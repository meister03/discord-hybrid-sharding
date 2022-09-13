/// <reference types="node" />
import EventEmitter from 'events';
import { Queue } from '../Structures/Queue';
import { Cluster } from './Cluster';
import { PromiseHandler } from '../Structures/PromiseHandler';
import { ClusterManagerEvents, ClusterManagerOptions, ClusterManagerSpawnOptions, ClusterRestartOptions, evalOptions, Plugin } from '../types/shared';
import { ChildProcessOptions } from '../Structures/Child';
import { WorkerThreadOptions } from '../Structures/Worker';
import { BaseMessage } from '../Structures/IPCMessage';
import { HeartbeatManager } from '../Plugins/HeartbeatSystem';
import { ReClusterManager } from '../Plugins/ReCluster';
export declare class ClusterManager extends EventEmitter {
    respawn: boolean;
    restarts: ClusterRestartOptions;
    clusterData: object;
    clusterOptions: ChildProcessOptions | WorkerThreadOptions | {};
    file: string;
    totalShards: number | -1;
    totalClusters: number | -1;
    shardsPerClusters: number | undefined;
    mode: 'worker' | 'process';
    shardArgs: string[];
    execArgv: string[];
    shardList: number[];
    token: string | null;
    clusters: Map<number, Cluster>;
    shardClusterList: number[][];
    clusterList: number[];
    spawnOptions: ClusterManagerSpawnOptions;
    queue: Queue;
    promise: PromiseHandler;
    heartbeat?: HeartbeatManager;
    recluster?: ReClusterManager;
    constructor(file: string, options: ClusterManagerOptions);
    spawn({ amount, delay, timeout }?: ClusterManagerSpawnOptions): Promise<unknown>;
    broadcast(message: BaseMessage): Promise<unknown[]>;
    createCluster(id: number, shardsToSpawn: number[], totalShards: number, recluster?: boolean): Cluster;
    broadcastEval(script: string, evalOptions?: evalOptions): Promise<unknown[]> | undefined;
    fetchClientValues(prop: string, cluster?: number): Promise<unknown[]> | undefined;
    private _performOnClusters;
    respawnAll({ clusterDelay, respawnDelay, timeout }?: {
        clusterDelay?: number | undefined;
        respawnDelay?: number | undefined;
        timeout?: number | undefined;
    }): Promise<Map<number, Cluster>>;
    evalOnManager(script: string): Promise<{
        _result: any;
        _error: {
            name: string;
            message: string;
            stack: string | undefined;
        } | null;
    }>;
    evalOnCluster(script: string, options: evalOptions): Promise<any> | undefined;
    extend(...plugins: Plugin[]): void;
    triggerMaintenance(reason: string): void;
    _debug(message: string, cluster?: number): string;
}
export interface ClusterManager {
    emit: (<K extends keyof ClusterManagerEvents>(event: K, ...args: ClusterManagerEvents[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, ...args: any[]) => boolean);
    off: (<K extends keyof ClusterManagerEvents>(event: K, listener: (...args: ClusterManagerEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, listener: (...args: any[]) => void) => this);
    on: (<K extends keyof ClusterManagerEvents>(event: K, listener: (...args: ClusterManagerEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, listener: (...args: any[]) => void) => this);
    once: (<K extends keyof ClusterManagerEvents>(event: K, listener: (...args: ClusterManagerEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, listener: (...args: any[]) => void) => this);
    removeAllListeners: (<K extends keyof ClusterManagerEvents>(event?: K) => this) & (<S extends string | symbol>(event?: Exclude<S, keyof ClusterManagerEvents>) => this);
}
//# sourceMappingURL=ClusterManager.d.ts.map