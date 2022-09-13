/// <reference types="node" />
/// <reference types="node" />
import { RawMessage } from '../Structures/IPCMessage';
import { Awaitable, ClusterClientEvents, evalOptions, Serialized } from '../types/shared';
import { ClusterManager as Manager } from '../Core/ClusterManager';
import { WorkerClient } from '../Structures/Worker';
import { ChildClient } from '../Structures/Child';
import { PromiseHandler } from '../Structures/PromiseHandler';
import EventEmitter from 'events';
import { Serializable } from 'child_process';
export declare class ClusterClient extends EventEmitter {
    client: any;
    mode: 'process' | 'worker';
    queue: {
        mode: 'auto' | string | undefined;
    };
    maintenance: string | undefined | Boolean;
    ready: boolean;
    process: ChildClient | WorkerClient | null;
    messageHandler: any;
    promise: PromiseHandler;
    constructor(client: any);
    get id(): number;
    get ids(): any;
    get count(): number;
    get info(): import("../Structures/Data").ClusterClientData;
    send(message: Serializable): Promise<void> | undefined;
    fetchClientValues(prop: string, cluster: number): Promise<any>;
    evalOnManager(script: string): Promise<any[]>;
    evalOnManager(script: string, options?: evalOptions): Promise<any>;
    evalOnManager<T>(fn: (manager: Manager) => T, options?: evalOptions): Promise<T>;
    evalOnManager<T>(fn: (manager: Manager) => T, options?: evalOptions): Promise<any[]>;
    broadcastEval(script: string): Promise<any[]>;
    broadcastEval(script: string, options?: evalOptions): Promise<any>;
    broadcastEval<T>(fn: (client: ClusterClient['client']) => Awaitable<T>): Promise<Serialized<T>[]>;
    broadcastEval<T>(fn: (client: ClusterClient['client']) => Awaitable<T>, options?: evalOptions): Promise<Serialized<T>>;
    broadcastEval<T, P>(fn: (client: ClusterClient['client'], context: Serialized<P>) => Awaitable<T>, options?: evalOptions<P>): Promise<Serialized<T>[]>;
    broadcastEval<T, P>(fn: (client: ClusterClient['client'], context: Serialized<P>) => Awaitable<T>, options?: evalOptions<P>): Promise<Serialized<T>>;
    request(message: RawMessage): Promise<unknown>;
    respawnAll({ clusterDelay, respawnDelay, timeout }?: {
        clusterDelay?: number | undefined;
        respawnDelay?: number | undefined;
        timeout?: number | undefined;
    }): Promise<void> | undefined;
    private _handleMessage;
    _eval(script: string): Promise<any>;
    _respond(type: string, message: Serializable): void;
    triggerReady(): boolean;
    triggerClusterReady(): boolean;
    triggerMaintenance(maintenance: string, all?: boolean): string;
    spawnNextCluster(): Promise<void> | undefined;
    static getInfo(): import("../Structures/Data").ClusterClientData;
}
export interface ClusterClient {
    emit: (<K extends keyof ClusterClientEvents>(event: K, ...args: ClusterClientEvents[K]) => boolean) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents>, ...args: any[]) => boolean);
    off: (<K extends keyof ClusterClientEvents>(event: K, listener: (...args: ClusterClientEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents>, listener: (...args: any[]) => void) => this);
    on: (<K extends keyof ClusterClientEvents>(event: K, listener: (...args: ClusterClientEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents>, listener: (...args: any[]) => void) => this);
    once: (<K extends keyof ClusterClientEvents>(event: K, listener: (...args: ClusterClientEvents[K]) => void) => this) & (<S extends string | symbol>(event: Exclude<S, keyof ClusterClientEvents>, listener: (...args: any[]) => void) => this);
    removeAllListeners: (<K extends keyof ClusterClientEvents>(event?: K) => this) & (<S extends string | symbol>(event?: Exclude<S, keyof ClusterClientEvents>) => this);
}
//# sourceMappingURL=ClusterClient.d.ts.map