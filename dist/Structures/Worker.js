"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerClient = exports.Worker = void 0;
const worker_threads_1 = require("worker_threads");
class Worker {
    file;
    process;
    workerOptions;
    constructor(file, options) {
        this.file = file;
        this.process = null;
        this.workerOptions = {};
        // Custom options
        if (options.clusterData)
            this.workerOptions.workerData = options.clusterData;
        if (options.argv)
            this.workerOptions.argv = options.argv;
        if (options.execArgv)
            this.workerOptions.execArgv = options.execArgv;
        if (options.env)
            this.workerOptions.env = options.env;
        if (options.eval)
            this.workerOptions.eval = options.eval;
        if (options.stdin)
            this.workerOptions.stdin = options.stdin;
        if (options.stdout)
            this.workerOptions.stdout = options.stdout;
        if (options.stderr)
            this.workerOptions.stderr = options.stderr;
        if (options.trackUnmanagedFds)
            this.workerOptions.trackUnmanagedFds = options.trackUnmanagedFds;
        if (options.transferList)
            this.workerOptions.transferList = options.transferList;
        if (options.resourceLimits)
            this.workerOptions.resourceLimits = options.resourceLimits;
    }
    spawn() {
        return (this.process = new worker_threads_1.Worker(this.file, this.workerOptions));
    }
    respawn() {
        this.kill();
        return this.spawn();
    }
    kill() {
        this.process?.removeAllListeners();
        return this.process?.terminate();
    }
    send(message) {
        return new Promise(resolve => {
            this.process?.postMessage(message);
            resolve(this);
        });
    }
}
exports.Worker = Worker;
class WorkerClient {
    ipc;
    constructor() {
        this.ipc = worker_threads_1.parentPort;
    }
    send(message) {
        return new Promise(resolve => {
            this.ipc?.postMessage(message);
            resolve();
        });
    }
    getData() {
        return worker_threads_1.workerData;
    }
}
exports.WorkerClient = WorkerClient;
