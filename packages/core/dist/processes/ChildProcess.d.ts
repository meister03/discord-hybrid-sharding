import { ChildProcess, ForkOptions, Serializable } from 'child_process';
import { ISpawnableProcess, IProcessOptions } from '../interfaces/IProcessManager';
/**
 * Options for child processes
 */
export interface ChildProcessOptions extends IProcessOptions, ForkOptions {
    /** Data to pass to the child process as environment variables */
    processData?: NodeJS.ProcessEnv;
    /** Additional command line arguments */
    args?: string[];
}
/**
 * Child process implementation using Node.js child_process.fork
 */
export declare class ChildProcessWrapper implements ISpawnableProcess {
    readonly file: string;
    process: ChildProcess | null;
    private readonly options;
    private readonly args;
    constructor(file: string, options?: ChildProcessOptions);
    /**
     * Build fork options from process options
     */
    private buildForkOptions;
    /**
     * Spawn the child process
     */
    spawn(): ChildProcess;
    /**
     * Respawn the child process
     */
    respawn(): ChildProcess;
    /**
     * Kill the child process
     */
    kill(): void;
    /**
     * Send message to the child process
     */
    send(message: Serializable): Promise<void>;
    /**
     * Check if the process is spawned
     */
    get isSpawned(): boolean;
    /**
     * Get the process ID
     */
    get pid(): number | undefined;
    /**
     * Get the exit code (if process has exited)
     */
    get exitCode(): number | null | undefined;
}
//# sourceMappingURL=ChildProcess.d.ts.map