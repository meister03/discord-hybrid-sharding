let data;
let clusterMode = process.env.CLUSTER_MANAGER_MODE;
if (clusterMode) {
    if (clusterMode !== 'worker' && clusterMode !== 'process')
        throw new Error('NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT');
    if (clusterMode === 'process') {
        const shardList = [];
        let parseShardList = process.env.SHARD_LIST.split(',');
        parseShardList.forEach(c => shardList.push(Number(c)));
        data = {
            SHARD_LIST: shardList,
            TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS),
            CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT),
            CLUSTER: Number(process.env.CLUSTER),
            CLUSTER_MANAGER_MODE: clusterMode,
            MAINTENANCE: process.env.MAINTENANCE,
            CLUSTER_QUEUE_MODE: process.env.CLUSTER_QUEUE_MODE,
        };
    } else {
        data = require('worker_threads').workerData;
    }

    data.FIRST_SHARD_ID = data.SHARD_LIST[0];
    data.LAST_SHARD_ID = data.SHARD_LIST[data.SHARD_LIST.length - 1];
}
module.exports = data;
