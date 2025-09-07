import { ClusterInfo } from '../types';

/**
 * Calculate which shard a guild belongs to
 */
export function shardIdForGuildId(guildId: string, totalShards: number): number {
  return Number((BigInt(guildId) >> 22n) % BigInt(totalShards));
}

/**
 * Chunk an array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Fetch recommended shard count from Discord API
 */
export async function fetchRecommendedShards(token: string): Promise<number> {
  if (!token) {
    throw new Error('No token provided for fetching recommended shards');
  }

  try {
    const response = await fetch('https://discord.com/api/v10/gateway/bot', {
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { shards: number };
    return data.shards;
  } catch (error) {
    throw new Error(`Failed to fetch recommended shards: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate shard distribution across clusters
 */
export function calculateShardDistribution(totalShards: number, totalClusters: number): number[][] {
  const shardsPerCluster = Math.ceil(totalShards / totalClusters);
  const shardDistribution: number[][] = [];

  for (let clusterId = 0; clusterId < totalClusters; clusterId++) {
    const startShard = clusterId * shardsPerCluster;
    const endShard = Math.min(startShard + shardsPerCluster, totalShards);
    
    if (startShard < totalShards) {
      const shardIds = Array.from({ length: endShard - startShard }, (_, i) => startShard + i);
      shardDistribution.push(shardIds);
    }
  }

  return shardDistribution;
}

/**
 * Generate cluster data for a specific cluster
 */
export function generateClusterData(
  clusterId: number,
  shardIds: number[],
  totalShards: number,
  totalClusters: number,
  additionalData?: any
): Record<string, any> {
  return {
    CLUSTER_ID: clusterId.toString(),
    CLUSTER_SHARD_LIST: shardIds.join(','),
    CLUSTER_SHARD_COUNT: shardIds.length.toString(),
    TOTAL_SHARDS: totalShards.toString(),
    TOTAL_CLUSTERS: totalClusters.toString(),
    FIRST_SHARD_ID: shardIds[0]?.toString() || '0',
    LAST_SHARD_ID: shardIds[shardIds.length - 1]?.toString() || '0',
    ...additionalData,
  };
}

/**
 * Parse cluster info from environment variables or worker data
 */
export function parseClusterInfo(): ClusterInfo {
  // Try to get from worker data first (for worker threads)
  let data: any = {};
  
  try {
    // Check if we're in a worker thread
    const { workerData } = require('worker_threads');
    if (workerData) {
      data = workerData;
    }
  } catch {
    // Not in a worker thread, use process.env
    data = process.env;
  }

  const clusterId = parseInt(data.CLUSTER_ID || '0', 10);
  const shardList = data.CLUSTER_SHARD_LIST 
    ? data.CLUSTER_SHARD_LIST.split(',').map((id: string) => parseInt(id, 10))
    : [0];
  const totalShards = parseInt(data.TOTAL_SHARDS || '1', 10);

  return {
    id: clusterId,
    processId: process.pid,
    threadId: data.threadId,
    shardIds: shardList,
    totalShards: totalShards,
    ready: false,
  };
}

/**
 * Validate cluster configuration
 */
export function validateClusterConfig(options: {
  totalShards: number;
  totalClusters: number;
  shardList?: number[];
  clusterList?: number[];
}): void {
  if (options.totalShards <= 0) {
    throw new Error('Total shards must be greater than 0');
  }

  if (options.totalClusters <= 0) {
    throw new Error('Total clusters must be greater than 0');
  }

  if (options.totalClusters > options.totalShards) {
    throw new Error('Total clusters cannot be greater than total shards');
  }

  if (options.shardList) {
    const invalidShards = options.shardList.filter(shard => shard < 0 || shard >= options.totalShards);
    if (invalidShards.length > 0) {
      throw new Error(`Invalid shard IDs: ${invalidShards.join(', ')}. Shards must be between 0 and ${options.totalShards - 1}`);
    }
  }

  if (options.clusterList) {
    const invalidClusters = options.clusterList.filter(cluster => cluster < 0 || cluster >= options.totalClusters);
    if (invalidClusters.length > 0) {
      throw new Error(`Invalid cluster IDs: ${invalidClusters.join(', ')}. Clusters must be between 0 and ${options.totalClusters - 1}`);
    }
  }
}

/**
 * Format memory usage for display
 */
export function formatMemoryUsage(memoryUsage: NodeJS.MemoryUsage): string {
  const formatBytes = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return [
    `RSS: ${formatBytes(memoryUsage.rss)}`,
    `Heap Used: ${formatBytes(memoryUsage.heapUsed)}`,
    `Heap Total: ${formatBytes(memoryUsage.heapTotal)}`,
    `External: ${formatBytes(memoryUsage.external)}`,
  ].join(', ');
}

/**
 * Create a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }

  throw lastError!;
}