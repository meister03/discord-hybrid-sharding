import type { Cluster } from "../Core/Cluster";

export class ClusterManagerHooks {
    constructClusterArgs(cluster: Cluster, args: string[]) {
        return [...args, '--clusterId ' + cluster.id, `--shards ${cluster.shardList.join(',')}`]
    }
}