"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterManagerHooks = void 0;
class ClusterManagerHooks {
    constructClusterArgs(cluster, args) {
        return [...args, '--clusterId ' + cluster.id, `--shards ${cluster.shardList.join(',')}`];
    }
}
exports.ClusterManagerHooks = ClusterManagerHooks;
