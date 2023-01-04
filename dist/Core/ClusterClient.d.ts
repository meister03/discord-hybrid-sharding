/// <reference types="node" />
import { RawMessage } from '../Structures/IPCMessage';
import { Awaitable, ClusterClientEvents, evalOptions, Serialized } from '../types/shared';
import { ClusterManager as Manager } from '../Core/ClusterManager';
import { WorkerClient } from '../Structures/Worker';
import { ChildClient } from '../Structures/Child';
import { PromiseHandler } from '../Structures/PromiseHandler';
import EventEmitter from 'events';
import { Serializable } from 'child_process';
export declare class ClusterClient<DiscordClient> extends EventEmitter {
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
    get info(): import("../Structures/Data").ClusterClientData;
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
    evalOnManager<T>(fn: (manager: Manager) => T, options?: evalOptions): Promise<T>;
    evalOnManager<T>(fn: (manager: Manager) => T, options?: evalOptions): Promise<any[]>;
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
    respawnAll({ clusterDelay, respawnDelay, timeout }?: {
        clusterDelay?: number | undefined;
        respawnDelay?: number | undefined;
        timeout?: number | undefined;
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
    static getInfo(): import("../Structures/Data").ClusterClientData;
}
export interface ClusterClient<DiscordClient> {
    emit: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, ...args: ClusterClientEvents<DiscordClient>[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, ...args: any[]) => boolean);
    off: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, listener: (...args: any[]) => void) => this);
    on: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, listener: (...args: any[]) => void) => this);
    once: (<K extends keyof ClusterClientEvents<DiscordClient>>(event: K, listener: (...args: ClusterClientEvents<DiscordClient>[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents<DiscordClient>>, listener: (...args: any[]) => void) => this);
    removeAllListeners: (<K extends keyof ClusterClientEvents<DiscordClient>>(event?: K) => this) & (<S extends string | symbol>(event?: Exclude<S, keyof ClusterClientEvents<DiscordClient>>) => this);
}
//# sourceMappingURL=ClusterClient.d.ts.map