import { Cluster } from '../Core/Cluster';
import { ClusterManager } from '../Core/ClusterManager';
import { chunkArray, fetchRecommendedShards } from '../Util/Util';

export type ReClusterRestartMode = 'gracefulSwitch' | 'rolling';

export interface ReClusterOptions {
    /** The delay to wait between each cluster spawn */
    delay?: number;
    /** The readyTimeout to wait until the cluster spawn promise is rejected*/
    timeout?: number;
    /** The new totalShards of the bot*/
    totalShards?: number | 'auto';
    /** The amount of totalClusters to spread the shards over all clusters */
    totalClusters?: number;
    /** The amount of shards per cluster */
    shardsPerClusters?: number;
    /** The shardList chunked over the clusters */
    shardList?: number[];
    /** The new shardList of the Cluster Manager */
    shardClusterList?: number[][];
    /** The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed*/
    restartMode?: ReClusterRestartMode;
}

export class ReClusterManager {
    options: ReClusterOptions;
    name: 'recluster';
    onProgress: Boolean;
    manager?: ClusterManager;
    constructor(options?: ReClusterOptions) {
        if (!options) this.options = {};
        else this.options = options;
        this.name = 'recluster';
        this.onProgress = false;
    }

    build(manager: ClusterManager) {
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
    public async start(options?: ReClusterOptions) {
        this.options = { ...this.options, ...(options || {}) }; // update the options of the class
        const {
            delay,
            timeout,
            totalClusters,
            totalShards,
            shardsPerClusters,
            shardClusterList,
            shardList,
            restartMode,
        } = { restartMode: 'gracefulSwitch', shardList: this.manager?.shardList, ...this.options }; // declare defaults that way
        if (this.onProgress) throw new Error('Zero Downtime Reclustering is already in progress');
        if (!this.manager) throw new Error('Manager is missing on ReClusterManager');
        if (totalShards) {
            if (!this.manager?.token)
                throw new Error('Token must be defined on manager, when totalShards is set on auto');
            this.manager.totalShards =
                totalShards === 'auto' || totalShards === -1
                    ? await fetchRecommendedShards(this.manager.token)
                    : totalShards;
        }
        if (totalClusters) this.manager.totalClusters = totalClusters;
        if (shardsPerClusters) {
            this.manager.shardsPerClusters = shardsPerClusters;
            this.manager.totalClusters = Math.ceil(this.manager.totalShards / this.manager.shardsPerClusters);
        }

        if (shardList) this.manager.shardList = shardList;
        else this.manager.shardList = Array.from(Array(this.manager.totalShards).keys());

        if (shardClusterList) this.manager.shardClusterList = shardClusterList;
        else
            this.manager.shardClusterList = chunkArray(
                this.manager.shardList,
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
     * @param options
     * @param options.delay The delay to wait between each cluster spawn
     * @param options.timeout The readyTimeout to wait until the cluster spawn promise is rejected
     * @param options.restartMode The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed
     */
    public async _start({ restartMode = 'gracefulSwitch', timeout = 30000 * 6, delay = 7000 }) {
        if (!this.manager) throw new Error('Manager is missing on ReClusterManager');
        process.env.MAINTENANCE = 'recluster';
        this.manager.triggerMaintenance('recluster');
        this.manager._debug('[↻][ReClustering] Enabling Maintenance Mode on all clusters');

        // when no shard settings have been updated
        const switchClusterAfterReady = restartMode === 'rolling'; //gracefulSwitch, spawn all clusters and kill all old clusters, when new clusters are ready

        const newClusters: Map<number, Cluster> = new Map();
        const oldClusters: Map<number, Cluster> = new Map([...this.manager.clusters.entries()]); // shorten the map creation clone - syntax: new Map([id, value][])

        for (let i = 0; i < this.manager.totalClusters; i++) {
            const length =
                this.manager.shardClusterList[i]?.length || this.manager.totalShards / this.manager.totalClusters;
            const clusterId = this.manager.clusterList[i] || i;
            const readyTimeout = timeout !== -1 ? timeout + delay * length : timeout;
            const spawnDelay = delay * length;
            this.manager.queue.add({
                run: (...a) => {
                    if (!this.manager) throw new Error('Manager is missing on ReClusterManager');
                    const cluster = this.manager.createCluster(
                        clusterId,
                        this.manager.shardClusterList[i] as number[],
                        this.manager.totalShards,
                        true,
                    );
                    newClusters.set(clusterId, cluster);
                    this.manager._debug(`[↻][ReClustering][${clusterId}] Spawning... Cluster`);
                    return cluster.spawn(...a).then(c => {
                        if (!this.manager) throw new Error('Manager is missing on ReClusterManager');
                        this.manager._debug(`[↻][ReClustering][${clusterId}] Cluster Ready`);
                        if (switchClusterAfterReady) {
                            const oldCluster = this.manager.clusters.get(clusterId);
                            if (oldCluster) {
                                oldCluster.kill({ force: true, reason: 'reclustering' });
                                oldClusters.delete(clusterId);
                            }
                            this.manager.clusters.set(clusterId, cluster);
                            cluster.triggerMaintenance(undefined);
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
            for (const [id, cluster] of Array.from(oldClusters)) {
                cluster.kill({ force: true, reason: 'reclustering' });
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
                if (!cluster) continue;
                if (oldCluster) {
                    oldCluster.kill({ force: true, reason: 'reclustering' });
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
