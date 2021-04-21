declare module 'discord-hybrid-sharding' {
export class Shard extends EventEmitter {
    constructor(manager: ShardingManager, id: number);
    private _evals: Map<string, Promise<any>>;
    private _exitListener: (...args: any[]) => void;
    private _fetches: Map<string, Promise<any>>;
    private _handleExit(respawn?: boolean): void;
    private _handleMessage(message: any): void;

    public args: string[];
    public execArgv: string[];
    public env: object;
    public id: number;
    public manager: ClusterManager;
    public process: ChildProcess | null;
    public ready: boolean;
    public worker: any | null;
    public eval(script: string): Promise<any>;
    public eval<T>(fn: (client: Client) => T): Promise<T[]>;
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

  export class ClusterClient {
    constructor(client: Client, mode: ClusterManagerMode);
    private _handleMessage(message: any): void;
    private _respond(type: string, message: any): void;

    public client: Client;
    public readonly count: number;
    public readonly ids: number[];
    public mode: ClusterManagerMode;
    public parentPort: any | null;
    public broadcastEval(script: string): Promise<any[]>;
    public broadcastEval(script: string, cluster: number): Promise<any>;
    public broadcastEval<T>(fn: (client: Client) => T): Promise<T[]>;
    public broadcastEval<T>(fn: (client: Client) => T, cluster: number): Promise<T>;
    public fetchClientValues(prop: string): Promise<any[]>;
    public fetchClientValues(prop: string, cluster: number): Promise<any>;
    public respawnAll(clusterDelay?: number, respawnDelay?: number, spawnTimeout?: number): Promise<void>;
    public send(message: any): Promise<void>;

    public static singleton(client: Client, mode: ClusterManagerMode): ClusterClient;
  }

  export class ClusterManager extends EventEmitter {
    constructor(
      file: string,
      options?: {
        totalShards?: number | 'auto';
        totalClusters?: number | 'auto';
        shardList?: number[] | 'auto';
        mode?: ShardingManagerMode;
        respawn?: boolean;
        shardArgs?: string[];
        token?: string;
        execArgv?: string[];
      },
    );
    private _performOnShards(method: string, args: any[]): Promise<any[]>;
    private _performOnShards(method: string, args: any[], cluster: number): Promise<any>;

    public file: string;
    public respawn: boolean;
    public shardArgs: string[];
    public shards: Collection<number, Clusters>;
    public token: string | null;
    public totalClusters: number | 'auto';
    public totalShards: number | 'auto';
    public shardList: number[] | 'auto';
    public broadcast(message: any): Promise<Cluster[]>;
    public broadcastEval(script: string): Promise<any[]>;
    public broadcastEval(script: string, cluster: number): Promise<any>;
    public createCluster(id: number, shardstospawn: number[], totalshards: number): Cluster;
    public fetchClientValues(prop: string): Promise<any[]>;
    public fetchClientValues(prop: string, cluster: number): Promise<any>;
    public respawnAll(
      shardDelay?: number,
      respawnDelay?: number,
      spawnTimeout?: number,
    ): Promise<Collection<number, Shard>>;
    public spawn(amount?: number | 'auto', delay?: number, spawnTimeout?: number): Promise<Collection<number, Cluster>>;

    public on(event: 'clusterCreate', listener: (cluster: Cluster) => void): this;

    public once(event: 'clusterCreate', listener: (cluster: Cluster) => void): this;
  }

  type ClusterManagerMode = 'process' | 'worker';
}
