"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseHandler = void 0;
exports.delayFor = delayFor;
exports.createDeferredPromise = createDeferredPromise;
exports.withTimeout = withTimeout;
exports.makePlainError = makePlainError;
exports.restoreError = restoreError;
/**
 * Promise handler for managing timeouts and promise resolution
 */
class PromiseHandler {
    constructor() {
        this.promises = new Map();
    }
    /**
     * Create a promise that can be resolved by nonce
     */
    create(nonce, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutHandle;
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
    resolve(nonce, value) {
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
    reject(nonce, reason) {
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
    has(nonce) {
        return this.promises.has(nonce);
    }
    /**
     * Get the number of pending promises
     */
    get size() {
        return this.promises.size;
    }
    /**
     * Clear all pending promises with rejection
     */
    clear(reason) {
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
    getPendingNonces() {
        return Array.from(this.promises.keys());
    }
}
exports.PromiseHandler = PromiseHandler;
/**
 * Create a promise that resolves after a delay
 */
function delayFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Create a promise with external resolve/reject functions
 */
function createDeferredPromise() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}
/**
 * Wrap a promise with a timeout
 */
function withTimeout(promise, timeout, message) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(message || `Operation timed out after ${timeout}ms`)), timeout)),
    ]);
}
/**
 * Make a plain error object serializable
 */
function makePlainError(error) {
    const result = {
        name: error.name,
        message: error.message,
        stack: error.stack,
    };
    // Copy any additional enumerable properties
    for (const key in error) {
        if (key !== 'name' && key !== 'message' && key !== 'stack' && error.hasOwnProperty(key)) {
            result[key] = error[key];
        }
    }
    return result;
}
/**
 * Restore an error from a plain object
 */
function restoreError(plainError) {
    const error = new Error(plainError.message);
    error.name = plainError.name;
    error.stack = plainError.stack;
    // Copy any additional properties
    for (const key in plainError) {
        if (key !== 'name' && key !== 'message' && key !== 'stack') {
            error[key] = plainError[key];
        }
    }
    return error;
}
//# sourceMappingURL=PromiseHandler.js.map