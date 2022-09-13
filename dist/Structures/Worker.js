"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerClient = exports.Worker = void 0;
var worker_threads_1 = require("worker_threads");
var Worker = (function () {
    function Worker(file, options) {
        this.file = file;
        this.process = null;
        this.workerOptions = {};
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
    Worker.prototype.spawn = function () {
        return (this.process = new worker_threads_1.Worker(this.file, this.workerOptions));
    };
    Worker.prototype.respawn = function () {
        this.kill();
        return this.spawn();
    };
    Worker.prototype.kill = function () {
        var _a, _b;
        (_a = this.process) === null || _a === void 0 ? void 0 : _a.removeAllListeners();
        return (_b = this.process) === null || _b === void 0 ? void 0 : _b.terminate();
    };
    Worker.prototype.send = function (message) {
        var _this = this;
        return new Promise(function (resolve) {
            var _a;
            (_a = _this.process) === null || _a === void 0 ? void 0 : _a.postMessage(message);
            resolve(_this);
        });
    };
    return Worker;
}());
exports.Worker = Worker;
var WorkerClient = (function () {
    function WorkerClient() {
        this.ipc = worker_threads_1.parentPort;
    }
    WorkerClient.prototype.send = function (message) {
        var _this = this;
        return new Promise(function (resolve) {
            var _a;
            (_a = _this.ipc) === null || _a === void 0 ? void 0 : _a.postMessage(message);
            resolve();
        });
    };
    WorkerClient.prototype.getData = function () {
        return worker_threads_1.workerData;
    };
    return WorkerClient;
}());
exports.WorkerClient = WorkerClient;
