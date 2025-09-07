import { Queue } from '../queue/Queue';
import { delayFor } from '../utils/PromiseHandler';

describe('Queue', () => {
  let queue: Queue<string>;

  beforeEach(() => {
    queue = new Queue<string>({ auto: false });
  });

  afterEach(() => {
    queue.clear();
  });

  describe('basic functionality', () => {
    it('should add items to the queue', () => {
      expect(queue.size).toBe(0);
      expect(queue.isEmpty).toBe(true);
      
      queue.add('item1');
      queue.add('item2');
      
      expect(queue.size).toBe(2);
      expect(queue.isEmpty).toBe(false);
    });

    it('should process items in order', async () => {
      const results: string[] = [];
      
      queue.setProcessor(async (item: string) => {
        results.push(item);
        return item.toUpperCase();
      });

      const promise1 = queue.add('item1');
      const promise2 = queue.add('item2');
      
      queue.start();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(results).toEqual(['item1', 'item2']);
      expect(result1).toBe('ITEM1');
      expect(result2).toBe('ITEM2');
    });

    it('should handle priorities correctly', async () => {
      const results: string[] = [];
      
      queue.setProcessor(async (item: string) => {
        results.push(item);
      });

      // Add items with different priorities
      queue.add('low', 1);
      queue.add('high', 10);
      queue.add('medium', 5);
      
      queue.start();
      
      // Wait for processing to complete
      await new Promise(resolve => queue.once('finish', resolve));
      
      expect(results).toEqual(['high', 'medium', 'low']);
    });

    it('should handle errors in processing', async () => {
      queue.setProcessor(async (item: string) => {
        if (item === 'error') {
          throw new Error('Processing failed');
        }
        return item;
      });

      const successPromise = queue.add('success');
      const errorPromise = queue.add('error');
      
      queue.start();
      
      await expect(successPromise).resolves.toBe('success');
      await expect(errorPromise).rejects.toThrow('Processing failed');
    });
  });

  describe('queue control', () => {
    it('should start and stop the queue', async () => {
      let processed = 0;
      
      queue.setProcessor(async () => {
        processed++;
        await delayFor(50);
      });

      queue.add('item1');
      queue.add('item2');
      
      expect(queue.isProcessing).toBe(false);
      expect(queue.isStopped).toBe(false);
      
      queue.start();
      expect(queue.isProcessing).toBe(true);
      
      // Let it process one item
      await delayFor(25);
      
      queue.stop();
      expect(queue.isStopped).toBe(true);
      
      // Wait for current processing to finish
      await new Promise(resolve => queue.once('stop', resolve));
      
      expect(processed).toBe(1); // Only one item should have been processed
    });

    it('should resume processing after stop', async () => {
      const results: string[] = [];
      
      queue.setProcessor(async (item: string) => {
        results.push(item);
      });

      queue.add('item1');
      queue.add('item2');
      
      queue.start();
      queue.stop();
      
      await new Promise(resolve => queue.once('stop', resolve));
      
      queue.resume();
      
      await new Promise(resolve => queue.once('finish', resolve));
      
      expect(results).toEqual(['item1', 'item2']);
    });

    it('should clear the queue', async () => {
      const promise1 = queue.add('item1');
      const promise2 = queue.add('item2');
      
      expect(queue.size).toBe(2);
      
      queue.clear();
      
      expect(queue.size).toBe(0);
      expect(queue.isEmpty).toBe(true);
      
      await expect(promise1).rejects.toThrow('Queue cleared');
      await expect(promise2).rejects.toThrow('Queue cleared');
    });
  });

  describe('events', () => {
    it('should emit events during processing', async () => {
      const events: string[] = [];
      
      queue.on('start', () => events.push('start'));
      queue.on('process', () => events.push('process'));
      queue.on('empty', () => events.push('empty'));
      queue.on('finish', () => events.push('finish'));
      
      queue.setProcessor(async (item: string) => item);
      
      queue.add('item1');
      queue.start();
      
      await new Promise(resolve => queue.once('finish', resolve));
      
      expect(events).toEqual(['start', 'process', 'empty', 'finish']);
    });

    it('should emit error events', async () => {
      const errors: Error[] = [];
      
      queue.on('error', (_, error) => {
        errors.push(error);
      });
      
      queue.setProcessor(async (_: string) => {
        throw new Error('Test error');
      });

      queue.add('item1');
      queue.start();
      
      await new Promise(resolve => queue.once('finish', resolve));
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Test error');
    });
  });

  describe('concurrency', () => {
    it('should process items concurrently', async () => {
      const processingTimes: number[] = [];
      const startTime = Date.now();
      
      queue = new Queue<string>({ auto: false, concurrency: 2 });
      
      queue.setProcessor(async (item: string) => {
        await delayFor(50);
        processingTimes.push(Date.now() - startTime);
        return item;
      });

      queue.add('item1');
      queue.add('item2');
      queue.add('item3');
      
      queue.start();
      
      await new Promise(resolve => queue.once('finish', resolve));
      
      // With concurrency 2, first two items should start almost simultaneously
      expect(processingTimes[0]).toBeLessThan(60);
      expect(processingTimes[1]).toBeLessThan(60);
      expect(processingTimes[2]).toBeGreaterThan(80); // Third item waits for one of the first two
    });
  });

  describe('auto-start', () => {
    it('should auto-start when adding items', async () => {
      queue = new Queue<string>({ auto: true });
      
      const results: string[] = [];
      queue.setProcessor(async (item: string) => {
        results.push(item);
      });

      queue.add('item1');
      
      expect(queue.isProcessing).toBe(true);
      
      await new Promise(resolve => queue.once('finish', resolve));
      
      expect(results).toEqual(['item1']);
    });
  });
});