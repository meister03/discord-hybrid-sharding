"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildProcessWrapper = void 0;
const child_process_1 = require("child_process");
/**
 * Child process implementation using Node.js child_process.fork
 */
class ChildProcessWrapper {
    constructor(file, options = {}) {
        this.process = null;
        this.file = file;
        this.args = options.args || [];
        this.options = this.buildForkOptions(options);
    }
    /**
     * Build fork options from process options
     */
    buildForkOptions(options) {
        const forkOptions = {};
        // Set environment variables from process data
        if (options.processData) {
            forkOptions.env = { ...process.env, ...options.processData };
        }
        // Copy relevant options
        if (options.cwd)
            forkOptions.cwd = options.cwd;
        if (options.detached !== undefined)
            forkOptions.detached = options.detached;
        if (options.execArgv)
            forkOptions.execArgv = options.execArgv;
        if (options.env)
            forkOptions.env = { ...forkOptions.env, ...options.env };
        if (options.execPath)
            forkOptions.execPath = options.execPath;
        if (options.gid)
            forkOptions.gid = options.gid;
        if (options.serialization)
            forkOptions.serialization = options.serialization;
        if (options.signal)
            forkOptions.signal = options.signal;
        if (options.killSignal)
            forkOptions.killSignal = options.killSignal;
        if (options.silent !== undefined)
            forkOptions.silent = options.silent;
        if (options.stdio)
            forkOptions.stdio = options.stdio;
        if (options.uid)
            forkOptions.uid = options.uid;
        if (options.windowsVerbatimArguments !== undefined) {
            forkOptions.windowsVerbatimArguments = options.windowsVerbatimArguments;
        }
        if (options.timeout)
            forkOptions.timeout = options.timeout;
        return forkOptions;
    }
    /**
     * Spawn the child process
     */
    spawn() {
        if (this.process) {
            throw new Error('Child process is already spawned');
        }
        this.process = (0, child_process_1.fork)(this.file, this.args, this.options);
        return this.process;
    }
    /**
     * Respawn the child process
     */
    respawn() {
        this.kill();
        return this.spawn();
    }
    /**
     * Kill the child process
     */
    kill() {
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
    async send(message) {
        if (!this.process) {
            throw new Error('Child process is not spawned');
        }
        return new Promise((resolve, reject) => {
            if (!this.process) {
                reject(new Error('Child process is not spawned'));
                return;
            }
            this.process.send(message, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Check if the process is spawned
     */
    get isSpawned() {
        return this.process !== null && !this.process.killed;
    }
    /**
     * Get the process ID
     */
    get pid() {
        return this.process?.pid;
    }
    /**
     * Get the exit code (if process has exited)
     */
    get exitCode() {
        return this.process?.exitCode;
    }
}
exports.ChildProcessWrapper = ChildProcessWrapper;
//# sourceMappingURL=ChildProcess.js.map