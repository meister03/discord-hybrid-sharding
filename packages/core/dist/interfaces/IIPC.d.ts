import { Serializable } from 'child_process';
/**
 * Message types for IPC communication
 */
export declare enum MessageType {
    MISSING_TYPE = 0,
    CUSTOM_REQUEST = 1,
    CUSTOM_MESSAGE = 2,
    CUSTOM_REPLY = 3,
    HEARTBEAT = 4,
    HEARTBEAT_ACK = 5,
    BROADCAST_REQUEST = 6,
    BROADCAST_RESPONSE = 7,
    PROCESS_RESPAWN = 8,
    PROCESS_RESPAWN_ALL = 9,
    PROCESS_READY = 10,
    EVAL_REQUEST = 11,
    EVAL_RESPONSE = 12,
    MANAGER_EVAL_REQUEST = 13,
    MANAGER_EVAL_RESPONSE = 14
}
/**
 * Base interface for IPC messages
 */
export interface IIPCMessage {
    /** Unique identifier for the message */
    nonce?: string;
    /** Type of the message */
    _type: MessageType;
    /** The actual message data */
    data?: Serializable;
    /** Source process ID */
    _source?: number;
    /** Target process ID */
    _target?: number;
    /** Timestamp */
    timestamp?: number;
}
/**
 * Interface for request messages that expect a response
 */
export interface IIPCRequest extends IIPCMessage {
    /** Request requires a response */
    _type: MessageType.CUSTOM_REQUEST | MessageType.BROADCAST_REQUEST | MessageType.EVAL_REQUEST | MessageType.MANAGER_EVAL_REQUEST;
    /** Timeout for the request */
    timeout?: number;
}
/**
 * Interface for reply messages
 */
export interface IIPCReply extends IIPCMessage {
    /** Reply to a specific request */
    _type: MessageType.CUSTOM_REPLY | MessageType.BROADCAST_RESPONSE | MessageType.EVAL_RESPONSE | MessageType.MANAGER_EVAL_RESPONSE;
    /** The request nonce this reply is for */
    _replyTo: string;
    /** Whether the reply contains an error */
    error?: boolean;
}
/**
 * Interface for IPC handlers
 */
export interface IIPCHandler {
    /** Handle incoming message */
    handleMessage(message: IIPCMessage): Promise<void> | void;
    /** Send message */
    send(message: Serializable): Promise<void> | void;
    /** Send request and wait for reply */
    request<T = any>(message: Serializable, timeout?: number): Promise<T>;
    /** Reply to a request */
    reply(originalMessage: IIPCRequest, data: Serializable): Promise<void> | void;
}
//# sourceMappingURL=IIPC.d.ts.map