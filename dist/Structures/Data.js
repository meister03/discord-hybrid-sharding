"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfo = void 0;
const worker_threads_1 = require("worker_threads");
function getInfo() {
    const clusterMode = process.env.CLUSTER_MANAGER_MODE;
    if (clusterMode !== 'worker' && clusterMode !== 'process')
        throw new Error('NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT');
    let data;
    if (clusterMode === 'process') {
        const shardList = [];
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
            FIRST_SHARD_ID: shardList[0],
            LAST_SHARD_ID: shardList[shardList.length - 1],
        };
    }
    else {
        data = worker_threads_1.workerData;
        data.FIRST_SHARD_ID = data.SHARD_LIST[0];
        data.LAST_SHARD_ID = data.SHARD_LIST[data.SHARD_LIST.length - 1];
    }
    return data;
}
exports.getInfo = getInfo;
