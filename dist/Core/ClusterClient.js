"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterClient = void 0;
const IPCMessage_1 = require("../Structures/IPCMessage");
const shared_1 = require("../types/shared");
const Data_1 = require("../Structures/Data");
const Worker_1 = require("../Structures/Worker");
const Child_1 = require("../Structures/Child");
const IPCHandler_1 = require("../Structures/IPCHandler");
const PromiseHandler_1 = require("../Structures/PromiseHandler");
const events_1 = __importDefault(require("events"));
const Util_1 = require("../Util/Util");
///communicates between the master workers and the process
class ClusterClient extends events_1.default {
    client;
    mode;
    queue;
    maintenance;
    ready;
    process;
    messageHandler;
    promise;
    constructor(client) {
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
        if (this.maintenance === 'undefined')
            this.maintenance = false;
        if (!this.maintenance) {
            // Wait 100ms so listener can be added
            setTimeout(() => this.triggerClusterReady(), 100);
        }
        this.ready = false;
        this.process = null;
        if (mode === 'process')
            this.process = new Child_1.ChildClient();
        else if (mode === 'worker')
            this.process = new Worker_1.WorkerClient();
        this.messageHandler = new IPCHandler_1.ClusterClientHandler(this, this.process);
        this.promise = new PromiseHandler_1.PromiseHandler();
        this.process?.ipc?.on('message', this._handleMessage.bind(this));
        // @ts-ignore
        client.on?.('ready', () => {
            this.triggerReady();
        });
    }
    /**
     * cluster's id
     */
    get id() {
        return this.info.CLUSTER;
    }
    /**
     * Array of shard IDs of this client
     */
    get ids() {
        // @ts-ignore
        if (!this.client.ws)
            return this.info.SHARD_LIST;
        // @ts-ignore
        return this.client.ws.shards;
    }
    /**
     * Total number of clusters
     */
    get count() {
        return this.info.CLUSTER_COUNT;
    }
    /**
     * Gets some Info like Cluster_Count, Number, Total shards...
     */
    get info() {
        return (0, Data_1.getInfo)();
    }
    /**
     * Sends a message to the master process.
     * @fires Cluster#message
     */
    send(message) {
        if (typeof message === 'object')
            message = new IPCMessage_1.BaseMessage(message).toJSON();
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
    fetchClientValues(prop, cluster) {
        return this.broadcastEval(`this.${prop}`, { cluster });
    }
    async evalOnManager(script, options) {
        const evalOptions = options || { _type: undefined };
        evalOptions._type = shared_1.messageType.CLIENT_MANAGER_EVAL_REQUEST;
        return await this.broadcastEval(script, evalOptions);
    }
    async broadcastEval(script, options) {
        if (!script || (typeof script !== 'string' && typeof script !== 'function'))
            throw new TypeError('Script for BroadcastEvaling has not been provided or must be a valid String/Function!');
        const broadcastOptions = options || { context: undefined, _type: undefined, timeout: undefined };
        script =
            typeof script === 'function' ? `(${script})(this, ${JSON.stringify(broadcastOptions.context)})` : script;
        const nonce = (0, Util_1.generateNonce)();
        const message = {
            nonce,
            _eval: script,
            options,
            _type: broadcastOptions._type || shared_1.messageType.CLIENT_BROADCAST_REQUEST,
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
    request(message) {
        const rawMessage = message || { _type: undefined };
        rawMessage._type = shared_1.messageType.CUSTOM_REQUEST;
        this.send(rawMessage);
        return this.promise.create(rawMessage, {});
    }
    /**
     * Requests a respawn of all clusters.
     * @see {@link ClusterManager#respawnAll}
     */
    respawnAll({ clusterDelay = 5000, respawnDelay = 7000, timeout = 30000 } = {}) {
        return this.send({ _type: shared_1.messageType.CLIENT_RESPAWN_ALL, options: { clusterDelay, respawnDelay, timeout } });
    }
    /**
     * Handles an IPC message.
     * @private
     */
    async _handleMessage(message) {
        if (!message)
            return;
        const emit = await this.messageHandler.handleMessage(message);
        if (!emit)
            return;
        let emitMessage;
        if (typeof message === 'object')
            emitMessage = new IPCMessage_1.IPCMessage(this, message);
        else
            emitMessage = message;
        /**
         * Emitted upon receiving a message from the parent process/worker.
         * @event ClusterClient#message
         * @param {*} message Message that was received
         */
        this.emit('message', emitMessage);
    }
    async _eval(script) {
        // @ts-ignore
        if (this.client._eval) {
            // @ts-ignore
            return await this.client._eval(script);
        }
        // @ts-ignore
        this.client._eval = function (_) {
            return eval(_);
        }.bind(this.client);
        // @ts-ignore
        return await this.client._eval(script);
    }
    /**
     * Sends a message to the master process, emitting an error from the client upon failure.
     */
    _respond(type, message) {
        this.send(message)?.catch(err => {
            const error = { err, message: '' };
            error.message = `Error when sending ${type} response to master process: ${err.message}`;
            /**
             * Emitted when the client encounters an error.
             * @event Client#error
             * @param {Error} error The error encountered
             */
            // @ts-ignore
            this.client.emit?.(shared_1.Events.ERROR, error);
        });
    }
    // Hooks
    triggerReady() {
        this.process?.send({ _type: shared_1.messageType.CLIENT_READY });
        this.ready = true;
        return this.ready;
    }
    triggerClusterReady() {
        this.emit('ready', this);
        return true;
    }
    /**
     *
     * @param maintenance Whether the cluster should opt in maintenance when a reason was provided or opt-out when no reason was provided.
     * @param all Whether to target it on all clusters or just the current one.
     * @returns The maintenance status of the cluster.
     */
    triggerMaintenance(maintenance, all = false) {
        let _type = shared_1.messageType.CLIENT_MAINTENANCE;
        if (all)
            _type = shared_1.messageType.CLIENT_MAINTENANCE_ALL;
        this.process?.send({ _type, maintenance });
        this.maintenance = maintenance;
        return this.maintenance;
    }
    /**
     * Manually spawn the next cluster, when queue mode is on 'manual'
     */
    spawnNextCluster() {
        if (this.queue.mode === 'auto')
            throw new Error('Next Cluster can just be spawned when the queue is not on auto mode.');
        return this.process?.send({ _type: shared_1.messageType.CLIENT_SPAWN_NEXT_CLUSTER });
    }
    /**
     * gets the total Internal shard count and shard list.
     */
    static getInfo() {
        return (0, Data_1.getInfo)();
    }
}
exports.ClusterClient = ClusterClient;
