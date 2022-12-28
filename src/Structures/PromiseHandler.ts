import { generateNonce } from '../Util/Util';
import { RawMessage } from './IPCMessage';

export interface StoredPromise {
    resolve(value: any): void;
    reject(error: Error): void;
    options: PromiseCreateOptions;
    timeout?: NodeJS.Timeout;
}

export interface ResolveMessage {
    _error: { message: string; stack: string; name: string };
    _result: any;
    _eval?: string;
    _type?: number;
    nonce: string;
}

export interface PromiseCreateOptions {
    timeout?: number;
}

export class PromiseHandler {
    nonce: Map<string, StoredPromise>;
    constructor() {
        this.nonce = new Map();
    }
    public resolve(message: ResolveMessage) {
        const promise = this.nonce.get(message.nonce);
        if (promise) {
            if (promise.timeout) clearTimeout(promise.timeout);
            this.nonce.delete(message.nonce);
            if (message._error) {
                const error = new Error(message._error.message);
                error.stack = message._error.stack;
                error.name = message._error.name;
                promise.reject(error);
            } else {
                promise.resolve(message._result);
            }
        }
    }

    public async create(
        message: RawMessage & { options?: PromiseCreateOptions; stack?: string },
        options: PromiseCreateOptions,
    ) {
        if (!options) options = {};
        if (Object.keys(options).length === 0 && message.options) options = message.options;
        if (!message.nonce) message.nonce = generateNonce();
        return await new Promise((resolve, reject) => {
            if (options.timeout) {
                const timeout = setTimeout(() => {
                    this.nonce.delete(message.nonce as string);
                    const error = new Error('Promise timed out');
                    error.stack = message.stack || error.stack;
                    reject(error);
                }, options.timeout);
                this.nonce.set(message.nonce as string, { resolve, reject, options, timeout });
            } else this.nonce.set(message.nonce as string, { resolve, reject, options });
        });
    }
}
