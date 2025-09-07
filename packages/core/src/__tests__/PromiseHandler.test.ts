import { PromiseHandler, delayFor, createDeferredPromise, withTimeout, makePlainError, restoreError } from '../utils/PromiseHandler';

describe('PromiseHandler', () => {
  let handler: PromiseHandler<string>;

  beforeEach(() => {
    handler = new PromiseHandler<string>();
  });

  afterEach(() => {
    handler.clear();
  });

  describe('basic functionality', () => {
    it('should create and resolve a promise', async () => {
      const nonce = 'test-nonce';
      const promise = handler.create(nonce);
      
      setTimeout(() => {
        handler.resolve(nonce, 'test-value');
      }, 10);
      
      const result = await promise;
      expect(result).toBe('test-value');
    });

    it('should create and reject a promise', async () => {
      const nonce = 'test-nonce';
      const promise = handler.create(nonce);
      
      setTimeout(() => {
        handler.reject(nonce, new Error('test-error'));
      }, 10);
      
      await expect(promise).rejects.toThrow('test-error');
    });

    it('should handle timeout', async () => {
      const nonce = 'test-nonce';
      const promise = handler.create(nonce, 50);
      
      await expect(promise).rejects.toThrow(/timed out/);
    });

    it('should return false for non-existent nonce', () => {
      expect(handler.resolve('non-existent', 'value')).toBe(false);
      expect(handler.reject('non-existent', new Error())).toBe(false);
    });

    it('should track pending promises', () => {
      expect(handler.size).toBe(0);
      
      handler.create('nonce1');
      handler.create('nonce2');
      
      expect(handler.size).toBe(2);
      expect(handler.has('nonce1')).toBe(true);
      expect(handler.has('nonce2')).toBe(true);
      
      handler.resolve('nonce1', 'value');
      
      expect(handler.size).toBe(1);
      expect(handler.has('nonce1')).toBe(false);
      expect(handler.has('nonce2')).toBe(true);
    });

    it('should clear all promises', () => {
      handler.create('nonce1');
      handler.create('nonce2');
      
      expect(handler.size).toBe(2);
      
      handler.clear(new Error('cleared'));
      
      expect(handler.size).toBe(0);
    });
  });
});

describe('utility functions', () => {
  describe('delayFor', () => {
    it('should delay for specified time', async () => {
      const start = Date.now();
      await delayFor(50);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some variance
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('createDeferredPromise', () => {
    it('should create a deferred promise', async () => {
      const deferred = createDeferredPromise<string>();
      
      setTimeout(() => {
        deferred.resolve('test-value');
      }, 10);
      
      const result = await deferred.promise;
      expect(result).toBe('test-value');
    });

    it('should handle rejection', async () => {
      const deferred = createDeferredPromise<string>();
      
      setTimeout(() => {
        deferred.reject(new Error('test-error'));
      }, 10);
      
      await expect(deferred.promise).rejects.toThrow('test-error');
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise resolves before timeout', async () => {
      const promise = delayFor(10).then(() => 'success');
      const result = await withTimeout(promise, 50);
      
      expect(result).toBe('success');
    });

    it('should reject if promise times out', async () => {
      const promise = delayFor(100).then(() => 'success');
      
      await expect(withTimeout(promise, 50)).rejects.toThrow(/timed out/);
    });
  });

  describe('error handling', () => {
    it('should make and restore plain errors', () => {
      const originalError = new Error('test error');
      originalError.name = 'TestError';
      (originalError as any).customProp = 'custom value';
      
      const plainError = makePlainError(originalError);
      expect(plainError.name).toBe('TestError');
      expect(plainError.message).toBe('test error');
      expect(plainError.customProp).toBe('custom value');
      
      const restoredError = restoreError(plainError);
      expect(restoredError).toBeInstanceOf(Error);
      expect(restoredError.name).toBe('TestError');
      expect(restoredError.message).toBe('test error');
      expect((restoredError as any).customProp).toBe('custom value');
    });
  });
});