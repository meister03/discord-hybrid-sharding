import { Serializable } from 'child_process';
import { Worker as WorkerThread, WorkerOptions } from 'worker_threads';
import { ISpawnableProcess, IProcessOptions } from '../interfaces/IProcessManager';

/**
 * Options for worker thread processes
 */
export interface WorkerProcessOptions extends Omit<IProcessOptions, 'env'>, Omit<WorkerOptions, 'workerData'> {
  /** Data to pass to the worker */
  processData?: any;
  
  /** Environment variables for worker */
  env?: NodeJS.ProcessEnv;
  
  /** Worker-specific options */
  transferList?: any[];
  resourceLimits?: {
    maxOldGenerationSizeMb?: number;
    maxYoungGenerationSizeMb?: number;
    codeRangeSizeMb?: number;
    stackSizeMb?: number;
  };
}

/**
 * Worker process implementation using worker threads
 */
export class WorkerProcess implements ISpawnableProcess {
  public readonly file: string;
  public process: WorkerThread | null = null;
  private readonly options: WorkerOptions;

  constructor(file: string, options: WorkerProcessOptions = {}) {
    this.file = file;
    this.options = this.buildWorkerOptions(options);
  }

  /**
   * Build worker options from process options
   */
  private buildWorkerOptions(options: WorkerProcessOptions): WorkerOptions {
    const workerOptions: WorkerOptions = {};

    // Set worker data from process data
    if (options.processData) {
      workerOptions.workerData = options.processData;
    }

    // Copy relevant options
    if (options.argv) workerOptions.argv = options.argv;
    if (options.execArgv) workerOptions.execArgv = options.execArgv;
    if (options.env) workerOptions.env = options.env;
    if (options.eval !== undefined) workerOptions.eval = options.eval;
    if (options.stdin !== undefined) workerOptions.stdin = options.stdin;
    if (options.stdout !== undefined) workerOptions.stdout = options.stdout;
    if (options.stderr !== undefined) workerOptions.stderr = options.stderr;
    if (options.trackUnmanagedFds !== undefined) workerOptions.trackUnmanagedFds = options.trackUnmanagedFds;
    if (options.transferList) workerOptions.transferList = options.transferList;
    if (options.resourceLimits) workerOptions.resourceLimits = options.resourceLimits;

    return workerOptions;
  }

  /**
   * Spawn the worker thread
   */
  public spawn(): WorkerThread {
    if (this.process) {
      throw new Error('Worker process is already spawned');
    }

    this.process = new WorkerThread(this.file, this.options);
    return this.process;
  }

  /**
   * Respawn the worker thread
   */
  public respawn(): WorkerThread {
    this.kill();
    return this.spawn();
  }

  /**
   * Kill the worker thread
   */
  public async kill(): Promise<void> {
    if (!this.process) {
      return;
    }

    this.process.removeAllListeners();
    await this.process.terminate();
    this.process = null;
  }

  /**
   * Send message to the worker thread
   */
  public async send(message: Serializable): Promise<void> {
    if (!this.process) {
      throw new Error('Worker process is not spawned');
    }

    return new Promise<void>((resolve, reject) => {
      try {
        this.process!.postMessage(message);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if the worker is spawned
   */
  public get isSpawned(): boolean {
    return this.process !== null;
  }

  /**
   * Get the worker thread ID
   */
  public get threadId(): number | undefined {
    return this.process?.threadId;
  }
}