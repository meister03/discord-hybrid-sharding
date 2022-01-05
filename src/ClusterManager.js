const EventEmitter = require('events');

const fs = require('fs');
const path = require('path');
const os = require('os');

const Util = require('./Util.js');
const Cluster = require('./Cluster.js')

class ClusterManager extends EventEmitter {
  /**
  * @param {string} file Path to your bot file
  * @param {Object} [options] Options for the cluster manager
  * @param {string|number} [options.totalShards='auto'] Number of total internal shards or "auto"
  * @param {string|number} [options.totalClusters='auto'] Number of total Clusters\Process to spawn
  * @param {string[]} [options.shardArgs=[]] Arguments to pass to the clustered script when spawning
  * (only available when using the `process` mode)
  * @param {string[]} [options.execArgv=[]] Arguments to pass to the clustered script executable when spawning
  * @param {boolean} [respawn=true] Whether clusters should automatically respawn upon exiting
  * (only available when using the `process` mode)
  * @param {ClusterManagerMode} [options.mode='worker'] Which mode to use for clustering
  * @param {number[]} [options.shardList] A Array of Internal Shards Ids, which should get spawned
  * @param {Object} [options.keepAlive] Whether Clusters should be automatically respawned, when Heartbeats have not been recieved for a given period of time
  * @param {Number} [options.keepAlive.interval=10000] The Interval for the Hearbeat CheckUp
  * @param {Number} [options.keepAlive.maxClusterRestarts=3] The maximal Amount of Cluster Restarts, which can be executed by the keepAlive Function in less than 1 hour.
  * @param {Number} [options.keepAlive.maxMissedHeartbeats=5] The maximal Amount of missed Hearbeats, upon the Cluster should be respawned.
  * @param {string} [options.token] Token to use for automatic internal shard count and passing to bot file
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
        keepAlive: {},
        token: process.env.DISCORD_TOKEN,
      },
      options,
    );

    /**
     * Whether clusters should automatically respawn upon exiting
     * @type {boolean}
     */
    this.respawn = options.respawn;

    /**
    * Path to the bot script file
    * @type {string}
    */
    this.file = file;
    if (!file) throw new Error('CLIENT_INVALID_OPTION', 'File', 'specified.');
    if (!path.isAbsolute(file)) this.file = path.resolve(process.cwd(), file);
    const stats = fs.statSync(this.file);
    if (!stats.isFile()) throw new Error('CLIENT_INVALID_OPTION', 'File', 'a file');

    /**
     * Amount of internal shards in total
     * @type {number}
     */
    this.totalShards = options.totalShards || 'auto';
    if (this.totalShards !== 'auto') {
      if (typeof this.totalShards !== 'number' || isNaN(this.totalShards)) {
        throw new TypeError('CLIENT_INVALID_OPTION', 'Amount of internal shards', 'a number.');
      }
      if (this.totalShards < 1) throw new RangeError('CLIENT_INVALID_OPTION', 'Amount of internal shards', 'at least 1.');
      if (!Number.isInteger(this.totalShards)) {
        throw new RangeError('CLIENT_INVALID_OPTION', 'Amount of internal shards', 'an integer.');
      }
    }


    /**
    * Amount of total clusters to spawn
    * @type {number}
    */
    this.totalClusters = options.totalClusters || 'auto';
    if (this.totalClusters !== 'auto') {
      if (typeof this.totalClusters !== 'number' || isNaN(this.totalClusters)) {
        throw new TypeError('CLIENT_INVALID_OPTION', 'Amount of Clusters', 'a number.');
      }
      if (this.totalClusters < 1) throw new RangeError('CLIENT_INVALID_OPTION', 'Amount of Clusters', 'at least 1.');
      if (!Number.isInteger(this.totalClusters)) {
        throw new RangeError('CLIENT_INVALID_OPTION', 'Amount of Clusters', 'an integer.');
      }
    }

    /**
    * Amount of Shards per Clusters
    * @type {number}
    */
    this.shardsPerClusters = options.shardsPerClusters;
    if (this.shardsPerClusters) {
      if (typeof this.shardsPerClusters !== 'number' || isNaN(this.shardsPerClusters)) {
        throw new TypeError('CLIENT_INVALID_OPTION', 'Amount of ShardsPerClusters', 'a number.');
      }
      if (this.shardsPerClusters < 1) throw new RangeError('CLIENT_INVALID_OPTION', 'Amount of shardsPerClusters', 'at least 1.');
      if (!Number.isInteger(this.shardsPerClusters)) {
        throw new RangeError('CLIENT_INVALID_OPTION', 'Amount of Shards Per Clusters', 'an integer.');
      }
    }

    /**
    * Mode for shards to spawn with
    * @type {ClusterManagerMode}
    */
    this.mode = options.mode;
    if (this.mode !== 'worker' && this.mode !== "process") {
      throw new RangeError('CLIENT_INVALID_OPTION', 'Cluster mode', '"worker/process"');
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
        throw new TypeError('CLIENT_INVALID_OPTION', 'shardList', 'an array.');
      }
      this.shardList = [...new Set(this.shardList)];
      if (this.shardList.length < 1) throw new RangeError('CLIENT_INVALID_OPTION', 'shardList', 'at least 1 ID.');
      if (
        this.shardList.some(
          shardID => typeof shardID !== 'number' || isNaN(shardID) || !Number.isInteger(shardID) || shardID < 0,
        )
      ) {
        throw new TypeError('CLIENT_INVALID_OPTION', 'shardList', 'an array of positive integers.');
      }
    }


    /**
    * Whether Clusters should be respawned, when the ClusterClient did not sent any Heartbeats.
    * @type {Object}
    */
    this.keepAlive = options.keepAlive;
    if (typeof this.keepAlive !== 'object') {
      throw new TypeError('CLIENT_INVALID_OPTION', 'keepAlive Options', 'a Object');
    }
    if (Object.keys(options.keepAlive).length !== 0) {
      this.keepAlive.interval = options.keepAlive.interval || 10000;
      this.keepAlive.maxMissedHeartbeats = options.keepAlive.maxMissedHeartbeats || 5;
      this.keepAlive.maxClusterRestarts = options.keepAlive.maxClusterRestarts || 3;
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
    process.env.KEEP_ALIVE_INTERVAL = this.keepAlive.interval;
    process.env.DISCORD_TOKEN = this.token;


    /**
    * Ongoing promises for calls to {@link ClusterClient#evalOnCluster}, mapped by the `script` they were called with
    * @type {Map<string, Promise>}
    * @private
    */
    this._nonce = new Map();

    /**
    * A Array of IDS[Number], which should be assigned to the spawned Clusters
    * @type {Number[]}
    */
    this.clusterList = options.clusterList || [];

    this._debug(`[START] Cluster Manager has been initalized`)
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
    if (amount === 'auto') {
      amount = await Util.fetchRecommendedShards(this.token, 1000);
      this.totalShards = amount;
      this._debug(`Discord recommanded Total Shard Count of ${amount}`)
    } else {
      if (typeof amount !== 'number' || isNaN(amount)) {
        throw new TypeError('CLIENT_INVALID_OPTION', 'Amount of internal shards', 'a number.');
      }
      if (amount < 1) throw new RangeError('CLIENT_INVALID_OPTION', 'Amount of internal shards', 'at least 1.');
      if (!Number.isInteger(amount)) {
        throw new TypeError('CLIENT_INVALID_OPTION', 'Amount of internal shards', 'an integer.');
      }
    }
    let clusteramount = this.totalClusters;
    if (clusteramount === 'auto') {
      clusteramount = os.cpus().length;
      this.totalClusters = clusteramount;
    } else {
      if (typeof clusteramount !== 'number' || isNaN(clusteramount)) {
        throw new TypeError('CLIENT_INVALID_OPTION', 'Amount of Clusters', 'a number.');
      }
      if (clusteramount < 1) throw new RangeError('CLIENT_INVALID_OPTION', 'Amount of Clusters', 'at least 1.');
      if (!Number.isInteger(clusteramount)) {
        throw new TypeError('CLIENT_INVALID_OPTION', 'Amount of Clusters', 'an integer.');
      }
    }

    if (this.shardList === "auto") this.shardList = [...Array(amount).keys()];

    //Calculate Shards per Cluster:
    if (this.shardsPerClusters) this.totalClusters = Math.ceil(this.shardList.length / this.shardsPerClusters);


    this.shardClusterList = this.shardList.chunk(Math.ceil(this.shardList.length / this.totalClusters));
    if (this.shardClusterList.length !== this.totalClusters) {
      this.totalClusters = this.shardClusterList.length;
    }
    if (this.shardList.some(shardID => shardID >= amount)) {
      throw new RangeError(
        'CLIENT_INVALID_OPTION',
        'Amount of Internal Shards',
        'bigger than the highest shardID in the shardList option.',
      );
    }
    this._debug(`[Spawning Clusters]
    ClusterCount: ${this.totalClusters}
    ShardCount: ${amount}
    ShardList: ${this.shardClusterList.join(', ')}`)
    for (let i = 0; i < this.totalClusters; i++) {
      const promises = [];
      const clusterId = this.clusterList[i] || i;
      const cluster = this.createCluster(clusterId, this.shardClusterList[i], this.totalShards)
      promises.push(cluster.spawn(timeout));
      if (delay > 0 && this.clusters.size !== this.totalClusters) promises.push(Util.delayFor(delay * this.shardClusterList[i].length));
      await Promise.all(promises); // eslint-disable-line no-await-in-loop
    }
    return this.clusters;
  }

  /**
  * Sends a message to all clusters.
  * @param {*} message Message to be sent to the clusters
  * @returns {Promise<Cluster[]>}
  */
  broadcast(message) {
    const promises = [];
    for (const cluster of this.clusters.values()) promises.push(cluster.send(message));
    return Promise.all(promises);
  }
  /**
  * Creates a single cluster.
  * <warn>Using this method is usually not necessary if you use the spawn method.</warn>
  * <info>This is usually not necessary to manually specify.</info>
  * @returns {CLUSTER} Note that the created cluster needs to be explicitly spawned using its spawn method.
  */
  createCluster(id, shardsToSpawn, totalShards) {

    const cluster = new Cluster(this, id, shardsToSpawn, totalShards);
    this.clusters.set(id, cluster);
    /**
     * Emitted upon creating a cluster.
     * @event ClusterManager#clusterCreate
     * @param {Cluster} cluster Cluster that was created
     */
    this.emit('clusterCreate', cluster);

    this._debug(`[CREATE] Created Cluster ${cluster.id}`)
    return cluster;
  }
  /**
  * Evaluates a script on all clusters, or a given cluster, in the context of the {@link Client}s.
  * @param {string|Function} script JavaScript to run on each cluster
  * @param {BroadcastEvalOptions} [options={}] The options for the broadcastEVal
  * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
  */
  broadcastEval(script, options = {}) {
    if (!script || (typeof script !== 'string' && typeof script !== 'function')) return Promise.reject(new TypeError('ClUSTERING_INVALID_EVAL_BROADCAST'));
    script = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(options.context)})` : script;
    return this._performOnShards('eval', [script], options.cluster, options.timeout);
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
    return this._performOnShards('fetchClientValue', [prop], cluster);
  }

  /**
   * Runs a method with given arguments on all clusters, or a given cluster.
   * @param {string} method Method name to run on each cluster
   * @param {Array<*>} args Arguments to pass through to the method call
   * @param {number} [cluster] cluser to run on, all if undefined
   * @param {number} [timeout] the amount of of time to wait until the promise will be rejected
   * @returns {Promise<*>|Promise<Array<*>>} Results of the method execution
   * @private
   */
  _performOnShards(method, args, cluster, timeout) {

    if (this.clusters.size === 0) return Promise.reject(new Error('CLUSTERING_NO_CLUSTERS'));

    if (typeof cluster === 'number') {
      if (this.clusters.has(cluster)) return this.clusters.get(cluster)[method](...args, undefined,timeout);
      return Promise.reject(new Error('CLUSTERING_CLUSTER_NOT_FOUND', cluster));
    }

    if (this.clusters.size !== this.totalClusters) return Promise.reject(new Error('CLUSTERING_IN_PROCESS'));

    const promises = [];
    for (const cl of this.clusters.values()) promises.push(cl[method](...args, undefined, timeout));
    return Promise.all(promises);
  }

  /**
  * Kills all running clusters and respawns them.
  * @param {ClusterRespawnOptions} [options] Options for respawning shards
  * @returns {Promise<Collection<string, Shard>>}
  */
  async respawnAll({ clusterDelay = 5500, respawnDelay = 500, timeout = -1 } = {}) {
    this._nonce.clear()
    let s = 0;
    let i = 0;
    for (const cluster of [...this.clusters.values()]) {
      const promises = [cluster.respawn({ delay: respawnDelay, timeout })];
      if (++s < this.clusters.size && clusterDelay > 0) promises.push(Util.delayFor(this.shardClusterList[i].length * clusterDelay));
      i++
      await Promise.all(promises); // eslint-disable-line no-await-in-loop
    }
    this._debug('Respawning all Clusters')
    return this.clusters;
  }

  //Custom Functions:

  /**
  * Runs a method with given arguments on the Manager itself
  * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
  * @private
  */
  async evalOnManager(script) {
    script = typeof script === 'function' ? `(${script})(this)` : script;
    let result;
    let error;
    try {
      result = await eval(script)
    } catch (err) {
      error = err;
    }
    const promise = { _results: result, _error: error }
    return promise;
  }

  /**
  * Runs a method with given arguments on the provided Cluster Client
  * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
  * @private
  */
  evalOnCluster(script, options) {
    script = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(options.context)})` : script;
    if(options.hasOwnProperty('guildId')){
      options.shard = Util.shardIdForGuildId(options.guildId, this.totalShards)
    } 
    if (options.hasOwnProperty('shard')) {
      const findcluster = [...this.clusters.values()].find(i => i.shardlist.includes(options.shard));
      options.cluster = findcluster ? findcluster.id : 0;
    }
    const cluster = this.clusters.get(options.cluster);
    if (!cluster) return Promise.reject(new Error('CLUSTER_DOES_NOT_EXIST', options.cluster));
    if (!cluster.process && !cluster.worker) return Promise.reject(new Error('CLUSTERING_NO_CHILD_EXISTS', cluster.id));
    return new Promise((resolve, reject) => {
      const nonce = options.nonce;
      this._nonce.set(nonce, { resolve, reject, requestcluster: options.requestcluster });
      const sent = cluster.send({ _sClusterEvalRequest: script, nonce, cluster: options.cluster }, void 0, void 0, e => {
        if (e) reject(new Error(`Failed to deliver Message to cluster: ${e}`));
        setTimeout(() => {
          if (this._nonce.has(nonce)) {
            this._nonce.get(nonce).reject(new Error("Eval Request Timedout"));
            this._nonce.delete(nonce);
          }
        }, (options.timeout || 10000));
      });
      if (!sent) reject(new Error("CLUSTERING_IN_PROCESS or CLUSTERING_DIED"));
    }).catch((e) => (new Error(e.toString())))
  }


  /**
   * Logsout the Debug Messages
   * <warn>Using this method just emits the Debug Event.</warn>
   * <info>This is usually not necessary to manually specify.</info>
   * @returns {log} returns the log message
   */
  _debug(message, cluster) {
    let log;
    if (cluster === undefined) {
      log = `[CM => Manager] ` + message;
    } else {
      log = `[CM => Cluster ${cluster}] ` + message;
    }
    /**
     * Emitted upon recieving a message
     * @event ClusterManager#debug
     * @param {log} Message, which was recieved
    */
    this.emit('debug', log)
    return log;
  }

}
module.exports = ClusterManager;

Object.defineProperty(Array.prototype, 'chunk', {
  value: function (chunkSize) {
    var R = [];
    for (var i = 0; i < this.length; i += chunkSize)
      R.push(this.slice(i, i + chunkSize));
    return R;
  }
});
