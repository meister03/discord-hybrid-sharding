import { EventEmitter } from 'events';
import { delayFor } from '../utils/PromiseHandler';

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
export class Queue<T = any> extends EventEmitter {
  private items: QueueItem<T>[] = [];
  private processing = false;
  private stopped = false;
  private currentlyProcessing = 0;
  
  private readonly options: Required<QueueOptions>;
  private processor?: (item: T) => Promise<any> | any;

  constructor(options: QueueOptions = {}) {
    super();
    this.options = {
      auto: options.auto ?? true,
      delay: options.delay ?? 0,
      concurrency: options.concurrency ?? 1,
    };
  }

  /**
   * Set the processor function for queue items
   */
  setProcessor(processor: (item: T) => Promise<any> | any): this {
    this.processor = processor;
    return this;
  }

  /**
   * Add an item to the queue
   */
  add(item: T, priority = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem<T> = {
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
  start(): this {
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
  stop(): this {
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
  resume(): this {
    this.stopped = false;
    return this.start();
  }

  /**
   * Process the next item in the queue
   */
  async next(): Promise<boolean> {
    if (!this.processing || this.stopped) {
      return false;
    }

    return this.processNext();
  }

  /**
   * Clear all items from the queue
   */
  clear(): this {
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
  get size(): number {
    return this.items.length;
  }

  /**
   * Check if the queue is empty
   */
  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Check if the queue is processing
   */
  get isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Check if the queue is stopped
   */
  get isStopped(): boolean {
    return this.stopped;
  }

  /**
   * Get the number of currently processing items
   */
  get processingCount(): number {
    return this.currentlyProcessing;
  }

  /**
   * Process the next item in the queue
   */
  private async processNext(): Promise<boolean> {
    if (this.stopped || this.items.length === 0) {
      this.currentlyProcessing--;
      
      if (this.currentlyProcessing === 0) {
        this.processing = false;
        
        if (this.stopped) {
          this.emit('stop');
        } else {
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
        await delayFor(this.options.delay);
      }

      // Process the item
      let result: any;
      if (this.processor) {
        result = await this.processor(queueItem.item);
      }

      queueItem.resolve(result);
      this.emit('process', queueItem.item, result);
    } catch (error) {
      queueItem.reject(error);
      this.emit('error', queueItem.item, error as Error);
    }

    this.currentlyProcessing--;

    // Check if queue is empty
    if (this.items.length === 0) {
      this.emit('empty');
    }

    // Continue processing if not stopped
    if (!this.stopped && this.items.length > 0) {
      setImmediate(() => this.processNext());
    } else if (this.currentlyProcessing === 0) {
      this.processing = false;
      
      if (this.stopped) {
        this.emit('stop');
      } else {
        this.emit('finish');
      }
    }

    return true;
  }

  // Method for type-safe event handling
  override on<K extends keyof QueueEvents<T>>(event: K, listener: (...args: QueueEvents<T>[K]) => void): this {
    return super.on(event as string, listener);
  }

  override emit<K extends keyof QueueEvents<T>>(event: K, ...args: QueueEvents<T>[K]): boolean {
    return super.emit(event as string, ...args);
  }
}