/**
 * Promise handler for managing timeouts and promise resolution
 */
export declare class PromiseHandler<T = any> {
    private promises;
    /**
     * Create a promise that can be resolved by nonce
     */
    create(nonce: string, timeout?: number): Promise<T>;
    /**
     * Resolve a promise by nonce
     */
    resolve(nonce: string, value: T): boolean;
    /**
     * Reject a promise by nonce
     */
    reject(nonce: string, reason?: any): boolean;
    /**
     * Check if a promise exists for the given nonce
     */
    has(nonce: string): boolean;
    /**
     * Get the number of pending promises
     */
    get size(): number;
    /**
     * Clear all pending promises with rejection
     */
    clear(reason?: any): void;
    /**
     * Get all pending promise nonces
     */
    getPendingNonces(): string[];
}
/**
 * Create a promise that resolves after a delay
 */
export declare function delayFor(ms: number): Promise<void>;
/**
 * Create a promise with external resolve/reject functions
 */
export declare function createDeferredPromise<T = any>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
};
/**
 * Wrap a promise with a timeout
 */
export declare function withTimeout<T>(promise: Promise<T>, timeout: number, message?: string): Promise<T>;
/**
 * Make a plain error object serializable
 */
export declare function makePlainError(error: Error): any;
/**
 * Restore an error from a plain object
 */
export declare function restoreError(plainError: any): Error;
//# sourceMappingURL=PromiseHandler.d.ts.map