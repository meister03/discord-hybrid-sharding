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
        this.client = client;
        this.mode = this.info.CLUSTER_MANAGER_MODE;
        const mode = this.mode;
        this.queue = {
            mode: this.info.CLUSTER_QUEUE_MODE,
        };
        this.maintenance = this.info.MAINTENANCE;
        if (this.maintenance === 'undefined')
            this.maintenance = false;
        if (!this.maintenance) {
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
        client.on?.('ready', () => {
            this.triggerReady();
        });
    }
    get id() {
        return this.info.CLUSTER;
    }
    get ids() {
        if (!this.client.ws)
            return this.info.SHARD_LIST;
        return this.client.ws.shards;
    }
    get count() {
        return this.info.CLUSTER_COUNT;
    }
    get info() {
        return (0, Data_1.getInfo)();
    }
    send(message) {
        if (typeof message === 'object')
            message = new IPCMessage_1.BaseMessage(message).toJSON();
        return this.process?.send(message);
    }
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
    request(message) {
        const rawMessage = message || { _type: undefined };
        rawMessage._type = shared_1.messageType.CUSTOM_REQUEST;
        this.send(rawMessage);
        return this.promise.create(rawMessage, {});
    }
    respawnAll({ clusterDelay = 5000, respawnDelay = 7000, timeout = 30000 } = {}) {
        return this.send({ _type: shared_1.messageType.CLIENT_RESPAWN_ALL, options: { clusterDelay, respawnDelay, timeout } });
    }
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
    _respond(type, message) {
        this.send(message)?.catch(err => {
            const error = { err, message: '' };
            error.message = `Error when sending ${type} response to master process: ${err.message}`;
            this.client.emit?.(shared_1.Events.ERROR, error);
        });
    }
    triggerReady() {
        this.process?.send({ _type: shared_1.messageType.CLIENT_READY });
        this.ready = true;
        return this.ready;
    }
    triggerClusterReady() {
        return this.emit('ready', this);
    }
    triggerMaintenance(maintenance, all = false) {
        let _type = shared_1.messageType.CLIENT_MAINTENANCE;
        if (all)
            _type = shared_1.messageType.CLIENT_MAINTENANCE_ALL;
        this.process?.send({ _type, maintenance });
        this.maintenance = maintenance;
        return this.maintenance;
    }
    spawnNextCluster() {
        if (this.queue.mode === 'auto')
            throw new Error('Next Cluster can just be spawned when the queue is not on auto mode.');
        return this.process?.send({ _type: shared_1.messageType.CLIENT_SPAWN_NEXT_CLUSTER });
    }
    static getInfo() {
        return (0, Data_1.getInfo)();
    }
}
exports.ClusterClient = ClusterClient;
