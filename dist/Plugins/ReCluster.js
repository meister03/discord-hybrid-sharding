"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReClusterManager = void 0;
const Util_1 = require("../Util/Util");
class ReClusterManager {
    options;
    name;
    onProgress;
    manager;
    constructor(options) {
        if (!options)
            this.options = {};
        else
            this.options = options;
        this.name = 'recluster';
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
        let { delay, timeout, totalClusters, totalShards, shardsPerClusters, shardClusterList, shardList = this.manager?.shardList, restartMode = 'gracefulSwitch', } = options || { restartMode: 'gracefulSwitch' };
        if (this.onProgress)
            throw new Error('Zero Downtime Reclustering is already in progress');
        if (!this.manager)
            throw new Error('Manager is missing on ReClusterManager');
        if (totalShards) {
            if (!this.manager?.token)
                throw new Error('Token must be defined on manager, when totalShards is set on auto');
            if (totalShards === 'auto' || totalShards === -1)
                totalShards = await (0, Util_1.fetchRecommendedShards)(this.manager.token);
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
            this.manager.shardClusterList = (0, Util_1.chunkArray)(this.manager.shardList, Math.ceil(this.manager.shardList.length / this.manager.totalClusters));
        if (this.manager.shardClusterList.length !== this.manager.totalClusters) {
            this.manager.totalClusters = this.manager.shardClusterList.length;
        }
        this.manager._debug([
            '[↻][ReClustering] Starting... Zerodowntime Reclustering',
            `├── Mode: ${restartMode}`,
            `├── Total Shards: ${this.manager.totalShards}`,
            `├── Total Clusters: ${this.manager.totalClusters}`,
            `├── Shards Per Cluster: ${this.manager.shardsPerClusters}`,
            `├── Shard Cluster List: ${this.manager.shardClusterList.join(', ')}`,
            `└── Shard List: ${this.manager.shardList.join(', ')}`,
        ].join('\n'));
        return this._start({ restartMode, timeout, delay });
    }
    /**
     * @param options
     * @param options.delay The delay to wait between each cluster spawn
     * @param options.timeout The readyTimeout to wait until the cluster spawn promise is rejected
     * @param options.restartMode The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed
     */
    async _start({ restartMode = 'gracefulSwitch', timeout = 30000 * 6, delay = 7000 }) {
        if (!this.manager)
            throw new Error('Manager is missing on ReClusterManager');
        process.env.MAINTENANCE = 'recluster';
        this.manager.triggerMaintenance('recluster');
        this.manager._debug('[↻][ReClustering] Enabling Maintenance Mode on all clusters');
        let switchClusterAfterReady = false;
        // when no shard settings have been updated
        switchClusterAfterReady = restartMode === 'rolling'; //gracefulSwitch, spawn all clusters and kill all old clusters, when new clusters are ready
        const newClusters = new Map();
        const oldClusters = new Map();
        Array.from(this.manager.clusters.values()).forEach(cluster => {
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
                        throw new Error('Manager is missing on ReClusterManager');
                    const cluster = this.manager.createCluster(clusterId, this.manager.shardClusterList[i], this.manager.totalShards, true);
                    newClusters.set(clusterId, cluster);
                    this.manager._debug(`[↻][ReClustering][${clusterId}] Spawning... Cluster`);
                    return cluster.spawn(...a).then(c => {
                        if (!this.manager)
                            throw new Error('Manager is missing on ReClusterManager');
                        this.manager._debug(`[↻][ReClustering][${clusterId}] Cluster Ready`);
                        if (switchClusterAfterReady) {
                            const oldCluster = this.manager.clusters.get(clusterId);
                            if (oldCluster) {
                                oldCluster.kill({ force: true, reason: 'reclustering' });
                                oldClusters.delete(clusterId);
                            }
                            this.manager.clusters.set(clusterId, cluster);
                            cluster.triggerMaintenance(undefined);
                            this.manager._debug(`[↻][ReClustering][${clusterId}] Switched OldCluster to NewCluster and exited Maintenance Mode`);
                        }
                        return c;
                    });
                },
                args: [readyTimeout],
                timeout: spawnDelay,
            });
        }
        await this.manager.queue.start();
        if (oldClusters.size) {
            this.manager._debug('[↻][ReClustering] Killing old clusters');
            for (const [id, cluster] of Array.from(oldClusters)) {
                cluster.kill({ force: true, reason: 'reclustering' });
                this.manager._debug(`[↻][ReClustering][${id}] Killed OldCluster`);
                this.manager.clusters.delete(id);
            }
            oldClusters.clear();
        }
        if (!switchClusterAfterReady) {
            this.manager._debug('[↻][ReClustering] Starting exiting Maintenance Mode on all clusters and killing old clusters');
            for (let i = 0; i < this.manager.totalClusters; i++) {
                const clusterId = this.manager.clusterList[i] || i;
                const cluster = newClusters.get(clusterId);
                const oldCluster = this.manager.clusters.get(clusterId);
                if (!cluster)
                    continue;
                if (oldCluster) {
                    oldCluster.kill({ force: true, reason: 'reclustering' });
                    oldClusters.delete(clusterId);
                }
                this.manager.clusters.set(clusterId, cluster);
                cluster.triggerMaintenance();
                this.manager._debug(`[↻][ReClustering][${clusterId}] Switched OldCluster to NewCluster and exited Maintenance Mode`);
            }
        }
        newClusters.clear();
        this.onProgress = false;
        process.env.MAINTENANCE = undefined;
        this.manager._debug('[↻][ReClustering] Finished ReClustering');
        return { success: true };
    }
}
exports.ReClusterManager = ReClusterManager;
