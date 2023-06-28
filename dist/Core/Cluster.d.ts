/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { ClusterManager } from './ClusterManager';
import EventEmitter from 'events';
import { ClusterEvents, ClusterKillOptions } from '../types/shared';
import { RawMessage } from '../Structures/IPCMessage.js';
import { Worker } from '../Structures/Worker.js';
import { Child } from '../Structures/Child.js';
/**
 * A self-contained cluster created by the {@link ClusterManager}. Each one has a {@link Child} that contains
 * an instance of the bot and its {@link Client}. When its child process/worker exits for any reason, the cluster will
 * spawn a new one to replace it as necessary.
 * @augments EventEmitter
 */
export declare class Cluster extends EventEmitter {
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
    spawn(spawnTimeout?: number): Promise<import("worker_threads").Worker | import("child_process").ChildProcess | null>;
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
    respawn({ delay, timeout }?: import("../types/shared").ClusterManagerSpawnOptions): Promise<import("worker_threads").Worker | import("child_process").ChildProcess | null>;
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
export interface Cluster {
    emit: (<K extends keyof ClusterEvents>(event: K, ...args: ClusterEvents[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, ...args: any[]) => boolean);
    off: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    on: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    once: (<K extends keyof ClusterEvents>(event: K, listener: (...args: ClusterEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterEvents>, listener: (...args: any[]) => void) => this);
    removeAllListeners: (<K extends keyof ClusterEvents>(event?: K) => this) & (<S extends string | symbol>(event?: Exclude<S, keyof ClusterEvents>) => this);
}
//# sourceMappingURL=Cluster.d.ts.map