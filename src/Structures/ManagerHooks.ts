import type { Cluster } from '../Core/Cluster';

export class ClusterManagerHooks {
    constructor() {
        // @ts-ignore
    }

    constructClusterArgs(cluster: Cluster, args: string[]) {
        return args;
    }
}
