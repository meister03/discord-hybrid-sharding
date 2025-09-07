import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { Serializable } from 'child_process';
import { IProcessManager, IProcessClient, EvalOptions, ProcessRestartOptions, ProcessManagerEvents, ProcessClientEvents } from '@hybrid-sharding/core';

/**
 * Discord client type (can be extended for other Discord libraries)
 */
export type DiscordClient = Client;

/**
 * Options for Discord cluster manager
 */
export interface ClusterManagerOptions {
  /** The Discord bot token */
  token?: string;
  
  /** Number of total shards or "auto" to fetch from Discord */
  totalShards?: number | 'auto';
  
  /** Number of clusters to spawn */
  totalClusters?: number | 'auto';
  
  /** Number of shards per cluster */
  shardsPerCluster?: number;
  
  /** Arguments to pass to the clustered script when spawning */
  shardArgs?: string[];
  
  /** Arguments to pass to the clustered script executable when spawning */
  execArgv?: string[];
  
  /** Whether clusters should automatically respawn upon exiting */
  respawn?: boolean;
  
  /** Mode for clustering: 'worker' or 'process' */
  mode?: 'worker' | 'process';
  
  /** List of shard IDs to spawn */
  shardList?: number[];
  
  /** List of cluster IDs to assign */
  clusterList?: number[];
  
  /** Restart options */
  restarts?: ProcessRestartOptions;
  
  /** Cluster data to pass to each cluster */
  clusterData?: any;
  
  /** Discord.js client options */
  clientOptions?: {
    intents?: GatewayIntentBits[];
    partials?: Partials[];
    [key: string]: any;
  };
}

/**
 * Options for cluster spawning
 */
export interface ClusterSpawnOptions {
  /** Amount of clusters to spawn */
  amount?: number | 'auto';
  
  /** Delay between spawning clusters */
  delay?: number;
  
  /** Timeout for cluster spawn */
  timeout?: number;
}

/**
 * Discord-specific evaluation options
 */
export interface DiscordEvalOptions<T = object> extends EvalOptions<T> {
  /** Target cluster ID(s) */
  cluster?: number | number[];
  
  /** Target shard ID */
  shard?: number;
  
  /** Guild ID for shard-specific operations */
  guildId?: string;
}

/**
 * Cluster information
 */
export interface ClusterInfo {
  /** Cluster ID */
  id: number;
  
  /** Process ID */
  processId?: number;
  
  /** Thread ID (for worker mode) */
  threadId?: number;
  
  /** Shard IDs handled by this cluster */
  shardIds: number[];
  
  /** Total shards in this cluster */
  totalShards: number;
  
  /** Cluster ready state */
  ready: boolean;
  
  /** Memory usage */
  memoryUsage?: NodeJS.MemoryUsage;
}

/**
 * Events emitted by the Discord cluster manager
 */
export interface ClusterManagerEvents {
  /** Cluster created */
  clusterCreate: [cluster: Cluster];
  
  /** Cluster ready */
  clusterReady: [cluster: Cluster];
  
  /** Cluster died */
  clusterDeath: [cluster: Cluster, process: any];
  
  /** Cluster error */
  clusterError: [cluster: Cluster, error: Error];
  
  /** All clusters ready */
  ready: [];
  
  /** Debug message */
  debug: [message: string];
  
  /** Shard ready */
  shardReady: [shardId: number, clusterId: number];
  
  /** Shard disconnect */
  shardDisconnect: [event: any, shardId: number, clusterId: number];
  
  /** Shard error */
  shardError: [error: Error, shardId: number, clusterId: number];
  
  /** Shard reconnecting */
  shardReconnecting: [shardId: number, clusterId: number];
  
  /** Shard resume */
  shardResume: [shardId: number, clusterId: number];
}

/**
 * Events emitted by the Discord cluster client
 */
export interface ClusterClientEvents<TClient = DiscordClient> {
  /** Message received */
  message: [message: any];
  
  /** Cluster client ready */
  ready: [clusterClient: ClusterClient<TClient>];
  
  /** Error occurred */
  error: [error: Error];
  
  /** Debug message */
  debug: [message: string];
}

/**
 * Base interface for Discord cluster
 */
export interface ICluster {
  /** Cluster ID */
  id: number;
  
  /** Shard IDs handled by this cluster */
  shardIds: number[];
  
  /** Total shards */
  totalShards: number;
  
  /** Manager reference */
  manager: IClusterManager;
  
  /** Send message to cluster */
  send(message: Serializable): Promise<void>;
  
  /** Request data from cluster */
  request<T = any>(message: Serializable): Promise<T>;
  
  /** Evaluate script in cluster */
  eval<T = any>(script: string, context?: any): Promise<T>;
  
  /** Respawn the cluster */
  respawn(options?: { delay?: number; timeout?: number }): Promise<void>;
  
  /** Kill the cluster */
  kill(): Promise<void>;
}

/**
 * Base interface for Discord cluster manager
 */
export interface IClusterManager extends IProcessManager {
  /** Discord bot token */
  token?: string;
  
  /** Total shards */
  totalShards: number;
  
  /** Total clusters */
  totalClusters: number;
  
  /** Shard list */
  shardList: number[];
  
  /** Cluster list */
  clusterList: number[];
  
  /** Get cluster by ID */
  getCluster(id: number): ICluster | undefined;
  
  /** Spawn clusters */
  spawn(options?: ClusterSpawnOptions): Promise<void>;
  
  /** Broadcast evaluation to all clusters */
  broadcastEval<T>(script: string, options?: DiscordEvalOptions): Promise<T[]>;
  
  /** Respawn all clusters */
  respawnAll(options?: { clusterDelay?: number; respawnDelay?: number; timeout?: number }): Promise<void>;
  
  /** Get recommended shard count from Discord */
  fetchRecommendedShards(): Promise<number>;
}

/**
 * Base interface for Discord cluster client
 */
export interface IClusterClient<TClient = DiscordClient> extends IProcessClient<TClient> {
  /** Cluster information */
  info: ClusterInfo;
  
  /** Shard IDs for this cluster */
  shardIds: number[];
  
  /** Total shards */
  totalShards: number;
  
  /** Broadcast evaluation to all clusters */
  broadcastEval<T>(script: string, options?: DiscordEvalOptions): Promise<T[]>;
  
  /** Respawn all clusters */
  respawnAll(options?: { clusterDelay?: number; respawnDelay?: number; timeout?: number }): Promise<void>;
  
  /** Trigger cluster ready state */
  triggerClusterReady(): void;
}

// Re-export cluster classes for convenience
export class Cluster implements ICluster {
  id!: number;
  shardIds!: number[];
  totalShards!: number;
  manager!: IClusterManager;
  
  async send(message: Serializable): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async request<T = any>(message: Serializable): Promise<T> {
    throw new Error('Method not implemented.');
  }
  
  async eval<T = any>(script: string, context?: any): Promise<T> {
    throw new Error('Method not implemented.');
  }
  
  async respawn(options?: { delay?: number; timeout?: number }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async kill(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export class ClusterManager implements IClusterManager {
  token?: string;
  totalShards!: number;
  totalClusters!: number;
  totalProcesses!: number;
  file!: string;
  shardList!: number[];
  clusterList!: number[];
  
  getCluster(id: number): ICluster | undefined {
    throw new Error('Method not implemented.');
  }
  
  async spawn(options?: ClusterSpawnOptions): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async broadcastEval<T>(script: string, options?: DiscordEvalOptions): Promise<T[]> {
    throw new Error('Method not implemented.');
  }
  
  async respawnAll(options?: { clusterDelay?: number; respawnDelay?: number; timeout?: number }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async fetchRecommendedShards(): Promise<number> {
    throw new Error('Method not implemented.');
  }
  
  getProcess(id: number): import('@hybrid-sharding/core').ISpawnableProcess | undefined {
    throw new Error('Method not implemented.');
  }
  
  async kill(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export class ClusterClient<TClient = DiscordClient> implements IClusterClient<TClient> {
  client!: TClient;
  id!: number;
  info!: ClusterInfo;
  shardIds!: number[];
  totalShards!: number;
  
  async send(message: Serializable): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  async request<T = any>(message: Serializable): Promise<T> {
    throw new Error('Method not implemented.');
  }
  
  async evalOnManager<T = any>(script: string): Promise<T> {
    throw new Error('Method not implemented.');
  }
  
  triggerReady(): void {
    throw new Error('Method not implemented.');
  }
  
  async broadcastEval<T>(script: string, options?: DiscordEvalOptions): Promise<T[]> {
    throw new Error('Method not implemented.');
  }
  
  async respawnAll(options?: { clusterDelay?: number; respawnDelay?: number; timeout?: number }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  triggerClusterReady(): void {
    throw new Error('Method not implemented.');
  }
}