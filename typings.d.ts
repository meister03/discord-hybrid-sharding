declare module 'discord-hybrid-sharding' {
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { Client as DJsClient } from "discord.js"
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
    public eval(script: string): Promise<any>;
    public eval<T>(fn: (client: client) => T): Promise<T[]>;
    public fetchClientValue(prop: string): Promise<any>;
    public kill(): void;
    public respawn(delay?: number, spawnTimeout?: number): Promise<ChildProcess>;
    public send(message: any): Promise<Cluster>;
    public spawn(spawnTimeout?: number): Promise<ChildProcess>;

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

  export class Client {
    constructor(client: client, mode: ClusterManagerMode);
    private _handleMessage(message: any): void;
    private _respond(type: string, message: any): void;
    private _nonce: Map<string, Promise<any>>;

    public client: client;
    public readonly count: number;
    public readonly ids: number[];
    public mode: ClusterManagerMode;
    public getinfo: data;
    public parentPort: any | null;
    public evalOnManager(script: string): Promise<any[]>;
    public evalOnCluster(script: string, options: Object): Promise<any[]>;
    public broadcastEval(script: string): Promise<any[]>;
    public broadcastEval(script: string, cluster: number): Promise<any>;
    public broadcastEval<T>(fn: (client: client) => T): Promise<T[]>;
    public broadcastEval<T>(fn: (client: client) => T, cluster: number): Promise<T>;
    public fetchClientValues(prop: string): Promise<any[]>;
    public fetchClientValues(prop: string, cluster: number): Promise<any>;
    public respawnAll(clusterDelay?: number, respawnDelay?: number, spawnTimeout?: number): Promise<void>;
    public send(message: any): Promise<void>;

    public static singleton(client: client, mode: ClusterManagerMode): client;
  }

  export class Manager extends EventEmitter {
    constructor(
      file: string,
      options?: {
        totalShards?: number | 'auto';
        totalClusters?: number | 'auto';
        shardList?: number[] | 'auto';
        mode?: ClusterManagerMode;
        respawn?: boolean;
        shardArgs?: string[];
        token?: string;
        execArgv?: string[];
      },
    );
    private _performOnShards(method: string, args: any[]): Promise<any[]>;
    private _performOnShards(method: string, args: any[], cluster: number): Promise<any>;
    private _nonce: Map<string, Promise<any>>;


    public file: string;
    public respawn: boolean;
    public shardArgs: string[];
    public clusters: Map<number, Cluster>;
    public token: string | null;
    public totalClusters: number | 'auto';
    public totalShards: number | 'auto';
    public shardList: number[] | 'auto';
    public broadcast(message: any): Promise<Cluster[]>;
    public broadcastEval(script: string): Promise<any[]>;
    public broadcastEval(script: string, cluster: number): Promise<any>;
    public createCluster(id: number, clusterstospawn: number[], totalshards: number): Cluster;
    public fetchClientValues(prop: string): Promise<any[]>;
    public fetchClientValues(prop: string, cluster: number): Promise<any>;
    public evalOnManager(script: string): Promise<any[]>;
    private evalOnCluster(script: string, options: Object): Promise<any[]>;
    public respawnAll(
      clusterDelay?: number,
      respawnDelay?: number,
      spawnTimeout?: number,
    ): Promise<Map<number, Cluster>>;
    public spawn(amount?: number | 'auto', delay?: number, spawnTimeout?: number): Promise<Map<number, Cluster>>;
   
    public on(event: 'clusterCreate', listener: (cluster: Cluster) => void): this;

    public once(event: 'clusterCreate', listener: (cluster: Cluster) => void): this;
  }
  export class data{
    public SHARD_LIST: number[], 
    public TOTAL_SHARDS: number, 
    public CLUSTER_COUNT: number, 
    public CLUSTER: number, 
    public CLUSTER_MANAGER_MODE: ClusterManagerMode
  }
    
    
  type ClusterManagerMode = 'process' | 'worker';
  type client = DJsClient;
  type data = {
        SHARD_LIST: number[], 
        TOTAL_SHARDS: number, 
        CLUSTER_COUNT: number, 
        CLUSTER: number, 
        CLUSTER_MANAGER_MODE: ClusterManagerMode
  }
  
}
