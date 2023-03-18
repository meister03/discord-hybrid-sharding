var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/Core/Cluster.ts
import EventEmitter from "events";
import path from "path";

// src/Util/Util.ts
import fetch from "node-fetch";

// src/types/shared.ts
var Events = {
  ERROR: "warn",
  WARN: "error"
};
var DefaultOptions = {
  http: {
    api: "https://discord.com/api",
    version: "10"
  }
};
var Endpoints = {
  botGateway: "/gateway/bot"
};
var messageType = /* @__PURE__ */ ((messageType2) => {
  messageType2[messageType2["MISSING_TYPE"] = 0] = "MISSING_TYPE";
  messageType2[messageType2["CUSTOM_REQUEST"] = 1] = "CUSTOM_REQUEST";
  messageType2[messageType2["CUSTOM_MESSAGE"] = 2] = "CUSTOM_MESSAGE";
  messageType2[messageType2["CUSTOM_REPLY"] = 3] = "CUSTOM_REPLY";
  messageType2[messageType2["HEARTBEAT"] = 4] = "HEARTBEAT";
  messageType2[messageType2["HEARTBEAT_ACK"] = 5] = "HEARTBEAT_ACK";
  messageType2[messageType2["CLIENT_BROADCAST_REQUEST"] = 6] = "CLIENT_BROADCAST_REQUEST";
  messageType2[messageType2["CLIENT_BROADCAST_RESPONSE"] = 7] = "CLIENT_BROADCAST_RESPONSE";
  messageType2[messageType2["CLIENT_RESPAWN"] = 8] = "CLIENT_RESPAWN";
  messageType2[messageType2["CLIENT_RESPAWN_ALL"] = 9] = "CLIENT_RESPAWN_ALL";
  messageType2[messageType2["CLIENT_MAINTENANCE"] = 10] = "CLIENT_MAINTENANCE";
  messageType2[messageType2["CLIENT_MAINTENANCE_ENABLE"] = 11] = "CLIENT_MAINTENANCE_ENABLE";
  messageType2[messageType2["CLIENT_MAINTENANCE_DISABLE"] = 12] = "CLIENT_MAINTENANCE_DISABLE";
  messageType2[messageType2["CLIENT_MAINTENANCE_ALL"] = 13] = "CLIENT_MAINTENANCE_ALL";
  messageType2[messageType2["CLIENT_SPAWN_NEXT_CLUSTER"] = 14] = "CLIENT_SPAWN_NEXT_CLUSTER";
  messageType2[messageType2["CLIENT_READY"] = 15] = "CLIENT_READY";
  messageType2[messageType2["CLIENT_EVAL_REQUEST"] = 16] = "CLIENT_EVAL_REQUEST";
  messageType2[messageType2["CLIENT_EVAL_RESPONSE"] = 17] = "CLIENT_EVAL_RESPONSE";
  messageType2[messageType2["CLIENT_MANAGER_EVAL_REQUEST"] = 18] = "CLIENT_MANAGER_EVAL_REQUEST";
  messageType2[messageType2["CLIENT_MANAGER_EVAL_RESPONSE"] = 19] = "CLIENT_MANAGER_EVAL_RESPONSE";
  messageType2[messageType2["MANAGER_BROADCAST_REQUEST"] = 20] = "MANAGER_BROADCAST_REQUEST";
  messageType2[messageType2["MANAGER_BROADCAST_RESPONSE"] = 21] = "MANAGER_BROADCAST_RESPONSE";
  return messageType2;
})(messageType || {});

// src/Util/Util.ts
function generateNonce() {
  return Date.now().toString(36) + Math.random().toString(36);
}
__name(generateNonce, "generateNonce");
function chunkArray(array, chunkSize) {
  const R = [];
  for (let i = 0; i < array.length; i += chunkSize)
    R.push(array.slice(i, i + chunkSize));
  return R;
}
__name(chunkArray, "chunkArray");
function delayFor(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
__name(delayFor, "delayFor");
function makePlainError(err) {
  return {
    name: err["name"],
    message: err["message"],
    stack: err["stack"]
  };
}
__name(makePlainError, "makePlainError");
function shardIdForGuildId(guildId, totalShards = 1) {
  const shard = Number(BigInt(guildId) >> BigInt(22)) % totalShards;
  if (shard < 0)
    throw new Error(
      `SHARD_MISCALCULATION_SHARDID_SMALLER_THAN_0 Calculated Shard: ${shard}, guildId: ${guildId}, totalShards: ${totalShards}`
    );
  return shard;
}
__name(shardIdForGuildId, "shardIdForGuildId");
async function fetchRecommendedShards(token, guildsPerShard = 1e3) {
  if (!token)
    throw new Error("DISCORD_TOKEN_MISSING");
  return fetch(`${DefaultOptions.http.api}/v${DefaultOptions.http.version}${Endpoints.botGateway}`, {
    method: "GET",
    headers: { Authorization: `Bot ${token.replace(/^Bot\s*/i, "")}` }
  }).then((res) => {
    if (res.ok)
      return res.json();
    if (res.status === 401)
      throw new Error("DISCORD_TOKEN_INVALID");
    throw res;
  }).then((data) => data.shards * (1e3 / guildsPerShard));
}
__name(fetchRecommendedShards, "fetchRecommendedShards");

// src/Structures/IPCMessage.ts
var BaseMessage = class {
  nonce;
  _raw;
  constructor(message) {
    this.nonce = message.nonce || generateNonce();
    message.nonce = this.nonce;
    this._raw = this.destructMessage(message);
  }
  /**
   * Destructs the Message Object and initializes it on the Constructor
   */
  destructMessage(message) {
    for (const [key, value] of Object.entries(message)) {
      this[key] = value;
    }
    if (message.nonce)
      this.nonce = message.nonce;
    this._type = message._type || 2 /* CUSTOM_MESSAGE */;
    return message;
  }
  toJSON() {
    return this._raw;
  }
};
__name(BaseMessage, "BaseMessage");
var IPCMessage = class extends BaseMessage {
  raw;
  instance;
  constructor(instance, message) {
    super(message);
    this.instance = instance;
    this.raw = new BaseMessage(message).toJSON();
  }
  /**
   * Sends a message to the cluster's process/worker or to the ParentCluster.
   */
  async send(message) {
    if (typeof message !== "object")
      throw new TypeError("The Message has to be a object");
    const baseMessage = new BaseMessage({ ...message, _type: 2 /* CUSTOM_MESSAGE */ });
    return this.instance.send(baseMessage.toJSON());
  }
  /**
   * Sends a Request to the cluster's process/worker or to the ParentCluster.
   */
  async request(message) {
    if (typeof message !== "object")
      throw new TypeError("The Message has to be a object");
    const baseMessage = new BaseMessage({ ...message, _type: 1 /* CUSTOM_REQUEST */, nonce: this.nonce });
    return this.instance.request(baseMessage.toJSON());
  }
  /**
   * Sends a Reply to Message from the cluster's process/worker or the ParentCluster.
   */
  async reply(message) {
    if (typeof message !== "object")
      throw new TypeError("The Message has to be a object");
    const baseMessage = new BaseMessage({
      ...message,
      _type: 3 /* CUSTOM_REPLY */,
      nonce: this.nonce,
      _result: message
    });
    return this.instance.send(baseMessage.toJSON());
  }
};
__name(IPCMessage, "IPCMessage");

// src/Structures/IPCHandler.ts
var ClusterHandler = class {
  manager;
  cluster;
  ipc;
  constructor(manager, cluster, ipc) {
    this.manager = manager;
    this.cluster = cluster;
    this.ipc = ipc;
  }
  handleMessage(message) {
    if (message._type === 15 /* CLIENT_READY */) {
      this.cluster.ready = true;
      this.cluster.emit("ready");
      this.cluster.manager._debug("Ready", this.cluster.id);
      return;
    }
    if (message._type === 6 /* CLIENT_BROADCAST_REQUEST */) {
      this.cluster.manager.broadcastEval(message._eval, message.options)?.then((results) => {
        return this.ipc.send({
          nonce: message.nonce,
          _type: 7 /* CLIENT_BROADCAST_RESPONSE */,
          _result: results
        });
      }).catch((err) => {
        return this.ipc.send({
          nonce: message.nonce,
          _type: 7 /* CLIENT_BROADCAST_RESPONSE */,
          _error: makePlainError(err)
        });
      });
      return;
    }
    if (message._type === 18 /* CLIENT_MANAGER_EVAL_REQUEST */) {
      this.cluster.manager.evalOnManager(message._eval).then((result2) => {
        if (result2._error)
          this.ipc.send({
            nonce: message.nonce,
            _type: 19 /* CLIENT_MANAGER_EVAL_RESPONSE */,
            _error: makePlainError(result2._error)
          });
        return this.ipc.send({
          nonce: message.nonce,
          _type: 19 /* CLIENT_MANAGER_EVAL_RESPONSE */,
          _result: result2._result
        });
      });
      return;
    }
    if (message._type === 17 /* CLIENT_EVAL_RESPONSE */) {
      this.cluster.manager.promise.resolve(message);
      return;
    }
    if (message._type === 9 /* CLIENT_RESPAWN_ALL */) {
      this.cluster.manager.respawnAll(message.options);
      return;
    }
    if (message._type === 8 /* CLIENT_RESPAWN */) {
      this.cluster.respawn(message.options);
      return;
    }
    if (message._type === 10 /* CLIENT_MAINTENANCE */) {
      this.cluster.triggerMaintenance(message.maintenance);
      return;
    }
    if (message._type === 13 /* CLIENT_MAINTENANCE_ALL */) {
      this.cluster.manager.triggerMaintenance(message.maintenance);
      return;
    }
    if (message._type === 14 /* CLIENT_SPAWN_NEXT_CLUSTER */) {
      this.cluster.manager.queue.next();
      return;
    }
    if (message._type === 5 /* HEARTBEAT_ACK */) {
      this.cluster.manager.heartbeat?.ack(this.cluster.id, message.date);
      return;
    }
    if (message._type === 3 /* CUSTOM_REPLY */) {
      this.cluster.manager.promise.resolve(message);
      return;
    }
    return true;
  }
};
__name(ClusterHandler, "ClusterHandler");
var ClusterClientHandler = class {
  client;
  ipc;
  constructor(client, ipc) {
    this.client = client;
    this.ipc = ipc;
  }
  async handleMessage(message) {
    if (message._type === 16 /* CLIENT_EVAL_REQUEST */) {
      try {
        if (!message._eval)
          throw new Error("Eval Script not provided");
        this.client._respond("eval", {
          _eval: message._eval,
          _result: await this.client._eval(message._eval),
          _type: 17 /* CLIENT_EVAL_RESPONSE */,
          nonce: message.nonce
        });
      } catch (err) {
        this.client._respond("eval", {
          _eval: message._eval,
          _error: makePlainError(err),
          _type: 17 /* CLIENT_EVAL_RESPONSE */,
          nonce: message.nonce
        });
      }
      return null;
    }
    if (message._type === 19 /* CLIENT_MANAGER_EVAL_RESPONSE */) {
      this.client.promise.resolve({ _result: message._result, _error: message._error, nonce: message.nonce });
      return null;
    }
    if (message._type === 7 /* CLIENT_BROADCAST_RESPONSE */) {
      this.client.promise.resolve({ _result: message._result, _error: message._error, nonce: message.nonce });
      return null;
    }
    if (message._type === 4 /* HEARTBEAT */) {
      this.client.send({ _type: 5 /* HEARTBEAT_ACK */, date: message.date });
      return null;
    }
    if (message._type === 12 /* CLIENT_MAINTENANCE_DISABLE */) {
      this.client.maintenance = false;
      this.client.triggerClusterReady();
      return null;
    }
    if (message._type === 11 /* CLIENT_MAINTENANCE_ENABLE */) {
      this.client.maintenance = message.maintenance || true;
      return null;
    }
    if (message._type === 3 /* CUSTOM_REPLY */) {
      this.client.promise.resolve(message);
      return null;
    }
    return true;
  }
};
__name(ClusterClientHandler, "ClusterClientHandler");

// src/Structures/Worker.ts
import { Worker as Worker_Thread, parentPort, workerData } from "worker_threads";
var Worker = class {
  file;
  process;
  workerOptions;
  constructor(file, options) {
    this.file = file;
    this.process = null;
    this.workerOptions = {};
    if (options.clusterData)
      this.workerOptions.workerData = options.clusterData;
    if (options.argv)
      this.workerOptions.argv = options.argv;
    if (options.execArgv)
      this.workerOptions.execArgv = options.execArgv;
    if (options.env)
      this.workerOptions.env = options.env;
    if (options.eval)
      this.workerOptions.eval = options.eval;
    if (options.stdin)
      this.workerOptions.stdin = options.stdin;
    if (options.stdout)
      this.workerOptions.stdout = options.stdout;
    if (options.stderr)
      this.workerOptions.stderr = options.stderr;
    if (options.trackUnmanagedFds)
      this.workerOptions.trackUnmanagedFds = options.trackUnmanagedFds;
    if (options.transferList)
      this.workerOptions.transferList = options.transferList;
    if (options.resourceLimits)
      this.workerOptions.resourceLimits = options.resourceLimits;
  }
  spawn() {
    return this.process = new Worker_Thread(this.file, this.workerOptions);
  }
  respawn() {
    this.kill();
    return this.spawn();
  }
  kill() {
    this.process?.removeAllListeners();
    return this.process?.terminate();
  }
  send(message) {
    return new Promise((resolve) => {
      this.process?.postMessage(message);
      resolve(this);
    });
  }
};
__name(Worker, "Worker");
var WorkerClient = class {
  ipc;
  constructor() {
    this.ipc = parentPort;
  }
  send(message) {
    return new Promise((resolve) => {
      this.ipc?.postMessage(message);
      resolve();
    });
  }
  getData() {
    return workerData;
  }
};
__name(WorkerClient, "WorkerClient");

// src/Structures/Child.ts
import { fork } from "child_process";
var Child = class {
  file;
  process;
  processOptions;
  args;
  constructor(file, options) {
    this.file = file;
    this.process = null;
    this.processOptions = {};
    if (options.clusterData)
      this.processOptions.env = options.clusterData;
    if (options.args)
      this.args = options.args;
    if (options.cwd)
      this.processOptions.cwd = options.cwd;
    if (options.detached)
      this.processOptions.detached = options.detached;
    if (options.execArgv)
      this.processOptions.execArgv = options.execArgv;
    if (options.env)
      this.processOptions.env = options.env;
    if (options.execPath)
      this.processOptions.execPath = options.execPath;
    if (options.gid)
      this.processOptions.gid = options.gid;
    if (options.serialization)
      this.processOptions.serialization = options.serialization;
    if (options.signal)
      this.processOptions.signal = options.signal;
    if (options.killSignal)
      this.processOptions.killSignal = options.killSignal;
    if (options.silent)
      this.processOptions.silent = options.silent;
    if (options.stdio)
      this.processOptions.stdio = options.stdio;
    if (options.uid)
      this.processOptions.uid = options.uid;
    if (options.windowsVerbatimArguments)
      this.processOptions.windowsVerbatimArguments = options.windowsVerbatimArguments;
    if (options.timeout)
      this.processOptions.timeout = options.timeout;
  }
  spawn() {
    return this.process = fork(this.file, this.args, this.processOptions);
  }
  respawn() {
    this.kill();
    return this.spawn();
  }
  kill() {
    this.process?.removeAllListeners();
    return this.process?.kill();
  }
  send(message) {
    return new Promise((resolve, reject) => {
      this.process?.send(message, (err) => {
        if (err)
          reject(err);
        else
          resolve(this);
      });
    });
  }
};
__name(Child, "Child");
var ChildClient = class {
  ipc;
  constructor() {
    this.ipc = process;
  }
  send(message) {
    const process2 = this.ipc;
    return new Promise((resolve, reject) => {
      process2.send?.(message, (err) => {
        if (err)
          reject(err);
        else
          resolve();
      });
    });
  }
  getData() {
    return process.env;
  }
};
__name(ChildClient, "ChildClient");

// src/Core/Cluster.ts
var Cluster = class extends EventEmitter {
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
    this.THREAD = manager.mode === "worker" ? Worker : Child;
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
      DISCORD_TOKEN: this.manager.token
    });
    this.ready = false;
    this.thread = null;
    this.restarts = {
      current: this.manager.restarts.current ?? 0,
      max: this.manager.restarts.max,
      interval: this.manager.restarts.interval,
      reset: void 0,
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
      }
    };
  }
  /**
   * Forks a child process or creates a worker thread for the cluster.
   * <warn>You should not need to call this manually.</warn>
   * @param spawnTimeout The amount in milliseconds to wait until the {@link Client} has become ready
   * before resolving. (-1 or Infinity for no wait)
   */
  async spawn(spawnTimeout = 3e4) {
    if (this.thread)
      throw new Error("CLUSTER ALREADY SPAWNED | ClusterId: " + this.id);
    this.thread = new this.THREAD(path.resolve(this.manager.file), {
      ...this.manager.clusterOptions,
      execArgv: this.execArgv,
      env: this.env,
      args: this.args,
      clusterData: { ...this.env, ...this.manager.clusterData }
    });
    this.messageHandler = new ClusterHandler(this.manager, this, this.thread);
    this.thread.spawn().on("message", this._handleMessage.bind(this)).on("exit", this._handleExit.bind(this)).on("error", this._handleError.bind(this));
    this.emit("spawn", this.thread.process);
    if (spawnTimeout === -1 || spawnTimeout === Infinity)
      return this.thread.process;
    await new Promise((resolve, reject) => {
      const cleanup = /* @__PURE__ */ __name(() => {
        clearTimeout(spawnTimeoutTimer);
        this.off("ready", onReady);
        this.off("death", onDeath);
      }, "cleanup");
      const onReady = /* @__PURE__ */ __name(() => {
        this.manager.emit("clusterReady", this);
        this.restarts.cleanup();
        this.restarts.resetRestarts();
        cleanup();
        resolve("Cluster is ready");
      }, "onReady");
      const onDeath = /* @__PURE__ */ __name(() => {
        cleanup();
        reject(new Error("CLUSTERING_READY_DIED | ClusterId: " + this.id));
      }, "onDeath");
      const onTimeout = /* @__PURE__ */ __name(() => {
        cleanup();
        reject(new Error("CLUSTERING_READY_TIMEOUT | ClusterId: " + this.id));
      }, "onTimeout");
      const spawnTimeoutTimer = setTimeout(onTimeout, spawnTimeout);
      this.once("ready", onReady);
      this.once("death", onDeath);
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
    if (this.thread) {
      this.thread = null;
    }
    this.manager.heartbeat?.clusters.get(this.id)?.stop();
    this.restarts.cleanup();
    this.manager._debug("[KILL] Cluster killed with reason: " + (options?.reason || "not given"), this.id);
  }
  /**
   * Kills and restarts the cluster's process/worker.
   * @param options Options for respawning the cluster
   */
  async respawn({ delay = 500, timeout = 3e4 } = this.manager.spawnOptions) {
    if (this.thread)
      this.kill({ force: true });
    if (delay > 0)
      await delayFor(delay);
    this.manager.heartbeat?.clusters.get(this.id)?.stop();
    return this.spawn(timeout);
  }
  /**
   * Sends a message to the cluster's process/worker.
   * @param  message Message to send to the cluster
   */
  send(message) {
    if (typeof message === "object")
      this.thread?.send(new BaseMessage(message).toJSON());
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
    message._type = 1 /* CUSTOM_REQUEST */;
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
  async eval(script2, context, timeout) {
    const _eval = typeof script2 === "function" ? `(${script2})(this, ${JSON.stringify(context)})` : script2;
    if (!this.thread)
      return Promise.reject(new Error("CLUSTERING_NO_CHILD_EXISTS | ClusterId: " + this.id));
    const nonce = generateNonce();
    const message = { nonce, _eval, options: { timeout }, _type: 16 /* CLIENT_EVAL_REQUEST */ };
    await this.send(message);
    return await this.manager.promise.create(message, message.options);
  }
  /**
   * @param reason If maintenance should be enabled with a given reason or disabled when nonce provided
   */
  triggerMaintenance(reason) {
    const _type = reason ? 11 /* CLIENT_MAINTENANCE_ENABLE */ : 12 /* CLIENT_MAINTENANCE_DISABLE */;
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
    if (typeof message === "object") {
      emitMessage = new IPCMessage(this, message);
      if (emitMessage._type === 1 /* CUSTOM_REQUEST */)
        this.manager.emit("clientRequest", emitMessage);
    } else
      emitMessage = message;
    this.emit("message", emitMessage);
  }
  /**
   * Handles the cluster's process/worker exiting.
   * @private
   * @param {Number} exitCode
   */
  _handleExit(exitCode) {
    const respawn = this.manager.respawn;
    this.manager.heartbeat?.clusters.get(this.id)?.stop();
    this.restarts.cleanup();
    this.emit("death", this, this.thread?.process);
    this.manager._debug(
      "[DEATH] Cluster died, attempting respawn | Restarts Left: " + (this.restarts.max - this.restarts.current),
      this.id
    );
    this.ready = false;
    this.thread = null;
    if (!respawn)
      return;
    if (this.restarts.current >= this.restarts.max)
      this.manager._debug(
        "[ATTEMPTED_RESPAWN] Attempted Respawn Declined | Max Restarts have been exceeded",
        this.id
      );
    if (respawn && this.restarts.current < this.restarts.max)
      this.spawn().catch((err) => this.emit("error", err));
    this.restarts.append();
  }
  /**
   * Handles the cluster's process/worker error.
   * @param  error the error, which occurred on the worker/child process
   * @private
   */
  _handleError(error2) {
    this.manager.emit("error", error2);
  }
};
__name(Cluster, "Cluster");

// src/Structures/Data.ts
import { workerData as workerData2 } from "worker_threads";
function getInfo() {
  const clusterMode = process.env.CLUSTER_MANAGER_MODE;
  if (clusterMode !== "worker" && clusterMode !== "process")
    throw new Error("NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT");
  let data;
  if (clusterMode === "process") {
    const shardList = [];
    const parseShardList = process.env?.SHARD_LIST?.split(",") || [];
    parseShardList.forEach((c) => shardList.push(Number(c)));
    data = {
      SHARD_LIST: shardList,
      TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS),
      CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT),
      CLUSTER: Number(process.env.CLUSTER),
      CLUSTER_MANAGER_MODE: clusterMode,
      MAINTENANCE: process.env.MAINTENANCE,
      CLUSTER_QUEUE_MODE: process.env.CLUSTER_QUEUE_MODE,
      FIRST_SHARD_ID: shardList[0],
      LAST_SHARD_ID: shardList[shardList.length - 1]
    };
  } else {
    data = workerData2;
    data.FIRST_SHARD_ID = data.SHARD_LIST[0];
    data.LAST_SHARD_ID = data.SHARD_LIST[data.SHARD_LIST.length - 1];
  }
  return data;
}
__name(getInfo, "getInfo");

// src/Structures/PromiseHandler.ts
var PromiseHandler = class {
  nonce;
  constructor() {
    this.nonce = /* @__PURE__ */ new Map();
  }
  resolve(message) {
    const promise = this.nonce.get(message.nonce);
    if (promise) {
      if (promise.timeout)
        clearTimeout(promise.timeout);
      this.nonce.delete(message.nonce);
      if (message._error) {
        const error2 = new Error(message._error.message);
        error2.stack = message._error.stack;
        error2.name = message._error.name;
        promise.reject(error2);
      } else {
        promise.resolve(message._result);
      }
    }
  }
  async create(message, options) {
    if (!options)
      options = {};
    if (Object.keys(options).length === 0 && message.options)
      options = message.options;
    if (!message.nonce)
      message.nonce = generateNonce();
    return await new Promise((resolve, reject) => {
      if (options.timeout) {
        const timeout = setTimeout(() => {
          this.nonce.delete(message.nonce);
          const error2 = new Error("Promise timed out");
          error2.stack = message.stack || error2.stack;
          reject(error2);
        }, options.timeout);
        this.nonce.set(message.nonce, { resolve, reject, options, timeout });
      } else
        this.nonce.set(message.nonce, { resolve, reject, options });
    });
  }
};
__name(PromiseHandler, "PromiseHandler");

// src/Core/ClusterClient.ts
import EventEmitter2 from "events";
var ClusterClient = class extends EventEmitter2 {
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
    this.client = client;
    this.mode = this.info.CLUSTER_MANAGER_MODE;
    const mode = this.mode;
    this.queue = {
      mode: this.info.CLUSTER_QUEUE_MODE
    };
    this.maintenance = this.info.MAINTENANCE;
    if (this.maintenance === "undefined")
      this.maintenance = false;
    if (!this.maintenance) {
      setTimeout(() => this.triggerClusterReady(), 100);
    }
    this.ready = false;
    this.process = null;
    if (mode === "process")
      this.process = new ChildClient();
    else if (mode === "worker")
      this.process = new WorkerClient();
    this.messageHandler = new ClusterClientHandler(this, this.process);
    this.promise = new PromiseHandler();
    this.process?.ipc?.on("message", this._handleMessage.bind(this));
    client.on?.("ready", () => {
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
    if (!this.client.ws)
      return this.info.SHARD_LIST;
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
    return getInfo();
  }
  /**
   * Sends a message to the master process.
   * @fires Cluster#message
   */
  send(message) {
    if (typeof message === "object")
      message = new BaseMessage(message).toJSON();
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
  async evalOnManager(script2, options) {
    const evalOptions2 = options || { _type: void 0 };
    evalOptions2._type = 18 /* CLIENT_MANAGER_EVAL_REQUEST */;
    return await this.broadcastEval(script2, evalOptions2);
  }
  async broadcastEval(script2, options) {
    if (!script2 || typeof script2 !== "string" && typeof script2 !== "function")
      throw new TypeError(
        "Script for BroadcastEvaling has not been provided or must be a valid String/Function!"
      );
    const broadcastOptions = options || { context: void 0, _type: void 0, timeout: void 0 };
    script2 = typeof script2 === "function" ? `(${script2})(this, ${JSON.stringify(broadcastOptions.context)})` : script2;
    const nonce = generateNonce();
    const message = {
      nonce,
      _eval: script2,
      options,
      _type: broadcastOptions._type || 6 /* CLIENT_BROADCAST_REQUEST */
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
    const rawMessage = message || { _type: void 0 };
    rawMessage._type = 1 /* CUSTOM_REQUEST */;
    this.send(rawMessage);
    return this.promise.create(rawMessage, {});
  }
  /**
   * Requests a respawn of all clusters.
   * @see {@link ClusterManager#respawnAll}
   */
  respawnAll(options = {}) {
    return this.send({ _type: 9 /* CLIENT_RESPAWN_ALL */, options });
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
    if (typeof message === "object")
      emitMessage = new IPCMessage(this, message);
    else
      emitMessage = message;
    this.emit("message", emitMessage);
  }
  async _eval(script) {
    if (this.client._eval) {
      return await this.client._eval(script);
    }
    this.client._eval = function(_) {
      return eval(_);
    }.bind(this.client);
    return await this.client._eval(script);
  }
  /**
   * Sends a message to the master process, emitting an error from the client upon failure.
   */
  _respond(type, message) {
    this.send(message)?.catch((err) => {
      const error2 = { err, message: "" };
      error2.message = `Error when sending ${type} response to master process: ${err.message}`;
      this.client.emit?.(Events.ERROR, error2);
    });
  }
  // Hooks
  triggerReady() {
    this.process?.send({ _type: 15 /* CLIENT_READY */ });
    this.ready = true;
    return this.ready;
  }
  triggerClusterReady() {
    this.emit("ready", this);
    return true;
  }
  /**
   *
   * @param maintenance Whether the cluster should opt in maintenance when a reason was provided or opt-out when no reason was provided.
   * @param all Whether to target it on all clusters or just the current one.
   * @returns The maintenance status of the cluster.
   */
  triggerMaintenance(maintenance, all = false) {
    let _type = 10 /* CLIENT_MAINTENANCE */;
    if (all)
      _type = 13 /* CLIENT_MAINTENANCE_ALL */;
    this.process?.send({ _type, maintenance });
    this.maintenance = maintenance;
    return this.maintenance;
  }
  /**
   * Manually spawn the next cluster, when queue mode is on 'manual'
   */
  spawnNextCluster() {
    if (this.queue.mode === "auto")
      throw new Error("Next Cluster can just be spawned when the queue is not on auto mode.");
    return this.process?.send({ _type: 14 /* CLIENT_SPAWN_NEXT_CLUSTER */ });
  }
  /**
   * gets the total Internal shard count and shard list.
   */
  static getInfo() {
    return getInfo();
  }
};
__name(ClusterClient, "ClusterClient");

// src/Core/ClusterManager.ts
import fs from "fs";
import path2 from "path";
import os from "os";
import EventEmitter3 from "events";

// src/Structures/Queue.ts
var Queue = class {
  queue;
  options;
  paused;
  constructor(options) {
    this.options = options;
    this.queue = [];
    this.paused = false;
  }
  /**
   * Starts the queue and run's the item functions
   */
  async start() {
    if (!this.options.auto) {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (this.queue.length === 0) {
            clearInterval(interval);
            resolve("Queue finished");
          }
        }, 200);
      });
    }
    const length = this.queue.length;
    for (let i = 0; i < length; i++) {
      if (!this.queue[0])
        continue;
      const timeout = this.queue[0].timeout;
      await this.next();
      await delayFor(timeout);
    }
    return this;
  }
  /**
   * Goes to the next item in the queue
   */
  async next() {
    if (this.paused)
      return;
    const item = this.queue.shift();
    if (!item)
      return true;
    return item.run(...item.args);
  }
  /**
   * Stop's the queue and blocks the next item from running
   */
  stop() {
    this.paused = true;
    return this;
  }
  /**
   * Resume's the queue
   */
  resume() {
    this.paused = false;
    return this;
  }
  /**
   * Adds an item to the queue
   */
  add(item) {
    this.queue.push({
      run: item.run,
      args: item.args,
      time: Date.now(),
      timeout: item.timeout ?? this.options.timeout
    });
    return this;
  }
};
__name(Queue, "Queue");

// src/Core/ClusterManager.ts
var ClusterManager = class extends EventEmitter3 {
  /**
   * Whether clusters should automatically respawn upon exiting
   */
  respawn;
  /**
   * How many times a cluster can maximally restart in the given interval
   */
  restarts;
  /**
   * Data, which is passed to the workerData or the processEnv
   */
  clusterData;
  /**
   * Options, which is passed when forking a child or creating a thread
   */
  clusterOptions;
  /**
   * Path to the bot script file
   */
  file;
  /**
   * Amount of internal shards in total
   */
  totalShards;
  /**
   * Amount of total clusters to spawn
   */
  totalClusters;
  /**
   * Amount of Shards per Clusters
   */
  shardsPerClusters;
  /** Mode for Clusters to spawn with */
  mode;
  /**
   * An array of arguments to pass to clusters (only when {@link ClusterManager#mode} is `process`)
   */
  shardArgs;
  /**
   * An array of arguments to pass to the executable (only when {@link ClusterManager#mode} is `process`)
   */
  execArgv;
  /**
   * List of internal shard ids this cluster manager spawns
   */
  shardList;
  /**
   * Token to use for obtaining the automatic internal shards count, and passing to bot script
   */
  token;
  /**
   * A collection of all clusters the manager spawned
   */
  clusters;
  shardClusterList;
  /**
   * An Array of IDS[Number], which should be assigned to the spawned Clusters
   */
  clusterList;
  spawnOptions;
  queue;
  promise;
  /** HeartbeatManager Plugin */
  heartbeat;
  /** Reclustering Plugin */
  recluster;
  constructor(file, options) {
    super();
    if (!options)
      options = {};
    if (options.keepAlive)
      throw new Error(
        'keepAlive is not supported anymore on and above v1.6.0. Import it as plugin ("HeartbeatManager"), therefore check the libs readme'
      );
    this.respawn = options.respawn ?? true;
    this.restarts = options.restarts || { max: 3, interval: 6e4 * 60, current: 0 };
    this.clusterData = options.clusterData || {};
    this.clusterOptions = options.clusterOptions || {};
    this.file = file;
    if (!file)
      throw new Error("CLIENT_INVALID_OPTION | No File specified.");
    if (!path2.isAbsolute(file))
      this.file = path2.resolve(process.cwd(), file);
    const stats = fs.statSync(this.file);
    if (!stats.isFile())
      throw new Error("CLIENT_INVALID_OPTION | Provided is file is not type of file");
    this.totalShards = options.totalShards === "auto" ? -1 : options.totalShards ?? -1;
    if (this.totalShards !== -1) {
      if (typeof this.totalShards !== "number" || isNaN(this.totalShards)) {
        throw new TypeError("CLIENT_INVALID_OPTION | Amount of internal shards must be a number.");
      }
      if (this.totalShards < 1)
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of internal shards must be at least 1.");
      if (!Number.isInteger(this.totalShards)) {
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of internal shards must be an integer.");
      }
    }
    this.totalClusters = options.totalClusters === "auto" ? -1 : options.totalClusters ?? -1;
    if (this.totalClusters !== -1) {
      if (typeof this.totalClusters !== "number" || isNaN(this.totalClusters)) {
        throw new TypeError("CLIENT_INVALID_OPTION | Amount of Clusters must be a number.");
      }
      if (this.totalClusters < 1)
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of Clusters must be at least 1.");
      if (!Number.isInteger(this.totalClusters)) {
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of Clusters must be an integer.");
      }
    }
    this.shardsPerClusters = options.shardsPerClusters;
    if (this.shardsPerClusters) {
      if (typeof this.shardsPerClusters !== "number" || isNaN(this.shardsPerClusters)) {
        throw new TypeError("CLIENT_INVALID_OPTION | Amount of ShardsPerClusters must be a number.");
      }
      if (this.shardsPerClusters < 1)
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of shardsPerClusters must be at least 1.");
      if (!Number.isInteger(this.shardsPerClusters)) {
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of Shards Per Clusters must be an integer.");
      }
    }
    this.mode = options.mode || "process";
    if (this.mode !== "worker" && this.mode !== "process") {
      throw new RangeError('CLIENT_INVALID_OPTIONCluster mode must be "worker" or "process"');
    }
    this.shardArgs = options.shardArgs ?? [];
    this.execArgv = options.execArgv ?? [];
    this.shardList = options.shardList ?? [];
    if (this.shardList.length) {
      if (!Array.isArray(this.shardList)) {
        throw new TypeError("CLIENT_INVALID_OPTION | shardList must be an array.");
      }
      this.shardList = Array.from(new Set(this.shardList));
      if (this.shardList.length < 1)
        throw new RangeError("CLIENT_INVALID_OPTION | shardList must contain at least 1 ID.");
      if (this.shardList.some(
        (shardID) => typeof shardID !== "number" || isNaN(shardID) || !Number.isInteger(shardID) || shardID < 0
      )) {
        throw new TypeError("CLIENT_INVALID_OPTION | shardList has to contain an array of positive integers.");
      }
    }
    if (!options.token)
      options.token = process.env.DISCORD_TOKEN;
    this.token = options.token ? options.token.replace(/^Bot\s*/i, "") : null;
    this.clusters = /* @__PURE__ */ new Map();
    this.shardClusterList = [];
    process.env.SHARD_LIST = void 0;
    process.env.TOTAL_SHARDS = this.totalShards;
    process.env.CLUSTER = void 0;
    process.env.CLUSTER_COUNT = this.totalClusters;
    process.env.CLUSTER_MANAGER = "true";
    process.env.CLUSTER_MANAGER_MODE = this.mode;
    process.env.DISCORD_TOKEN = String(this.token);
    process.env.MAINTENANCE = void 0;
    if (options.queue?.auto)
      process.env.CLUSTER_QUEUE_MODE = "auto";
    else
      process.env.CLUSTER_QUEUE_MODE = "manual";
    this.clusterList = options.clusterList || [];
    this.spawnOptions = options.spawnOptions || { delay: 7e3, timeout: -1 };
    if (!this.spawnOptions.delay)
      this.spawnOptions.delay = 7e3;
    if (!options.queue)
      options.queue = { auto: true };
    if (!options.queue.timeout)
      options.queue.timeout = this.spawnOptions.delay;
    this.queue = new Queue(options.queue);
    this._debug(`[START] Cluster Manager has been initialized`);
    this.promise = new PromiseHandler();
  }
  /**
   * Spawns multiple internal shards.
   */
  async spawn({ amount = this.totalShards, delay = 7e3, timeout = -1 } = this.spawnOptions) {
    if (delay < 7e3) {
      process.emitWarning(
        `Spawn Delay (delay: ${delay}) is smaller than 7s, this can cause global rate limits on /gateway/bot`,
        {
          code: "CLUSTER_MANAGER"
        }
      );
    }
    if (amount === -1 || amount === "auto") {
      if (!this.token)
        throw new Error("A Token must be provided, when totalShards is set on auto.");
      amount = await fetchRecommendedShards(this.token, 1e3);
      this.totalShards = amount;
      this._debug(`Discord recommended a total shard count of ${amount}`);
    } else {
      if (typeof amount !== "number" || isNaN(amount)) {
        throw new TypeError("CLIENT_INVALID_OPTION | Amount of Internal Shards must be a number.");
      }
      if (amount < 1)
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of Internal Shards must be at least 1.");
      if (!Number.isInteger(amount)) {
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of Internal Shards must be an integer.");
      }
    }
    let clusterAmount = this.totalClusters;
    if (clusterAmount === -1) {
      clusterAmount = os.cpus().length;
      this.totalClusters = clusterAmount;
    } else {
      if (typeof clusterAmount !== "number" || isNaN(clusterAmount)) {
        throw new TypeError("CLIENT_INVALID_OPTION | Amount of Clusters must be a number.");
      }
      if (clusterAmount < 1)
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of Clusters must be at least 1.");
      if (!Number.isInteger(clusterAmount)) {
        throw new RangeError("CLIENT_INVALID_OPTION | Amount of Clusters must be an integer.");
      }
    }
    if (!this.shardList.length)
      this.shardList = Array.from(Array(amount).keys());
    if (this.shardsPerClusters)
      this.totalClusters = Math.ceil(this.shardList.length / this.shardsPerClusters);
    this.shardClusterList = chunkArray(
      this.shardList,
      !isNaN(this.shardsPerClusters) ? this.shardsPerClusters : Math.ceil(this.shardList.length / this.totalClusters)
    );
    if (this.shardClusterList.length !== this.totalClusters) {
      this.totalClusters = this.shardClusterList.length;
    }
    if (this.shardList.some((shardID) => shardID >= Number(amount))) {
      throw new RangeError("CLIENT_INVALID_OPTION | Shard IDs must be smaller than the amount of shards.");
    }
    this.spawnOptions = { delay, timeout };
    this._debug(`[Spawning Clusters]
    ClusterCount: ${this.totalClusters}
    ShardCount: ${amount}
    ShardList: ${this.shardClusterList.join(", ")}`);
    for (let i = 0; i < this.totalClusters; i++) {
      const clusterId = this.clusterList[i] || i;
      if (this.shardClusterList[i]) {
        const length = this.shardClusterList[i]?.length;
        const readyTimeout = timeout !== -1 ? timeout + delay * length : timeout;
        const spawnDelay = delay * length;
        this.queue.add({
          run: (...a) => {
            const cluster = this.createCluster(
              clusterId,
              this.shardClusterList[i],
              this.totalShards
            );
            return cluster.spawn(...a);
          },
          args: [readyTimeout],
          timeout: spawnDelay
        });
      }
    }
    return this.queue.start();
  }
  /**
   * Sends a message to all clusters.
   */
  broadcast(message) {
    const promises = [];
    for (const cluster of Array.from(this.clusters.values()))
      promises.push(cluster.send(message));
    return Promise.all(promises);
  }
  /**
   * Creates a single cluster.
   * <warn>Using this method is usually not necessary if you use the spawn method.</warn>
   * <info>This is usually not necessary to manually specify.</info>
   * @returns Note that the created cluster needs to be explicitly spawned using its spawn method.
   */
  createCluster(id, shardsToSpawn, totalShards, recluster = false) {
    const cluster = new Cluster(this, id, shardsToSpawn, totalShards);
    if (!recluster)
      this.clusters.set(id, cluster);
    this.emit("clusterCreate", cluster);
    this._debug(`[CREATE] Created Cluster ${cluster.id}`);
    return cluster;
  }
  async broadcastEval(script2, evalOptions2) {
    const options = evalOptions2 ?? {};
    if (!script2 || typeof script2 !== "string" && typeof script2 !== "function")
      return Promise.reject(new TypeError("ClUSTERING_INVALID_EVAL_BROADCAST"));
    script2 = typeof script2 === "function" ? `(${script2})(this, ${JSON.stringify(options.context)})` : script2;
    if (Object.prototype.hasOwnProperty.call(options, "cluster")) {
      if (typeof options.cluster === "number") {
        if (options.cluster < 0)
          throw new RangeError("CLUSTER_ID_OUT_OF_RANGE");
      }
      if (Array.isArray(options.cluster)) {
        if (options.cluster.length === 0)
          throw new RangeError("ARRAY_MUST_CONTAIN_ONE CLUSTER_ID");
      }
    }
    if (options.guildId) {
      options.shard = shardIdForGuildId(options.guildId, this.totalShards);
    }
    if (options.shard) {
      if (typeof options.shard === "number") {
        if (options.shard < 0)
          throw new RangeError("SHARD_ID_OUT_OF_RANGE");
      }
      if (Array.isArray(options.shard)) {
        if (options.shard.length === 0)
          throw new RangeError("ARRAY_MUST_CONTAIN_ONE SHARD_ID");
      }
      options.cluster = Array.from(this.clusters.values()).find(
        (c) => c.shardList.includes(options.shard)
      )?.id;
    }
    return this._performOnClusters("eval", [script2], options.cluster, options.timeout);
  }
  /**
   * Fetches a client property value of each cluster, or a given cluster.
   * @param prop Name of the client property to get, using periods for nesting
   * @param cluster Cluster to fetch property from, all if undefined
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
   * @param method Method name to run on each cluster
   * @param args Arguments to pass through to the method call
   * @param cluster cluster to run on, all if undefined
   * @param timeout the amount of time to wait until the promise will be rejected
   * @returns Results of the method execution
   * @private
   */
  _performOnClusters(method, args, cluster, timeout) {
    if (this.clusters.size === 0)
      return Promise.reject(new Error("CLUSTERING_NO_CLUSTERS"));
    if (typeof cluster === "number") {
      if (this.clusters.has(cluster))
        return this.clusters.get(cluster)?.[method](...args, void 0, timeout).then((e) => [e]);
      return Promise.reject(new Error("CLUSTERING_CLUSTER_NOT_FOUND FOR ClusterId: " + cluster));
    }
    let clusters = Array.from(this.clusters.values());
    if (cluster)
      clusters = clusters.filter((c) => cluster.includes(c.id));
    if (clusters.length === 0)
      return Promise.reject(new Error("CLUSTERING_NO_CLUSTERS_FOUND"));
    const promises = [];
    for (const cl of clusters)
      promises.push(cl[method](...args, void 0, timeout));
    return Promise.all(promises);
  }
  /**
   * Kills all running clusters and respawns them.
   * @param options Options for respawning shards
   */
  async respawnAll({ clusterDelay = this.spawnOptions.delay = 5500, respawnDelay = this.spawnOptions.delay = 5500, timeout = -1 } = {}) {
    this.promise.nonce.clear();
    let s = 0;
    let i = 0;
    this._debug("Respawning all Clusters");
    for (const cluster of Array.from(this.clusters.values())) {
      const promises = [cluster.respawn({ delay: respawnDelay, timeout })];
      const length = this.shardClusterList[i]?.length || this.totalShards / this.totalClusters;
      if (++s < this.clusters.size && clusterDelay > 0)
        promises.push(delayFor(length * clusterDelay));
      i++;
      await Promise.all(promises);
    }
    return this.clusters;
  }
  //Custom Functions:
  /**
   * Runs a method with given arguments on the Manager itself
   */
  async evalOnManager(script) {
    script = typeof script === "function" ? `(${script})(this)` : script;
    let result;
    let error;
    try {
      result = await eval(script);
    } catch (err) {
      error = err;
    }
    return { _result: result, _error: error ? makePlainError(error) : null };
  }
  /**
   * Runs a method with given arguments on the provided Cluster Client
   * @returns Results of the script execution
   * @private
   */
  evalOnCluster(script2, options) {
    return this.broadcastEval(script2, options)?.then((r) => r[0]);
  }
  /**
   * Adds a plugin to the cluster manager
   */
  extend(...plugins) {
    if (!plugins)
      throw new Error("NO_PLUGINS_PROVIDED");
    if (!Array.isArray(plugins))
      plugins = [plugins];
    for (const plugin of plugins) {
      if (!plugin)
        throw new Error("PLUGIN_NOT_PROVIDED");
      if (typeof plugin !== "object")
        throw new Error("PLUGIN_NOT_A_OBJECT");
      plugin.build(this);
    }
  }
  /**
   * @param reason If maintenance should be enabled on all clusters with a given reason or disabled when nonce provided
   */
  triggerMaintenance(reason) {
    return Array.from(this.clusters.values()).forEach((cluster) => cluster.triggerMaintenance(reason));
  }
  /**
   * Logs out the Debug Messages
   * <warn>Using this method just emits the Debug Event.</warn>
   * <info>This is usually not necessary to manually specify.</info>
   */
  _debug(message, cluster) {
    let log;
    if (cluster === void 0) {
      log = `[CM => Manager] ` + message;
    } else {
      log = `[CM => Cluster ${cluster}] ` + message;
    }
    this.emit("debug", log);
    return log;
  }
};
__name(ClusterManager, "ClusterManager");

// src/Plugins/HeartbeatSystem.ts
var HeartbeatManager = class {
  options;
  clusters;
  manager;
  name;
  constructor(options) {
    if (!options)
      options = {};
    this.options = options;
    if (!this.options.interval)
      this.options.interval = 2e4;
    if (!this.options.maxMissedHeartbeats)
      this.options.maxMissedHeartbeats = 5;
    this.clusters = /* @__PURE__ */ new Map();
    this.manager = null;
    this.name = "heartbeat";
  }
  build(manager) {
    manager[this.name] = this;
    this.manager = manager;
    this.start();
  }
  start() {
    this.manager?.on("clusterReady", (cluster) => {
      if (this.clusters.has(cluster.id))
        this.clusters.get(cluster.id)?.stop();
      this.clusters.set(cluster.id, new Heartbeat(this, cluster, this.options));
    });
  }
  stop(cluster, reason) {
    if (!this.clusters.has(cluster.id))
      return;
    this.clusters.get(cluster.id)?.stop();
    this.manager?._debug(`[Heartbeat_MISSING] ${reason}`, cluster.id);
    if (cluster.restarts.current < cluster.restarts.max) {
      cluster.respawn(this.manager?.spawnOptions);
      this.manager?._debug("[Heartbeat_MISSING] Attempted Respawn", cluster.id);
    } else {
      this.manager?._debug("[Heartbeat_MISSING] Respawn Rejected | Max Restarts of Cluster Reached", cluster.id);
    }
  }
  ack(id, date) {
    if (!this.clusters.has(id))
      return;
    this.clusters.get(id)?.ack(date);
  }
};
__name(HeartbeatManager, "HeartbeatManager");
var Heartbeat = class {
  manager;
  options;
  interval;
  heartbeats;
  instance;
  constructor(manager, instance, options) {
    this.manager = manager;
    this.options = options;
    this.interval = void 0;
    this.heartbeats = /* @__PURE__ */ new Map();
    this.instance = instance;
    this.start();
  }
  ack(date) {
    return this.heartbeats.delete(date);
  }
  start() {
    return this.interval = setInterval(() => {
      const start = Date.now();
      this.heartbeats.set(start, true);
      this.instance.send({ _type: 4 /* HEARTBEAT */, date: start })?.catch(() => null);
      if (this.heartbeats.size > this.options.maxMissedHeartbeats) {
        this.manager.stop(this.instance, `Missed ${this.heartbeats.size} Heartbeat Acks | Attempting Respawn`);
      }
    }, this.options.interval);
  }
  stop() {
    this.heartbeats.clear();
    clearInterval(this.interval);
  }
  resume() {
    this.start();
  }
};
__name(Heartbeat, "Heartbeat");

// src/Plugins/ReCluster.ts
var ReClusterManager = class {
  options;
  name;
  onProgress;
  manager;
  constructor(options) {
    if (!options)
      this.options = {};
    else
      this.options = options;
    this.name = "recluster";
    this.onProgress = false;
  }
  build(manager) {
    manager[this.name] = this;
    this.manager = manager;
    return this;
  }
  /**
   * Execute a Zero Downtime Restart on all Clusters with an updated totalShards (count) or a scheduled restart.
   * @param options
   * @param options.delay
   * @param options.timeout
   * @param options.totalShards
   * @param options.totalClusters
   * @param options.shardsPerClusters
   * @param options.shardClusterList
   * @param options.shardList
   * @param options.restartMode
   */
  async start(options) {
    let {
      delay,
      timeout,
      totalClusters,
      totalShards,
      shardsPerClusters,
      shardClusterList,
      shardList = this.manager?.shardList,
      restartMode = "gracefulSwitch"
    } = options || { restartMode: "gracefulSwitch" };
    if (this.onProgress)
      throw new Error("Zero Downtime Reclustering is already in progress");
    if (!this.manager)
      throw new Error("Manager is missing on ReClusterManager");
    if (totalShards) {
      if (!this.manager?.token)
        throw new Error("Token must be defined on manager, when totalShards is set on auto");
      if (totalShards === "auto" || totalShards === -1)
        totalShards = await fetchRecommendedShards(this.manager.token);
      this.manager.totalShards = totalShards;
    }
    if (totalClusters)
      this.manager.totalClusters = totalClusters;
    if (shardsPerClusters) {
      this.manager.shardsPerClusters = shardsPerClusters;
      this.manager.totalClusters = Math.ceil(this.manager.totalShards / this.manager.shardsPerClusters);
    }
    if (shardList)
      this.manager.shardList = shardList;
    else
      this.manager.shardList = Array.from(Array(this.manager.totalShards).keys());
    if (shardClusterList)
      this.manager.shardClusterList = shardClusterList;
    else
      this.manager.shardClusterList = chunkArray(
        this.manager.shardList,
        Math.ceil(this.manager.shardList.length / this.manager.totalClusters)
      );
    if (this.manager.shardClusterList.length !== this.manager.totalClusters) {
      this.manager.totalClusters = this.manager.shardClusterList.length;
    }
    this.manager._debug(
      [
        "[\u21BB][ReClustering] Starting... Zerodowntime Reclustering",
        `\u251C\u2500\u2500 Mode: ${restartMode}`,
        `\u251C\u2500\u2500 Total Shards: ${this.manager.totalShards}`,
        `\u251C\u2500\u2500 Total Clusters: ${this.manager.totalClusters}`,
        `\u251C\u2500\u2500 Shards Per Cluster: ${this.manager.shardsPerClusters}`,
        `\u251C\u2500\u2500 Shard Cluster List: ${this.manager.shardClusterList.join(", ")}`,
        `\u2514\u2500\u2500 Shard List: ${this.manager.shardList.join(", ")}`
      ].join("\n")
    );
    return this._start({ restartMode, timeout, delay });
  }
  /**
   * @param options
   * @param options.delay The delay to wait between each cluster spawn
   * @param options.timeout The readyTimeout to wait until the cluster spawn promise is rejected
   * @param options.restartMode The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed
   */
  async _start({ restartMode = "gracefulSwitch", timeout = 3e4 * 6, delay = 7e3 }) {
    if (!this.manager)
      throw new Error("Manager is missing on ReClusterManager");
    process.env.MAINTENANCE = "recluster";
    this.manager.triggerMaintenance("recluster");
    this.manager._debug("[\u21BB][ReClustering] Enabling Maintenance Mode on all clusters");
    let switchClusterAfterReady = false;
    switchClusterAfterReady = restartMode === "rolling";
    const newClusters = /* @__PURE__ */ new Map();
    const oldClusters = /* @__PURE__ */ new Map();
    Array.from(this.manager.clusters.values()).forEach((cluster) => {
      oldClusters.set(cluster.id, cluster);
    });
    for (let i = 0; i < this.manager.totalClusters; i++) {
      const length = this.manager.shardClusterList[i]?.length || this.manager.totalShards / this.manager.totalClusters;
      const clusterId = this.manager.clusterList[i] || i;
      const readyTimeout = timeout !== -1 ? timeout + delay * length : timeout;
      const spawnDelay = delay * length;
      this.manager.queue.add({
        run: (...a) => {
          if (!this.manager)
            throw new Error("Manager is missing on ReClusterManager");
          const cluster = this.manager.createCluster(
            clusterId,
            this.manager.shardClusterList[i],
            this.manager.totalShards,
            true
          );
          newClusters.set(clusterId, cluster);
          this.manager._debug(`[\u21BB][ReClustering][${clusterId}] Spawning... Cluster`);
          return cluster.spawn(...a).then((c) => {
            if (!this.manager)
              throw new Error("Manager is missing on ReClusterManager");
            this.manager._debug(`[\u21BB][ReClustering][${clusterId}] Cluster Ready`);
            if (switchClusterAfterReady) {
              const oldCluster = this.manager.clusters.get(clusterId);
              if (oldCluster) {
                oldCluster.kill({ force: true, reason: "reclustering" });
                oldClusters.delete(clusterId);
              }
              this.manager.clusters.set(clusterId, cluster);
              cluster.triggerMaintenance(void 0);
              this.manager._debug(
                `[\u21BB][ReClustering][${clusterId}] Switched OldCluster to NewCluster and exited Maintenance Mode`
              );
            }
            return c;
          });
        },
        args: [readyTimeout],
        timeout: spawnDelay
      });
    }
    await this.manager.queue.start();
    if (oldClusters.size) {
      this.manager._debug("[\u21BB][ReClustering] Killing old clusters");
      for (const [id, cluster] of Array.from(oldClusters)) {
        cluster.kill({ force: true, reason: "reclustering" });
        this.manager._debug(`[\u21BB][ReClustering][${id}] Killed OldCluster`);
        this.manager.clusters.delete(id);
      }
      oldClusters.clear();
    }
    if (!switchClusterAfterReady) {
      this.manager._debug(
        "[\u21BB][ReClustering] Starting exiting Maintenance Mode on all clusters and killing old clusters"
      );
      for (let i = 0; i < this.manager.totalClusters; i++) {
        const clusterId = this.manager.clusterList[i] || i;
        const cluster = newClusters.get(clusterId);
        const oldCluster = this.manager.clusters.get(clusterId);
        if (!cluster)
          continue;
        if (oldCluster) {
          oldCluster.kill({ force: true, reason: "reclustering" });
          oldClusters.delete(clusterId);
        }
        this.manager.clusters.set(clusterId, cluster);
        cluster.triggerMaintenance();
        this.manager._debug(
          `[\u21BB][ReClustering][${clusterId}] Switched OldCluster to NewCluster and exited Maintenance Mode`
        );
      }
    }
    newClusters.clear();
    this.onProgress = false;
    process.env.MAINTENANCE = void 0;
    this.manager._debug("[\u21BB][ReClustering] Finished ReClustering");
    return { success: true };
  }
};
__name(ReClusterManager, "ReClusterManager");
export {
  BaseMessage,
  Child,
  ChildClient,
  Cluster,
  ClusterClient,
  ClusterClientHandler,
  ClusterHandler,
  ClusterManager,
  DefaultOptions,
  Endpoints,
  Events,
  Heartbeat,
  HeartbeatManager,
  IPCMessage,
  PromiseHandler,
  Queue,
  ReClusterManager,
  Worker,
  WorkerClient,
  chunkArray,
  delayFor,
  fetchRecommendedShards,
  generateNonce,
  getInfo,
  makePlainError,
  messageType,
  shardIdForGuildId
};
//# sourceMappingURL=index.mjs.map