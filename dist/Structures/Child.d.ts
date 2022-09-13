/// <reference types="node" />
/// <reference types="node" />
import { ChildProcess, ForkOptions, Serializable } from 'child_process';
export interface ChildProcessOptions extends ForkOptions {
    clusterData: NodeJS.ProcessEnv | undefined;
    args?: string[] | undefined;
}
export declare class Child {
    file: string;
    process: ChildProcess | null;
    processOptions: ForkOptions;
    args?: string[];
    constructor(file: string, options: ChildProcessOptions);
    spawn(): ChildProcess;
    respawn(): ChildProcess;
    kill(): boolean | undefined;
    send(message: Serializable): Promise<unknown>;
}
export declare class ChildClient {
    ipc: NodeJS.Process;
    constructor();
    send(message: Serializable): Promise<void>;
    getData(): NodeJS.ProcessEnv;
}
//# sourceMappingURL=Child.d.ts.map