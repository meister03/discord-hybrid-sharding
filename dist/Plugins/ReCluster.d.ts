import { ClusterManager } from '../Core/ClusterManager';
export declare type ReClusterRestartMode = 'gracefulSwitch' | 'rolling';
export interface ReClusterOptions {
    delay?: number;
    timeout?: number;
    totalShards?: number | 'auto';
    totalClusters?: number;
    shardsPerClusters?: number;
    shardList?: number[];
    shardClusterList?: number[][];
    restartMode?: ReClusterRestartMode;
}
export declare class ReClusterManager {
    options: ReClusterOptions;
    name: 'recluster';
    onProgress: Boolean;
    manager?: ClusterManager;
    constructor(options: ReClusterOptions);
    build(manager: ClusterManager): this;
    start(options?: ReClusterOptions): Promise<{
        success: boolean;
    }>;
    _start({ restartMode, timeout, delay }: {
        restartMode?: string | undefined;
        timeout?: number | undefined;
        delay?: number | undefined;
    }): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=ReCluster.d.ts.map