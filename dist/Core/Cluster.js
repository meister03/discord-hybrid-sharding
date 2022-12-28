"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cluster = void 0;
const events_1 = __importDefault(require("events"));
const path_1 = __importDefault(require("path"));
const Util_1 = require("../Util/Util");
const shared_1 = require("../types/shared");
const IPCMessage_js_1 = require("../Structures/IPCMessage.js");
const IPCHandler_js_1 = require("../Structures/IPCHandler.js");
const Worker_js_1 = require("../Structures/Worker.js");
const Child_js_1 = require("../Structures/Child.js");
/**
 * A self-contained cluster created by the {@link ClusterManager}. Each one has a {@link Child} that contains
 * an instance of the bot and its {@link Client}. When its child process/worker exits for any reason, the cluster will
 * spawn a new one to replace it as necessary.
 * @augments EventEmitter
 */
class Cluster extends events_1.default {
    THREAD;
    /**
     * Manager that created the cluster
     */
    manager;
    /**
     * ID of the cluster in the manager
     */
    id;
    /**
     * Arguments for the shard's process (only when {@link ShardingManager#mode} is `process`)
     */
    args;
    /**
     * Arguments for the shard's process executable (only when {@link ShardingManager#mode} is `process`)
     */
    execArgv;
    /**
     * Internal Shards which will get spawned in the cluster
     */
    shardList;
    /**
     * the amount of real shards
     */
    totalShards;
    /**
     * Environment variables for the cluster's process, or workerData for the cluster's worker
     */
    env;
    /**
     * Process of the cluster (if {@link ClusterManager#mode} is `process`)
     */
    thread;
    restarts;
    messageHandler;
    /**
     * Whether the cluster's {@link Client} is ready
     */
    ready;
    /**
     * @param manager Manager that is creating this cluster
     * @param id ID of this cluster
     * @param shardList
     * @param totalShards
     */
    constructor(manager, id, shardList, totalShards) {
        super();
        this.THREAD = manager.mode === 'worker' ? Worker_js_1.Worker : Child_js_1.Child;
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
            DISCORD_TOKEN: this.manager.token,
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
                if (this.restarts.reset)
                    clearInterval(this.restarts.reset);
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
    async spawn(spawnTimeout = 30000) {
        if (this.thread)
            throw new Error('CLUSTER ALREADY SPAWNED | ClusterId: ' + this.id);
        this.thread = new this.THREAD(path_1.default.resolve(this.manager.file), {
            ...this.manager.clusterOptions,
            execArgv: this.execArgv,
            env: this.env,
            args: this.args,
            clusterData: { ...this.env, ...this.manager.clusterData },
        });
        this.messageHandler = new IPCHandler_js_1.ClusterHandler(this.manager, this, this.thread);
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
        if (spawnTimeout === -1 || spawnTimeout === Infinity)
            return this.thread.process;
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
    kill(options) {
        this.thread?.kill();
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        this.restarts.cleanup();
        this.manager._debug('[KILL] Cluster killed with reason: ' + (options?.reason || 'not given'), this.id);
    }
    /**
     * Kills and restarts the cluster's process/worker.
     * @param options Options for respawning the cluster
     */
    async respawn({ delay = 500, timeout = 30000 } = this.manager.spawnOptions) {
        if (this.thread)
            this.kill({ force: true });
        if (delay > 0)
            await (0, Util_1.delayFor)(delay);
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        return this.spawn(timeout);
    }
    /**
     * Sends a message to the cluster's process/worker.
     * @param  message Message to send to the cluster
     */
    send(message) {
        if (typeof message === 'object')
            this.thread?.send(new IPCMessage_js_1.BaseMessage(message).toJSON());
        else
            return this.thread?.send(message);
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
    request(message) {
        message._type = shared_1.messageType.CUSTOM_REQUEST;
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
    async eval(script, context, timeout) {
        // Stringify the script if it's a Function
        const _eval = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(context)})` : script;
        // cluster is dead (maybe respawning), don't cache anything and error immediately
        if (!this.thread)
            return Promise.reject(new Error('CLUSTERING_NO_CHILD_EXISTS | ClusterId: ' + this.id));
        const nonce = (0, Util_1.generateNonce)();
        const message = { nonce, _eval, options: { timeout }, _type: shared_1.messageType.CLIENT_EVAL_REQUEST };
        await this.send(message);
        return await this.manager.promise.create(message, message.options);
    }
    /**
     * @param reason If maintenance should be enabled with a given reason or disabled when nonce provided
     */
    triggerMaintenance(reason) {
        const _type = reason ? shared_1.messageType.CLIENT_MAINTENANCE_ENABLE : shared_1.messageType.CLIENT_MAINTENANCE_DISABLE;
        return this.send({ _type, maintenance: reason });
    }
    /**
     * Handles a message received from the child process/worker.
     * @param message Message received
     * @private
     */
    _handleMessage(message) {
        if (!message)
            return;
        const emit = this.messageHandler.handleMessage(message);
        if (!emit)
            return;
        let emitMessage;
        if (typeof message === 'object') {
            emitMessage = new IPCMessage_js_1.IPCMessage(this, message);
            if (emitMessage._type === shared_1.messageType.CUSTOM_REQUEST)
                this.manager.emit('clientRequest', emitMessage);
        }
        else
            emitMessage = message;
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
    _handleExit(exitCode) {
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
        this.manager._debug('[DEATH] Cluster died, attempting respawn | Restarts Left: ' + (this.restarts.max - this.restarts.current), this.id);
        this.ready = false;
        this.thread = null;
        if (!respawn)
            return;
        if (this.restarts.current >= this.restarts.max)
            this.manager._debug('[ATTEMPTED_RESPAWN] Attempted Respawn Declined | Max Restarts have been exceeded', this.id);
        if (respawn && this.restarts.current < this.restarts.max)
            this.spawn().catch(err => this.emit('error', err));
        this.restarts.append();
    }
    /**
     * Handles the cluster's process/worker error.
     * @param  error the error, which occurred on the worker/child process
     * @private
     */
    _handleError(error) {
        /**
         * Emitted upon the cluster's child process/worker error.
         * @event Cluster#error
         * @param {Child|Worker} process Child process/worker, where error occurred
         */
        this.manager.emit('error', error);
    }
}
exports.Cluster = Cluster;
