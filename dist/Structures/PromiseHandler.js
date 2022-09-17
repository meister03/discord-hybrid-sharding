import { generateNonce } from '../Util/Util';
export class PromiseHandler {
    nonce;
    constructor() {
        this.nonce = new Map();
    }
    resolve(message) {
        const promise = this.nonce.get(message.nonce);
        if (promise) {
            if (promise.timeout)
                clearTimeout(promise.timeout);
            this.nonce.delete(message.nonce);
            if (message._error) {
                const error = new Error(message._error.message);
                error.stack = message._error.stack;
                error.name = message._error.name;
                promise.reject(error);
            }
            else {
                promise.resolve(message._result);
            }
        }
    }
    async create(message, options) {
        if (Object.keys(options).length === 0 && message.options)
            options = message.options;
        if (!message.nonce)
            message.nonce = generateNonce();
        return await new Promise((resolve, reject) => {
            if (options.timeout) {
                const timeout = setTimeout(() => {
                    this.nonce.delete(message.nonce);
                    const error = new Error('Promise timed out');
                    error.stack = message.stack || error.stack;
                    reject(error);
                }, options.timeout);
                this.nonce.set(message.nonce, { resolve, reject, options, timeout });
            }
            else
                this.nonce.set(message.nonce, { resolve, reject, options });
        });
    }
}
