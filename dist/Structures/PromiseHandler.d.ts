/// <reference types="node" />
import { RawMessage } from './IPCMessage';
export interface StoredPromise {
    resolve(value: any): void;
    reject(error: Error): void;
    options: PromiseCreateOptions;
    timeout?: NodeJS.Timeout;
}
export interface ResolveMessage {
    _error: {
        message: string;
        stack: string;
        name: string;
    };
    _result: any;
    _eval?: string;
    _type?: number;
    nonce: string;
}
export interface PromiseCreateOptions {
    timeout?: number;
}
export declare class PromiseHandler {
    nonce: Map<string, StoredPromise>;
    constructor();
    resolve(message: ResolveMessage): void;
    create(message: RawMessage & {
        options?: PromiseCreateOptions;
        stack?: string;
    }, options: PromiseCreateOptions): Promise<unknown>;
}
//# sourceMappingURL=PromiseHandler.d.ts.map