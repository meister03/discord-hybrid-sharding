import type { Cluster } from "../Core/Cluster";

export class ClusterManagerHooks {
    constructor() {
    }

    constructClusterArgs(cluster: Cluster,args: string[]) {
        return args;
    }
}