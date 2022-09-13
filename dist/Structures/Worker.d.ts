/// <reference types="node" />
/// <reference types="node" />
import { Serializable } from 'child_process';
import { Worker as Worker_Thread, WorkerOptions, parentPort } from 'worker_threads';
export interface WorkerThreadOptions extends WorkerOptions {
    clusterData: any;
}
export declare class Worker {
    file: string;
    process: Worker_Thread | null;
    workerOptions: WorkerOptions;
    constructor(file: string, options: WorkerThreadOptions);
    spawn(): Worker_Thread;
    respawn(): Worker_Thread;
    kill(): Promise<number> | undefined;
    send(message: Serializable): Promise<unknown>;
}
export declare class WorkerClient {
    ipc: typeof parentPort;
    constructor();
    send(message: Serializable): Promise<void>;
    getData(): any;
}
//# sourceMappingURL=Worker.d.ts.map