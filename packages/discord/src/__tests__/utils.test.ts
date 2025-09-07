import { 
  shardIdForGuildId, 
  chunkArray, 
  calculateShardDistribution, 
  generateClusterData,
  parseClusterInfo,
  validateClusterConfig,
  formatMemoryUsage,
  delay,
  retryWithBackoff
} from '../utils';

describe('Discord Utilities', () => {
  describe('shardIdForGuildId', () => {
    it('should calculate correct shard ID for guild', () => {
      // Test with known calculation: (guild_id >> 22) % num_shards
      expect(shardIdForGuildId('123456789012345678', 16)).toBe(8);
      expect(shardIdForGuildId('987654321098765432', 10)).toBe(9);
      expect(shardIdForGuildId('111111111111111111', 5)).toBe(3);
    });

    it('should handle single shard', () => {
      expect(shardIdForGuildId('123456789012345678', 1)).toBe(0);
    });

    it('should be consistent for same guild ID', () => {
      const guildId = '123456789012345678';
      const totalShards = 8;
      const shard1 = shardIdForGuildId(guildId, totalShards);
      const shard2 = shardIdForGuildId(guildId, totalShards);
      
      expect(shard1).toBe(shard2);
    });
  });

  describe('chunkArray', () => {
    it('should chunk array into specified sizes', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8];
      const chunked = chunkArray(array, 3);
      
      expect(chunked).toEqual([[1, 2, 3], [4, 5, 6], [7, 8]]);
    });

    it('should handle empty arrays', () => {
      expect(chunkArray([], 3)).toEqual([]);
    });

    it('should handle arrays smaller than chunk size', () => {
      expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
    });
  });

  describe('calculateShardDistribution', () => {
    it('should distribute shards evenly across clusters', () => {
      const distribution = calculateShardDistribution(8, 4);
      
      expect(distribution).toEqual([
        [0, 1],
        [2, 3],
        [4, 5],
        [6, 7]
      ]);
    });

    it('should handle uneven distribution', () => {
      const distribution = calculateShardDistribution(10, 3);
      
      expect(distribution).toEqual([
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9]
      ]);
    });

    it('should handle more clusters than shards', () => {
      const distribution = calculateShardDistribution(2, 4);
      
      expect(distribution).toEqual([
        [0],
        [1]
      ]);
    });
  });

  describe('generateClusterData', () => {
    it('should generate correct cluster data', () => {
      const data = generateClusterData(1, [2, 3, 4], 8, 4, { CUSTOM: 'value' });
      
      expect(data).toEqual({
        CLUSTER_ID: '1',
        CLUSTER_SHARD_LIST: '2,3,4',
        CLUSTER_SHARD_COUNT: '3',
        TOTAL_SHARDS: '8',
        TOTAL_CLUSTERS: '4',
        FIRST_SHARD_ID: '2',
        LAST_SHARD_ID: '4',
        CUSTOM: 'value'
      });
    });

    it('should handle empty shard list', () => {
      const data = generateClusterData(0, [], 4, 2);
      
      expect(data.FIRST_SHARD_ID).toBe('0');
      expect(data.LAST_SHARD_ID).toBe('0');
      expect(data.CLUSTER_SHARD_COUNT).toBe('0');
    });
  });

  describe('validateClusterConfig', () => {
    it('should pass valid configurations', () => {
      expect(() => {
        validateClusterConfig({
          totalShards: 8,
          totalClusters: 4,
          shardList: [0, 1, 2, 3],
          clusterList: [0, 1]
        });
      }).not.toThrow();
    });

    it('should reject invalid shard counts', () => {
      expect(() => {
        validateClusterConfig({ totalShards: 0, totalClusters: 1 });
      }).toThrow('Total shards must be greater than 0');

      expect(() => {
        validateClusterConfig({ totalShards: -1, totalClusters: 1 });
      }).toThrow('Total shards must be greater than 0');
    });

    it('should reject invalid cluster counts', () => {
      expect(() => {
        validateClusterConfig({ totalShards: 4, totalClusters: 0 });
      }).toThrow('Total clusters must be greater than 0');

      expect(() => {
        validateClusterConfig({ totalShards: 4, totalClusters: -1 });
      }).toThrow('Total clusters must be greater than 0');
    });

    it('should reject more clusters than shards', () => {
      expect(() => {
        validateClusterConfig({ totalShards: 2, totalClusters: 4 });
      }).toThrow('Total clusters cannot be greater than total shards');
    });

    it('should reject invalid shard IDs', () => {
      expect(() => {
        validateClusterConfig({
          totalShards: 4,
          totalClusters: 2,
          shardList: [0, 1, 2, 5] // 5 is invalid
        });
      }).toThrow('Invalid shard IDs: 5');
    });

    it('should reject invalid cluster IDs', () => {
      expect(() => {
        validateClusterConfig({
          totalShards: 4,
          totalClusters: 2,
          clusterList: [0, 1, 3] // 3 is invalid
        });
      }).toThrow('Invalid cluster IDs: 3');
    });
  });

  describe('formatMemoryUsage', () => {
    it('should format memory usage correctly', () => {
      const memoryUsage = {
        rss: 50 * 1024 * 1024, // 50 MB
        heapUsed: 30 * 1024 * 1024, // 30 MB
        heapTotal: 40 * 1024 * 1024, // 40 MB
        external: 5 * 1024 * 1024, // 5 MB
        arrayBuffers: 0
      };

      const formatted = formatMemoryUsage(memoryUsage);
      
      expect(formatted).toBe('RSS: 50.00 MB, Heap Used: 30.00 MB, Heap Total: 40.00 MB, External: 5.00 MB');
    });
  });

  describe('delay', () => {
    it('should delay for the specified time', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 3, 10);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 3, 10);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('always fail'));
      
      await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('always fail');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});