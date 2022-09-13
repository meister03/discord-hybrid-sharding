"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildClient = exports.Child = void 0;
var child_process_1 = require("child_process");
var Child = (function () {
    function Child(file, options) {
        this.file = file;
        this.process = null;
        this.processOptions = {};
        if (options.clusterData)
            this.processOptions.env = options.clusterData;
        if (options.args)
            this.args = options.args;
        if (options.cwd)
            this.processOptions.cwd = options.cwd;
        if (options.detached)
            this.processOptions.detached = options.detached;
        if (options.execArgv)
            this.processOptions.execArgv = options.execArgv;
        if (options.env)
            this.processOptions.env = options.env;
        if (options.execPath)
            this.processOptions.execPath = options.execPath;
        if (options.gid)
            this.processOptions.gid = options.gid;
        if (options.serialization)
            this.processOptions.serialization = options.serialization;
        if (options.signal)
            this.processOptions.signal = options.signal;
        if (options.killSignal)
            this.processOptions.killSignal = options.killSignal;
        if (options.silent)
            this.processOptions.silent = options.silent;
        if (options.stdio)
            this.processOptions.stdio = options.stdio;
        if (options.uid)
            this.processOptions.uid = options.uid;
        if (options.windowsVerbatimArguments)
            this.processOptions.windowsVerbatimArguments = options.windowsVerbatimArguments;
        if (options.timeout)
            this.processOptions.timeout = options.timeout;
    }
    Child.prototype.spawn = function () {
        return (this.process = (0, child_process_1.fork)(this.file, this.args, this.processOptions));
    };
    Child.prototype.respawn = function () {
        this.kill();
        return this.spawn();
    };
    Child.prototype.kill = function () {
        var _a, _b;
        (_a = this.process) === null || _a === void 0 ? void 0 : _a.removeAllListeners();
        return (_b = this.process) === null || _b === void 0 ? void 0 : _b.kill();
    };
    Child.prototype.send = function (message) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a;
            (_a = _this.process) === null || _a === void 0 ? void 0 : _a.send(message, function (err) {
                if (err)
                    reject(err);
                else
                    resolve(_this);
            });
        });
    };
    return Child;
}());
exports.Child = Child;
var ChildClient = (function () {
    function ChildClient() {
        this.ipc = process;
    }
    ChildClient.prototype.send = function (message) {
        var process = this.ipc;
        return new Promise(function (resolve, reject) {
            var _a;
            (_a = process.send) === null || _a === void 0 ? void 0 : _a.call(process, message, function (err) {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    };
    ChildClient.prototype.getData = function () {
        return process.env;
    };
    return ChildClient;
}());
exports.ChildClient = ChildClient;
