"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterClientHandler = exports.ClusterHandler = void 0;
const shared_1 = require("../types/shared");
const Util_1 = require("../Util/Util");
class ClusterHandler {
    manager;
    cluster;
    ipc;
    constructor(manager, cluster, ipc) {
        this.manager = manager;
        this.cluster = cluster;
        this.ipc = ipc;
    }
    handleMessage(message) {
        switch (message._type) {
            case shared_1.messageType.CLIENT_READY:
                this.cluster.ready = true;
                /**
                 * Emitted upon the cluster's {@link Client#ready} event.
                 * @event Cluster#ready
                 */
                this.cluster.emit('ready');
                this.cluster.manager._debug('Ready', this.cluster.id);
                break;
            case shared_1.messageType.CLIENT_BROADCAST_REQUEST:
                this.cluster.manager
                    .broadcastEval(message._eval, message.options)
                    ?.then(results => {
                    return this.ipc.send({
                        nonce: message.nonce,
                        _type: shared_1.messageType.CLIENT_BROADCAST_RESPONSE,
                        _result: results,
                    });
                })
                    .catch(err => {
                    return this.ipc.send({
                        nonce: message.nonce,
                        _type: shared_1.messageType.CLIENT_BROADCAST_RESPONSE,
                        _error: (0, Util_1.makePlainError)(err),
                    });
                });
                break;
            case shared_1.messageType.CLIENT_MANAGER_EVAL_REQUEST:
                this.cluster.manager.evalOnManager(message._eval).then(result => {
                    if (result._error)
                        this.ipc.send({
                            nonce: message.nonce,
                            _type: shared_1.messageType.CLIENT_MANAGER_EVAL_RESPONSE,
                            _error: (0, Util_1.makePlainError)(result._error),
                        });
                    return this.ipc.send({
                        nonce: message.nonce,
                        _type: shared_1.messageType.CLIENT_MANAGER_EVAL_RESPONSE,
                        _result: result._result,
                    });
                });
                break;
            case shared_1.messageType.CLIENT_EVAL_RESPONSE:
                this.cluster.manager.promise.resolve(message);
                break;
            case shared_1.messageType.CLIENT_RESPAWN_ALL:
                this.cluster.manager.respawnAll(message.options);
                break;
            case shared_1.messageType.CLIENT_RESPAWN:
                this.cluster.respawn(message.options);
                break;
            case shared_1.messageType.CLIENT_MAINTENANCE:
                this.cluster.triggerMaintenance(message.maintenance);
                break;
            case shared_1.messageType.CLIENT_MAINTENANCE_ALL:
                this.cluster.manager.triggerMaintenance(message.maintenance);
                break;
            case shared_1.messageType.CLIENT_SPAWN_NEXT_CLUSTER:
                this.cluster.manager.queue.next();
                break;
            case shared_1.messageType.HEARTBEAT_ACK:
                this.cluster.manager.heartbeat?.ack(this.cluster.id, message.date);
                break;
            case shared_1.messageType.CUSTOM_REPLY:
                this.cluster.manager.promise.resolve(message);
                break;
            default:
                return true;
        }
    }
}
exports.ClusterHandler = ClusterHandler;
class ClusterClientHandler {
    client;
    ipc;
    constructor(client, ipc) {
        this.client = client;
        this.ipc = ipc;
    }
    async handleMessage(message) {
        switch (message._type) {
            case shared_1.messageType.CLIENT_EVAL_REQUEST:
                try {
                    if (!message._eval)
                        throw new Error('Eval Script not provided');
                    this.client._respond('eval', {
                        _eval: message._eval,
                        _result: await this.client._eval(message._eval),
                        _type: shared_1.messageType.CLIENT_EVAL_RESPONSE,
                        nonce: message.nonce,
                    });
                }
                catch (err) {
                    this.client._respond('eval', {
                        _eval: message._eval,
                        _error: (0, Util_1.makePlainError)(err),
                        _type: shared_1.messageType.CLIENT_EVAL_RESPONSE,
                        nonce: message.nonce,
                    });
                }
                return null;
            case shared_1.messageType.CLIENT_MANAGER_EVAL_RESPONSE:
                this.client.promise.resolve({ _result: message._result, _error: message._error, nonce: message.nonce });
                return null;
            case shared_1.messageType.CLIENT_BROADCAST_RESPONSE:
                this.client.promise.resolve({ _result: message._result, _error: message._error, nonce: message.nonce });
                return null;
            case shared_1.messageType.HEARTBEAT:
                this.client.send({ _type: shared_1.messageType.HEARTBEAT_ACK, date: message.date });
                return null;
            case shared_1.messageType.CLIENT_MAINTENANCE_DISABLE:
                this.client.maintenance = false;
                this.client.triggerClusterReady();
                return null;
            case shared_1.messageType.CLIENT_MAINTENANCE_ENABLE:
                this.client.maintenance = message.maintenance || true;
                return null;
            case shared_1.messageType.CUSTOM_REPLY:
                this.client.promise.resolve(message);
                return null;
            default:
                return true;
        }
    }
}
exports.ClusterClientHandler = ClusterClientHandler;
