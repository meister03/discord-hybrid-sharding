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
class Cluster extends events_1.default {
    THREAD;
    manager;
    id;
    args;
    execArgv;
    shardList;
    totalShards;
    env;
    thread;
    restarts;
    messageHandler;
    ready;
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
    kill(options) {
        this.thread?.kill();
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        this.restarts.cleanup();
        this._handleExit(false, options);
    }
    async respawn({ delay = 500, timeout = 30000 } = this.manager.spawnOptions) {
        if (this.thread)
            this.kill({ force: true });
        if (delay > 0)
            await (0, Util_1.delayFor)(delay);
        this.manager.heartbeat?.clusters.get(this.id)?.stop();
        return this.spawn(timeout);
    }
    send(message) {
        if (typeof message === 'object')
            this.thread?.send(new IPCMessage_js_1.BaseMessage(message).toJSON());
        else
            return this.thread?.send(message);
    }
    request(message) {
        message._type = shared_1.messageType.CUSTOM_REQUEST;
        this.send(message);
        return this.manager.promise.create(message, message.options);
    }
    async eval(script, context, timeout) {
        const _eval = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(context)})` : script;
        if (!this.thread)
            return Promise.reject(new Error('CLUSTERING_NO_CHILD_EXISTS | ClusterId: ' + this.id));
        const nonce = (0, Util_1.generateNonce)();
        const message = { nonce, _eval, options: { timeout }, _type: shared_1.messageType.CLIENT_EVAL_REQUEST };
        await this.send(message);
        return await this.manager.promise.create(message, message.options);
    }
    triggerMaintenance(reason) {
        const _type = reason ? shared_1.messageType.CLIENT_MAINTENANCE_ENABLE : shared_1.messageType.CLIENT_MAINTENANCE_DISABLE;
        return this.send({ _type, maintenance: reason });
    }
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
        this.emit('message', emitMessage);
    }
    _handleExit(respawn = this.manager.respawn, options) {
        if (!options)
            options = {};
        if (options?.reason !== 'reclustering')
            this.emit('death', this, this.thread?.process);
        if (respawn) {
            this.manager._debug('[DEATH] Cluster died, attempting respawn | Restarts Left: ' +
                (this.restarts.max - this.restarts.current), this.id);
        }
        else {
            this.manager._debug('[KILL] Cluster killed with reason: ' + (options?.reason || 'not given'), this.id);
        }
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
    _handleError(error) {
        this.manager.emit('error', error);
    }
}
exports.Cluster = Cluster;
