import { IPCMessage, BaseMessage } from '../Structures/IPCMessage';
import { Events, messageType, } from '../types/shared';
import { getInfo } from '../Structures/Data';
import { WorkerClient } from '../Structures/Worker';
import { ChildClient } from '../Structures/Child';
import { ClusterClientHandler } from '../Structures/IPCHandler';
import { PromiseHandler } from '../Structures/PromiseHandler';
import EventEmitter from 'events';
import { generateNonce } from '../Util/Util';
export class ClusterClient extends EventEmitter {
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
            this.process = new ChildClient();
        else if (mode === 'worker')
            this.process = new WorkerClient();
        this.messageHandler = new ClusterClientHandler(this, this.process);
        this.promise = new PromiseHandler();
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
        return getInfo();
    }
    send(message) {
        if (typeof message === 'object')
            message = new BaseMessage(message).toJSON();
        return this.process?.send(message);
    }
    fetchClientValues(prop, cluster) {
        return this.broadcastEval(`this.${prop}`, { cluster });
    }
    async evalOnManager(script, options) {
        const evalOptions = options || { _type: undefined };
        evalOptions._type = messageType.CLIENT_MANAGER_EVAL_REQUEST;
        return await this.broadcastEval(script, evalOptions);
    }
    async broadcastEval(script, options) {
        if (!script || (typeof script !== 'string' && typeof script !== 'function'))
            throw new TypeError('Script for BroadcastEvaling has not been provided or must be a valid String/Function!');
        const broadcastOptions = options || { context: undefined, _type: undefined, timeout: undefined };
        script =
            typeof script === 'function' ? `(${script})(this, ${JSON.stringify(broadcastOptions.context)})` : script;
        const nonce = generateNonce();
        const message = {
            nonce,
            _eval: script,
            options,
            _type: broadcastOptions._type || messageType.CLIENT_BROADCAST_REQUEST,
        };
        await this.send(message);
        return await this.promise.create(message, broadcastOptions);
    }
    request(message) {
        const rawMessage = message || { _type: undefined };
        rawMessage._type = messageType.CUSTOM_REQUEST;
        this.send(rawMessage);
        return this.promise.create(rawMessage, {});
    }
    respawnAll({ clusterDelay = 5000, respawnDelay = 7000, timeout = 30000 } = {}) {
        return this.send({ _type: messageType.CLIENT_RESPAWN_ALL, options: { clusterDelay, respawnDelay, timeout } });
    }
    async _handleMessage(message) {
        if (!message)
            return;
        const emit = await this.messageHandler.handleMessage(message);
        if (!emit)
            return;
        let emitMessage;
        if (typeof message === 'object')
            emitMessage = new IPCMessage(this, message);
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
            this.client.emit?.(Events.ERROR, error);
        });
    }
    triggerReady() {
        this.process?.send({ _type: messageType.CLIENT_READY });
        this.ready = true;
        return this.ready;
    }
    triggerClusterReady() {
        return this.emit('ready', this);
    }
    triggerMaintenance(maintenance, all = false) {
        let _type = messageType.CLIENT_MAINTENANCE;
        if (all)
            _type = messageType.CLIENT_MAINTENANCE_ALL;
        this.process?.send({ _type, maintenance });
        this.maintenance = maintenance;
        return this.maintenance;
    }
    spawnNextCluster() {
        if (this.queue.mode === 'auto')
            throw new Error('Next Cluster can just be spawned when the queue is not on auto mode.');
        return this.process?.send({ _type: messageType.CLIENT_SPAWN_NEXT_CLUSTER });
    }
    static getInfo() {
        return getInfo();
    }
}
