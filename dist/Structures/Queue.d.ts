import { QueueOptions } from '../types/shared';
export interface QueueItem {
    run(...args: any): Promise<any>;
    args: any[];
    time?: number;
    timeout: number;
}
export declare class Queue {
    queue: QueueItem[];
    options: Required<QueueOptions>;
    paused: boolean;
    constructor(options: Required<QueueOptions>);
    /**
     * Starts the queue and run's the item functions
     */
    start(): Promise<unknown>;
    /**
     * Goes to the next item in the queue
     */
    next(): Promise<any>;
    /**
     * Stop's the queue and blocks the next item from running
     */
    stop(): this;
    /**
     * Resume's the queue
     */
    resume(): this;
    /**
     * Adds an item to the queue
     */
    add(item: QueueItem): this;
}
//# sourceMappingURL=Queue.d.ts.map