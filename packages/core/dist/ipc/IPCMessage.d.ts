import { Serializable } from 'child_process';
import { IIPCMessage, IIPCRequest, IIPCReply, MessageType } from '../interfaces/IIPC';
/**
 * Generate a unique nonce for messages
 */
export declare function generateNonce(): string;
/**
 * Base IPC message implementation
 */
export declare class IPCMessage implements IIPCMessage {
    nonce: string;
    _type: MessageType;
    data?: Serializable;
    _source?: number;
    _target?: number;
    timestamp: number;
    constructor(type: MessageType, data?: Serializable, nonce?: string);
    /**
     * Create a custom message
     */
    static custom(data: Serializable): IPCMessage;
    /**
     * Create a heartbeat message
     */
    static heartbeat(): IPCMessage;
    /**
     * Create a heartbeat acknowledgment
     */
    static heartbeatAck(): IPCMessage;
    /**
     * Set the source process ID
     */
    setSource(processId: number): this;
    /**
     * Set the target process ID
     */
    setTarget(processId: number): this;
    /**
     * Convert to plain object for serialization
     */
    toJSON(): IIPCMessage;
    /**
     * Create message from plain object
     */
    static fromJSON(obj: IIPCMessage): IPCMessage;
}
/**
 * IPC request message implementation
 */
export declare class IPCRequest extends IPCMessage implements IIPCRequest {
    timeout?: number;
    _type: MessageType.CUSTOM_REQUEST | MessageType.BROADCAST_REQUEST | MessageType.EVAL_REQUEST | MessageType.MANAGER_EVAL_REQUEST;
    constructor(type: MessageType.CUSTOM_REQUEST | MessageType.BROADCAST_REQUEST | MessageType.EVAL_REQUEST | MessageType.MANAGER_EVAL_REQUEST, data?: Serializable, timeout?: number, nonce?: string);
    /**
     * Create a custom request
     */
    static custom(data: Serializable, timeout?: number): IPCRequest;
    /**
     * Create a broadcast request
     */
    static broadcast(data: Serializable, timeout?: number): IPCRequest;
    /**
     * Create an eval request
     */
    static eval(script: string, context?: any, timeout?: number): IPCRequest;
    /**
     * Create a manager eval request
     */
    static managerEval(script: string, context?: any, timeout?: number): IPCRequest;
}
/**
 * IPC reply message implementation
 */
export declare class IPCReply extends IPCMessage implements IIPCReply {
    _replyTo: string;
    error?: boolean;
    _type: MessageType.CUSTOM_REPLY | MessageType.BROADCAST_RESPONSE | MessageType.EVAL_RESPONSE | MessageType.MANAGER_EVAL_RESPONSE;
    constructor(type: MessageType.CUSTOM_REPLY | MessageType.BROADCAST_RESPONSE | MessageType.EVAL_RESPONSE | MessageType.MANAGER_EVAL_RESPONSE, replyTo: string, data?: Serializable, error?: boolean, nonce?: string);
    /**
     * Create a custom reply
     */
    static customReply(replyTo: string, data: Serializable): IPCReply;
    /**
     * Create a broadcast response
     */
    static broadcast(replyTo: string, data: Serializable): IPCReply;
    /**
     * Create an eval response
     */
    static eval(replyTo: string, result: any): IPCReply;
    /**
     * Create a manager eval response
     */
    static managerEval(replyTo: string, result: any): IPCReply;
    /**
     * Create an error reply
     */
    static error(replyTo: string, error: Error, type?: MessageType.CUSTOM_REPLY | MessageType.BROADCAST_RESPONSE | MessageType.EVAL_RESPONSE | MessageType.MANAGER_EVAL_RESPONSE): IPCReply;
}
//# sourceMappingURL=IPCMessage.d.ts.map