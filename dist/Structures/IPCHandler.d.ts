import { Cluster } from '../Core/Cluster';
import { ClusterClient } from '../Core/ClusterClient';
import { ClusterManager } from '../Core/ClusterManager';
import { Child, ChildClient } from './Child';
import { RawMessage } from './IPCMessage';
import { ResolveMessage } from './PromiseHandler';
import { Worker, WorkerClient } from './Worker';
export declare class ClusterHandler {
    manager: ClusterManager;
    cluster: Cluster;
    ipc: Worker | Child;
    constructor(manager: ClusterManager, cluster: Cluster, ipc: Worker | Child);
    handleMessage(message: RawMessage): true | undefined;
}
export declare class ClusterClientHandler<DiscordClient> {
    client: ClusterClient<DiscordClient>;
    ipc: ChildClient | WorkerClient | null;
    constructor(client: ClusterClient<DiscordClient>, ipc: ChildClient | WorkerClient | null);
    handleMessage(message: ResolveMessage & {
        date?: number;
        maintenance?: string;
    }): Promise<true | null>;
}
//# sourceMappingURL=IPCHandler.d.ts.map