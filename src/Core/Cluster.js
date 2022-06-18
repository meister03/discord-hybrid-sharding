// @ts-check
const EventEmitter = require('events');
const path = require('path');
const Util = require('../Util/Util.js');

const { messageType } = require('../Util/Constants.js');
const { IPCMessage, BaseMessage } = require('../Structures/IPCMessage.js');
const { ClusterHandler } = require('../Structures/IPCHandler.js');

const { Worker } = require('../Structures/Worker.js');
const { Child } = require('../Structures/Child.js');

let Thread = null;

/**
 * A self-contained cluster created by the {@link ClusterManager}. Each one has a {@link Child} that contains
 * an instance of the bot and its {@link Client}. When its child process/worker exits for any reason, the cluster will
 * spawn a new one to replace it as necessary.
 * @augments EventEmitter
 */
class Cluster extends EventEmitter {
    /**
     * @param {ClusterManager} manager Manager that is creating this cluster
     * @param {number} id ID of this cluster
     * @param shardList
     * @param totalShards
     */
    constructor(manager, id, shardList, totalShards) {
        super();
        if (manager.mode === 'process') Thread = Child;
        else if (manager.mode === 'worker') Thread = Worker;
        /**
         * Manager that created the cluster
         * @type {ClusterManager}
         */
        this.manager = manager;
        /**
         * ID of the cluster in the manager
         * @type {number}
         */
        this.id = id;

        /**
         * Arguments for the shard's process (only when {@link ShardingManager#mode} is `process`)
         * @type {string[]}
         */
        this.args = manager.shardArgs || [];

        /**
         * Arguments for the shard's process executable (only when {@link ShardingManager#mode} is `process`)
         * @type {string[]}
         */
        this.execArgv = manager.execArgv;
        /**
         * Internal Shards which will get spawned in the cluster
         * @type {number}
         */
        this.shardList = shardList;
        /**
         * the amount of real shards
         * @type {number}
         */
        this.totalShards = totalShards;
        /**
         * Environment variables for the cluster's process, or workerData for the cluster's worker
         * @type {object}
         */
        this.env = Object.assign({}, process.env, {
            SHARD_LIST: this.shardList,
            TOTAL_SHARDS: this.totalShards,
            CLUSTER_MANAGER: true,
            CLUSTER: this.id,
            CLUSTER_COUNT: this.manager.totalClusters,
            DISCORD_TOKEN: this.manager.token,
        });
        /**
         * Whether the cluster's {@link Client} is ready
         * @type {boolean}
         */

        /**
         * Process of the cluster (if {@link ClusterManager#mode} is `process`)
         * @type {?Child|?Worker}
         */
        this.thread = null;


        this.restarts = {
            current: this.manager.restarts.current,
            max: this.manager.restarts.max,
            interval: this.manager.restarts.interval,
            resetRestarts: () =>{ 
               this.restarts.reset = setInterval(() => {
                    this.restarts.current = 0;
                }, this.manager.restarts.interval)
            },
            cleanup: () => {
                clearInterval(this.restarts.reset);
            },
            append: () => {
                this.restarts.current++;
            }
        }
    }
    /**
     * Forks a child process or creates a worker thread for the cluster.
     * <warn>You should not need to call this manually.</warn>
     * @param {number} [spawnTimeout=30000] The amount in milliseconds to wait until the {@link Client} has become ready
     * before resolving. (-1 or Infinity for no wait)
     * @returns {Promise<Child>}
     */
    async spawn(spawnTimeout = 30000) {
        if (this.thread) throw new Error('CLUSTER ALREADY SPAWNED | ClusterId: ' + this.id);
        this.thread = new Thread(path.resolve(this.manager.file), {
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
                resolve();
            };

            const onDeath = () => {
                cleanup();
                reject(new Error('CLUSTERING_READY_DIED | ClusterId: ' + this.id));
            };

            const onTimeout = () => {
                cleanup();
                reject(new Error('CLUSTERING_READY_TIMEOUT | ClusterId: '+ this.id));
            };

            const spawnTimeoutTimer = setTimeout(onTimeout, spawnTimeout);
            this.once('ready', onReady);
            this.once('death', onDeath);
        });
        return this.thread.process;
    }
    /**
     * Immediately kills the clusters's process/worker and does not restart it.
     * @param {object} options Some Options for managing the Kill
     * @param {object} options.force Whether the Cluster should be force kill and be ever respawned...
     */
    kill(options = {}) {
        this.thread.kill(options);
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        this._handleExit(false);
    }
    /**
     * Kills and restarts the cluster's process/worker.
     * @param {ClusterRespawnOptions} [options] Options for respawning the cluster
     * @returns {Promise<Child>}
     */
    async respawn({ delay = 500, timeout = 30000 } = {}) {
        if (this.thread) this.kill({ force: true });
        if (delay > 0) await Util.delayFor(delay);
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        return this.spawn(timeout);
    }
    /**
     * Sends a message to the cluster's process/worker.
     * @param {*|BaseMessage} message Message to send to the cluster
     * @returns {Promise<Shard>}
     */
    send(message) {
        if (typeof message === 'object') message = new BaseMessage(message).toJSON();
        return this.thread.send(message);
    }

    /**
     * Sends a Request to the ClusterClient and returns the reply
     * @param {BaseMessage} message Message, which should be sent as request
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
        message.type = messageType.CUSTOM_REQUEST;
        this.send(message);
        return this.manager.promise.create(message);
    }
    /**
     * Evaluates a script or function on the cluster, in the context of the {@link Client}.
     * @param {string|Function} script JavaScript to run on the cluster
     * @param context
     * @param timeout
     * @returns {Promise<*>} Result of the script execution
     */
    async eval(script, context, timeout) {
        // Stringify the script if it's a Function
        const _eval = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(context)})` : script;

        // cluster is dead (maybe respawning), don't cache anything and error immediately
        if (!this.thread) return Promise.reject(new Error('CLUSTERING_NO_CHILD_EXISTS | ClusterId: '+  this.id));
        const nonce = Util.generateNonce();
        const message = {nonce, _eval, options: {timeout}, type: messageType.CLIENT_EVAL_REQUEST};
        await this.send(message);
        const res = await this.manager.promise.create(message);
        return res;
    }

    /**
     * Handles a message received from the child process/worker.
     * @param {*} message Message received
     * @private
     */
    _handleMessage(message) {
        if (!message) return;
        const emit = this.messageHandler.handleMessage(message);
        if(!emit) return;

        let emitMessage;
        if (typeof message === 'object') {
            emitMessage = new IPCMessage(this, message);
            if (emitMessage._sRequest) this.manager.emit('clientRequest', emitMessage);
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
     * @param {boolean} [respawn=this.manager.respawn] Whether to spawn the cluster again
     * @private
     */
    _handleExit(respawn = this.manager.respawn) {
        /**
         * Emitted upon the cluster's child process/worker exiting.
         * @event Cluster#death
         * @param {Child|Worker} process Child process/worker that exited
         */
        this.emit('death', this.thread.process);
        this.manager._debug('[DEATH] Cluster died, attempting respawn | Restarts Left: '+ (this.restarts.max - this.restarts.current), this.id);

        this.ready = false;
        this.thread = null;

        if(this.restarts.current >= this.restarts.max) this.manager._debug('[ATTEMPTED_RESPAWN] Attempted Respawn Declined | Max Restarts have been exceeded', this.id);
        if (respawn && this.restarts.current < this.restarts.max) this.spawn().catch(err => this.emit('error', err));
        
        this.restarts.append();
    }

    /**
     * Handles the cluster's process/worker error.
     * @param {object} [error] the error, which occurred on the worker/child process
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

module.exports = Cluster;
