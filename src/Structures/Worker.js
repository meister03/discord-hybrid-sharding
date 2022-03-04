const Worker_Thread = require('worker_threads').Worker;

class Worker {
    constructor(file, options = {}){
        this.file = file;
        this.process = null;

        this.workerOptions = {};

        // Custom options
        if(options.clusterData) this.workerOptions.workerData = options.clusterData;
        
        if(options.argv) this.workerOptions.argv = options.argv;
        if(options.execArgv) this.workerOptions.execArgv = options.execArgv;
        if(options.env) this.workerOptions.env = options.env;
        if(options.eval) this.workerOptions.eval = options.eval;
        if(options.stdin) this.workerOptions.stdin = options.stdin;
        if(options.stdout) this.workerOptions.stdout = options.stdout;
        if(options.stderr) this.workerOptions.stderr = options.stderr;
        if(options.trackUnmanagedFds) this.workerOptions.trackUnmanagedFds = options.trackUnmanagedFds;
        if(options.transferList) this.workerOptions.transferList = options.transferList;
        if(options.resourceLimits) this.workerOptions.resourceLimits = options.resourceLimits;

    }

    spawn(){
        return this.process = new Worker_Thread(this.file, this.workerOptions);
    }

    respawn(){
        this.kill();
        return this.spawn();
    }

    kill(){
        this.process?.removeAllListeners();
        return this.process?.terminate();
    }

    send(message){
        return new Promise((resolve, reject) => {
            this.process.postMessage(message);
            resolve(this);
        })
    }
}

class WorkerClient{
    constructor(){
        this.ipc = require("worker_threads").parentPort;
    }
    send(message){
        return new Promise((resolve, reject) => {
            this.parentPort.postMessage(message);
            resolve();  
        });
    }

    getData(){
        return  require("worker_threads").workerData;
    }
}



module.exports = {Worker, WorkerClient};