import { ChildProcess, Serializable } from 'child_process';
import { Worker } from 'worker_threads';
import { Cluster } from '../Core/Cluster';
import { ClusterClient } from '../Core/ClusterClient';
import { ClusterManager } from '../Core/ClusterManager';
import { ChildProcessOptions } from '../Structures/Child';
import { BaseMessage } from '../Structures/IPCMessage';
import { WorkerThreadOptions } from '../Structures/Worker';
import { Client } from 'discord.js';

export const Events = {
    ERROR: 'warn',
    WARN: 'error',
};

export const DefaultOptions = {
    http: {
        api: 'https://discord.com/api',
        version: '10',
    },
};

export const Endpoints = {
    botGateway: '/gateway/bot',
};

export enum messageType {
    'MISSING_TYPE',
    'CUSTOM_REQUEST',
    'CUSTOM_MESSAGE',
    'CUSTOM_REPLY',
    'HEARTBEAT',
    'HEARTBEAT_ACK',
    'CLIENT_BROADCAST_REQUEST',
    'CLIENT_BROADCAST_RESPONSE',
    'CLIENT_RESPAWN',
    'CLIENT_RESPAWN_ALL',
    'CLIENT_MAINTENANCE',
    'CLIENT_MAINTENANCE_ENABLE',
    'CLIENT_MAINTENANCE_DISABLE',
    'CLIENT_MAINTENANCE_ALL',
    'CLIENT_SPAWN_NEXT_CLUSTER',
    'CLIENT_READY',
    'CLIENT_EVAL_REQUEST',
    'CLIENT_EVAL_RESPONSE',
    'CLIENT_MANAGER_EVAL_REQUEST',
    'CLIENT_MANAGER_EVAL_RESPONSE',
    'MANAGER_BROADCAST_REQUEST',
    'MANAGER_BROADCAST_RESPONSE',
}

export interface evalOptions<T = object> {
    cluster?: number | number[];
    shard?: number;
    guildId?: string;
    context?: T;
    timeout?: number;
    _type?: messageType;
}

export type Awaitable<T> = T | PromiseLike<T>;

export type Serialized<T> = T extends symbol | bigint | (() => any)
    ? never
    : T extends number | string | boolean | undefined
    ? T
    : T extends { toJSON(): infer R }
    ? R
    : T extends ReadonlyArray<infer V>
    ? Serialized<V>[]
    : T extends ReadonlyMap<unknown, unknown> | ReadonlySet<unknown>
    ? {}
    : { [K in keyof T]: Serialized<T[K]> };

export interface ClusterSpawnOptions {
    delay?: number;
    timeout?: number;
}

export interface ClusterManagerSpawnOptions extends ClusterSpawnOptions {
    amount?: number | 'auto';
}

export interface ClusterManagerOptions {
    /** The token of the discord bot */
    token?: string;
    /** Number of total internal shards or "auto" */
    totalShards?: number | 'auto';
    /** Number of total Clusters\Process to spawn*/
    totalClusters?: number | 'auto';
    /** Number of shards per cluster*/
    shardsPerClusters?: number;
    /** Arguments to pass to the clustered script when spawning (only available when using the `process` mode)*/
    shardArgs?: string[];
    /** Arguments to pass to the clustered script executable when spawning*/
    execArgv?: string[];
    /** Whether clusters should automatically respawn upon exiting */
    respawn?: boolean;
    /** Which mode to use for clustering */
    mode?: 'worker' | 'process';
    /** An Array of Internal Shards Ids, which should get spawned */
    shardList?: number[];
    /** An Array of Ids to assign to the spawned Clusters, when the default id scheme is not wanted */
    clusterList?: number[];
    /** Restart options */
    restarts?: ClusterRestartOptions;
    /** Control the Spawn Queue */
    queue?: QueueOptions;
    /** Options to pass to the spawn,respawn method */
    spawnOptions?: ClusterManagerSpawnOptions;
    /** Data, which is passed to the Cluster */
    clusterData?: object;
    /** @deprecated keepAlive is not supported anymore on and above v1.6.0. Import it as plugin ("HeartbeatManager") */
    keepAlive?: boolean;
    /** Options, which is passed when forking a child or creating a thread */
    clusterOptions?: ChildProcessOptions | WorkerThreadOptions;
}

export interface ClusterRestartOptions {
    /** Maximum amount of restarts a cluster can have in the interval */
    max: number;
    /** Interval in milliseconds on which the current restarts amount of a cluster will be resetted */
    interval: number;
    /** Current Amount of restarts */
    current?: number;
}

export interface QueueOptions {
    /** Whether the spawn queue be automatically managed */
    auto: boolean;
    /** Time to wait until next item */
    timeout?: number;
}

export interface ClusterKillOptions {
    reason?: string;
    force: boolean;
}

export interface Plugin {
    build(manager: ClusterManager): void;
}

// Events
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

export interface ClusterClientEvents<DiscordClient> {
    message: [message: BaseMessage | Serializable];
    ready: [clusterClient: ClusterClient<DiscordClient>];
}


export interface DjsDiscordClient extends Client {

}
