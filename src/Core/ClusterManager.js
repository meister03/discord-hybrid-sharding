// @ts-check
const EventEmitter = require('events');

const fs = require('fs');
const path = require('path');
const os = require('os');

const Util = require('../Util/Util.js');

const Queue = require('../Structures/Queue.js');

const Cluster = require('./Cluster.js');

const PromiseHandler = require('../Structures/PromiseHandler.js');

class ClusterManager extends EventEmitter {
    /**
     * @param {string} file Path to your bot file
     * @param {object} [options] Options for the cluster manager
     * @param {string|number} [options.totalShards='auto'] Number of total internal shards or "auto"
     * @param {string|number} [options.totalClusters='auto'] Number of total Clusters\Process to spawn
     * @param {number} [options.shardsPerClusters] Number of shards per cluster
     * @param {string[]} [options.shardArgs=[]] Arguments to pass to the clustered script when spawning
     * (only available when using the `process` mode)
     * @param {string[]} [options.execArgv=[]] Arguments to pass to the clustered script executable when spawning
     * @param {boolean} [options.respawn=true] Whether clusters should automatically respawn upon exiting
     * (only available when using the `process` mode)
     * @param {ClusterManagerMode} [options.mode='worker'] Which mode to use for clustering
     * @param {number[]} [options.shardList] A Array of Internal Shards Ids, which should get spawned
     * @param {string} [options.token] Token to use for automatic internal shard count and passing to bot file
     * @param {object} [options.restarts] Restart options
     * @param {number} [options.restarts.interval] Interval in milliseconds on which the current restarts amount of a cluster will be resetted
     * @param {number} [options.restarts.max] Maximum amount of restarts a cluster can have in the interval
     * @param {object} [options.queue] Control the Spawn Queue 
     * @param {boolean} [options.queue.auto=true] Whether the spawn queue be automatically managed
     */
    constructor(file, options = {}) {
        super();
        options = Util.mergeDefault(
            {
                totalClusters: 'auto',
                totalShards: 'auto',
                shardArgs: [],
                execArgv: [],
                respawn: true,
                mode: 'process',
                token: process.env.DISCORD_TOKEN,
                queue: {
                    auto: true,
                },
                restarts: {
                    max: 3,
                    interval: 60000*60,
                    current: 0,
                },
                clusterData: {},
                clusterOptions: {},
            },
            options,
        );

        if(options.keepAlive) throw new Error('keepAlive is not supported anymore on and above v1.6.0. Import it as plugin ("HeartBeatManager"), therefore check the libs readme');

        /**
         * Whether clusters should automatically respawn upon exiting
         * @type {boolean}
         */
        this.respawn = options.respawn;


        /**
         * How many times a cluster can maximally restart in the given interval
         * @type {Object}
         * @param {number} [interval=60000*60] Interval in milliseconds
         * @param {number} [max=3] Max amount of restarts
         * @param {number} [current=0] Current amount of restarts
        */
        this.restarts = options.restarts;

        /**
         * Data, which is passed to the workerData or the processEnv
         * @type {object}
         */
        this.clusterData = options.clusterData;

        /**
         * Options, which is passed when forking a child or creating a thread
         * @type {object}
         */
        this.clusterOptions = options.clusterOptions;


        /**
         * Path to the bot script file
         * @type {string}
         */
        this.file = file;
        if (!file) throw new Error('CLIENT_INVALID_OPTION | No File specified.');
        if (!path.isAbsolute(file)) this.file = path.resolve(process.cwd(), file);
        const stats = fs.statSync(this.file);
        if (!stats.isFile()) throw new Error('CLIENT_INVALID_OPTION | Provided is file is not type of file');

        /**
         * Amount of internal shards in total
         * @type {number}
         */
        this.totalShards = options.totalShards || 'auto';
        if (this.totalShards !== 'auto') {
            if (typeof this.totalShards !== 'number' || isNaN(this.totalShards)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of internal shards must be a number.');
            }
            if (this.totalShards < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of internal shards must be at least 1.');
            if (!Number.isInteger(this.totalShards)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of internal shards must be an integer.');
            }
        }

        /**
         * Amount of total clusters to spawn
         * @type {number}
         */
        this.totalClusters = options.totalClusters || 'auto';
        if (this.totalClusters !== 'auto') {
            if (typeof this.totalClusters !== 'number' || isNaN(this.totalClusters)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of Clusters must be a number.');
            }
            if (this.totalClusters < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be at least 1.');
            if (!Number.isInteger(this.totalClusters)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be an integer.');
            }
        }

        /**
         * Amount of Shards per Clusters
         * @type {number}
         */
        this.shardsPerClusters = options.shardsPerClusters;
        if (this.shardsPerClusters) {
            if (typeof this.shardsPerClusters !== 'number' || isNaN(this.shardsPerClusters)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of ShardsPerClusters must be a number.');
            }
            if (this.shardsPerClusters < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of shardsPerClusters must be at least 1.');
            if (!Number.isInteger(this.shardsPerClusters)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Shards Per Clusters must be an integer.');
            }
        }

        /**
         * Mode for shards to spawn with
         * @type {ClusterManagerMode}
         */
        this.mode = options.mode;
        if (this.mode !== 'worker' && this.mode !== 'process') {
            throw new RangeError('CLIENT_INVALID_OPTION' + 'Cluster mode must be ' + '"worker" or "process"');
        }

        /**
         * An array of arguments to pass to clusters (only when {@link ClusterManager#mode} is `process`)
         * @type {string[]}
         */
        this.shardArgs = options.shardArgs;

        /**
         * An array of arguments to pass to the executable (only when {@link ClusterManager#mode} is `process`)
         * @type {string[]}
         */
        this.execArgv = options.execArgv;

        /**
         * List of internal shard ids this cluster manager spawns
         * @type {string|number[]}
         */
        this.shardList = options.shardList || 'auto';
        if (this.shardList !== 'auto') {
            if (!Array.isArray(this.shardList)) {
                throw new TypeError('CLIENT_INVALID_OPTION | shardList must be an array.');
            }
            this.shardList = [...new Set(this.shardList)];
            if (this.shardList.length < 1) throw new RangeError('CLIENT_INVALID_OPTION | shardList must contain at least 1 ID.');
            if (
                this.shardList.some(
                    shardID =>
                        typeof shardID !== 'number' || isNaN(shardID) || !Number.isInteger(shardID) || shardID < 0,
                )
            ) {
                throw new TypeError('CLIENT_INVALID_OPTION | shardList has to contain an array of positive integers.');
            }
        }

        /**
         * Token to use for obtaining the automatic internal shards count, and passing to bot script
         * @type {?string}
         */
        this.token = options.token ? options.token.replace(/^Bot\s*/i, '') : null;

        /**
         * A collection of all clusters the manager spawned
         * @type {Collection<number, Cluster>}
         */
        this.clusters = new Map();
        this.shardClusterList = null;
        process.env.SHARD_LIST = undefined;
        process.env.TOTAL_SHARDS = this.totalShards;
        process.env.CLUSTER = undefined;
        process.env.CLUSTER_COUNT = this.totalClusters;
        process.env.CLUSTER_MANAGER = true;
        process.env.CLUSTER_MANAGER_MODE = this.mode;
        process.env.DISCORD_TOKEN = this.token;

        if (options.queue.auto) process.env.CLUSTER_QUEUE_MODE = 'auto';
        else process.env.CLUSTER_QUEUE_MODE = 'manual';

        /**
         * A Array of IDS[Number], which should be assigned to the spawned Clusters
         * @type {number[]}
         */
        this.clusterList = options.clusterList || [];

        this.queue = new Queue(options.queue);

        this._debug(`[START] Cluster Manager has been initialized`);

        this.promise = new PromiseHandler();
    }
    /**
     * Spawns multiple internal shards.
     * @typedef {Object} ClusterSpawnOptions
     * @property {number|string} [amount=this.totalShards] Number of internal shards to spawn
     * @property {number} [delay=7000] How long to wait in between spawning each cluster (in milliseconds)
     * @property {number} [tTimeout=30000] The amount in milliseconds to wait until the {@link Client} has become ready
     * before resolving. (-1 or Infinity for no wait)
     * @returns {Promise<Collection<number, Cluster>>}
     */
    async spawn({ amount = this.totalShards, delay = 7000, timeout = -1 } = {}) {
        if (delay < 7000) {
            process.emitWarning(
                `Spawn Delay (delay: ${delay}) is smaller than 7s, this can cause global rate limits on /gateway/bot`,
                {
                    code: 'CLUSTER_MANAGER',
                },
            );
        }

        if (amount === 'auto') {
            amount = await Util.fetchRecommendedShards(this.token, 1000);
            this.totalShards = amount;
            this._debug(`Discord recommended a total shard count of ${amount}`);
        } else {
            if (typeof amount !== 'number' || isNaN(amount)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be a number.');
            }
            if (amount < 1) throw new RangeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be at least 1.');
            if (!Number.isInteger(amount)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be an integer.');
            }
        }
        let clusterAmount = this.totalClusters;
        if (clusterAmount === 'auto') {
            clusterAmount = os.cpus().length;
            this.totalClusters = clusterAmount;
        } else {
            if (typeof clusterAmount !== 'number' || isNaN(clusterAmount)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of Clusters must be a number.');
            }
            if (clusterAmount < 1) throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be at least 1.');
            if (!Number.isInteger(clusterAmount)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be an integer.');
            }
        }

        if (this.shardList === 'auto') this.shardList = [...Array(amount).keys()];

        //Calculate Shards per Cluster:
        if (this.shardsPerClusters) this.totalClusters = Math.ceil(this.shardList.length / this.shardsPerClusters);

        this.shardClusterList = this.shardList.chunk(Math.ceil(this.shardList.length / this.totalClusters));
        if (this.shardClusterList.length !== this.totalClusters) {
            this.totalClusters = this.shardClusterList.length;
        }
        if (this.shardList.some(shardID => shardID >= amount)) {
            throw new RangeError('CLIENT_INVALID_OPTION | Shard IDs must be smaller than the amount of shards.');
        }
        this._debug(`[Spawning Clusters]
    ClusterCount: ${this.totalClusters}
    ShardCount: ${amount}
    ShardList: ${this.shardClusterList.join(', ')}`);
        for (let i = 0; i < this.totalClusters; i++) {
            const clusterId = this.clusterList[i] || i;
            const readyTimeout = timeout !== -1 ? timeout + delay * this.shardClusterList[i].length : timeout;
            const spawnDelay = delay * this.shardClusterList[i].length;
            this.queue.add({
                run: (...a) => {
                    const cluster = this.createCluster(clusterId, this.shardClusterList[i], this.totalShards);
                    return cluster.spawn(...a);
                },
                args: [readyTimeout],
                timeout: spawnDelay,
            });
        }
        return this.queue.start();
    }

    /**
     * Sends a message to all clusters.
     * @param {*} message Message to be sent to the clusters
     * @returns {Promise<Cluster[]>}
     */
    broadcast(message) {
        const promises = [];
        for (const cluster of this.clusters.values()) promises.push(cluster.send(message));
        return Promise.all(promises).then(e => e._result);
    }
    /**
     * Creates a single cluster.
     * <warn>Using this method is usually not necessary if you use the spawn method.</warn>
     * <info>This is usually not necessary to manually specify.</info>
     * @param id
     * @param shardsToSpawn
     * @param totalShards
     * @returns {CLUSTER} Note that the created cluster needs to be explicitly spawned using its spawn method.
     */
    createCluster(id, shardsToSpawn, totalShards, recluster = false) {
        const cluster = new Cluster(this, id, shardsToSpawn, totalShards);
        if(!recluster) this.clusters.set(id, cluster);
        /**
         * Emitted upon creating a cluster.
         * @event ClusterManager#clusterCreate
         * @param {Cluster} cluster Cluster that was created
         */
        // @todo clusterReady event
        this.emit('clusterCreate', cluster);

        this._debug(`[CREATE] Created Cluster ${cluster.id}`);
        return cluster;
    }
    /**
     * Evaluates a script on all clusters, or a given cluster, in the context of the {@link Client}s.
     * @param {string|Function} script JavaScript to run on each cluster
     * @param {BroadcastEvalOptions} [options={}] The options for the broadcastEVal
     * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
     */
    broadcastEval(script, options = {}) {
        if (!script || (typeof script !== 'string' && typeof script !== 'function'))
            return Promise.reject(new TypeError('ClUSTERING_INVALID_EVAL_BROADCAST'));
        script = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(options.context)})` : script;
                   
        if(options.hasOwnProperty('cluster')) {
            if(typeof options.cluster === 'number'){
                if(options.cluster < 0 ) throw new RangeError('CLUSTER_ID_OUT_OF_RANGE');
            }
            if(Array.isArray(options.cluster)){
                if(options.cluster.length === 0) throw new RangeError('ARRAY_MUST_CONTAIN_ONE CLUSTER_ID');
            }
        }
        if(options.guildId){
            options.shard = Util.shardIdForGuildId(options.guildId, this.totalShards);
        }
        if(options.shard){
            if(typeof options.shard === 'number'){
                if(options.shard < 0 ) throw new RangeError('SHARD_ID_OUT_OF_RANGE');
            }
            if(Array.isArray(options.shard)){
                if(options.shard.length === 0) throw new RangeError('ARRAY_MUST_CONTAIN_ONE SHARD_ID');
            }
            options.cluster = [...this.clusters.values()].find(c => c.shardId === options.shard);
        }
        return this._performOnClusters('eval', [script], options.cluster, options.timeout);
    }
    /**
     * Fetches a client property value of each cluster, or a given cluster.
     * @param {string} prop Name of the client property to get, using periods for nesting
     * @param {number} [cluster] Cluster to fetch property from, all if undefined
     * @returns {Promise<*>|Promise<Array<*>>}
     * @example
     * manager.fetchClientValues('guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     */
    fetchClientValues(prop, cluster) {
        return this.broadcastEval(`this.${prop}`, { cluster });
    }

    /**
     * Runs a method with given arguments on all clusters, or a given cluster.
     * @param {string} method Method name to run on each cluster
     * @param {Array<*>} args Arguments to pass through to the method call
     * @param {number|array} [cluster] cluster to run on, all if undefined
     * @param {number} [timeout] the amount of of time to wait until the promise will be rejected
     * @returns {Promise<*>|Promise<Array<*>>} Results of the method execution
     * @private
     */
    _performOnClusters(method, args, cluster, timeout) {
        if (this.clusters.size === 0) return Promise.reject(new Error('CLUSTERING_NO_CLUSTERS'));

        if (typeof cluster === 'number') {
            if (this.clusters.has(cluster)) return this.clusters.get(cluster)[method](...args, undefined, timeout);
            return Promise.reject(new Error('CLUSTERING_CLUSTER_NOT_FOUND FOR ClusterId: ' + cluster));
        }
        let clusters = [...this.clusters.values()];
        if (cluster) clusters = clusters.filter(c => cluster.includes(c.id));
        if(clusters.length === 0) return Promise.reject(new Error('CLUSTERING_NO_CLUSTERS_FOUND'));

        /* if (this.clusters.size !== this.totalClusters && !cluster) return Promise.reject(new Error('CLUSTERING_IN_PROCESS')); */

        const promises = [];
        for (const cl of clusters) promises.push(cl[method](...args, undefined, timeout));
        return Promise.all(promises);
    }

    /**
     * Kills all running clusters and respawns them.
     * @param {ClusterRespawnOptions} [options] Options for respawning shards
     * @returns {Promise<Collection<string, Shard>>}
     */
    async respawnAll({ clusterDelay = 5500, respawnDelay = 500, timeout = -1 } = {}) {
        this.promise.nonce.clear();
        let s = 0;
        let i = 0;
        for (const cluster of [...this.clusters.values()]) {
            const promises = [cluster.respawn({ delay: respawnDelay, timeout })];
            if (++s < this.clusters.size && clusterDelay > 0)
                promises.push(Util.delayFor(this.shardClusterList[i].length * clusterDelay));
            i++;
            await Promise.all(promises); // eslint-disable-line no-await-in-loop
        }
        this._debug('Respawning all Clusters');
        return this.clusters;
    }

    //Custom Functions:

    /**
     * Runs a method with given arguments on the Manager itself
     * @param script
     * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
     * @private
     */
    async evalOnManager(script) {
        script = typeof script === 'function' ? `(${script})(this)` : script;
        let result;
        let error;
        try {
            result = await eval(script);
        } catch (err) {
            error = err;
        }
        const promise = { _result: result, _error: error ? Util.makePlainError(error) : null };
        return promise;
    }

    /**
     * Runs a method with given arguments on the provided Cluster Client
     * @param script
     * @param options
     * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
     * @private
     */
    evalOnCluster(script, options) {
        return this.broadcastEval(script, options).then(r => r[0]);
    }

    /**
     * Adds a plugin to the cluster manager
     */
    extend(...plugins){
        if(!plugins) throw new Error('NO_PLUGINS_PROVIDED');
        if(!Array.isArray(plugins)) plugins = [plugins];
        for(const plugin of plugins){
            if(!plugin) throw new Error('PLUGIN_NOT_PROVIDED');
            if(typeof plugin !== 'object') throw new Error('PLUGIN_NOT_A_OBJECT');
            plugin.build(this);
        }
        return ;
    }

    /**
     * Logs out the Debug Messages
     * <warn>Using this method just emits the Debug Event.</warn>
     * <info>This is usually not necessary to manually specify.</info>
     * @param message
     * @param cluster
     * @returns {string} returns the log message
     */
    _debug(message, cluster) {
        let log;
        if (cluster === undefined) {
            log = `[CM => Manager] ` + message;
        } else {
            log = `[CM => Cluster ${cluster}] ` + message;
        }
        /**
         * Emitted upon receiving a message
         * @event ClusterManager#debug
         * @param {string} Message, which was received
         */
        this.emit('debug', log);
        return log;
    }
}
module.exports = ClusterManager;

Object.defineProperty(Array.prototype, 'chunk', {
    value: function (chunkSize) {
        var R = [];
        for (var i = 0; i < this.length; i += chunkSize) R.push(this.slice(i, i + chunkSize));
        return R;
    },
});
