const Discord = require('discord.js');
const { Events } = Discord.Constants
const Util = Discord.Util;
///communicates between the master workers and the process
class ClusterClient {
  /**
  * @param {Client} client Client of the current cluster
  */
  constructor(client, usev13) {
    /**
     * Client for the Cluser
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
    * Ongoing promises for calls to {@link ClusterManager#evalOnCluster}, mapped by the `script` they were called with
    * @type {Map<string, Promise>}
    * @private
    */
    this._nonce = new Map();


    this.usev13 = usev13 || false;
    /**
     * Message port for the master process (only when {@link ClusterClientUtil#mode} is `worker`)
     * @type {?MessagePort}
     */
    this.parentPort = null;

    if (mode === 'process') {
      process.on('message', this._handleMessage.bind(this));
      client.on('ready', () => {
        process.send({ _ready: true });
      });
      client.on('disconnect', () => {
        process.send({ _disconnect: true });
      });
      client.on('reconnecting', () => {
        process.send({ _reconnecting: true });
      });
    } else if (mode === 'worker') {
      this.parentPort = require('worker_threads').parentPort;
      this.parentPort.on('message', this._handleMessage.bind(this));
      client.on('ready', () => {
        this.parentPort.postMessage({ _ready: true });
      });
      client.on('disconnect', () => {
        this.parentPort.postMessage({ _disconnect: true });
      });
      client.on('reconnecting', () => {
        this.parentPort.postMessage({ _reconnecting: true });
      });
    }

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
  * @type {number[]}
  * @readonly
  */
  get ids() {
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
  * Gets several Info like Cluster_Count, Number, Totalshards...
  * @type {Object}
  * @readonly
  */
  get info() {
    let clustermode = process.env.CLUSTER_MANAGER_MODE;
    if (!clustermode) return
    if (clustermode !== "worker" && clustermode !== "process") throw new Error("NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT");
    let data;
    if (clustermode === "process") {
      const shardlist = [];
      let parseshardlist = process.env.SHARD_LIST.split(",")
      parseshardlist.forEach(c => shardlist.push(Number(c)))
      data = { SHARD_LIST: shardlist, TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS), CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT), CLUSTER: Number(process.env.CLUSTER), CLUSTER_MANAGER_MODE: clustermode }
    } else {
      data = require("worker_threads").workerData
    }
    return data;
  }
  /**
  * Sends a message to the master process.
  * @param {*} message Message to send
  * @returns {Promise<void>}
  * @emits Cluster#message
  */
  send(message) {
    //console.log(message)
    return new Promise((resolve, reject) => {
      if (this.mode === 'process') {
        process.send(message, err => {
          if (err) reject(err);
          else resolve();
        });
      } else if (this.mode === 'worker') {
        this.parentPort.postMessage(message);
        resolve();
      }
    });
  }
  /**
 * Fetches a client property value of each shard, or a given shard.
 * @param {string} prop Name of the client property to get, using periods for nesting
 * @param {number} [shard] Shard to fetch property from, all if undefined
 * @returns {Promise<*>|Promise<Array<*>>}
 * @example
 * client.shard.fetchClientValues('guilds.cache.size')
 *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
 *   .catch(console.error);
 * @see {@link ClusterManager#fetchClientValues}
 */
  fetchClientValues(prop, shard) {
    return new Promise((resolve, reject) => {
      const parent = this.parentPort || process;

      const listener = message => {
        if (!message || message._sFetchProp !== prop || message._sFetchPropShard !== shard) return;
        parent.removeListener('message', listener);
        if (!message._error) resolve(message._result);
        else reject(Util.makeError(message._error));
      };
      parent.on('message', listener);

      this.send({ _sFetchProp: prop, _sFetchPropShard: shard }).catch(err => {
        parent.removeListener('message', listener);
        reject(err);
      });
    });
  }

  /**
   * Evaluates a script or function on all clusters, or a given cluster, in the context of the {@link Client}s.
   * @param {string|Function} script JavaScript to run on each cluster
   * @param {number} [cluster] Cluster to run script on, all if undefined
   * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
   * @example
   * client.cluster.broadcastEval('this.guilds.cache.size')
   *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
   *   .catch(console.error);
   * @see {@link ClusterManager#broadcastEval}
   */
  broadcastEval(script, cluster) {
    if (this.usev13) {

      return new Promise((resolve, reject) => {
        const options = cluster || {};

        const parent = this.parentPort || process;
        if (typeof script !== 'function') {
          reject(new TypeError('CLUSTERING_INVALID_EVAL_BROADCAST'));
          return;
        }

        script = `(${script})(this, ${JSON.stringify(options.context)})`;
        const listener = message => {
          if (message._sEval !== script || message._sEvalShard !== options.cluster) return;
          parent.removeListener('message', listener);
          if (!message._error) resolve(message._result);
          else reject(Util.makeError(message._error));
        };
        parent.on('message', listener);
        this.send({ _sEval: script, _sEvalShard: options.cluster }).catch(err => {
          parent.removeListener('message', listener);
          reject(err);
        });
      })

    }
    return new Promise((resolve, reject) => {
      const parent = this.parentPort || process;
      script = typeof script === 'function' ? `(${script})(this)` : script;

      const listener = message => {
        if (!message || message._sEval !== script || message._sEvalShard !== cluster) return;
        parent.removeListener('message', listener);
        if (!message._error) resolve(message._result);
        else reject(Util.makeError(message._error));
      };
      parent.on('message', listener);

      this.send({ _sEval: script, _sEvalShard: cluster }).catch(err => {
        parent.removeListener('message', listener);
        reject(err);
      });
    });
  }

   /**
 * Evaluates a script or function on the Cluster Manager
 * @param {string|Function} script JavaScript to run on the Manager
 * @returns {Promise<*>|Promise<Array<*>>} Result of the script execution
 * @example
 * client.cluster.evalOnManager('process.uptime')
 *   .then(result => console.log(result))
 *   .catch(console.error);
 * @see {@link ClusterManager#evalOnManager}
 */
  evalOnManager(script) {
    return new Promise((resolve, reject) => {
      const parent = this.parentPort || process;
      script = typeof script === 'function' ? `(${script})(this)` : script;

      const listener = message => {
        if (!message || message._sManagerEval !== script) return;
        parent.removeListener('message', listener);
        if (!message._error) resolve(message._result[0]);
        else reject(Util.makeError(message._error));
      };
      parent.on('message', listener);

      this.send({ _sManagerEval: script }).catch(err => {
        parent.removeListener('message', listener);
        reject(err);
      });
    })
  }

 /**
   * Evaluates a script or function on the ClusterClient
   * @param {string|Function} script JavaScript to run on the ClusterClient
   * @param {Object} options Some options such as the TargetCluster or the Evaltimeout
   * @param {number} [options.cluster] The Id od the target Cluster
   * @param {number} [options.timeout=10000] The time in ms to wait, until the eval will be rejected without any response
   * @returns {Promise<*>|Promise<Array<*>>} Result of the script execution
   * @example
   * client.cluster.evalOnCluster('this.cluster.id',  {timeout: 10000, cluster: 0})
   *   .then(result => console.log(result))
   *   .catch(console.error);
   * @see {@link ClusterManager#evalOnCluster}
   */
  evalOnCluster(script, options = {}) {
    return new Promise((resolve, reject) => {
      if (!options.hasOwnProperty('cluster')) reject('TARGET CLUSTER HAS NOT BEEN PROVIDED');
      script = typeof script === 'function' ? `(${script})(this)` : script;
      const nonce = Date.now().toString(36) + Math.random().toString(36);
      this._nonce.set(nonce, { resolve, reject });
      if (!options.timeout) options.timeout = 10000;
      setTimeout(() => {
        if (this._nonce.has(nonce)) {
          this._nonce.get(nonce).reject(new Error("EVAL Request Timed out"));
          this._nonce.delete(nonce);
        }
      }, options.timeout);
      this.send({ _sClusterEval: script, nonce, timeout: options.timeout, cluster: options.cluster });
    })
  }

  /**
   * Requests a respawn of all clusters.
   * @param {number} [clusterDelay=5000] How long to wait between clusters (in milliseconds)
   * @param {number} [respawnDelay=500] How long to wait between killing a cluster's process/worker and restarting it
   * (in milliseconds)
   * @param {number} [spawnTimeout=30000] The amount in milliseconds to wait for a cluster to become ready before
   * continuing to another. (-1 or Infinity for no wait)
   * @returns {Promise<void>} Resolves upon the message being sent
   * @see {@link ClusterManager#respawnAll}
   */
  respawnAll(clusterDelay = 5000, respawnDelay = 500, spawnTimeout = 30000) {
    return this.send({ _sRespawnAll: { clusterDelay, respawnDelay, spawnTimeout } });
  }

  /**
   * Handles an IPC message.
   * @param {*} message Message received
   * @private
   */
  async _handleMessage(message) {
    if (!message) return;
    if (message._fetchProp) {
      const props = message._fetchProp.split('.');
      let value = this.client;
      for (const prop of props) value = value[prop];
      this._respond('fetchProp', { _fetchProp: message._fetchProp, _result: value });
    } else if (message._eval) {
      try {
        this._respond('eval', { _eval: message._eval, _result: await this.client._eval(message._eval) });
      } catch (err) {
        this._respond('eval', { _eval: message._eval, _error: Util.makePlainError(err) });
      }
    } else if (message.hasOwnProperty('_sClusterEvalRequest')) {
      try {
        this._respond('evalOnCluster', { _sClusterEvalResponse: await this.client._eval(message._sClusterEvalRequest), nonce: message.nonce, cluster: message.cluster });
      } catch (err) {
        this._respond('evalOnCluster', { _sClusterEvalResponse: {}, _error: Util.makePlainError(err), nonce: message.nonce });
      }
    } else if (message.hasOwnProperty('_sClusterEvalResponse')) {
      const promise = this._nonce.get(message.nonce);
      if (!promise) return;
      if (message._error) {
        promise.reject(message._error)
        this._nonce.delete(message.nonce);
      } else {
        promise.resolve(message._sClusterEvalResponse)
        this._nonce.delete(message.nonce);
      }
      return;
    }
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
      this.client.emit(Events.ERROR, error);
    });
  }

  /**
   * Creates/gets the singleton of this class.
   * @param {Client} client The client to use
   * @param {ClusterManagerMode} mode Mode the cluster was spawned with
   * @returns {ShardClientUtil}
   */
  static singleton(client, mode) {
    if (!this._singleton) {
      this._singleton = new this(client, mode);
    } else {
      client.emit(
        Events.WARN,
        'Multiple clients created in child process/worker; only the first will handle clustering helpers.',
      );
    }
    return this._singleton;
  }
  /**
   * gets the total Internalshardcount and shard list.
   * @returns {ClusterClientUtil}
   */
  static getinfo() {
    let clustermode = process.env.CLUSTER_MANAGER_MODE;
    if (!clustermode) return
    if (clustermode !== "worker" && clustermode !== "process") throw new Error("NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT");
    let data;
    if (clustermode === "process") {
      const shardlist = [];
      let parseshardlist = process.env.SHARD_LIST.split(",")
      parseshardlist.forEach(c => shardlist.push(Number(c)))
      data = { SHARD_LIST: shardlist, TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS), CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT), CLUSTER: Number(process.env.CLUSTER), CLUSTER_MANAGER_MODE: clustermode }
    } else {
      data = require("worker_threads").workerData
    }
    return data;
  }


}
module.exports = ClusterClient;
