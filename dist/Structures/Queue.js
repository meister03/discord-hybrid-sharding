import { delayFor } from '../Util/Util';
export class Queue {
    queue;
    options;
    paused;
    constructor(options) {
        this.options = options;
        this.queue = [];
        this.paused = false;
    }
    async start() {
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
            if (!this.queue[0])
                continue;
            const timeout = this.queue[0].timeout;
            await this.next();
            await delayFor(timeout);
        }
        return this;
    }
    async next() {
        if (this.paused)
            return;
        const item = this.queue.shift();
        if (!item)
            return true;
        return item.run(...item.args);
    }
    stop() {
        this.paused = true;
        return this;
    }
    resume() {
        this.paused = false;
        return this;
    }
    add(item) {
        this.queue.push({
            run: item.run,
            args: item.args,
            time: Date.now(),
            timeout: item.timeout ?? this.options.timeout,
        });
        return this;
    }
}
