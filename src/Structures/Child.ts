import { ChildProcess, fork, ForkOptions, Serializable } from 'child_process';

export interface ChildProcessOptions extends ForkOptions {
    clusterData: NodeJS.ProcessEnv | undefined;
    args?: string[] | undefined;
}

export class Child {
    file: string;
    process: ChildProcess | null;
    processOptions: ForkOptions;
    args?: string[];
    constructor(file: string, options: ChildProcessOptions) {
        this.file = file;
        this.process = null;

        this.processOptions = {};

        // Custom options
        if (options.clusterData) this.processOptions.env = options.clusterData;

        if (options.args) this.args = options.args;

        if (options.cwd) this.processOptions.cwd = options.cwd;
        if (options.detached) this.processOptions.detached = options.detached;
        if (options.execArgv) this.processOptions.execArgv = options.execArgv;
        if (options.env) this.processOptions.env = options.env;
        if (options.execPath) this.processOptions.execPath = options.execPath;
        if (options.gid) this.processOptions.gid = options.gid;

        if (options.serialization) this.processOptions.serialization = options.serialization;
        if (options.signal) this.processOptions.signal = options.signal;
        if (options.killSignal) this.processOptions.killSignal = options.killSignal;
        if (options.silent) this.processOptions.silent = options.silent;

        if (options.stdio) this.processOptions.stdio = options.stdio;
        if (options.uid) this.processOptions.uid = options.uid;

        if (options.windowsVerbatimArguments)
            this.processOptions.windowsVerbatimArguments = options.windowsVerbatimArguments;
        if (options.timeout) this.processOptions.timeout = options.timeout;
    }

    public spawn() {
        return (this.process = fork(this.file, this.args, this.processOptions));
    }

    public respawn() {
        this.kill();
        return this.spawn();
    }

    public kill() {
        this.process?.removeAllListeners();
        return this.process?.kill();
    }

    public send(message: Serializable) {
        return new Promise((resolve, reject) => {
            this.process?.send(message, err => {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
}

export class ChildClient {
    ipc: NodeJS.Process;
    constructor() {
        this.ipc = process;
    }
    public send(message: Serializable) {
        const process = this.ipc;
        return new Promise<void>((resolve, reject) => {
            process.send?.(message, (err: Error) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    public getData() {
        return process.env;
    }
}
