import { ChildProcess, fork, ForkOptions, Serializable } from 'child_process';
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
export class ChildProcessWrapper implements ISpawnableProcess {
  public readonly file: string;
  public process: ChildProcess | null = null;
  private readonly options: ForkOptions;
  private readonly args: string[];

  constructor(file: string, options: ChildProcessOptions = {}) {
    this.file = file;
    this.args = options.args || [];
    this.options = this.buildForkOptions(options);
  }

  /**
   * Build fork options from process options
   */
  private buildForkOptions(options: ChildProcessOptions): ForkOptions {
    const forkOptions: ForkOptions = {};

    // Set environment variables from process data
    if (options.processData) {
      forkOptions.env = { ...process.env, ...options.processData };
    }

    // Copy relevant options
    if (options.cwd) forkOptions.cwd = options.cwd;
    if (options.detached !== undefined) forkOptions.detached = options.detached;
    if (options.execArgv) forkOptions.execArgv = options.execArgv;
    if (options.env) forkOptions.env = { ...forkOptions.env, ...options.env };
    if (options.execPath) forkOptions.execPath = options.execPath;
    if (options.gid) forkOptions.gid = options.gid;
    if (options.serialization) forkOptions.serialization = options.serialization;
    if (options.signal) forkOptions.signal = options.signal;
    if (options.killSignal) forkOptions.killSignal = options.killSignal;
    if (options.silent !== undefined) forkOptions.silent = options.silent;
    if (options.stdio) forkOptions.stdio = options.stdio;
    if (options.uid) forkOptions.uid = options.uid;
    if (options.windowsVerbatimArguments !== undefined) {
      forkOptions.windowsVerbatimArguments = options.windowsVerbatimArguments;
    }
    if (options.timeout) forkOptions.timeout = options.timeout;

    return forkOptions;
  }

  /**
   * Spawn the child process
   */
  public spawn(): ChildProcess {
    if (this.process) {
      throw new Error('Child process is already spawned');
    }

    this.process = fork(this.file, this.args, this.options);
    return this.process;
  }

  /**
   * Respawn the child process
   */
  public respawn(): ChildProcess {
    this.kill();
    return this.spawn();
  }

  /**
   * Kill the child process
   */
  public kill(): void {
    if (!this.process) {
      return;
    }

    this.process.removeAllListeners();
    
    // Try graceful shutdown first
    if (!this.process.killed) {
      this.process.kill('SIGTERM');
      
      // Force kill after timeout
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    }
    
    this.process = null;
  }

  /**
   * Send message to the child process
   */
  public async send(message: Serializable): Promise<void> {
    if (!this.process) {
      throw new Error('Child process is not spawned');
    }

    return new Promise<void>((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Child process is not spawned'));
        return;
      }

      this.process.send(message, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if the process is spawned
   */
  public get isSpawned(): boolean {
    return this.process !== null && !this.process.killed;
  }

  /**
   * Get the process ID
   */
  public get pid(): number | undefined {
    return this.process?.pid;
  }

  /**
   * Get the exit code (if process has exited)
   */
  public get exitCode(): number | null | undefined {
    return this.process?.exitCode;
  }
}