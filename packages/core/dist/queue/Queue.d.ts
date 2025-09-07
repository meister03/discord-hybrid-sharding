import { EventEmitter } from 'events';
/**
 * Options for the queue
 */
export interface QueueOptions {
    /** Whether to auto-start processing the queue */
    auto?: boolean;
    /** Delay between processing items (in milliseconds) */
    delay?: number;
    /** Maximum number of concurrent items to process */
    concurrency?: number;
}
/**
 * Queue item with optional priority
 */
export interface QueueItem<T = any> {
    /** The item to process */
    item: T;
    /** Priority (higher numbers = higher priority) */
    priority?: number;
    /** Promise resolvers */
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}
/**
 * Events emitted by the queue
 */
export interface QueueEvents<T> {
    /** Queue started processing */
    start: [];
    /** Queue stopped processing */
    stop: [];
    /** Item processed successfully */
    process: [item: T, result?: any];
    /** Item processing failed */
    error: [item: T, error: Error];
    /** Queue is empty */
    empty: [];
    /** Queue processing finished */
    finish: [];
}
/**
 * Generic queue implementation with priority support
 */
export declare class Queue<T = any> extends EventEmitter {
    private items;
    private processing;
    private stopped;
    private currentlyProcessing;
    private readonly options;
    private processor?;
    constructor(options?: QueueOptions);
    /**
     * Set the processor function for queue items
     */
    setProcessor(processor: (item: T) => Promise<any> | any): this;
    /**
     * Add an item to the queue
     */
    add(item: T, priority?: number): Promise<any>;
    /**
     * Start processing the queue
     */
    start(): this;
    /**
     * Stop processing the queue
     */
    stop(): this;
    /**
     * Resume processing the queue
     */
    resume(): this;
    /**
     * Process the next item in the queue
     */
    next(): Promise<boolean>;
    /**
     * Clear all items from the queue
     */
    clear(): this;
    /**
     * Get the current queue size
     */
    get size(): number;
    /**
     * Check if the queue is empty
     */
    get isEmpty(): boolean;
    /**
     * Check if the queue is processing
     */
    get isProcessing(): boolean;
    /**
     * Check if the queue is stopped
     */
    get isStopped(): boolean;
    /**
     * Get the number of currently processing items
     */
    get processingCount(): number;
    /**
     * Process the next item in the queue
     */
    private processNext;
    on<K extends keyof QueueEvents<T>>(event: K, listener: (...args: QueueEvents<T>[K]) => void): this;
    emit<K extends keyof QueueEvents<T>>(event: K, ...args: QueueEvents<T>[K]): boolean;
}
//# sourceMappingURL=Queue.d.ts.map