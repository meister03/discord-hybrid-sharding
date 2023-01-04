import { Cluster } from '../Core/Cluster';
import { ClusterClient } from '../Core/ClusterClient';
import { ClusterManager } from '../Core/ClusterManager';
import { messageType } from '../types/shared';
import { makePlainError } from '../Util/Util';
import { Child, ChildClient } from './Child';
import { RawMessage } from './IPCMessage';
import { ResolveMessage } from './PromiseHandler';
import { Worker, WorkerClient } from './Worker';

export class ClusterHandler {
    manager: ClusterManager;
    cluster: Cluster;
    ipc: Worker | Child;
    constructor(manager: ClusterManager, cluster: Cluster, ipc: Worker | Child) {
        this.manager = manager;
        this.cluster = cluster;
        this.ipc = ipc;
    }

    handleMessage(message: RawMessage) {
        if (message._type === messageType.CLIENT_READY) {
            this.cluster.ready = true;
            /**
             * Emitted upon the cluster's {@link Client#ready} event.
             * @event Cluster#ready
             */
            this.cluster.emit('ready');
            this.cluster.manager._debug('Ready', this.cluster.id);
            return;
        }
        if (message._type === messageType.CLIENT_BROADCAST_REQUEST) {
            this.cluster.manager
                .broadcastEval(message._eval, message.options)
                ?.then(results => {
                    return this.ipc.send({
                        nonce: message.nonce,
                        _type: messageType.CLIENT_BROADCAST_RESPONSE,
                        _result: results,
                    });
                })
                .catch(err => {
                    return this.ipc.send({
                        nonce: message.nonce,
                        _type: messageType.CLIENT_BROADCAST_RESPONSE,
                        _error: makePlainError(err),
                    });
                });
            return;
        }
        if (message._type === messageType.CLIENT_MANAGER_EVAL_REQUEST) {
            this.cluster.manager.evalOnManager(message._eval).then(result => {
                if (result._error)
                    this.ipc.send({
                        nonce: message.nonce,
                        _type: messageType.CLIENT_MANAGER_EVAL_RESPONSE,
                        _error: makePlainError(result._error),
                    });
                return this.ipc.send({
                    nonce: message.nonce,
                    _type: messageType.CLIENT_MANAGER_EVAL_RESPONSE,
                    _result: result._result,
                });
            });
            return;
        }
        if (message._type === messageType.CLIENT_EVAL_RESPONSE) {
            this.cluster.manager.promise.resolve(message as ResolveMessage);
            return;
        }
        if (message._type === messageType.CLIENT_RESPAWN_ALL) {
            this.cluster.manager.respawnAll(message.options);
            return;
        }
        if (message._type === messageType.CLIENT_RESPAWN) {
            this.cluster.respawn(message.options);
            return;
        }
        if (message._type === messageType.CLIENT_MAINTENANCE) {
            this.cluster.triggerMaintenance(message.maintenance);
            return;
        }
        if (message._type === messageType.CLIENT_MAINTENANCE_ALL) {
            this.cluster.manager.triggerMaintenance(message.maintenance);
            return;
        }
        if (message._type === messageType.CLIENT_SPAWN_NEXT_CLUSTER) {
            this.cluster.manager.queue.next();
            return;
        }
        if (message._type === messageType.HEARTBEAT_ACK) {
            this.cluster.manager.heartbeat?.ack(this.cluster.id, message.date);
            return;
        }
        if (message._type === messageType.CUSTOM_REPLY) {
            this.cluster.manager.promise.resolve(message as ResolveMessage);
            return;
        }
        return true;
    }
}

export class ClusterClientHandler<DiscordClient> {
    client: ClusterClient<DiscordClient>;
    ipc: ChildClient | WorkerClient | null;
    constructor(client: ClusterClient<DiscordClient>, ipc: ChildClient | WorkerClient | null) {
        this.client = client;
        this.ipc = ipc;
    }

    public async handleMessage(message: ResolveMessage & { date?: number; maintenance?: string }) {
        if (message._type === messageType.CLIENT_EVAL_REQUEST) {
            try {
                if (!message._eval) throw new Error('Eval Script not provided');
                this.client._respond('eval', {
                    _eval: message._eval,
                    _result: await this.client._eval(message._eval),
                    _type: messageType.CLIENT_EVAL_RESPONSE,
                    nonce: message.nonce,
                });
            } catch (err) {
                this.client._respond('eval', {
                    _eval: message._eval,
                    _error: makePlainError(err),
                    _type: messageType.CLIENT_EVAL_RESPONSE,
                    nonce: message.nonce,
                });
            }
            return null;
        }
        if (message._type === messageType.CLIENT_MANAGER_EVAL_RESPONSE) {
            this.client.promise.resolve({ _result: message._result, _error: message._error, nonce: message.nonce });
            return null;
        }
        if (message._type === messageType.CLIENT_BROADCAST_RESPONSE) {
            this.client.promise.resolve({ _result: message._result, _error: message._error, nonce: message.nonce });
            return null;
        }
        if (message._type === messageType.HEARTBEAT) {
            this.client.send({ _type: messageType.HEARTBEAT_ACK, date: message.date });
            return null;
        }
        if (message._type === messageType.CLIENT_MAINTENANCE_DISABLE) {
            this.client.maintenance = false;
            this.client.triggerClusterReady();
            return null;
        }
        if (message._type === messageType.CLIENT_MAINTENANCE_ENABLE) {
            this.client.maintenance = message.maintenance || true;
            return null;
        }
        if (message._type === messageType.CUSTOM_REPLY) {
            this.client.promise.resolve(message);
            return null;
        }
        return true;
    }
}
