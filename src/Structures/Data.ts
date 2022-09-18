import { workerData } from 'worker_threads';
export function getInfo() {
    const clusterMode = process.env.CLUSTER_MANAGER_MODE;
    if (clusterMode !== 'worker' && clusterMode !== 'process')
        throw new Error('NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT');

    let data: ClusterClientData;

    if (clusterMode === 'process') {
        const shardList: number[] = [];
        const parseShardList = process.env?.SHARD_LIST?.split(',') || [];
        parseShardList.forEach(c => shardList.push(Number(c)));
        data = {
            SHARD_LIST: shardList,
            TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS),
            CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT),
            CLUSTER: Number(process.env.CLUSTER),
            CLUSTER_MANAGER_MODE: clusterMode,
            MAINTENANCE: process.env.MAINTENANCE,
            CLUSTER_QUEUE_MODE: process.env.CLUSTER_QUEUE_MODE,
            FIRST_SHARD_ID: shardList[0] as number,
            LAST_SHARD_ID: shardList[shardList.length - 1] as number,
        };
    } else {
        data = workerData;
        data.FIRST_SHARD_ID = data.SHARD_LIST[0] as number;
        data.LAST_SHARD_ID = data.SHARD_LIST[data.SHARD_LIST.length - 1] as number;
    }
    return data;
}

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

export type ClusterManagerMode = 'process' | 'worker';
