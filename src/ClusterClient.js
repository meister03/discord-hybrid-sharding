const { IPCMessage, BaseMessage } = require('./IPCMessage.js')
const Util = require('./Util.js');
const { Events } = require('./Constants.js');
const EventEmitter = require('events');
///communicates between the master workers and the process
class ClusterClient extends EventEmitter {
  /**
  * @param {Client} client Client of the current cluster
  */
  constructor(client) {
    super();
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

    /**
    * The Interval of the Heartbeat Messages and the Heartbeat CheckUp to respawn unresponsive Clusters.
    * @type {Number}
    */
    this.keepAliveInterval = isNaN(Number(this.info.KEEP_ALIVE_INTERVAL)) ? 0 : this.info.KEEP_ALIVE_INTERVAL;

    /**
    * The Hearbeat Object, which contains the missed Hearbeats, the last Hearbeat and the Hearbeat Interval
    * @type {Object}
    */
    this.heartbeat = {};

    /**
     * Message port for the master process (only when {@link ClusterClientUtil#mode} is `worker`)
     * @type {?MessagePort}
     */
    this.parentPort = null;

    if (mode === 'process') {
      process.on('message', this._handleMessage.bind(this));
      client.on('ready', () => {
        process.send({ _ready: true });
        if (this.keepAliveInterval) {
          this._cleanupHearbeat();
          this._checkIfClusterAlive();
          this._checkIfAckRecieved();
        }
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
        if (this.keepAliveInterval) {
          this._cleanupHearbeat();
          this._checkIfClusterAlive();
          this._checkIfAckRecieved();
        }
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
      data = { SHARD_LIST: shardlist, TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS), CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT), CLUSTER: Number(process.env.CLUSTER), CLUSTER_MANAGER_MODE: clustermode, KEEP_ALIVE_INTERVAL: Number(process.env.KEEP_ALIVE_INTERVAL) }
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
    if (typeof message === 'object') message = new BaseMessage(message).toJSON();
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
   * @param {BroadcastEvalOptions} [options={}] The options for the broadcast
   * @returns {Promise<*>|Promise<Array<*>>} Results of the script execution
   * @example
   * client.cluster.broadcastEval('this.guilds.cache.size')
   *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
   *   .catch(console.error);
   * @see {@link ClusterManager#broadcastEval}
   */
  broadcastEval(script, options = {}) {
    return new Promise((resolve, reject) => {
      if (!script || (typeof script !== 'string' && typeof script !== 'function')) reject(new TypeError('Script for BroadcastEvaling has not been provided or must be a valid String!'));
      script = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(options.context)})` : script;

      const parent = this.parentPort || process;
      let evaltimeout;

      const listener = message => {
        if (message._sEval !== script || message._sEvalShard !== options.cluster) return;
        parent.removeListener('message', listener);
        if(evaltimeout) clearTimeout(evaltimeout);
        if (!message._error) resolve(message._result);
        else reject(Util.makeError(message._error));
      };
      parent.on('message', listener);
      this.send({ _sEval: script, _sEvalShard: options.cluster, _sEvalTimeout: options.timeout }).then(m => {
        if(options.timeout){
          evaltimeout = setTimeout(()=> {
            parent.removeListener('message', listener);
            reject(new Error(`BROADCAST_EVAL_REQUEST_TIMED_OUT`));
          }, options.timeout + 100); //Add 100 ms more to prevent timeout on client side
        }
      }).catch(err => {
        if(evaltimeout) clearTimeout(evaltimeout);
        parent.removeListener('message', listener);
        reject(err);
      });
    })
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
        if (!message._error) resolve(message._results);
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
  * @param {number} [options.shard] The Id od the target Shard, when the Cluster has not been provided.
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
      if (!options.hasOwnProperty('cluster') && !options.hasOwnProperty('shard') && !options.hasOwnProperty('guildId')) reject('TARGET CLUSTER HAS NOT BEEN PROVIDED');
      if (!script || (typeof script !== 'string' && typeof script !== 'function')) reject(new TypeError('Script for BroadcastEvaling has not been provided or must be a valid String!'));
      script = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(options.context)})` : script;
      const nonce = Date.now().toString(36) + Math.random().toString(36);
      this._nonce.set(nonce, { resolve, reject });
      if (!options.timeout) options.timeout = 10000;
      setTimeout(() => {
        if (this._nonce.has(nonce)) {
          this._nonce.get(nonce).reject(new Error("EVAL Request Timed out"));
          this._nonce.delete(nonce);
        }
      }, options.timeout);
      this.send({ _sClusterEval: script, nonce, ...options });
    })
  }

  /**
  * Sends a Request to the ParentCluster and returns the reply
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
    message = new BaseMessage(message).toJSON()
    return new Promise((resolve, reject) => {
      this._nonce.set(message.nonce, { resolve, reject });
      setTimeout(() => {
        if (this._nonce.has(message.nonce)) {
          this._nonce.get(message.nonce).reject(new Error("EVAL Request Timed out"));
          this._nonce.delete(message.nonce);
        }
      }, (message.timeout || 10000));
      this.send(message);
    }).catch(e => ({ ...message, error: e }))
  }

  /**
  * Requests a respawn of all clusters.
  * @param {ClusterRespawnOptions} [options] Options for respawning shards
  * @returns {Promise<void>} Resolves upon the message being sent
  * @see {@link ClusterManager#respawnAll}
  */
  respawnAll({ clusterDelay = 5000, respawnDelay = 7000, timeout = 30000 } = {}) {
    return this.send({ _sRespawnAll: { clusterDelay, respawnDelay, timeout } });
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
      return;
    } else if (message._eval) {
      try {
        this._respond('eval', { _eval: message._eval, _result: await this.client._eval(message._eval) });
      } catch (err) {
        this._respond('eval', { _eval: message._eval, _error: Util.makePlainError(err) });
      }
      return;
    } else if (message.hasOwnProperty('_sClusterEvalRequest')) {
      try {
        this._respond('evalOnCluster', { _sClusterEvalResponse: await this.client._eval(message._sClusterEvalRequest), nonce: message.nonce, cluster: message.cluster });
      } catch (err) {
        this._respond('evalOnCluster', { _sClusterEvalResponse: {}, _error: Util.makePlainError(err), nonce: message.nonce });
      }
      return;
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
    } else if (message.ack) {
      return this._heartbeatAckMessage();
    } else if (message._sCustom) {
      if (message._sReply) {
        const promise = this._nonce.get(message.nonce);
        if (promise) {
          promise.resolve(message)
          this._nonce.delete(message.nonce);
        }
        return;
      } else if (message._sRequest) {
        //this.request(message).then(e => this.send(e)).catch(e => this.send({...message, error: e}))
      }

      let emitmessage;
      if (typeof message === 'object') emitmessage = new IPCMessage(this, message)
      else emitmessage = message;
      /**
      * Emitted upon receiving a message from the parent process/worker.
      * @event ClusterClient#message
      * @param {*} message Message that was received
      */
      this.emit('message', emitmessage)
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

  /*Hearbeat System*/
  _heartbeatAckMessage() {
    this.heartbeat.last = Date.now();
    this.heartbeat.missed = 0;
  }

  _checkIfAckRecieved() {
    this.client.emit('clusterDebug', `[ClusterClient ${this.id}] Heartbeat Ack Interval CheckUp Started`, this.id);
    this.heartbeat.ack = setInterval(() => {
      if (!this.heartbeat) return;
      const diff = Date.now() - Number(this.heartbeat.last);
      if (isNaN(diff)) return;
      if (diff > (this.keepAliveInterval + 2000)) {
        this.heartbeat.missed = (this.heartbeat.missed || 0) + 1;
        if (this.heartbeat.missed < 5) {
          this.client.emit('clusterDebug', `[ClusterClient ${this.id}][Heartbeat_ACK_MISSING] ${this.heartbeat.missed} Heartbeat(s) Ack have been missed.`, this.id);
          return;
        }
        else this._cleanupHearbeat();
      }
    }, this.keepAliveInterval);
    return this.heartbeat;
  }

  _checkIfClusterAlive() {
    this.heartbeat.interval = setInterval(() => {
      this.send({ _keepAlive: true, heartbeat: { last: Date.now() } })
    }, this.keepAliveInterval);
    return this.heartbeat.interval;
  }

  _cleanupHearbeat() {
    clearInterval(this.heartbeat.interval);
    clearInterval(this.heartbeat.ack);
    this.heartbeat = {};
    return this.heartbeat;
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
      data = { SHARD_LIST: shardlist, TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS), CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT), CLUSTER: Number(process.env.CLUSTER), CLUSTER_MANAGER_MODE: clustermode, KEEP_ALIVE_INTERVAL: Number(process.env.KEEP_ALIVE_INTERVAL) }
    } else {
      data = require("worker_threads").workerData
    }
    return data;
  }


}
module.exports = ClusterClient;
