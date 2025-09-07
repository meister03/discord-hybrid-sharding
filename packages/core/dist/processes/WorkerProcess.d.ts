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
export declare class WorkerProcess implements ISpawnableProcess {
    readonly file: string;
    process: WorkerThread | null;
    private readonly options;
    constructor(file: string, options?: WorkerProcessOptions);
    /**
     * Build worker options from process options
     */
    private buildWorkerOptions;
    /**
     * Spawn the worker thread
     */
    spawn(): WorkerThread;
    /**
     * Respawn the worker thread
     */
    respawn(): WorkerThread;
    /**
     * Kill the worker thread
     */
    kill(): Promise<void>;
    /**
     * Send message to the worker thread
     */
    send(message: Serializable): Promise<void>;
    /**
     * Check if the worker is spawned
     */
    get isSpawned(): boolean;
    /**
     * Get the worker thread ID
     */
    get threadId(): number | undefined;
}
//# sourceMappingURL=WorkerProcess.d.ts.map