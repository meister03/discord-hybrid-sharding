"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfo = void 0;
var worker_threads_1 = require("worker_threads");
function getInfo() {
    var _a, _b;
    var clusterMode = process.env.CLUSTER_MANAGER_MODE;
    if (clusterMode !== 'worker' && clusterMode !== 'process')
        throw new Error('NO CHILD/MASTER EXISTS OR SUPPLIED CLUSTER_MANAGER_MODE IS INCORRECT');
    var data = {};
    if (clusterMode === 'process') {
        var shardList_1 = [];
        var parseShardList = ((_b = (_a = process.env) === null || _a === void 0 ? void 0 : _a.SHARD_LIST) === null || _b === void 0 ? void 0 : _b.split(',')) || [];
        parseShardList.forEach(function (c) { return shardList_1.push(Number(c)); });
        data = {
            SHARD_LIST: shardList_1,
            TOTAL_SHARDS: Number(process.env.TOTAL_SHARDS),
            CLUSTER_COUNT: Number(process.env.CLUSTER_COUNT),
            CLUSTER: Number(process.env.CLUSTER),
            CLUSTER_MANAGER_MODE: clusterMode,
            MAINTENANCE: process.env.MAINTENANCE,
            CLUSTER_QUEUE_MODE: process.env.CLUSTER_QUEUE_MODE,
            FIRST_SHARD_ID: shardList_1[0],
            LAST_SHARD_ID: shardList_1[shardList_1.length - 1],
        };
        return data;
    }
    else {
        data = worker_threads_1.workerData;
        data.FIRST_SHARD_ID = data.SHARD_LIST[0];
        data.LAST_SHARD_ID = data.SHARD_LIST[data.SHARD_LIST.length - 1];
        return data;
    }
}
exports.getInfo = getInfo;
