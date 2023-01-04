import EventEmitter from 'events';
import { Queue } from '../Structures/Queue';
import { Cluster } from './Cluster';
import { PromiseHandler } from '../Structures/PromiseHandler';
import { Awaitable, ClusterManagerEvents, ClusterManagerOptions, ClusterManagerSpawnOptions, ClusterRestartOptions, DjsDiscordClient, evalOptions, Plugin, Serialized } from '../types/shared';
import { ChildProcessOptions } from '../Structures/Child';
import { WorkerThreadOptions } from '../Structures/Worker';
import { BaseMessage } from '../Structures/IPCMessage';
import { HeartbeatManager } from '../Plugins/HeartbeatSystem';
import { ReClusterManager } from '../Plugins/ReCluster';
export declare class ClusterManager extends EventEmitter {
    /**
     * Whether clusters should automatically respawn upon exiting
     */
    respawn: boolean;
    /**
     * How many times a cluster can maximally restart in the given interval
     */
    restarts: ClusterRestartOptions;
    /**
     * Data, which is passed to the workerData or the processEnv
     */
    clusterData: object;
    /**
     * Options, which is passed when forking a child or creating a thread
     */
    clusterOptions: ChildProcessOptions | WorkerThreadOptions | {};
    /**
     * Path to the bot script file
     */
    file: string;
    /**
     * Amount of internal shards in total
     */
    totalShards: number | -1;
    /**
     * Amount of total clusters to spawn
     */
    totalClusters: number | -1;
    /**
     * Amount of Shards per Clusters
     */
    shardsPerClusters: number | undefined;
    /** Mode for Clusters to spawn with */
    mode: 'worker' | 'process';
    /**
     * An array of arguments to pass to clusters (only when {@link ClusterManager#mode} is `process`)
     */
    shardArgs: string[];
    /**
     * An array of arguments to pass to the executable (only when {@link ClusterManager#mode} is `process`)
     */
    execArgv: string[];
    /**
     * List of internal shard ids this cluster manager spawns
     */
    shardList: number[];
    /**
     * Token to use for obtaining the automatic internal shards count, and passing to bot script
     */
    token: string | null;
    /**
     * A collection of all clusters the manager spawned
     */
    clusters: Map<number, Cluster>;
    shardClusterList: number[][];
    /**
     * An Array of IDS[Number], which should be assigned to the spawned Clusters
     */
    clusterList: number[];
    spawnOptions: ClusterManagerSpawnOptions;
    queue: Queue;
    promise: PromiseHandler;
    /** HeartbeatManager Plugin */
    heartbeat?: HeartbeatManager;
    /** Reclustering Plugin */
    recluster?: ReClusterManager;
    constructor(file: string, options: ClusterManagerOptions);
    /**
     * Spawns multiple internal shards.
     */
    spawn({ amount, delay, timeout }?: ClusterManagerSpawnOptions): Promise<unknown>;
    /**
     * Sends a message to all clusters.
     */
    broadcast(message: BaseMessage): Promise<unknown[]>;
    /**
     * Creates a single cluster.
     * <warn>Using this method is usually not necessary if you use the spawn method.</warn>
     * <info>This is usually not necessary to manually specify.</info>
     * @returns Note that the created cluster needs to be explicitly spawned using its spawn method.
     */
    createCluster(id: number, shardsToSpawn: number[], totalShards: number, recluster?: boolean): Cluster;
    /**
     * Evaluates a script on all clusters, or a given cluster, in the context of the {@link Client}s.
     * @returns Results of the script execution
     */
    broadcastEval(script: string): Promise<any[]>;
    broadcastEval(script: string, options?: evalOptions): Promise<any>;
    broadcastEval<T>(fn: (client: DjsDiscordClient) => Awaitable<T>): Promise<Serialized<T>[]>;
    broadcastEval<T>(fn: (client: DjsDiscordClient) => Awaitable<T>, options?: {
        cluster?: number;
        timeout?: number;
    }): Promise<Serialized<T>>;
    broadcastEval<T, P>(fn: (client: DjsDiscordClient, context: Serialized<P>) => Awaitable<T>, options?: evalOptions<P>): Promise<Serialized<T>[]>;
    broadcastEval<T, P>(fn: (client: DjsDiscordClient, context: Serialized<P>) => Awaitable<T>, options?: evalOptions<P>): Promise<Serialized<T>>;
    /**
     * Fetches a client property value of each cluster, or a given cluster.
     * @param prop Name of the client property to get, using periods for nesting
     * @param cluster Cluster to fetch property from, all if undefined
     * @example
     * manager.fetchClientValues('guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     */
    fetchClientValues(prop: string, cluster?: number): Promise<any>;
    /**
     * Runs a method with given arguments on all clusters, or a given cluster.
     * @param method Method name to run on each cluster
     * @param args Arguments to pass through to the method call
     * @param cluster cluster to run on, all if undefined
     * @param timeout the amount of time to wait until the promise will be rejected
     * @returns Results of the method execution
     * @private
     */
    private _performOnClusters;
    /**
     * Kills all running clusters and respawns them.
     * @param options Options for respawning shards
     */
    respawnAll({ clusterDelay, respawnDelay, timeout }?: {
        clusterDelay?: number | undefined;
        respawnDelay?: number | undefined;
        timeout?: number | undefined;
    }): Promise<Map<number, Cluster>>;
    /**
     * Runs a method with given arguments on the Manager itself
     */
    evalOnManager(script: string): Promise<{
        _result: any;
        _error: {
            name: string;
            message: string;
            stack: string | undefined;
        } | null;
    }>;
    /**
     * Runs a method with given arguments on the provided Cluster Client
     * @returns Results of the script execution
     * @private
     */
    evalOnCluster(script: string, options: evalOptions): Promise<any>;
    /**
     * Adds a plugin to the cluster manager
     */
    extend(...plugins: Plugin[]): void;
    /**
     * @param reason If maintenance should be enabled on all clusters with a given reason or disabled when nonce provided
     */
    triggerMaintenance(reason: string): void;
    /**
     * Logs out the Debug Messages
     * <warn>Using this method just emits the Debug Event.</warn>
     * <info>This is usually not necessary to manually specify.</info>
     */
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