"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
const events_1 = require("events");
const PromiseHandler_1 = require("../utils/PromiseHandler");
/**
 * Generic queue implementation with priority support
 */
class Queue extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.items = [];
        this.processing = false;
        this.stopped = false;
        this.currentlyProcessing = 0;
        this.options = {
            auto: options.auto ?? true,
            delay: options.delay ?? 0,
            concurrency: options.concurrency ?? 1,
        };
    }
    /**
     * Set the processor function for queue items
     */
    setProcessor(processor) {
        this.processor = processor;
        return this;
    }
    /**
     * Add an item to the queue
     */
    add(item, priority = 0) {
        return new Promise((resolve, reject) => {
            const queueItem = {
                item,
                priority,
                resolve,
                reject,
            };
            // Insert item based on priority (higher priority first)
            let inserted = false;
            for (let i = 0; i < this.items.length; i++) {
                if ((this.items[i].priority ?? 0) < priority) {
                    this.items.splice(i, 0, queueItem);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                this.items.push(queueItem);
            }
            // Auto-start if enabled and not already processing
            if (this.options.auto && !this.processing && !this.stopped) {
                this.start();
            }
        });
    }
    /**
     * Start processing the queue
     */
    start() {
        if (this.processing || this.stopped) {
            return this;
        }
        this.processing = true;
        this.stopped = false;
        this.emit('start');
        // Start processing with concurrency
        for (let i = 0; i < this.options.concurrency; i++) {
            this.processNext();
        }
        return this;
    }
    /**
     * Stop processing the queue
     */
    stop() {
        this.stopped = true;
        if (this.currentlyProcessing === 0) {
            this.processing = false;
            this.emit('stop');
        }
        return this;
    }
    /**
     * Resume processing the queue
     */
    resume() {
        this.stopped = false;
        return this.start();
    }
    /**
     * Process the next item in the queue
     */
    async next() {
        if (!this.processing || this.stopped) {
            return false;
        }
        return this.processNext();
    }
    /**
     * Clear all items from the queue
     */
    clear() {
        // Reject all pending items
        for (const item of this.items) {
            item.reject(new Error('Queue cleared'));
        }
        this.items = [];
        this.emit('empty');
        return this;
    }
    /**
     * Get the current queue size
     */
    get size() {
        return this.items.length;
    }
    /**
     * Check if the queue is empty
     */
    get isEmpty() {
        return this.items.length === 0;
    }
    /**
     * Check if the queue is processing
     */
    get isProcessing() {
        return this.processing;
    }
    /**
     * Check if the queue is stopped
     */
    get isStopped() {
        return this.stopped;
    }
    /**
     * Get the number of currently processing items
     */
    get processingCount() {
        return this.currentlyProcessing;
    }
    /**
     * Process the next item in the queue
     */
    async processNext() {
        if (this.stopped || this.items.length === 0) {
            this.currentlyProcessing--;
            if (this.currentlyProcessing === 0) {
                this.processing = false;
                if (this.stopped) {
                    this.emit('stop');
                }
                else {
                    this.emit('finish');
                }
            }
            return false;
        }
        const queueItem = this.items.shift();
        if (!queueItem) {
            return false;
        }
        this.currentlyProcessing++;
        try {
            // Add delay if specified
            if (this.options.delay > 0) {
                await (0, PromiseHandler_1.delayFor)(this.options.delay);
            }
            // Process the item
            let result;
            if (this.processor) {
                result = await this.processor(queueItem.item);
            }
            queueItem.resolve(result);
            this.emit('process', queueItem.item, result);
        }
        catch (error) {
            queueItem.reject(error);
            this.emit('error', queueItem.item, error);
        }
        this.currentlyProcessing--;
        // Check if queue is empty
        if (this.items.length === 0) {
            this.emit('empty');
        }
        // Continue processing if not stopped
        if (!this.stopped && this.items.length > 0) {
            setImmediate(() => this.processNext());
        }
        else if (this.currentlyProcessing === 0) {
            this.processing = false;
            if (this.stopped) {
                this.emit('stop');
            }
            else {
                this.emit('finish');
            }
        }
        return true;
    }
    // Method for type-safe event handling
    on(event, listener) {
        return super.on(event, listener);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
}
exports.Queue = Queue;
//# sourceMappingURL=Queue.js.map