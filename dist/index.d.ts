import * as child_process from 'child_process';
import { ForkOptions, ChildProcess, Serializable } from 'child_process';
import * as worker_threads from 'worker_threads';
import { WorkerOptions, Worker as Worker$1, parentPort } from 'worker_threads';
import EventEmitter from 'events';
import { Client } from 'discord.js';

declare function getInfo(): ClusterClientData;
interface ClusterClientData {
    SHARD_LIST: number[];
    TOTAL_SHARDS: number;
    LAST_SHARD_ID: number;
    FIRST_SHARD_ID: number;
    CLUSTER_COUNT: number;
    MAINTENANCE?: string;
    CLUSTER_QUEUE_MODE?: 'auto' | string | undefined;
    CLUSTER: number;
    CLUSTER_MANAGER_MODE: ClusterManagerMode;
}
type ClusterManagerMode = 'process' | 'worker';

interface RawMessage {
    nonce?: string;
    _type?: number;
    [x: string]: any;
}
declare class BaseMessage {
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
declare class IPCMessage extends BaseMessage {
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

interface QueueItem {
    run(...args: any): Promise<any>;
    args: any[];
    time?: number;
    timeout: number;
}
declare class Queue {
    queue: QueueItem[];
    options: Required<QueueOptions>;
    paused: boolean;
    constructor(options: Required<QueueOptions>);
    /**
     * Starts the queue and run's the item functions
     */
    start(): Promise<unknown>;
    /**
     * Goes to the next item in the queue
     */
    next(): Promise<any>;
    /**
     * Stop's the queue and blocks the next item from running
     */
    stop(): this;
    /**
     * Resume's the queue
     */
    resume(): this;
    /**
     * Adds an item to the queue
     */
    add(item: QueueItem): this;
}

interface StoredPromise {
    resolve(value: any): void;
    reject(error: Error): void;
    options: PromiseCreateOptions;
    timeout?: NodeJS.Timeout;
}
interface ResolveMessage {
    _error: {
        message: string;
        stack: string;
        name: string;
    };
    _result: any;
    _eval?: string;
    _type?: number;
    nonce: string;
}
interface PromiseCreateOptions {
    timeout?: number;
}
declare class PromiseHandler {
    nonce: Map<string, StoredPromise>;
    constructor();
    resolve(message: ResolveMessage): void;
    create(message: RawMessage & {
        options?: PromiseCreateOptions;
        stack?: string;
    }, options: PromiseCreateOptions): Promise<unknown>;
}

interface ChildProcessOptions extends ForkOptions {
    clusterData: NodeJS.ProcessEnv | undefined;
    args?: string[] | undefined;
}
declare class Child {
    file: string;
    process: ChildProcess | null;
    processOptions: ForkOptions;
    args?: string[];
    constructor(file: string, options: ChildProcessOptions);
    spawn(): ChildProcess;
    respawn(): ChildProcess;
    kill(): boolean | undefined;
    send(message: Serializable): Promise<unknown>;
}
declare class ChildClient {
    ipc: NodeJS.Process;
    constructor();
    send(message: Serializable): Promise<void>;
    getData(): NodeJS.ProcessEnv;
}

interface WorkerThreadOptions extends WorkerOptions {
    clusterData: any;
}
declare class Worker {
    file: string;
    process: Worker$1 | null;
    workerOptions: WorkerOptions;
    constructor(file: string, options: WorkerThreadOptions);
    spawn(): Worker$1;
    respawn(): Worker$1;
    kill(): Promise<number> | undefined;
    send(message: Serializable): Promise<unknown>;
}
declare class WorkerClient {
    ipc: typeof parentPort;
    constructor();
    send(message: Serializable): Promise<void>;
    getData(): any;
}

type keepAliveOptions = {
    /** Default interval is 20000 */
    interval?: number;
    /** Default maxMissedHeartbeats is 5 */
    maxMissedHeartbeats?: number;
};
declare class HeartbeatManager {
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
declare class Heartbeat {
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

type ReClusterRestartMode = 'gracefulSwitch' | 'rolling';
interface ReClusterOptions {
    /** The delay to wait between each cluster spawn */
    delay?: number;
    /** The readyTimeout to wait until the cluster spawn promise is rejected*/
    timeout?: number;
    /** The new totalShards of the bot*/
    totalShards?: number | 'auto';
    /** The amount of totalClusters to spread the shards over all clusters */
    totalClusters?: number;
    /** The amount of shards per cluster */
    shardsPerClusters?: number;
    /** The shardList chunked over the clusters */
    shardList?: number[];
    /** The new shardList of the Cluster Manager */
    shardClusterList?: number[][];
    /** The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed*/
    restartMode?: ReClusterRestartMode;
}
declare class ReClusterManager {
    options: ReClusterOptions;
    name: 'recluster';
    onProgress: Boolean;
    manager?: ClusterManager;
    constructor(options?: ReClusterOptions);
    build(manager: ClusterManager): this;
    /**
     * Execute a Zero Downtime Restart on all Clusters with an updated totalShards (count) or a scheduled restart.
     * @param options
     * @param options.delay
     * @param options.timeout
     * @param options.totalShards
     * @param options.totalClusters
     * @param options.shardsPerClusters
     * @param options.shardClusterList
     * @param options.shardList
     * @param options.restartMode
     */
    start(options?: ReClusterOptions): Promise<{
        success: boolean;
    }>;
    /**
     * @param options
     * @param options.delay The delay to wait between each cluster spawn
     * @param options.timeout The readyTimeout to wait until the cluster spawn promise is rejected
     * @param options.restartMode The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed
     */
    _start({ restartMode, timeout, delay }: {
        restartMode?: string | undefined;
        timeout?: number | undefined;
        delay?: number | undefined;
    }): Promise<{
        success: boolean;
    }>;
}

declare class ClusterManager extends EventEmitter {
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
interface ClusterManager {
    emit: (<K extends keyof ClusterManagerEvents>(event: K, ...args: ClusterManagerEvents[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, ...args: any[]) => boolean);
    off: (<K extends keyof ClusterManagerEvents>(event: K, listener: (...args: ClusterManagerEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, listener: (...args: any[]) => void) => this);
    on: (<K extends keyof ClusterManagerEvents>(event: K, listener: (...args: ClusterManagerEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, listener: (...args: any[]) => void) => this);
    once: (<K extends keyof ClusterManagerEvents>(event: K, listener: (...args: ClusterManagerEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, listener: (...args: any[]) => void) => this);
    removeAllListeners: (<K extends keyof ClusterManagerEvents>(event?: K) => this) & (<S extends string | symbol>(event?: Exclude<S, keyof ClusterManagerEvents>) => this);
}

declare class ClusterClient<DiscordClient> extends EventEmitter {
    client: DiscordClient;
    mode: 'process' | 'worker';
    queue: {
        mode: 'auto' | string | undefined;
    };
    maintenance: string | undefined | Boolean;
    ready: boolean;
    process: ChildClient | WorkerClient | null;
    messageHandler: any;
    promise: PromiseHandler;
    constructor(client: DiscordClient);
    /**
     * cluster's id
     */
    get id(): number;
    /**
     * Array of shard IDs of this client
     */
    get ids(): any;
    /**
     * Total number of clusters
     */
    get count(): number;
    /**
     * Gets some Info like Cluster_Count, Number, Total shards...
     */
    get info(): ClusterClientData;
    /**
     * Sends a message to the master process.
     * @fires Cluster#message
     */
    send(message: Serializable): Promise<void> | undefined;
    /**
     * Fetches a client property value of each cluster, or a given cluster.
     * @example
     * client.cluster.fetchClientValues('guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     * @see {@link ClusterManager#fetchClientValues}
     */
    fetchClientValues(prop: string, cluster?: number): Promise<any>;
    /**
     * Evaluates a script or function on the Cluster Manager
     * @example
     * client.cluster.evalOnManager('process.uptime')
     *   .then(result => console.log(result))
     *   .catch(console.error);
     * @see {@link ClusterManager#evalOnManager}
     */
    evalOnManager(script: string): Promise<any[]>;
    evalOnManager(script: string, options?: evalOptions): Promise<any>;
    evalOnManager<T>(fn: (manager: ClusterManager) => T, options?: evalOptions): Promise<T>;
    evalOnManager<T>(fn: (manager: ClusterManager) => T, options?: evalOptions): Promise<any[]>;
    /**
     * Evaluates a script or function on all clusters, or a given cluster, in the context of the {@link Client}s.
     * @example
     * client.cluster.broadcastEval('this.guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     * @see {@link ClusterManager#broadcastEval}
     */
    broadcastEval(script: string): Promise<any[]>;
    broadcastEval(script: string, options?: evalOptions): Promise<any>;
    broadcastEval<T>(fn: (client: DiscordClient) => Awaitable<T>): Promise<Serialized<T>[]>;
    broadcastEval<T>(fn: (client: DiscordClient) => Awaitable<T>, options?: {
        cluster?: number;
        timeout?: number;
    }): Promise<Serialized<T>>;
    broadcastEval<T, P>(fn: (client: DiscordClient, context: Serialized<P>) => Awaitable<T>, options?: evalOptions<P>): Promise<Serialized<T>[]>;
    broadcastEval<T, P>(fn: (client: DiscordClient, context: Serialized<P>) => Awaitable<T>, options?: evalOptions<P>): Promise<Serialized<T>>;
    /**
     * Sends a Request to the ParentCluster and returns the reply
     * @example
     * client.cluster.request({content: 'hello'})
     *   .then(result => console.log(result)) //hi
     *   .catch(console.error);
     * @see {@link IPCMessage#reply}
     */
    request(message: RawMessage): Promise<unknown>;
    /**
     * Requests a respawn of all clusters.
     * @see {@link ClusterManager#respawnAll}
     */
    respawnAll(options?: {
        clusterDelay?: number;
        respawnDelay?: number;
        timeout?: number;
    }): Promise<void> | undefined;
    /**
     * Handles an IPC message.
     * @private
     */
    private _handleMessage;
    _eval(script: string): Promise<any>;
    /**
     * Sends a message to the master process, emitting an error from the client upon failure.
     */
    _respond(type: string, message: Serializable): void;
    triggerReady(): boolean;
    triggerClusterReady(): boolean;
    /**
     *
     * @param maintenance Whether the cluster should opt in maintenance when a reason was provided or opt-out when no reason was provided.
     * @param all Whether to target it on all clusters or just the current one.
     * @returns The maintenance status of the cluster.
     */
    triggerMaintenance(maintenance: string, all?: boolean): string;
    /**
     * Manually spawn the next cluster, when queue mode is on 'manual'
     */
    spawnNextCluster(): Promise<void> | undefined;
    /**
     * gets the total Internal shard count and shard list.
     */
    static getInfo(): ClusterClientData;
}
interface ClusterClient<DiscordClient> {
    emit: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, ...args: ClusterClientEvents<DiscordClient>[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, ...args: any[]) => boolean);
    off: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, listener: (...args: any[]) => void) => this);
    on: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, listener: (...args: any[]) => void) => this);
    once: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, listener: (...args: any[]) => void) => this);
    removeAllListeners: (<K extends keyof ClusterClientEvents<DiscordClient>>(event?: K) => this) & (<S extends string | symbol>(event?: Exclude<S, keyof ClusterClientEvents<DiscordClient>>) => this);
}

declare const Events: {
    ERROR: string;
    WARN: string;
};
declare const DefaultOptions: {
    http: {
        api: string;
        version: string;
    };
};
declare const Endpoints: {
    botGateway: string;
};
declare enum messageType {
    'MISSING_TYPE' = 0,
    'CUSTOM_REQUEST' = 1,
    'CUSTOM_MESSAGE' = 2,
    'CUSTOM_REPLY' = 3,
    'HEARTBEAT' = 4,
    'HEARTBEAT_ACK' = 5,
    'CLIENT_BROADCAST_REQUEST' = 6,
    'CLIENT_BROADCAST_RESPONSE' = 7,
    'CLIENT_RESPAWN' = 8,
    'CLIENT_RESPAWN_ALL' = 9,
    'CLIENT_MAINTENANCE' = 10,
    'CLIENT_MAINTENANCE_ENABLE' = 11,
    'CLIENT_MAINTENANCE_DISABLE' = 12,
    'CLIENT_MAINTENANCE_ALL' = 13,
    'CLIENT_SPAWN_NEXT_CLUSTER' = 14,
    'CLIENT_READY' = 15,
    'CLIENT_EVAL_REQUEST' = 16,
    'CLIENT_EVAL_RESPONSE' = 17,
    'CLIENT_MANAGER_EVAL_REQUEST' = 18,
    'CLIENT_MANAGER_EVAL_RESPONSE' = 19,
    'MANAGER_BROADCAST_REQUEST' = 20,
    'MANAGER_BROADCAST_RESPONSE' = 21
}
interface evalOptions<T = object> {
    cluster?: number | number[];
    shard?: number;
    guildId?: string;
    context?: T;
    timeout?: number;
    _type?: messageType;
}
type Awaitable<T> = T | PromiseLike<T>;
type Serialized<T> = T extends symbol | bigint | (() => any) ? never : T extends number | string | boolean | undefined ? T : T extends {
    toJSON(): infer R;
} ? R : T extends ReadonlyArray<infer V> ? Serialized<V>[] : T extends ReadonlyMap<unknown, unknown> | ReadonlySet<unknown> ? {} : {
    [K in keyof T]: Serialized<T[K]>;
};
interface ClusterSpawnOptions {
    delay?: number;
    timeout?: number;
}
interface ClusterManagerSpawnOptions extends ClusterSpawnOptions {
    amount?: number | 'auto';
}
interface ClusterManagerOptions {
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
interface ClusterRestartOptions {
    /** Maximum amount of restarts a cluster can have in the interval */
    max: number;
    /** Interval in milliseconds on which the current restarts amount of a cluster will be resetted */
    interval: number;
    /** Current Amount of restarts */
    current?: number;
}
interface QueueOptions {
    /** Whether the spawn queue be automatically managed */
    auto: boolean;
    /** Time to wait until next item */
    timeout?: number;
}
interface ClusterKillOptions {
    reason?: string;
    force: boolean;
}
interface Plugin {
    build(manager: ClusterManager): void;
}
interface ClusterManagerEvents {
    clusterCreate: [cluster: Cluster];
    clusterReady: [cluster: Cluster];
    debug: [debugMessage: string];
}
interface ClusterEvents {
    message: [message: BaseMessage | Serializable];
    clientRequest: [message: BaseMessage | Serializable];
    death: [cluster: Cluster, thread: ChildProcess | Worker$1 | undefined | null];
    error: [error: Error];
    spawn: [thread: ChildProcess | Worker$1 | undefined | null];
}
interface ClusterClientEvents<DiscordClient> {
    message: [message: BaseMessage | Serializable];
    ready: [clusterClient: ClusterClient<DiscordClient>];
}
interface DjsDiscordClient extends Client {
}

/**
 * A self-contained cluster created by the {@link ClusterManager}. Each one has a {@link Child} that contains
 * an instance of the bot and its {@link Client}. When its child process/worker exits for any reason, the cluster will
 * spawn a new one to replace it as necessary.
 * @augments EventEmitter
 */
declare class Cluster extends EventEmitter {
    THREAD: typeof Worker | typeof Child;
    /**
     * Manager that created the cluster
     */
    manager: ClusterManager;
    /**
     * ID of the cluster in the manager
     */
    id: number;
    /**
     * Arguments for the shard's process (only when {@link ShardingManager#mode} is `process`)
     */
    args: string[];
    /**
     * Arguments for the shard's process executable (only when {@link ShardingManager#mode} is `process`)
     */
    execArgv: string[];
    /**
     * Internal Shards which will get spawned in the cluster
     */
    shardList: number[];
    /**
     * the amount of real shards
     */
    totalShards: number;
    /**
     * Environment variables for the cluster's process, or workerData for the cluster's worker
     */
    env: NodeJS.ProcessEnv & {
        SHARD_LIST: number[];
        TOTAL_SHARDS: number;
        CLUSTER_MANAGER: boolean;
        CLUSTER: number;
        CLUSTER_COUNT: number;
        DISCORD_TOKEN: string;
    };
    /**
     * Process of the cluster (if {@link ClusterManager#mode} is `process`)
     */
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
    /**
     * Whether the cluster's {@link Client} is ready
     */
    ready: boolean;
    /**
     * @param manager Manager that is creating this cluster
     * @param id ID of this cluster
     * @param shardList
     * @param totalShards
     */
    constructor(manager: ClusterManager, id: number, shardList: number[], totalShards: number);
    /**
     * Forks a child process or creates a worker thread for the cluster.
     * <warn>You should not need to call this manually.</warn>
     * @param spawnTimeout The amount in milliseconds to wait until the {@link Client} has become ready
     * before resolving. (-1 or Infinity for no wait)
     */
    spawn(spawnTimeout?: number): Promise<worker_threads.Worker | child_process.ChildProcess | null>;
    /**
     * Immediately kills the clusters process/worker and does not restart it.
     * @param options Some Options for managing the Kill
     * @param options.force Whether the Cluster should be force kill and be ever respawned...
     */
    kill(options: ClusterKillOptions): void;
    /**
     * Kills and restarts the cluster's process/worker.
     * @param options Options for respawning the cluster
     */
    respawn({ delay, timeout }?: ClusterManagerSpawnOptions): Promise<worker_threads.Worker | child_process.ChildProcess | null>;
    /**
     * Sends a message to the cluster's process/worker.
     * @param  message Message to send to the cluster
     */
    send(message: RawMessage): Promise<unknown> | undefined;
    /**
     * Sends a Request to the ClusterClient and returns the reply
     * @param message Message, which should be sent as request
     * @returns Reply of the Message
     * @example
     * client.cluster.request({content: 'hello'})
     *   .then(result => console.log(result)) //hi
     *   .catch(console.error);
     * @see {@link IPCMessage#reply}
     */
    request(message: RawMessage): Promise<unknown>;
    /**
     * Evaluates a script or function on the cluster, in the context of the {@link Client}.
     * @param script JavaScript to run on the cluster
     * @param context
     * @param timeout
     * @returns Result of the script execution
     */
    eval(script: string, context: any, timeout: number): Promise<unknown>;
    /**
     * @param reason If maintenance should be enabled with a given reason or disabled when nonce provided
     */
    triggerMaintenance(reason?: string): Promise<unknown> | undefined;
    /**
     * Handles a message received from the child process/worker.
     * @param message Message received
     * @private
     */
    private _handleMessage;
    /**
     * Handles the cluster's process/worker exiting.
     * @private
     * @param {Number} exitCode
     */
    private _handleExit;
    /**
     * Handles the cluster's process/worker error.
     * @param  error the error, which occurred on the worker/child process
     * @private
     */
    private _handleError;
}
interface Cluster {
    emit: (<K extends keyof ClusterEvents>(event: K, ...args: ClusterEvents[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, ...args: any[]) => boolean);
    off: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    on: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    once: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    removeAllListeners: (<K extends keyof ClusterEvents>(event?: K) => this) & (<S extends string | symbol>(event?: Exclude<S, keyof ClusterEvents>) => this);
}

declare class ClusterHandler {
    manager: ClusterManager;
    cluster: Cluster;
    ipc: Worker | Child;
    constructor(manager: ClusterManager, cluster: Cluster, ipc: Worker | Child);
    handleMessage(message: RawMessage): true | undefined;
}
declare class ClusterClientHandler<DiscordClient> {
    client: ClusterClient<DiscordClient>;
    ipc: ChildClient | WorkerClient | null;
    constructor(client: ClusterClient<DiscordClient>, ipc: ChildClient | WorkerClient | null);
    handleMessage(message: ResolveMessage & {
        date?: number;
        maintenance?: string;
    }): Promise<true | null>;
}

declare function generateNonce(): string;
declare function chunkArray(array: any[], chunkSize: number): any[][];
declare function delayFor(ms: number): Promise<unknown>;
declare function makePlainError(err: Error): {
    name: string;
    message: string;
    stack: string | undefined;
};
declare function shardIdForGuildId(guildId: string, totalShards?: number): number;
declare function fetchRecommendedShards(token: string, guildsPerShard?: number): Promise<number>;

export { Awaitable, BaseMessage, Child, ChildClient, ChildProcessOptions, Cluster, ClusterClient, ClusterClientData, ClusterClientEvents, ClusterClientHandler, ClusterEvents, ClusterHandler, ClusterKillOptions, ClusterManager, ClusterManagerEvents, ClusterManagerMode, ClusterManagerOptions, ClusterManagerSpawnOptions, ClusterRestartOptions, ClusterSpawnOptions, DefaultOptions, DjsDiscordClient, Endpoints, Events, Heartbeat, HeartbeatManager, IPCMessage, Plugin, PromiseCreateOptions, PromiseHandler, Queue, QueueItem, QueueOptions, RawMessage, ReClusterManager, ReClusterOptions, ReClusterRestartMode, ResolveMessage, Serialized, StoredPromise, Worker, WorkerClient, WorkerThreadOptions, chunkArray, delayFor, evalOptions, fetchRecommendedShards, generateNonce, getInfo, keepAliveOptions, makePlainError, messageType, shardIdForGuildId };
