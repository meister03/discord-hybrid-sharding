const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
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
   * (only available when using the `process` mode)
   * @param {ClusterManagerMode} [options.mode='worker'] Which mode to use for clustering
   * @param {number[]} [options.shardList] A Array of Internal Shards Ids, which should get spawned
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
            mode: 'process',
            shardList: 'auto',
            token: process.env.DISCORD_TOKEN,
          },
          options,
        );
    this.respawn = true;
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
      * Token to use for obtaining the automatic internal shards count, and passing to bot script
      * @type {?string}
      */
      this.token = options.token ? options.token.replace(/^Bot\s*/i, '') : null;
      /**
      * A collection of all clusters the manager spawned
      * @type {Collection<number, Cluster>}
      */
      this.clusters = new Map();
      this.shardclusterlist = null;
      process.env.SHARD_LIST =  undefined;
      process.env.TOTAL_SHARDS = this.totalShards;
      process.env.CLUSTER = undefined;
      process.env.CLUSTER_COUNT = this.totalClusters;
      process.env.CLUSTER_MANAGER = true;
      process.env.CLUSTER_MANAGER_MODE = this.mode;
      process.env.DISCORD_TOKEN = this.token;
  }
  /**
   * Spawns multiple internal shards.
   * @param {number|string} [amount=this.totalShards] Number of internal shards to spawn
   * @param {number} [delay=5500] How long to wait in between spawning each cluster (in milliseconds)
   * @param {number} [spawnTimeout=30000] The amount in milliseconds to wait until the {@link Client} has become ready
   * before resolving. (-1 or Infinity for no wait)
   * @returns {Promise<Collection<number, Shard>>}
   */
  async spawn(amount = this.totalShards, delay = 5500, spawnTimeout) {
    if (amount === 'auto') {
      amount = await Discord.fetchRecommendedShards(this.token, 1000);
      this.totalShards = amount;
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
   
      if(this.shardList === "auto")  this.shardList = [...Array(amount).keys()];
      this.shardclusterlist = this.shardList.chunk(Math.ceil(this.shardList.length/this.totalClusters));
      if(this.shardclusterlist.length !== this.totalClusters){
        this.totalClusters = this.shardclusterlist.length ;
      }
    if (this.shardList.some(shardID => shardID >= amount)) {
      throw new RangeError(
        'CLIENT_INVALID_OPTION',
        'Amount of Internal Shards',
        'bigger than the highest shardID in the shardList option.',
      );
    }
    for (let i = 0; i < this.totalClusters ; i++) {
        const promises = [];
        const cluster = this.createCluster(i, this.shardclusterlist[i], this.totalShards)
        promises.push(cluster.spawn(spawnTimeout));
        if (delay > 0 && this.clusters.size !== this.totalClusters) promises.push(Discord.Util.delayFor(delay));
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
   * Creates a single shard.
   * <warn>Using this method is usually not necessary if you use the spawn method.</warn>
   * <info>This is usually not necessary to manually specify.</info>
   * @returns {CLUSTER} Note that the created cluster needs to be explicitly spawned using its spawn method.
   */
    createCluster(id , shardstospawn, totalshards) {
      
      const cluster = new Cluster(this, id,  shardstospawn, totalshards);
      this.clusters.set(id, cluster);
      /**
       * Emitted upon creating a cluster.
       * @event ClusterManager#clusterCreate
       * @param {Cluster} cluster Cluster that was created
       */
      this.emit('clusterCreate', cluster);
      return cluster;
    }
    /**
    * Evaluates a script on all clusters, or a given cluster, in the context of the {@link Client}s.
    * @param {string} script JavaScript to run on each cluster
    * @param {number} [cluster] cluser to run on, all if undefined
    * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
    */
   broadcastEval(script, cluster) {
     return this._performOnShards('eval', [script], cluster);
   }
  /**
   * Fetches a client property value of each cluster, or a given cluster.
   * @param {string} prop Name of the client property to get, using periods for nesting
   * @param {number} [cluser] Cluster to fetch property from, all if undefined
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
   * @returns {Promise<*>|Promise<Array<*>>} Results of the method execution
   * @private
   */
  _performOnShards(method, args, cluster) {
    if (this.clusters.size === 0) return Promise.reject(new Error('CLUSTERING_NO_CLUSTERS'));

    if (typeof cluster=== 'number') {
      if (this.clusters.has(cluster)) return this.clusers.get(cluster)[method](...args);
      return Promise.reject(new Error('CLUSTERING_CLUSTER_NOT_FOUND', cluster));
    }

    if (this.clusters.size !== this.totalClusters) return Promise.reject(new Error('CLUSTERING_IN_PROCESS'));

    const promises = [];
    for (const cl of this.clusters.values()) promises.push(cl[method](...args));
    return Promise.all(promises);
  }

  /**
   * Kills all running clusters and respawns them.
   * @param {number} [clusterDelay=5000] How long to wait between each clusters (in milliseconds)
   * @param {number} [respawnDelay=500] How long to wait between killing a cluster's process and restarting it
   * (in milliseconds)
   * @param {number} [spawnTimeout=30000] The amount in milliseconds to wait for a cluster to become ready before
   * continuing to another. (-1 or Infinity for no wait)
   * @returns {Promise<Collection<string, Shard>>}
   */
  async respawnAll(shardDelay = 5000, respawnDelay = 500, spawnTimeout) {
    let s = 0;
    for (const cluster of this.clusters.values()) {
      const promises = [cluster.respawn(respawnDelay, spawnTimeout)];
      if (++s < this.clusters.size && shardDelay > 0) promises.push(Util.delayFor(shardDelay));
      await Promise.all(promises); // eslint-disable-line no-await-in-loop
    }
    return this.clusters;
  }

}
module.exports = ClusterManager;

Object.defineProperty(Array.prototype, 'chunk', {
  value: function(chunkSize) {
    var R = [];
    for (var i = 0; i < this.length; i += chunkSize)
      R.push(this.slice(i, i + chunkSize));
    return R;
  }
});
