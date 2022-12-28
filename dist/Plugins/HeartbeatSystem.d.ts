/// <reference types="node" />
import { Cluster } from '../Core/Cluster';
import { ClusterManager } from '../Core/ClusterManager';
export declare type keepAliveOptions = {
    /** Default interval is 20000 */
    interval?: number;
    /** Default maxMissedHeartbeats is 5 */
    maxMissedHeartbeats?: number;
};
export declare class HeartbeatManager {
    options: keepAliveOptions;
    clusters: Map<number, Heartbeat>;
    manager: null | ClusterManager;
    name: 'heartbeat';
    constructor(options?: keepAliveOptions);
    build(manager: ClusterManager): void;
    start(): void;
    stop(cluster: Cluster, reason: string): void;
    ack(id: number, date: number): void;
}
export declare class Heartbeat {
    manager: HeartbeatManager;
    options: Required<keepAliveOptions>;
    interval?: NodeJS.Timer;
    heartbeats: Map<number, Boolean>;
    instance: Cluster;
    constructor(manager: HeartbeatManager, instance: Cluster, options: Required<keepAliveOptions>);
    ack(date: number): boolean;
    start(): NodeJS.Timer;
    stop(): void;
    resume(): void;
}
//# sourceMappingURL=HeartbeatSystem.d.ts.map