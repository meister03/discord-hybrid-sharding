export declare function getInfo(): ClusterClientData;
export interface ClusterClientData {
    SHARD_LIST: number[];
    TOTAL_SHARDS: number;
    LAST_SHARD_ID: number;
    FIRST_SHARD_ID: number;
    CLUSTER_COUNT: number;
    MAINTENANCE?: string;
    CLUSTER_QUEUE_MODE?: 'auto' | string | undefined;
    CLUSTER: number;
    CLUSTER_MANAGER_MODE: ClusterManagerMode;
}
export declare type ClusterManagerMode = 'process' | 'worker';
//# sourceMappingURL=Data.d.ts.map