import { ClusterManager } from '../Core/ClusterManager';
export declare type ReClusterRestartMode = 'gracefulSwitch' | 'rolling';
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
export declare class ReClusterManager {
    options: ReClusterOptions;
    name: 'recluster';
    onProgress: Boolean;
    manager?: ClusterManager;
    constructor(options?: ReClusterOptions);
    build(manager: ClusterManager): this;
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
    start(options?: ReClusterOptions): Promise<{
        success: boolean;
    }>;
    /**
     * @param options
     * @param options.delay The delay to wait between each cluster spawn
     * @param options.timeout The readyTimeout to wait until the cluster spawn promise is rejected
     * @param options.restartMode The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed
     */
    _start({ restartMode, timeout, delay }: {
        restartMode?: string | undefined;
        timeout?: number | undefined;
        delay?: number | undefined;
    }): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=ReCluster.d.ts.map