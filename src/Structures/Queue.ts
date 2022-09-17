import { QueueOptions } from '../types/shared';
import { delayFor } from '../Util/Util';

export interface QueueItem {
    run(...args: any): Promise<any>;
    args: any[];
    time?: number;
    timeout: number;
}

export class Queue {
    queue: QueueItem[];
    options: Required<QueueOptions>;
    paused: boolean;
    constructor(options: Required<QueueOptions>) {
        this.options = options;
        this.queue = [];
        this.paused = false;
    }

    /**
     * Starts the queue and run's the item functions
     */
    public async start() {
        if (!this.options.auto) {
            return new Promise(resolve => {
                const interval = setInterval(() => {
                    if (this.queue.length === 0) {
                        clearInterval(interval);
                        resolve('Queue finished');
                    }
                }, 200);
            });
        }

        const length = this.queue.length;
        for (let i = 0; i < length; i++) {
            if (!this.queue[0]) continue;
            const timeout = this.queue[0].timeout;
            await this.next();
            await delayFor(timeout);
        }
        return this;
    }

    /**
     * Goes to the next item in the queue
     */
    public async next() {
        if (this.paused) return;
        const item = this.queue.shift();
        if (!item) return true;
        return item.run(...item.args);
    }

    /**
     * Stop's the queue and blocks the next item from running
     */
    public stop() {
        this.paused = true;
        return this;
    }

    /**
     * Resume's the queue
     */
    public resume() {
        this.paused = false;
        return this;
    }

    /**
     * Adds an item to the queue
     */
    public add(item: QueueItem) {
        this.queue.push({
            run: item.run,
            args: item.args,
            time: Date.now(),
            timeout: item.timeout ?? this.options.timeout,
        });
        return this;
    }
}
