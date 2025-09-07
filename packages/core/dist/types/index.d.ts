import { ChildProcess } from 'child_process';
import { Worker } from 'worker_threads';
import { ISpawnableProcess } from '../interfaces/IProcessManager';
import { MessageType } from '../interfaces/IIPC';
/**
 * Process mode - either worker threads or child processes
 */
export type ProcessMode = 'worker' | 'process';
/**
 * Union type for process instances
 */
export type ProcessInstance = ChildProcess | Worker;
/**
 * Awaitable type utility
 */
export type Awaitable<T> = T | Promise<T>;
/**
 * Serialized type utility
 */
export type Serialized<T> = T extends symbol | bigint | (() => any) | undefined ? never : T extends string | number | boolean | null ? T : T extends any[] ? Serialized<T[0]>[] : T extends Record<string, any> ? {
    [K in keyof T]: Serialized<T[K]>;
} : never;
/**
 * Options for evaluation
 */
export interface EvalOptions<T = object> {
    /** Target process ID(s) */
    processId?: number | number[];
    /** Context to pass to the evaluation */
    context?: T;
    /** Timeout for the evaluation */
    timeout?: number;
    /** Message type for internal use */
    _type?: MessageType;
}
/**
 * Process restart configuration
 */
export interface ProcessRestartOptions {
    /** Maximum number of restarts allowed */
    max: number;
    /** Time interval to reset restart count (in milliseconds) */
    interval: number;
    /** Current restart count */
    current?: number;
}
/**
 * Queue options
 */
export interface CoreQueueOptions {
    /** Whether to auto-start the queue */
    auto?: boolean;
    /** Delay between processing items (in milliseconds) */
    delay?: number;
}
/**
 * Process kill options
 */
export interface ProcessKillOptions {
    /** Reason for killing */
    reason?: string;
    /** Timeout before force kill (in milliseconds) */
    timeout?: number;
}
/**
 * Generic plugin interface
 */
export interface IPlugin<TManager = any> {
    /** Plugin name */
    name: string;
    /** Initialize the plugin */
    init(manager: TManager): void | Promise<void>;
    /** Cleanup the plugin */
    destroy?(): void | Promise<void>;
}
/**
 * Events emitted by process managers
 */
export interface ProcessManagerEvents<TProcess extends ISpawnableProcess = ISpawnableProcess> {
    /** Process created */
    processCreate: [process: TProcess];
    /** Process ready */
    processReady: [process: TProcess];
    /** Process died */
    processDeath: [process: TProcess, instance: ProcessInstance | null];
    /** Process error */
    processError: [process: TProcess, error: Error];
    /** Debug message */
    debug: [message: string];
    /** Manager ready */
    ready: [];
}
/**
 * Events emitted by process clients
 */
export interface ProcessClientEvents<TClient = any> {
    /** Message received */
    message: [message: any];
    /** Client ready */
    ready: [client: TClient];
    /** Error occurred */
    error: [error: Error];
    /** Debug message */
    debug: [message: string];
}
//# sourceMappingURL=index.d.ts.map