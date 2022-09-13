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
    start(): Promise<unknown>;
    next(): Promise<any>;
    stop(): this;
    resume(): this;
    add(item: QueueItem): this;
}
//# sourceMappingURL=Queue.d.ts.map