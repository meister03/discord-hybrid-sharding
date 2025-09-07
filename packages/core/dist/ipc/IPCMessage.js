"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCReply = exports.IPCRequest = exports.IPCMessage = void 0;
exports.generateNonce = generateNonce;
const IIPC_1 = require("../interfaces/IIPC");
/**
 * Generate a unique nonce for messages
 */
function generateNonce() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
/**
 * Base IPC message implementation
 */
class IPCMessage {
    constructor(type, data, nonce) {
        this.nonce = nonce || generateNonce();
        this._type = type;
        this.data = data ?? undefined;
        this.timestamp = Date.now();
    }
    /**
     * Create a custom message
     */
    static custom(data) {
        return new IPCMessage(IIPC_1.MessageType.CUSTOM_MESSAGE, data);
    }
    /**
     * Create a heartbeat message
     */
    static heartbeat() {
        return new IPCMessage(IIPC_1.MessageType.HEARTBEAT);
    }
    /**
     * Create a heartbeat acknowledgment
     */
    static heartbeatAck() {
        return new IPCMessage(IIPC_1.MessageType.HEARTBEAT_ACK);
    }
    /**
     * Set the source process ID
     */
    setSource(processId) {
        this._source = processId;
        return this;
    }
    /**
     * Set the target process ID
     */
    setTarget(processId) {
        this._target = processId;
        return this;
    }
    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            nonce: this.nonce,
            _type: this._type,
            data: this.data ?? undefined,
            _source: this._source ?? undefined,
            _target: this._target ?? undefined,
            timestamp: this.timestamp,
        };
    }
    /**
     * Create message from plain object
     */
    static fromJSON(obj) {
        const message = new IPCMessage(obj._type, obj.data, obj.nonce);
        if (obj._source !== undefined)
            message._source = obj._source;
        if (obj._target !== undefined)
            message._target = obj._target;
        message.timestamp = obj.timestamp || Date.now();
        return message;
    }
}
exports.IPCMessage = IPCMessage;
/**
 * IPC request message implementation
 */
class IPCRequest extends IPCMessage {
    constructor(type, data, timeout, nonce) {
        super(type, data, nonce);
        this.timeout = timeout ?? undefined;
    }
    /**
     * Create a custom request
     */
    static custom(data, timeout) {
        return new IPCRequest(IIPC_1.MessageType.CUSTOM_REQUEST, data, timeout);
    }
    /**
     * Create a broadcast request
     */
    static broadcast(data, timeout) {
        return new IPCRequest(IIPC_1.MessageType.BROADCAST_REQUEST, data, timeout);
    }
    /**
     * Create an eval request
     */
    static eval(script, context, timeout) {
        return new IPCRequest(IIPC_1.MessageType.EVAL_REQUEST, { script, context }, timeout);
    }
    /**
     * Create a manager eval request
     */
    static managerEval(script, context, timeout) {
        return new IPCRequest(IIPC_1.MessageType.MANAGER_EVAL_REQUEST, { script, context }, timeout);
    }
}
exports.IPCRequest = IPCRequest;
/**
 * IPC reply message implementation
 */
class IPCReply extends IPCMessage {
    constructor(type, replyTo, data, error, nonce) {
        super(type, data, nonce);
        this._replyTo = replyTo;
        this.error = error ?? undefined;
    }
    /**
     * Create a custom reply
     */
    static customReply(replyTo, data) {
        return new IPCReply(IIPC_1.MessageType.CUSTOM_REPLY, replyTo, data);
    }
    /**
     * Create a broadcast response
     */
    static broadcast(replyTo, data) {
        return new IPCReply(IIPC_1.MessageType.BROADCAST_RESPONSE, replyTo, data);
    }
    /**
     * Create an eval response
     */
    static eval(replyTo, result) {
        return new IPCReply(IIPC_1.MessageType.EVAL_RESPONSE, replyTo, result);
    }
    /**
     * Create a manager eval response
     */
    static managerEval(replyTo, result) {
        return new IPCReply(IIPC_1.MessageType.MANAGER_EVAL_RESPONSE, replyTo, result);
    }
    /**
     * Create an error reply
     */
    static error(replyTo, error, type = IIPC_1.MessageType.CUSTOM_REPLY) {
        return new IPCReply(type, replyTo, {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }, true);
    }
}
exports.IPCReply = IPCReply;
//# sourceMappingURL=IPCMessage.js.map