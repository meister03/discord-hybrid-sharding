import { ClusterManager } from './ClusterManager';

import EventEmitter from 'events';
import path from 'path';
import { delayFor, generateNonce } from '../Util/Util';

import { ClusterEvents, ClusterKillOptions, messageType } from '../types/shared';
import { IPCMessage, BaseMessage, RawMessage } from '../Structures/IPCMessage.js';
import { ClusterHandler } from '../Structures/IPCHandler.js';

import { Worker } from '../Structures/Worker.js';
import { Child } from '../Structures/Child.js';
import { Serializable } from 'child_process';

/**
 * A self-contained cluster created by the {@link ClusterManager}. Each one has a {@link Child} that contains
 * an instance of the bot and its {@link Client}. When its child process/worker exits for any reason, the cluster will
 * spawn a new one to replace it as necessary.
 * @augments EventEmitter
 */
export class Cluster extends EventEmitter {
    THREAD: typeof Worker | typeof Child;

    /**
     * Manager that created the cluster
     */
    manager: ClusterManager;

    /**
     * ID of the cluster in the manager
     */
    id: number;

    /**
     * Arguments for the shard's process (only when {@link ShardingManager#mode} is `process`)
     */
    args: string[];

    /**
     * Arguments for the shard's process executable (only when {@link ShardingManager#mode} is `process`)
     */
    execArgv: string[];

    /**
     * Internal Shards which will get spawned in the cluster
     */
    shardList: number[];

    /**
     * the amount of real shards
     */
    totalShards: number;

    /**
     * Environment variables for the cluster's process, or workerData for the cluster's worker
     */
    env: NodeJS.ProcessEnv & {
        SHARD_LIST: number[];
        TOTAL_SHARDS: number;
        CLUSTER_MANAGER: boolean;
        CLUSTER: number;
        CLUSTER_COUNT: number;
        DISCORD_TOKEN: string;
    };

    /**
     * Process of the cluster (if {@link ClusterManager#mode} is `process`)
     */
    thread: null | Worker | Child;

    restarts: {
        current: number;
        max: number;
        interval: number;
        reset?: NodeJS.Timer;
        resetRestarts: () => void;
        cleanup: () => void;
        append: () => void;
    };

    messageHandler: any;

    /**
     * Whether the cluster's {@link Client} is ready
     */
    ready: boolean;

    /**
     * @param manager Manager that is creating this cluster
     * @param id ID of this cluster
     * @param shardList
     * @param totalShards
     */
    constructor(manager: ClusterManager, id: number, shardList: number[], totalShards: number) {
        super();

        this.THREAD = manager.mode === 'worker' ? Worker : Child;

        this.manager = manager;

        this.id = id;

        this.args = manager.shardArgs || [];

        this.execArgv = manager.execArgv;

        this.shardList = shardList;

        this.totalShards = totalShards;

        this.env = Object.assign({}, process.env, {
            SHARD_LIST: this.shardList,
            TOTAL_SHARDS: this.totalShards,
            CLUSTER_MANAGER: true,
            CLUSTER: this.id,
            CLUSTER_COUNT: this.manager.totalClusters,
            DISCORD_TOKEN: this.manager.token as string,
        });

        this.ready = false;

        this.thread = null;

        this.restarts = {
            current: this.manager.restarts.current ?? 0,
            max: this.manager.restarts.max,
            interval: this.manager.restarts.interval,
            reset: undefined,
            resetRestarts: () => {
                this.restarts.reset = setInterval(() => {
                    this.restarts.current = 0;
                }, this.manager.restarts.interval);
            },
            cleanup: () => {
                if (this.restarts.reset) clearInterval(this.restarts.reset);
            },
            append: () => {
                this.restarts.current++;
            },
        };
    }
    /**
     * Forks a child process or creates a worker thread for the cluster.
     * <warn>You should not need to call this manually.</warn>
     * @param spawnTimeout The amount in milliseconds to wait until the {@link Client} has become ready
     * before resolving. (-1 or Infinity for no wait)
     */
    public async spawn(spawnTimeout = 30000) {
        if (this.thread) throw new Error('CLUSTER ALREADY SPAWNED | ClusterId: ' + this.id);
        this.thread = new this.THREAD(path.resolve(this.manager.file), {
            ...this.manager.clusterOptions,
            execArgv: this.execArgv,
            env: this.env,
            args: this.args,
            clusterData: { ...this.env, ...this.manager.clusterData },
        });
        this.messageHandler = new ClusterHandler(this.manager, this, this.thread);

        this.thread
            .spawn()
            .on('message', this._handleMessage.bind(this))
            .on('exit', this._handleExit.bind(this))
            .on('error', this._handleError.bind(this));

        /**
         * Emitted upon the creation of the cluster's child process/worker.
         * @event Cluster#spawn
         * @param {Child|Worker} process Child process/worker that was created
         */
        this.emit('spawn', this.thread.process);

        if (spawnTimeout === -1 || spawnTimeout === Infinity) return this.thread.process;

        await new Promise((resolve, reject) => {
            const cleanup = () => {
                clearTimeout(spawnTimeoutTimer);
                this.off('ready', onReady);
                this.off('death', onDeath);
            };

            const onReady = () => {
                this.manager.emit('clusterReady', this);
                this.restarts.cleanup();
                this.restarts.resetRestarts();
                cleanup();
                resolve('Cluster is ready');
            };

            const onDeath = () => {
                cleanup();
                reject(new Error('CLUSTERING_READY_DIED | ClusterId: ' + this.id));
            };

            const onTimeout = () => {
                cleanup();
                reject(new Error('CLUSTERING_READY_TIMEOUT | ClusterId: ' + this.id));
            };

            const spawnTimeoutTimer = setTimeout(onTimeout, spawnTimeout);
            this.once('ready', onReady);
            this.once('death', onDeath);
        });
        return this.thread.process;
    }
    /**
     * Immediately kills the clusters process/worker and does not restart it.
     * @param options Some Options for managing the Kill
     * @param options.force Whether the Cluster should be force kill and be ever respawned...
     */
    public kill(options: ClusterKillOptions) {
        this.thread?.kill();
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        this.restarts.cleanup();
        this.manager._debug('[KILL] Cluster killed with reason: ' + (options?.reason || 'not given'), this.id);
    }
    /**
     * Kills and restarts the cluster's process/worker.
     * @param options Options for respawning the cluster
     */
    public async respawn({ delay = 500, timeout = 30000 } = this.manager.spawnOptions) {
        if (this.thread) this.kill({ force: true });
        if (delay > 0) await delayFor(delay);
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        return this.spawn(timeout);
    }
    /**
     * Sends a message to the cluster's process/worker.
     * @param  message Message to send to the cluster
     */
    public send(message: RawMessage) {
        if (typeof message === 'object') this.thread?.send(new BaseMessage(message).toJSON());
        else return this.thread?.send(message);
    }

    /**
     * Sends a Request to the ClusterClient and returns the reply
     * @param message Message, which should be sent as request
     * @returns Reply of the Message
     * @example
     * client.cluster.request({content: 'hello'})
     *   .then(result => console.log(result)) //hi
     *   .catch(console.error);
     * @see {@link IPCMessage#reply}
     */
    public request(message: RawMessage) {
        message._type = messageType.CUSTOM_REQUEST;
        this.send(message);
        return this.manager.promise.create(message, message.options);
    }
    /**
     * Evaluates a script or function on the cluster, in the context of the {@link Client}.
     * @param script JavaScript to run on the cluster
     * @param context
     * @param timeout
     * @returns Result of the script execution
     */
    public async eval(script: string, context: any, timeout: number) {
        // Stringify the script if it's a Function
        const _eval = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(context)})` : script;

        // cluster is dead (maybe respawning), don't cache anything and error immediately
        if (!this.thread) return Promise.reject(new Error('CLUSTERING_NO_CHILD_EXISTS | ClusterId: ' + this.id));
        const nonce = generateNonce();
        const message = { nonce, _eval, options: { timeout }, _type: messageType.CLIENT_EVAL_REQUEST };
        await this.send(message);
        return await this.manager.promise.create(message, message.options);
    }

    /**
     * @param reason If maintenance should be enabled with a given reason or disabled when nonce provided
     */
    public triggerMaintenance(reason?: string) {
        const _type = reason ? messageType.CLIENT_MAINTENANCE_ENABLE : messageType.CLIENT_MAINTENANCE_DISABLE;
        return this.send({ _type, maintenance: reason });
    }

    /**
     * Handles a message received from the child process/worker.
     * @param message Message received
     * @private
     */
    private _handleMessage(message: Serializable) {
        if (!message) return;
        const emit = this.messageHandler.handleMessage(message);
        if (!emit) return;

        let emitMessage;
        if (typeof message === 'object') {
            emitMessage = new IPCMessage(this, message);
            if (emitMessage._type === messageType.CUSTOM_REQUEST) this.manager.emit('clientRequest', emitMessage);
        } else emitMessage = message;
        /**
         * Emitted upon receiving a message from the child process/worker.
         * @event Shard#message
         * @param {*|IPCMessage} message Message that was received
         */
        this.emit('message', emitMessage);
    }

    /**
     * Handles the cluster's process/worker exiting.
     * @private
     * @param {Number} exitCode
     */
    private _handleExit(exitCode: number) {
        /**
         * Emitted upon the cluster's child process/worker exiting.
         * @event Cluster#death
         * @param {Child|Worker} process Child process/worker that exited
         */

        const respawn = this.manager.respawn;

        // Cleanup functions
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        this.restarts.cleanup();

        this.emit('death', this, this.thread?.process);

        this.manager._debug(
            '[DEATH] Cluster died, attempting respawn | Restarts Left: ' + (this.restarts.max - this.restarts.current),
            this.id,
        );

        this.ready = false;

        this.thread = null;

        if (!respawn) return;

        if (this.restarts.current >= this.restarts.max)
            this.manager._debug(
                '[ATTEMPTED_RESPAWN] Attempted Respawn Declined | Max Restarts have been exceeded',
                this.id,
            );
        if (respawn && this.restarts.current < this.restarts.max) this.spawn().catch(err => this.emit('error', err));

        this.restarts.append();
    }

    /**
     * Handles the cluster's process/worker error.
     * @param  error the error, which occurred on the worker/child process
     * @private
     */
    private _handleError(error: Error) {
        /**
         * Emitted upon the cluster's child process/worker error.
         * @event Cluster#error
         * @param {Child|Worker} process Child process/worker, where error occurred
         */
        this.manager.emit('error', error);
    }
}

// Credits for EventEmitter typings: https://github.com/discordjs/discord.js/blob/main/packages/rest/src/lib/RequestManager.ts#L159 | See attached license
export interface Cluster {
    emit: (<K extends keyof ClusterEvents>(event: K, ...args: ClusterEvents[K]) => boolean) &
        (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, ...args: any[]) => boolean);

    off: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) &
        (<S extends string | symbol>(
            event: Exclude<S, keyof ClusterEvents>,
            listener: (...args: any[]) => void,
        ) => this);

    on: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) &
        (<S extends string | symbol>(
            event: Exclude<S, keyof ClusterEvents>,
            listener: (...args: any[]) => void,
        ) => this);

    once: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) &
        (<S extends string | symbol>(
            event: Exclude<S, keyof ClusterEvents>,
            listener: (...args: any[]) => void,
        ) => this);

    removeAllListeners: (<K extends keyof ClusterEvents>(event?: K) => this) &
        (<S extends string | symbol>(event?: Exclude<S, keyof ClusterEvents>) => this);
}
