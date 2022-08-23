// @ts-check
const { messageType } = require('../Util/Constants.js');
class HeartbeatManager {
    constructor(options = {}) {
        this.options = options;

        if (!this.options.interval) this.options.interval = 20000;
        if (!this.options.maxMissedHeartbeats) this.options.maxMissedHeartbeats = 5;
        this.clusters = new Map();
        this.manager = null;
        this.name = 'heartbeat';
    }
    build(manager) {
        manager[this.name] = this;
        this.manager = manager;
        this.start();
    }
    start() {
        this.manager.on('clusterReady', cluster => {
            if (this.clusters.has(cluster.id)) this.clusters.get(cluster.id).stop();
            this.clusters.set(cluster.id, new Heartbeat(this, cluster, this.options));
        });
    }
    stop(cluster, reason) {
        if (!this.clusters.has(cluster.id)) return;
        this.clusters.get(cluster.id).stop(reason);
        this.manager._debug(`[Heartbeat_MISSING] ${reason}`, cluster.id);
        if (cluster.restarts.current < cluster.restarts.max) {
            cluster.respawn({ auto: true, ...this.manager.spawnOptions });
            this.manager._debug('[Heartbeat_MISSING] Attempted Respawn', cluster.id);
        } else {
            this.manager._debug('[Heartbeat_MISSING] Respawn Rejected | Max Restarts of Cluster Reached', cluster.id);
        }
    }
    ack(id, date) {
        if (!this.clusters.has(id)) return;
        this.clusters.get(id).ack(date);
    }
}

class Heartbeat {
    constructor(manager, instance, options) {
        this.manager = manager;
        this.options = options;
        this.interval = null;
        this.heartbeats = new Map();
        this.instance = instance;
        this.start();
    }

    ack(date) {
        return this.heartbeats.delete(date);
    }

    start() {
        return (this.interval = setInterval(() => {
            const start = Date.now();
            this.heartbeats.set(start, true);
            this.instance.send({ _type: messageType.HEARTBEAT, date: start }).catch(() => null);
            if (this.heartbeats.size > this.options.maxMissedHeartbeats) {
                this.manager.stop(this.instance, `Missed ${this.heartbeats.size} Heartbeat Acks | Attempting Respawn`);
            }
        }, this.options.interval));
    }

    stop() {
        this.heartbeats.clear();
        clearInterval(this.interval);
    }

    resume() {
        this.start();
    }
}

module.exports = HeartbeatManager;
