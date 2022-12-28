import { Cluster } from '../Core/Cluster';
import { ClusterManager } from '../Core/ClusterManager';
import { messageType } from '../types/shared';

export type keepAliveOptions = {
    /** Default interval is 20000 */
    interval?: number;
    /** Default maxMissedHeartbeats is 5 */
    maxMissedHeartbeats?: number;
};

export class HeartbeatManager {
    options: keepAliveOptions;
    clusters: Map<number, Heartbeat>;
    manager: null | ClusterManager;
    name: 'heartbeat';
    constructor(options?: keepAliveOptions) {
        if (!options) options = {};
        this.options = options;

        if (!this.options.interval) this.options.interval = 20000;
        if (!this.options.maxMissedHeartbeats) this.options.maxMissedHeartbeats = 5;
        this.clusters = new Map();
        this.manager = null;
        this.name = 'heartbeat';
    }
    public build(manager: ClusterManager) {
        manager[this.name] = this;
        this.manager = manager;
        this.start();
    }
    public start() {
        this.manager?.on('clusterReady', (cluster: Cluster) => {
            if (this.clusters.has(cluster.id)) this.clusters.get(cluster.id)?.stop();
            this.clusters.set(cluster.id, new Heartbeat(this, cluster, this.options as Required<keepAliveOptions>));
        });
    }
    public stop(cluster: Cluster, reason: string) {
        if (!this.clusters.has(cluster.id)) return;
        this.clusters.get(cluster.id)?.stop();
        this.manager?._debug(`[Heartbeat_MISSING] ${reason}`, cluster.id);
        if (cluster.restarts.current < cluster.restarts.max) {
            cluster.respawn(this.manager?.spawnOptions);
            this.manager?._debug('[Heartbeat_MISSING] Attempted Respawn', cluster.id);
        } else {
            this.manager?._debug('[Heartbeat_MISSING] Respawn Rejected | Max Restarts of Cluster Reached', cluster.id);
        }
    }
    public ack(id: number, date: number) {
        if (!this.clusters.has(id)) return;
        this.clusters.get(id)?.ack(date);
    }
}

export class Heartbeat {
    manager: HeartbeatManager;
    options: Required<keepAliveOptions>;
    interval?: NodeJS.Timer;
    heartbeats: Map<number, Boolean>;
    instance: Cluster;
    constructor(manager: HeartbeatManager, instance: Cluster, options: Required<keepAliveOptions>) {
        this.manager = manager;
        this.options = options;
        this.interval = undefined;
        this.heartbeats = new Map();
        this.instance = instance;
        this.start();
    }

    public ack(date: number) {
        return this.heartbeats.delete(date);
    }

    public start() {
        return (this.interval = setInterval(() => {
            const start = Date.now();
            this.heartbeats.set(start, true);
            this.instance.send({ _type: messageType.HEARTBEAT, date: start })?.catch(() => null);
            if (this.heartbeats.size > this.options.maxMissedHeartbeats) {
                this.manager.stop(this.instance, `Missed ${this.heartbeats.size} Heartbeat Acks | Attempting Respawn`);
            }
        }, this.options.interval));
    }

    public stop() {
        this.heartbeats.clear();
        clearInterval(this.interval);
    }

    public resume() {
        this.start();
    }
}
