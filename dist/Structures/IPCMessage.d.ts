import { ClusterClient } from '../Core/ClusterClient';
import { Cluster } from '../Core/Cluster';
export interface RawMessage {
    nonce?: string;
    _type?: number;
    [x: string]: any;
}
export declare class BaseMessage {
    [x: string]: any;
    nonce: string;
    private readonly _raw;
    constructor(message: RawMessage);
    /**
     * Destructs the Message Object and initializes it on the Constructor
     */
    private destructMessage;
    toJSON(): RawMessage;
}
export declare class IPCMessage extends BaseMessage {
    raw: RawMessage;
    instance: ClusterClient<any> | Cluster;
    constructor(instance: ClusterClient<any> | Cluster, message: RawMessage);
    /**
     * Sends a message to the cluster's process/worker or to the ParentCluster.
     */
    send(message: object): Promise<unknown>;
    /**
     * Sends a Request to the cluster's process/worker or to the ParentCluster.
     */
    request(message: object): Promise<unknown>;
    /**
     * Sends a Reply to Message from the cluster's process/worker or the ParentCluster.
     */
    reply(message: object): Promise<unknown>;
}
//# sourceMappingURL=IPCMessage.d.ts.map