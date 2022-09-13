/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { ClusterManager } from "./ClusterManager";
import EventEmitter from 'events';
import { ClusterEvents, ClusterKillOptions } from '../types/shared';
import { RawMessage } from '../Structures/IPCMessage.js';
import { Worker } from '../Structures/Worker.js';
import { Child } from '../Structures/Child.js';
export declare class Cluster extends EventEmitter {
    THREAD: typeof Worker | typeof Child;
    manager: ClusterManager;
    id: number;
    args: string[];
    execArgv: string[];
    shardList: number[];
    totalShards: number;
    env: NodeJS.ProcessEnv & {
        SHARD_LIST: number[];
        TOTAL_SHARDS: number;
        CLUSTER_MANAGER: boolean;
        CLUSTER: number;
        CLUSTER_COUNT: number;
        DISCORD_TOKEN: string;
    };
    thread: null | Worker | Child;
    restarts: {
        current: number;
        max: number;
        interval: number;
        reset?: NodeJS.Timer;
        resetRestarts: () => void;
        cleanup: () => void;
        append: () => void;
    };
    messageHandler: any;
    ready: boolean;
    constructor(manager: ClusterManager, id: number, shardList: number[], totalShards: number);
    spawn(spawnTimeout?: number): Promise<import("child_process").ChildProcess | import("worker_threads").Worker | null>;
    kill(options: ClusterKillOptions): void;
    respawn({ delay, timeout }?: import("../types/shared").ClusterManagerSpawnOptions): Promise<import("child_process").ChildProcess | import("worker_threads").Worker | null>;
    send(message: RawMessage): Promise<unknown> | undefined;
    request(message: RawMessage): Promise<unknown>;
    eval(script: string, context: any, timeout: number): Promise<unknown>;
    triggerMaintenance(reason?: string): Promise<unknown> | undefined;
    private _handleMessage;
    private _handleExit;
    private _handleError;
}
export interface Cluster {
    emit: (<K extends keyof ClusterEvents>(event: K, ...args: ClusterEvents[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, ...args: any[]) => boolean);
    off: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    on: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    once: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    removeAllListeners: (<K extends keyof ClusterEvents>(event?: K) => this) & (<S extends string | symbol>(event?: Exclude<S, keyof ClusterEvents>) => this);
}
//# sourceMappingURL=Cluster.d.ts.map