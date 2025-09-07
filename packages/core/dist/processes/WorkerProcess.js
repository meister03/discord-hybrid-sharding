"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerProcess = void 0;
const worker_threads_1 = require("worker_threads");
/**
 * Worker process implementation using worker threads
 */
class WorkerProcess {
    constructor(file, options = {}) {
        this.process = null;
        this.file = file;
        this.options = this.buildWorkerOptions(options);
    }
    /**
     * Build worker options from process options
     */
    buildWorkerOptions(options) {
        const workerOptions = {};
        // Set worker data from process data
        if (options.processData) {
            workerOptions.workerData = options.processData;
        }
        // Copy relevant options
        if (options.argv)
            workerOptions.argv = options.argv;
        if (options.execArgv)
            workerOptions.execArgv = options.execArgv;
        if (options.env)
            workerOptions.env = options.env;
        if (options.eval !== undefined)
            workerOptions.eval = options.eval;
        if (options.stdin !== undefined)
            workerOptions.stdin = options.stdin;
        if (options.stdout !== undefined)
            workerOptions.stdout = options.stdout;
        if (options.stderr !== undefined)
            workerOptions.stderr = options.stderr;
        if (options.trackUnmanagedFds !== undefined)
            workerOptions.trackUnmanagedFds = options.trackUnmanagedFds;
        if (options.transferList)
            workerOptions.transferList = options.transferList;
        if (options.resourceLimits)
            workerOptions.resourceLimits = options.resourceLimits;
        return workerOptions;
    }
    /**
     * Spawn the worker thread
     */
    spawn() {
        if (this.process) {
            throw new Error('Worker process is already spawned');
        }
        this.process = new worker_threads_1.Worker(this.file, this.options);
        return this.process;
    }
    /**
     * Respawn the worker thread
     */
    respawn() {
        this.kill();
        return this.spawn();
    }
    /**
     * Kill the worker thread
     */
    async kill() {
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
    async send(message) {
        if (!this.process) {
            throw new Error('Worker process is not spawned');
        }
        return new Promise((resolve, reject) => {
            try {
                this.process.postMessage(message);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Check if the worker is spawned
     */
    get isSpawned() {
        return this.process !== null;
    }
    /**
     * Get the worker thread ID
     */
    get threadId() {
        return this.process?.threadId;
    }
}
exports.WorkerProcess = WorkerProcess;
//# sourceMappingURL=WorkerProcess.js.map