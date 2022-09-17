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
    private destructMessage;
    toJSON(): RawMessage;
}
export declare class IPCMessage extends BaseMessage {
    raw: RawMessage;
    instance: ClusterClient | Cluster;
    constructor(instance: ClusterClient | Cluster, message: RawMessage);
    send(message: object): Promise<unknown>;
    request(message: object): Promise<unknown>;
    reply(message: object): Promise<unknown>;
}
//# sourceMappingURL=IPCMessage.d.ts.map