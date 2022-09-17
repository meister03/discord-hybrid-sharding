/// <reference types="node" />
/// <reference types="node" />
import { ChildProcess, Serializable } from 'child_process';
import { Worker } from 'worker_threads';
import { Cluster } from '../Core/Cluster';
import { ClusterClient } from '../Core/ClusterClient';
import { ClusterManager } from '../Core/ClusterManager';
import { ChildProcessOptions } from '../Structures/Child';
import { BaseMessage } from '../Structures/IPCMessage';
import { WorkerThreadOptions } from '../Structures/Worker';
import { Client } from 'discord.js';
export declare const Events: {
    ERROR: string;
    WARN: string;
};
export declare const DefaultOptions: {
    http: {
        api: string;
        version: string;
    };
};
export declare const Endpoints: {
    botGateway: string;
};
export declare enum messageType {
    'CUSTOM_REQUEST' = 0,
    'CUSTOM_MESSAGE' = 1,
    'CUSTOM_REPLY' = 2,
    'HEARTBEAT' = 3,
    'HEARTBEAT_ACK' = 4,
    'CLIENT_BROADCAST_REQUEST' = 5,
    'CLIENT_BROADCAST_RESPONSE' = 6,
    'CLIENT_RESPAWN' = 7,
    'CLIENT_RESPAWN_ALL' = 8,
    'CLIENT_MAINTENANCE' = 9,
    'CLIENT_MAINTENANCE_ENABLE' = 10,
    'CLIENT_MAINTENANCE_DISABLE' = 11,
    'CLIENT_MAINTENANCE_ALL' = 12,
    'CLIENT_SPAWN_NEXT_CLUSTER' = 13,
    'CLIENT_READY' = 14,
    'CLIENT_EVAL_REQUEST' = 15,
    'CLIENT_EVAL_RESPONSE' = 16,
    'CLIENT_MANAGER_EVAL_REQUEST' = 17,
    'CLIENT_MANAGER_EVAL_RESPONSE' = 18,
    'MANAGER_BROADCAST_REQUEST' = 19,
    'MANAGER_BROADCAST_RESPONSE' = 20
}
export interface evalOptions<T = object> {
    cluster?: number | number[];
    shard?: number;
    guildId?: string;
    context?: T;
    timeout?: number;
    _type?: messageType;
}
export declare type Awaitable<T> = T | PromiseLike<T>;
export declare type Serialized<T> = T extends symbol | bigint | (() => any) ? never : T extends number | string | boolean | undefined ? T : T extends {
    toJSON(): infer R;
} ? R : T extends ReadonlyArray<infer V> ? Serialized<V>[] : T extends ReadonlyMap<unknown, unknown> | ReadonlySet<unknown> ? {} : {
    [K in keyof T]: Serialized<T[K]>;
};
export interface ClusterSpawnOptions {
    delay: number;
    timeout: number;
}
export interface ClusterManagerSpawnOptions extends ClusterSpawnOptions {
    amount?: number | 'auto';
}
export interface ClusterManagerOptions {
    token?: string;
    totalShards?: number | 'auto';
    totalClusters?: number | 'auto';
    shardsPerClusters?: number;
    shardArgs?: string[];
    execArgv?: string[];
    respawn?: boolean;
    mode?: 'worker' | 'process';
    shardList?: number[];
    clusterList?: number[];
    restarts?: ClusterRestartOptions;
    queue?: QueueOptions;
    spawnOptions?: ClusterManagerSpawnOptions;
    clusterData?: object;
    keepAlive?: boolean;
    clusterOptions?: ChildProcessOptions | WorkerThreadOptions;
}
export interface ClusterRestartOptions {
    max: number;
    interval: number;
    current?: number;
}
export interface QueueOptions {
    auto: boolean;
    timeout?: number;
}
export interface ClusterKillOptions {
    reason?: string;
    force: boolean;
}
export interface handleExitOptions {
    reason?: string;
}
export interface Plugin {
    build(manager: ClusterManager): void;
}
export interface ClusterManagerEvents {
    clusterCreate: [cluster: Cluster];
    clusterReady: [cluster: Cluster];
    debug: [debugMessage: string];
}
export interface ClusterEvents {
    message: [message: BaseMessage | Serializable];
    clientRequest: [message: BaseMessage | Serializable];
    death: [cluster: Cluster, thread: ChildProcess | Worker | undefined | null];
    error: [error: Error];
    spawn: [thread: ChildProcess | Worker | undefined | null];
}
export interface ClusterClientEvents {
    message: [message: BaseMessage | Serializable];
    ready: [clusterClient: ClusterClient];
}
export interface DjsClient extends Client {
    _eval: (_: string) => unknown;
}
//# sourceMappingURL=shared.d.ts.map