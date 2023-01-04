import { IPCMessage, BaseMessage, RawMessage } from '../Structures/IPCMessage';
import {
    Awaitable,
    ClusterClientEvents,
    evalOptions,
    Events,
    messageType,
    Serialized,
} from '../types/shared';

import { ClusterManager as Manager } from '../Core/ClusterManager';

import { getInfo } from '../Structures/Data';

import { WorkerClient } from '../Structures/Worker';
import { ChildClient } from '../Structures/Child';
import { ClusterClientHandler } from '../Structures/IPCHandler';
import { PromiseHandler } from '../Structures/PromiseHandler';

import EventEmitter from 'events';
import { Serializable } from 'child_process';
import { generateNonce } from '../Util/Util';
///communicates between the master workers and the process
export class ClusterClient<DiscordClient> extends EventEmitter {
    client: DiscordClient;
    mode: 'process' | 'worker';
    queue: { mode: 'auto' | string | undefined };
    maintenance: string | undefined | Boolean;
    ready: boolean;
    process: ChildClient | WorkerClient | null;
    messageHandler: any;
    promise: PromiseHandler;
    constructor(client: DiscordClient) {
        super();
        /**
         * Client for the Cluster
         */
        this.client = client;

        /**
         * Mode the Cluster was spawned with
         */
        this.mode = this.info.CLUSTER_MANAGER_MODE;
        const mode = this.mode;

        /**
         * If the Cluster is spawned automatically or with an own controller
         */
        this.queue = {
            mode: this.info.CLUSTER_QUEUE_MODE,
        };

        /**
         * If the Cluster is under maintenance
         */
        this.maintenance = this.info.MAINTENANCE;
        if (this.maintenance === 'undefined') this.maintenance = false;
        if (!this.maintenance) {
            // Wait 100ms so listener can be added
            setTimeout(() => this.triggerClusterReady(), 100);
        }

        this.ready = false;

        this.process = null;

        if (mode === 'process') this.process = new ChildClient();
        else if (mode === 'worker') this.process = new WorkerClient();

        this.messageHandler = new ClusterClientHandler<DiscordClient>(this, this.process);

        this.promise = new PromiseHandler();

        this.process?.ipc?.on('message', this._handleMessage.bind(this));

        // @ts-ignore
        client.on?.('ready', () => {
            this.triggerReady();
        });
    }
    /**
     * cluster's id
     */
    public get id() {
        return this.info.CLUSTER;
    }
    /**
     * Array of shard IDs of this client
     */
    public get ids() {
        // @ts-ignore
        if (!this.client.ws) return this.info.SHARD_LIST;
        // @ts-ignore
        return this.client.ws.shards;
    }
    /**
     * Total number of clusters
     */
    public get count() {
        return this.info.CLUSTER_COUNT;
    }
    /**
     * Gets some Info like Cluster_Count, Number, Total shards...
     */
    public get info() {
        return getInfo();
    }
    /**
     * Sends a message to the master process.
     * @fires Cluster#message
     */
    public send(message: Serializable) {
        if (typeof message === 'object') message = new BaseMessage(message).toJSON();
        return this.process?.send(message);
    }
    /**
     * Fetches a client property value of each cluster, or a given cluster.
     * @example
     * client.cluster.fetchClientValues('guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     * @see {@link ClusterManager#fetchClientValues}
     */
    public fetchClientValues(prop: string, cluster?: number) {
        return this.broadcastEval(`this.${prop}`, { cluster });
    }

    /**
     * Evaluates a script or function on the Cluster Manager
     * @example
     * client.cluster.evalOnManager('process.uptime')
     *   .then(result => console.log(result))
     *   .catch(console.error);
     * @see {@link ClusterManager#evalOnManager}
     */
    public evalOnManager(script: string): Promise<any[]>;
    public evalOnManager(script: string, options?: evalOptions): Promise<any>;
    public evalOnManager<T>(fn: (manager: Manager) => T, options?: evalOptions): Promise<T>;
    public evalOnManager<T>(fn: (manager: Manager) => T, options?: evalOptions): Promise<any[]>;
    public async evalOnManager<T>(script: string | ((manager: Manager) => T), options?: evalOptions) {
        const evalOptions = options || { _type: undefined };
        evalOptions._type = messageType.CLIENT_MANAGER_EVAL_REQUEST;

        return await this.broadcastEval(script as string, evalOptions);
    }

    /**
     * Evaluates a script or function on all clusters, or a given cluster, in the context of the {@link Client}s.
     * @example
     * client.cluster.broadcastEval('this.guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     * @see {@link ClusterManager#broadcastEval}
     */
    public broadcastEval(script: string): Promise<any[]>;
    public broadcastEval(script: string, options?: evalOptions): Promise<any>;
    public broadcastEval<T>(fn: (client: DiscordClient) => Awaitable<T>): Promise<Serialized<T>[]>;
    public broadcastEval<T>(
        fn: (client: DiscordClient) => Awaitable<T>,
        options?: { cluster?: number; timeout?: number },
    ): Promise<Serialized<T>>;
    public broadcastEval<T, P>(
        fn: (client: DiscordClient, context: Serialized<P>) => Awaitable<T>,
        options?: evalOptions<P>,
    ): Promise<Serialized<T>[]>;
    public broadcastEval<T, P>(
        fn: (client: DiscordClient, context: Serialized<P>) => Awaitable<T>,
        options?: evalOptions<P>,
    ): Promise<Serialized<T>>;
    public async broadcastEval<T, P>(
        script:
            | string
            | ((client: DiscordClient, context?: Serialized<P>) => Awaitable<T> | Promise<Serialized<T>>),
        options?: evalOptions | evalOptions<P>,
    ) {
        if (!script || (typeof script !== 'string' && typeof script !== 'function'))
            throw new TypeError(
                'Script for BroadcastEvaling has not been provided or must be a valid String/Function!',
            );

        const broadcastOptions = options || { context: undefined, _type: undefined, timeout: undefined };
        script =
            typeof script === 'function' ? `(${script})(this, ${JSON.stringify(broadcastOptions.context)})` : script;
        const nonce = generateNonce();
        const message = {
            nonce,
            _eval: script,
            options,
            _type: broadcastOptions._type || messageType.CLIENT_BROADCAST_REQUEST,
        };
        await this.send(message);

        return await this.promise.create(message, broadcastOptions);
    }
    /**
     * Sends a Request to the ParentCluster and returns the reply
     * @example
     * client.cluster.request({content: 'hello'})
     *   .then(result => console.log(result)) //hi
     *   .catch(console.error);
     * @see {@link IPCMessage#reply}
     */
    public request(message: RawMessage) {
        const rawMessage = message || { _type: undefined };
        rawMessage._type = messageType.CUSTOM_REQUEST;
        this.send(rawMessage);
        return this.promise.create(rawMessage, {});
    }

    /**
     * Requests a respawn of all clusters.
     * @see {@link ClusterManager#respawnAll}
     */
    public respawnAll({ clusterDelay = 5000, respawnDelay = 7000, timeout = 30000 } = {}) {
        return this.send({ _type: messageType.CLIENT_RESPAWN_ALL, options: { clusterDelay, respawnDelay, timeout } });
    }

    /**
     * Handles an IPC message.
     * @private
     */
    private async _handleMessage(message: RawMessage) {
        if (!message) return;
        const emit = await this.messageHandler.handleMessage(message);
        if (!emit) return;
        let emitMessage;
        if (typeof message === 'object') emitMessage = new IPCMessage(this, message);
        else emitMessage = message;
        /**
         * Emitted upon receiving a message from the parent process/worker.
         * @event ClusterClient#message
         * @param {*} message Message that was received
         */
        this.emit('message', emitMessage);
    }

    public async _eval(script: string) {
        // @ts-ignore
        if (this.client._eval) {
            // @ts-ignore
            return await this.client._eval(script);
        }
        // @ts-ignore
        this.client._eval = function (_: string) {
            return eval(_);
        }.bind(this.client);
        // @ts-ignore
        return await this.client._eval(script);
    }

    /**
     * Sends a message to the master process, emitting an error from the client upon failure.
     */
    public _respond(type: string, message: Serializable) {
        this.send(message)?.catch(err => {
            const error = { err, message: '' };

            error.message = `Error when sending ${type} response to master process: ${err.message}`;
            /**
             * Emitted when the client encounters an error.
             * @event Client#error
             * @param {Error} error The error encountered
             */
            // @ts-ignore
            this.client.emit?.(Events.ERROR, error);
        });
    }

    // Hooks
    public triggerReady() {
        this.process?.send({ _type: messageType.CLIENT_READY });
        this.ready = true;
        return this.ready;
    }

    public triggerClusterReady() {
        this.emit('ready', this);
        return true;
    }

    /**
     *
     * @param maintenance Whether the cluster should opt in maintenance when a reason was provided or opt-out when no reason was provided.
     * @param all Whether to target it on all clusters or just the current one.
     * @returns The maintenance status of the cluster.
     */
    public triggerMaintenance(maintenance: string, all = false) {
        let _type = messageType.CLIENT_MAINTENANCE;
        if (all) _type = messageType.CLIENT_MAINTENANCE_ALL;
        this.process?.send({ _type, maintenance });
        this.maintenance = maintenance;
        return this.maintenance;
    }

    /**
     * Manually spawn the next cluster, when queue mode is on 'manual'
     */
    public spawnNextCluster() {
        if (this.queue.mode === 'auto')
            throw new Error('Next Cluster can just be spawned when the queue is not on auto mode.');
        return this.process?.send({ _type: messageType.CLIENT_SPAWN_NEXT_CLUSTER });
    }

    /**
     * gets the total Internal shard count and shard list.
     */
    public static getInfo() {
        return getInfo();
    }
}

// Credits for EventEmitter typings: https://github.com/discordjs/discord.js/blob/main/packages/rest/src/lib/RequestManager.ts#L159 | See attached license
export interface ClusterClient<DiscordClient> {
    emit: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, ...args: ClusterClientEvents<DiscordClient>[K]) => boolean) &
        (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, ...args: any[]) => boolean);

    off: (<K extends keyof ClusterClientEvents<DiscordClient>>(
        event: K,
        listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void,
    ) => this) &
        (<S extends string | symbol>(
            event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>,
            listener: (...args: any[]) => void,
        ) => this);

    on: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void) => this) &
        (<S extends string | symbol>(
            event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>,
            listener: (...args: any[]) => void,
        ) => this);

    once: (<K extends keyof ClusterClientEvents<DiscordClient>>(
        event: K,
        listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void,
    ) => this) &
        (<S extends string | symbol>(
            event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>,
            listener: (...args: any[]) => void,
        ) => this);

    removeAllListeners: (<K extends keyof ClusterClientEvents<DiscordClient>>(event?: K) => this) &
        (<S extends string | symbol>(event?: Exclude<S, keyof ClusterClientEvents<DiscordClient>>) => this);
}
