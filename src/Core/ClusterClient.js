// @ts-check
const { IPCMessage, BaseMessage } = require('../Structures/IPCMessage.js');
const Util = require('../Util/Util.js');
const { Events, messageType } = require('../Util/Constants.js');

const { WorkerClient } = require('../Structures/Worker.js');
const { ChildClient } = require('../Structures/Child.js');
const { ClusterClientHandler } = require('../Structures/IPCHandler.js');
const PromiseHandler = require('../Structures/PromiseHandler.js');

const EventEmitter = require('events');
///communicates between the master workers and the process
class ClusterClient extends EventEmitter {
    /**
     * @param {Client} client Client of the current cluster
     */
    constructor(client) {
        super();
        /**
         * Client for the Cluster
         * @type {Client}
         */
        this.client = client;

        /**
         * Mode the Cluster was spawned with
         * @type {ClusterManagerMode}
         */
        this.mode = this.info.CLUSTER_MANAGER_MODE;
        let mode = this.mode;

        /**
         * If the Cluster is spawned automatically or with a own controller
         * @type {Object}
         */
        this.queue = {
            mode: this.info.CLUSTER_QUEUE_MODE,
        };

        /**
         * If the Cluster is under maintenance
         * @type {String}
         */
        this.maintenance = this.info.MAINTENANCE;
        if(this.maintenance === 'undefined') this.maintenance = false;
        if(!this.maintenance) {
            // Wait 100ms so listener can be added
           setTimeout(() => this.triggerClusterReady() , 100);
        }

        this.ready = false;

        this.process = null;

        if (mode === 'process') this.process = new ChildClient(this);
        else if (mode === 'worker') this.process = new WorkerClient(this);

        this.messageHandler = new ClusterClientHandler(this, this.process);

        this.promise = new PromiseHandler();

        this.process.ipc.on('message', this._handleMessage.bind(this));
        client.on?.('ready', () => {
            this.triggerReady();
        });
    }
    /**
     * cluster's id
     * @type {number}
     * @readonly
     */
    get id() {
        return this.info.CLUSTER;
    }
    /**
     * Array of shard IDs of this client
     * @type {Map<number, any>}
     * @readonly
     */
    get ids() {
        if (!this.client.ws) return this.info.SHARD_LIST;
        return this.client.ws.shards;
    }
    /**
     * Total number of clusters
     * @type {number}
     * @readonly
     */
    get count() {
        return this.info.CLUSTER_COUNT;
    }
    /**
     * Gets several Info like Cluster_Count, Number, Total shards...
     * @type {object}
     * @readonly
     */
    get info() {
        return ClusterClient.getInfo();
    }
    /**
     * Sends a message to the master process.
     * @param {*} message Message to send
     * @returns {Promise<void>}
     * @fires Cluster#message
     */
    send(message) {
        if (typeof message === 'object') message = new BaseMessage(message).toJSON();
        return this.process.send(message);
    }
    /**
     * Fetches a client property value of each cluster, or a given cluster.
     * @param {string} prop Name of the client property to get, using periods for nesting
     * @param {number} [cluster] Cluster to fetch property from, all if undefined
     * @returns {Promise<*>|Promise<Array<*>>}
     * @example
     * client.cluster.fetchClientValues('guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     * @see {@link ClusterManager#fetchClientValues}
     */
    fetchClientValues(prop, cluster) {
        return this.broadcastEval(`this.${prop}`, {cluster});
    }

    /**
     * Evaluates a script or function on the Cluster Manager
     * @param {string|Function} script JavaScript to run on the Manager
     * @param {object} options Some options such as the Eval timeout or the Context
     * @param {number} [options.timeout=10000] The time in ms to wait, until the eval will be rejected without any response
     * @param {any} [options.context] The context to pass to the script, when providing functions
     * @returns {Promise<*>|Promise<Array<*>>} Result of the script execution
     * @example
     * client.cluster.evalOnManager('process.uptime')
     *   .then(result => console.log(result))
     *   .catch(console.error);
     * @see {@link ClusterManager#evalOnManager}
     */
    async evalOnManager(script, options = {}) {
        options._type = messageType.CLIENT_MANAGER_EVAL_REQUEST
        return await this.broadcastEval(script, options);
    }

    async evalOnCluster(script, options = {}) {
        return await this.broadcastEval(script, options);
    }

    /**
     * Evaluates a script or function on all clusters, or a given cluster, in the context of the {@link Client}s.
     * @param {string|Function} script JavaScript to run on each cluster
     * @param {object} options Some options such as the TargetCluster or the Eval timeout
     * @param {number} [options.context] The Context to pass to the eval script
     * @param {number} [options.cluster] The Id od the target Cluster
     * @param {number} [options.shard] The Id od the target Shard, when the Cluster has not been provided.
     * @param {number} [options.guildId] The Id od the guild the cluster is in, when the Cluster has not been provided.
     * @param {number} [options.timeout=10000] The time in ms to wait, until the eval will be rejected without any response
     * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
     * @example
     * client.cluster.broadcastEval('this.guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     * @see {@link ClusterManager#broadcastEval}
     */
    async broadcastEval(script, options = {}) {
        if (!script || (typeof script !== 'string' && typeof script !== 'function'))
          throw new TypeError(
            'Script for BroadcastEvaling has not been provided or must be a valid String/Function!',
          );
        script = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(options.context)})` : script;
        const nonce = Util.generateNonce();
        const message = {nonce, _eval: script, options, _type: options._type || messageType.CLIENT_BROADCAST_REQUEST};
        await this.send(message);

        return await this.promise.create(message);
    }
    /**
     * Sends a Request to the ParentCluster and returns the reply
     * @param {Object} message Message, which should be sent as request
     * @returns {Promise<*>} Reply of the Message
     * @example
     * client.cluster.request({content: 'hello'})
     *   .then(result => console.log(result)) //hi
     *   .catch(console.error);
     * @see {@link IPCMessage#reply}
     */
    request(message = {}) {
        message._sRequest = true;
        message._sReply = false;
        message._type = messageType.CUSTOM_REQUEST;
        this.send(message);
        return this.promise.create(message);
    }

    /**
     * Requests a respawn of all clusters.
     * @param {ClusterRespawnOptions} [options] Options for respawning shards
     * @returns {Promise<void>} Resolves upon the message being sent
     * @see {@link ClusterManager#respawnAll}
     */
    respawnAll({ clusterDelay = 5000, respawnDelay = 7000, timeout = 30000 } = {}) {
        return this.send({ _type: messageType.CLIENT_RESPAWN_ALL , options: { clusterDelay, respawnDelay, timeout } });
    }

    /**
     * Handles an IPC message.
     * @param {*} message Message received
     * @private
     */
    async _handleMessage(message) {
        if (!message) return;
        const emit = await this.messageHandler.handleMessage(message);
        if(!emit) return;
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

    async _eval(script) {
        if (this.client._eval) {
            return await this.client._eval(script);
        }
        this.client._eval = function (_) {
            return eval(_);
        }.bind(this.client);
        return await this.client._eval(script);
    }

    /**
     * Sends a message to the master process, emitting an error from the client upon failure.
     * @param {string} type Type of response to send
     * @param {*} message Message to send, which can be a Object or a String
     * @private
     */
    _respond(type, message) {
        this.send(message).catch(err => {
            let error = { err };

            error.message = `Error when sending ${type} response to master process: ${err.message}`;
            /**
             * Emitted when the client encounters an error.
             * @event Client#error
             * @param {Error} error The error encountered
             */
            this.client.emit?.(Events.ERROR, error);
        });
    }

    // Hooks
    triggerReady() {
        this.process.send({ _type: messageType.CLIENT_READY });
        this.ready = true;
        return this.ready;
    }

    triggerClusterReady() {
        return this.emit('ready', this);
    }

    /**
     * 
     * @param {String} maintenance Whether the cluster should opt in maintenance when a reason was provided or opt-out when no reason was provided.
     * @param {Boolean} all Whether to target it on all clusters or just the current one.
     * @returns {String} The maintenance status of the cluster.
     */
    triggerMaintenance(maintenance, all = false) {
        let _type = messageType.CLIENT_MAINTENANCE;
        if(all) _type = messageType.CLIENT_MAINTENANCE_ALL;
        this.process.send({ _type, maintenance });
        this.maintenance = maintenance;
        return this.maintenance;
    }

    /**
     * Manually spawn the next cluster, when queue mode is on 'manual'
     * @returns {Promise<*>}
     */
    spawnNextCluster() {
        if (this.queue.mode === 'auto')
            throw new Error('Next Cluster can just be spawned when the queue is not on auto mode.');
        return this.process.send({ _type: messageType.CLIENT_SPAWN_NEXT_CLUSTER});
    }

    /**
     * gets the total Internal shard count and shard list.
     * @returns {Object}
     */
    static getInfo() {
        let clusterMode = process.env.CLUSTER_MANAGER_MODE;
        if (!clusterMode) return;
        if (clusterMode !== 'worker' && clusterMode !== 'process')
            throw new Error('NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT');
        let data;
        if (clusterMode === 'process') {
            const shardList = [];
            let parseShardList = process.env.SHARD_LIST.split(',');
            parseShardList.forEach(c => shardList.push(Number(c)));
            data = {
                SHARD_LIST: shardList,
                TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS),
                CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT),
                CLUSTER: Number(process.env.CLUSTER),
                CLUSTER_MANAGER_MODE: clusterMode,
                MAINTENANCE: process.env.MAINTENANCE,
                CLUSTER_QUEUE_MODE: process.env.CLUSTER_QUEUE_MODE,
            };
        } else {
            data = require('worker_threads').workerData;
        }

        data.FIRST_SHARD_ID = data.SHARD_LIST[0];
        data.LAST_SHARD_ID = data.SHARD_LIST[data.SHARD_LIST.length - 1];

        return data;
    }
}
module.exports = ClusterClient;
