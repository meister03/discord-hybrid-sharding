declare module 'discord-hybrid-sharding' {
    import { EventEmitter } from 'events';
    import { ChildProcess } from 'child_process';
    import { Client as DJsClient, Collection } from 'discord.js';

    export class Cluster extends EventEmitter {
        constructor(manager: Manager, id: number);
        private _evals: Map<string, Promise<any>>;
        private _exitListener: (...args: any[]) => void;
        private _fetches: Map<string, Promise<any>>;
        private _handleExit(respawn?: boolean): void;
        private _handleMessage(message: any): void;

        public args: string[];
        public execArgv: string[];
        public env: object;
        public id: number;
        public manager: Manager;
        public process: ChildProcess | null;
        public ready: boolean;
        public worker: any | null;
        public heartbeat: object;

        private _restarts: object;

        public eval(script: string): Promise<unknown>;
        public eval<T>(fn: (client: Client) => T): Promise<T>;
        public eval<T, P>(fn: (client: Client, context: Serialized<P>) => T, context: P): Promise<T>;
        public fetchClientValue(prop: string, cluster: number): Promise<any>;
        public kill(): void;
        public respawn(options?: { delay?: number; timeout?: number }): Promise<ChildProcess>;
        public send(message: any): Promise<Cluster>;
        public request(message: object): Promise<BaseMessage>;
        public spawn(timeout?: number): Promise<ChildProcess>;

        public triggerMaintenance(reason: string): any;

        public on(event: 'spawn' | 'death', listener: (child: ChildProcess) => void): this;
        public on(event: 'disconnect' | 'ready' | 'reconnecting', listener: () => void): this;
        public on(event: 'error', listener: (error: Error) => void): this;
        public on(event: 'message', listener: (message: any) => void): this;
        public on(event: string, listener: (...args: any[]) => void): this;

        public once(event: 'spawn' | 'death', listener: (child: ChildProcess) => void): this;
        public once(event: 'disconnect' | 'ready' | 'reconnecting', listener: () => void): this;
        public once(event: 'error', listener: (error: Error) => void): this;
        public once(event: 'message', listener: (message: any) => void): this;
        public once(event: string, listener: (...args: any[]) => void): this;
    }

    export class Client extends EventEmitter {
        constructor(client: client|any);
        private _handleMessage(message: any): void;
        private _respond(type: string, message: any): void;

        public client: client;
        public readonly count: number;
        public readonly id: number;
        public readonly ids: Collection<number,any>;
        public mode: ClusterManagerMode;
        public maintenance: string;
        public static getInfo: processData;
        get getInfo(): processData;
        public parentPort: any | null;
        public evalOnManager(script: string): Promise<any[]>;
        public evalOnManager(script: string, options?: evalOptions): Promise<any>;
        public evalOnManager<T>(fn: (manager: Manager) => T, options?: evalOptions): Promise<T>;
        public evalOnManager<T>(fn: (manager: Manager) => T, options?: evalOptions): Promise<any[]>;

        public evalOnCluster(
            script: string,
            options?: evalOptions,
        ): Promise<any[]>;
        public evalOnCluster<T>(
            fn: (client: DJsClient) => T,
            options?: evalOptions,
        ): Promise<T>;
        public evalOnCluster<T>(
            fn: (client: DJsClient) => T,
            options?: evalOptions,
        ): Promise<any[]>;
        public broadcastEval(script: string): Promise<any[]>;
        public broadcastEval(script: string, options?: evalOptions): Promise<any>;
        public broadcastEval<T>(fn: (client: DJsClient) => Awaitable<T>): Promise<Serialized<T>[]>;
        public broadcastEval<T>(
            fn: (client: DJsClient) => Awaitable<T>,
            options?: evalOptions,
        ): Promise<Serialized<T>>;
        public broadcastEval<T, P>(
            fn: (client: DJsClient, context: Serialized<P>) => Awaitable<T>,
            options?: evalOptions,
        ): Promise<Serialized<T>[]>;
        public broadcastEval<T, P>(
            fn: (client: DJsClient, context: Serialized<P>) => Awaitable<T>,
            options?: evalOptions,
        ): Promise<Serialized<T>>;
        public fetchClientValues(prop: string): Promise<any[]>;
        public fetchClientValues(prop: string, cluster: number): Promise<any>;
        public send(message: any): Promise<void>;
        public request(message: Object): Promise<BaseMessage>;
        public respawnAll(options?: ClusterRespawnOptions): Promise<void>;

        public triggerReady(): Promise<void>;
        public triggerMaintenance(reason: string, all?: Boolean): any;
        public spawnNextCluster(): Promise<void>;
    }

    export interface ManagerOptions {
        totalShards?: number | 'auto';
        totalClusters?: number | 'auto';
        shardsPerClusters?: number;
        shardList?: number[][] | 'auto';
        mode?: ClusterManagerMode;
        respawn?: boolean;
        shardArgs?: string[];
        token?: string;
        execArgv?: string[];
        keepAlive?: keepAliveOptions;
        queue?: {
            auto?: boolean;
        };
        restarts?: {
            max?: number;
            interval?: number;
            current?: number;
        };
        clusterData?: Object;
        clusterOptions?: Object;
    }

    export class Manager extends EventEmitter {
        constructor(
            file: string,
            options?: ManagerOptions,
        );
        private _performOnShards(method: string, args: any[]): Promise<any[]>;
        private _performOnShards(method: string, args: any[], cluster: number): Promise<any>;
        private _nonce: Map<string, Promise<any>>;

        public file: string;
        public respawn: boolean;
        public clusterData: Object;
        public clusterOptions: Object;
        public shardArgs: string[];
        public clusters: Map<number, Cluster>;
        public token: string | null;
        public totalClusters: number | 'auto';
        public shardsPerClusters: number | 'auto';
        public totalShards: number | 'auto';
        public shardList: number[][] | 'auto';
        public clusterList: number[];
        public keepAlive: keepAliveOptions;
        public queue: Queue;
        public broadcast(message: any): Promise<Cluster[]>;
        public broadcastEval(script: string): Promise<any[]>;
        public broadcastEval(script: string, options: { cluster?: number; timeout?: number }): Promise<any>;
        public broadcastEval<T>(fn: (client: DJsClient) => Awaitable<T>): Promise<Serialized<T>[]>;
        public broadcastEval<T>(
            fn: (client: DJsClient) => Awaitable<T>,
            options: { cluster?: number; timeout?: number },
        ): Promise<Serialized<T>>;
        public broadcastEval<T, P>(
            fn: (client: DJsClient, context: Serialized<P>) => Awaitable<T>,
            options: { context: P },
        ): Promise<Serialized<T>[]>;
        public broadcastEval<T, P>(
            fn: (client: DJsClient, context: Serialized<P>) => Awaitable<T>,
            options: { context: P; cluster?: number; timeout?: number },
        ): Promise<Serialized<T>>;
        public createCluster(id: number, clustersToSpawn: number[], totalShards: number): Cluster;
        public fetchClientValues(prop: string): Promise<any[]>;
        public fetchClientValues(prop: string, cluster: number): Promise<any>;
        public evalOnManager(script: string): Promise<any[]>;
        private evalOnCluster(script: string, options: Object): Promise<any[]>;
        public respawnAll(options?: ClusterRespawnOptions): Promise<Map<number, Cluster>>;
        public spawn(options?: ClusterSpawnOptions): Promise<Map<number, Cluster>>;
        public triggerMaintenance(reason: string): any;
        public extend(...plugins: object[]): void;

        public on(event: 'clusterCreate', listener: (cluster: Cluster) => void): this;
        public on(event: 'debug', listener: (message: string) => void): this;

        public once(event: 'clusterCreate', listener: (cluster: Cluster) => void): this;
        public once(event: 'debug', listener: (message: string) => void): this;
    }

    export class BaseMessage {
        public _sCustom: true;
        public nonce: String;
        private destructMessage(message: Object): Promise<Object>;
        public toJSON(): Promise<Object>;
    }

    export class IPCMessage {
        public instance: Cluster | Client;
        public raw: BaseMessage;
        public send(message: Object): Promise<Cluster | Client>;
        public request(message: Object): Promise<Object>;
        public reply(message: Object): Promise<Object>;
    }

    export class data {
        SHARD_LIST: number[];
        TOTAL_SHARDS: number;
        LAST_SHARD_ID: number;
        FIRST_SHARD_ID: number;
        CLUSTER_COUNT: number;
        CLUSTER: number;
        CLUSTER_MANAGER_MODE: ClusterManagerMode; 
    }

    export type processData = {
        SHARD_LIST: number[];
        TOTAL_SHARDS: number;
        LAST_SHARD_ID: number;
        FIRST_SHARD_ID: number;
        CLUSTER_COUNT: number;
        CLUSTER: number;
        CLUSTER_MANAGER_MODE: ClusterManagerMode;
    }

    type ClusterManagerMode = 'process' | 'worker';
    type client = DJsClient;

    

    export type keepAliveOptions = {
        /** Default interval is 20000 */
        interval?: number;
        /** Default maxMissedHeartbeats is 5 */
        maxMissedHeartbeats?: number;
    };

    export interface ClusterSpawnOptions {
        amount?: number | 'auto';
        delay?: number;
        timeout?: number;
    }

    export interface ClusterRespawnOptions {
        clusterDelay?: number;
        respawnDelay?: number;
        timeout?: number;
    }

    export interface ReClusterOptions {
        delay?: number;
        timeout?: number;
        totalShards?: number | 'auto';
        totalClusters?: number;
        shardsPerClusters?: number;
        shardList?: number[];
        shardClusterList?: number[][];
        restartMode?: 'gracefulSwitch' | 'rolling';
    }

    export interface evalOptions {
        cluster?: number | number[],
        shard?: number,
        guildId?: string,
        context?: Array<any> | object,
        timeout?: number;
    }

    export class Queue {
        options: {
            auto?: boolean;
            timeout?: number;
        };
        queue: object[];
        public start(): Promise<void>;
        public stop(): Queue;
        public resume(): Queue;
        public add(item: any): Queue;
        public next(): Promise<void>;
    }

    export class HeartBeatManager {
        constructor(options?: keepAliveOptions);
        public start(): Promise<void>;
        public build(): Promise<typeof this.start>;
    }

    export class ReClusterManager {
        constructor(options?: object);
        private _start(): Promise<{success: boolean}>;
        public start(options: ReClusterOptions): typeof this._start;
        public build(manager: Manager): Manager;
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
}
