// @ts-check
const Util = require('../Util/Util.js');
class ReClusterManager {
    constructor(options = {}) {
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
     * Execute a Zero Downtime Restart on all Clusters with a updated totalShards (count) or a scheduled restart.
     * @param {object} options
     * @param {?number} options.delay The delay to wait between each cluster spawn
     * @param {?number} options.timeout The readyTimeout to wait until the cluster spawn promise is rejected
     * @param {?number|'auto'} options.totalShards The new totalShards of the bot
     * @param {?number} options.totalClusters The amount of totalClusters to spread the shards over all clusters
     * @param {?number} options.shardsPerClusters The amount of shards per cluster
     * @param {?number[][]} options.shardClusterList The shardList chunked over the clusters
     * @param {?number[]} options.shardList The new shardList of the Cluster Manager
     * @param {?string} options.restartMode The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed
     * @returns {ReClusterManager._start}
     */
    async start({
        delay,
        timeout,
        totalShards,
        totalClusters,
        shardsPerClusters,
        shardClusterList,
        shardList = this.manager.shardList,
        restartMode = 'gracefulSwitch',
    }) {
        if (this.onProgress) throw new Error('Zero Downtime Reclustering is already in progress');
        if (totalShards) {
            if (totalShards === 'auto') totalShards = await Util.fetchRecommendedShards(this.manager.token);
            this.manager.totalShards = totalShards;
        }
        if (totalClusters) this.manager.totalClusters = totalClusters;
        if (shardsPerClusters) {
            this.manager.shardsPerClusters = shardsPerClusters;
            this.manager.totalClusters = Math.ceil(this.manager.totalShards / this.manager.shardsPerClusters);
        }

        if (shardList) this.manager.shardList = shardList;
        else this.manager.shardList = [...Array(this.manager.totalShards).keys()];
        if (shardClusterList) this.manager.shardClusterList = shardClusterList;
        else
            this.manager.shardClusterList = this.manager.shardList?.chunk(
                Math.ceil(this.manager.shardList.length / this.manager.totalClusters),
            );

        if (this.manager.shardClusterList.length !== this.manager.totalClusters) {
            this.manager.totalClusters = this.manager.shardClusterList.length;
        }
        this.manager._debug(
            [
                '[↻][ReClustering] Starting... Zerodowntime Reclustering',
                `├── Mode: ${restartMode}`,
                `├── Total Shards: ${this.manager.totalShards}`,
                `├── Total Clusters: ${this.manager.totalClusters}`,
                `├── Shards Per Cluster: ${this.manager.shardsPerClusters}`,
                `├── Shard Cluster List: ${this.manager.shardClusterList.join(', ')}`,
                `└── Shard List: ${this.manager.shardList.join(', ')}`,
            ].join('\n'),
        );
        return this._start({ restartMode, timeout, delay });
    }

    /**
     * @param {object} options
     * @param {?number} options.delay The delay to wait between each cluster spawn
     * @param {?number} options.timeout The readyTimeout to wait until the cluster spawn promise is rejected
     * @param {?string} options.restartMode The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed
     * @returns {Promise<Object>}
     */
    async _start({ restartMode, timeout = 30000 * 6, delay = 7000 }) {
        process.env.MAINTENANCE = 'recluster';
        this.manager.triggerMaintenance('recluster');
        this.manager._debug('[↻][ReClustering] Enabling Maintenance Mode on all clusters');

        let switchClusterAfterReady = false;
        // when no shard settings have been updated
        switchClusterAfterReady = restartMode === 'rolling'; //gracefulSwitch, spawn all clusters and kill all old clusters, when new clusters are ready

        const newClusters = new Map();
        const oldClusters = new Map();
        [...this.manager.clusters.values()].forEach(cluster => {
            oldClusters.set(cluster.id, cluster);
        });
        for (let i = 0; i < this.manager.totalClusters; i++) {
            const clusterId = this.manager.clusterList[i] || i;
            const readyTimeout = timeout !== -1 ? timeout + delay * this.manager.shardClusterList[i].length : timeout;
            const spawnDelay = delay * this.manager.shardClusterList[i].length;
            this.manager.queue.add({
                run: (...a) => {
                    const cluster = this.manager.createCluster(
                        clusterId,
                        this.manager.shardClusterList[i],
                        this.manager.totalShards,
                        true,
                    );
                    newClusters.set(clusterId, cluster);
                    this.manager._debug(`[↻][ReClustering][${clusterId}] Spawning... Cluster`);
                    return cluster.spawn(...a).then(c => {
                        this.manager._debug(`[↻][ReClustering][${clusterId}] Cluster Ready`);
                        if (switchClusterAfterReady) {
                            const oldCluster = this.manager.clusters.get(clusterId);
                            if (oldCluster) {
                                oldCluster.kill({ force: true, reason: 'Reclustering' });
                                oldClusters.delete(clusterId);
                            }
                            this.manager.clusters.set(clusterId, cluster);
                            cluster.triggerMaintenance();
                            this.manager._debug(
                                `[↻][ReClustering][${clusterId}] Switched OldCluster to NewCluster and exited Maintenance Mode`,
                            );
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
            for (let [id, cluster] of oldClusters) {
                cluster.kill({ force: true, reason: 'Reclustering' });
                this.manager._debug(`[↻][ReClustering][${id}] Killed OldCluster`);
                this.manager.clusters.delete(id);
            }
            oldClusters.clear();
        }
        if (!switchClusterAfterReady) {
            this.manager._debug(
                '[↻][ReClustering] Starting exiting Maintenance Mode on all clusters and killing old clusters',
            );
            for (let i = 0; i < this.manager.totalClusters; i++) {
                const clusterId = this.manager.clusterList[i] || i;
                const cluster = newClusters.get(clusterId);
                const oldCluster = this.manager.clusters.get(clusterId);
                if (oldCluster) {
                    oldCluster.kill({ force: true, reason: 'Reclustering' });
                    oldClusters.delete(clusterId);
                }
                this.manager.clusters.set(clusterId, cluster);
                cluster.triggerMaintenance();
                this.manager._debug(
                    `[↻][ReClustering][${clusterId}] Switched OldCluster to NewCluster and exited Maintenance Mode`,
                );
            }
        }

        newClusters.clear();
        this.onProgress = false;
        process.env.MAINTENANCE = undefined;
        this.manager._debug('[↻][ReClustering] Finished ReClustering');
        return { success: true };
    }
}
module.exports = ReClusterManager;
