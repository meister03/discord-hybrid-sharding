const { delayFor } = require('../Util/Util.js');
class Queue {
    constructor(options) {
        this.options = options;
        this.queue = [];
        this.paused = false;
    }

    /**
    * Starts the queue and run's the item functions
    * @returns {Promise<Queue>}
    */
    async start() {
        if (!this.options.auto) {
            return new Promise(resolve => {
                const interval = setInterval(() => {
                    if (this.queue.length === 0) {
                        clearInterval(interval);
                        resolve();
                    };
                }, 200);
            });
        }

        const length = this.queue.length;
        for (let i = 0; i < length; i++) {
            const timeout = this.queue[0].timeout;
            await this.next();
            await delayFor(timeout);
        }
        return this;
    }

    /**
    * Goes to the next item in the queue
    * @returns {Promise<any>}
    */
    async next() {
        if (this.paused) return;
        const item = this.queue.shift();
        if (!item) return true;
        return item.run(...item.args);
    }   

    /**
    * Stop's the queue and blocks the next item from running
    * @returns {Promise<Queue>}
    */
    stop() {
        this.paused = true;
        return this;
    }

    /**
    * Resume's the queue
    * @returns {Promise<Queue>}
    */
    resume() {
        this.paused = false;
        return this;
    }

    /**
    * Adds an item to the queue
    * @returns {Promise<Queue>}
    */
    add(item) {
        this.queue.push({ run: item.run, args: item.args, time: Date.now(), timeout: item.timeout ?? this.options.timeout });
        return this;
    }
}
module.exports = Queue;