/**
 * Promise handler for managing timeouts and promise resolution
 */
export class PromiseHandler<T = any> {
  private promises = new Map<string, {
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
    timeout?: NodeJS.Timeout;
  }>();

  /**
   * Create a promise that can be resolved by nonce
   */
  create(nonce: string, timeout?: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let timeoutHandle: NodeJS.Timeout | undefined;

      if (timeout && timeout > 0) {
        timeoutHandle = setTimeout(() => {
          this.reject(nonce, new Error(`Promise with nonce ${nonce} timed out after ${timeout}ms`));
        }, timeout);
      }

      this.promises.set(nonce, {
        resolve,
        reject,
        timeout: timeoutHandle ?? undefined,
      });
    });
  }

  /**
   * Resolve a promise by nonce
   */
  resolve(nonce: string, value: T): boolean {
    const promise = this.promises.get(nonce);
    if (!promise) {
      return false;
    }

    if (promise.timeout) {
      clearTimeout(promise.timeout);
    }

    this.promises.delete(nonce);
    promise.resolve(value);
    return true;
  }

  /**
   * Reject a promise by nonce
   */
  reject(nonce: string, reason?: any): boolean {
    const promise = this.promises.get(nonce);
    if (!promise) {
      return false;
    }

    if (promise.timeout) {
      clearTimeout(promise.timeout);
    }

    this.promises.delete(nonce);
    promise.reject(reason);
    return true;
  }

  /**
   * Check if a promise exists for the given nonce
   */
  has(nonce: string): boolean {
    return this.promises.has(nonce);
  }

  /**
   * Get the number of pending promises
   */
  get size(): number {
    return this.promises.size;
  }

  /**
   * Clear all pending promises with rejection
   */
  clear(reason?: any): void {
    for (const [, promise] of this.promises) {
      if (promise.timeout) {
        clearTimeout(promise.timeout);
      }
      promise.reject(reason || new Error('Promise handler cleared'));
    }
    this.promises.clear();
  }

  /**
   * Get all pending promise nonces
   */
  getPendingNonces(): string[] {
    return Array.from(this.promises.keys());
  }
}

/**
 * Create a promise that resolves after a delay
 */
export function delayFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a promise with external resolve/reject functions
 */
export function createDeferredPromise<T = any>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Wrap a promise with a timeout
 */
export function withTimeout<T>(promise: Promise<T>, timeout: number, message?: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message || `Operation timed out after ${timeout}ms`)), timeout)
    ),
  ]);
}

/**
 * Make a plain error object serializable
 */
export function makePlainError(error: Error): any {
  const result: any = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
  
  // Copy any additional enumerable properties
  for (const key in error) {
    if (key !== 'name' && key !== 'message' && key !== 'stack' && error.hasOwnProperty(key)) {
      result[key] = (error as any)[key];
    }
  }
  
  return result;
}

/**
 * Restore an error from a plain object
 */
export function restoreError(plainError: any): Error {
  const error = new Error(plainError.message);
  error.name = plainError.name;
  error.stack = plainError.stack;
  
  // Copy any additional properties
  for (const key in plainError) {
    if (key !== 'name' && key !== 'message' && key !== 'stack') {
      (error as any)[key] = plainError[key];
    }
  }
  
  return error;
}