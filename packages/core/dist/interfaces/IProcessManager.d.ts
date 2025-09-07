import { Serializable } from 'child_process';
import { Worker } from 'worker_threads';
import { ChildProcess } from 'child_process';
/**
 * Base interface for any spawnable process or worker
 */
export interface ISpawnableProcess {
    /** Spawn the process/worker */
    spawn(): ChildProcess | Worker;
    /** Respawn the process/worker (kill and spawn) */
    respawn(): ChildProcess | Worker;
    /** Kill the process/worker */
    kill(): Promise<void> | void;
    /** Send message to the process/worker */
    send(message: Serializable): Promise<any>;
}
/**
 * Options for spawning processes
 */
export interface IProcessOptions {
    /** Data to pass to the process */
    processData?: any;
    /** Additional arguments */
    args?: string[];
    /** Environment variables */
    env?: NodeJS.ProcessEnv;
    /** Execution arguments */
    execArgv?: string[];
}
/**
 * Base interface for process management
 */
export interface IProcessManager<TProcess extends ISpawnableProcess = ISpawnableProcess> {
    /** Total number of processes to manage */
    totalProcesses: number;
    /** File to execute in each process */
    file: string;
    /** Spawn all processes */
    spawn(): Promise<void>;
    /** Respawn all processes */
    respawnAll(options?: {
        processDelay?: number;
        respawnDelay?: number;
        timeout?: number;
    }): Promise<void>;
    /** Broadcast evaluation to all processes */
    broadcastEval<T>(script: string, options?: {
        timeout?: number;
        context?: any;
    }): Promise<T[]>;
    /** Get a specific process by ID */
    getProcess(id: number): TProcess | undefined;
    /** Kill all processes */
    kill(): Promise<void>;
}
/**
 * Base interface for process client (running inside each process)
 */
export interface IProcessClient<TClient = any> {
    /** The client instance managed by this process client */
    client: TClient;
    /** Process ID */
    id: number;
    /** Send message to manager */
    send(message: Serializable): Promise<void>;
    /** Request data from manager and wait for response */
    request<T = any>(message: Serializable): Promise<T>;
    /** Evaluate script on manager */
    evalOnManager<T = any>(script: string): Promise<T>;
    /** Trigger ready state */
    triggerReady(): void;
}
//# sourceMappingURL=IProcessManager.d.ts.map