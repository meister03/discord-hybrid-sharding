import { Serializable } from 'child_process';
import { IIPCMessage, IIPCRequest, IIPCReply, MessageType } from '../interfaces/IIPC';

/**
 * Generate a unique nonce for messages
 */
export function generateNonce(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Base IPC message implementation
 */
export class IPCMessage implements IIPCMessage {
  public nonce: string;
  public _type: MessageType;
  public data?: Serializable;
  public _source?: number;
  public _target?: number;
  public timestamp: number;

  constructor(type: MessageType, data?: Serializable, nonce?: string) {
    this.nonce = nonce || generateNonce();
    this._type = type;
    this.data = data ?? undefined;
    this.timestamp = Date.now();
  }

  /**
   * Create a custom message
   */
  static custom(data: Serializable): IPCMessage {
    return new IPCMessage(MessageType.CUSTOM_MESSAGE, data);
  }

  /**
   * Create a heartbeat message
   */
  static heartbeat(): IPCMessage {
    return new IPCMessage(MessageType.HEARTBEAT);
  }

  /**
   * Create a heartbeat acknowledgment
   */
  static heartbeatAck(): IPCMessage {
    return new IPCMessage(MessageType.HEARTBEAT_ACK);
  }

  /**
   * Set the source process ID
   */
  setSource(processId: number): this {
    this._source = processId;
    return this;
  }

  /**
   * Set the target process ID
   */
  setTarget(processId: number): this {
    this._target = processId;
    return this;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): IIPCMessage {
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
  static fromJSON(obj: IIPCMessage): IPCMessage {
    const message = new IPCMessage(obj._type, obj.data, obj.nonce);
    if (obj._source !== undefined) message._source = obj._source;
    if (obj._target !== undefined) message._target = obj._target;
    message.timestamp = obj.timestamp || Date.now();
    return message;
  }
}

/**
 * IPC request message implementation
 */
export class IPCRequest extends IPCMessage implements IIPCRequest {
  public timeout?: number;
  public declare _type: MessageType.CUSTOM_REQUEST | MessageType.BROADCAST_REQUEST | MessageType.EVAL_REQUEST | MessageType.MANAGER_EVAL_REQUEST;

  constructor(type: MessageType.CUSTOM_REQUEST | MessageType.BROADCAST_REQUEST | MessageType.EVAL_REQUEST | MessageType.MANAGER_EVAL_REQUEST, data?: Serializable, timeout?: number, nonce?: string) {
    super(type, data, nonce);
    this.timeout = timeout ?? undefined;
  }

  /**
   * Create a custom request
   */
  static override custom(data: Serializable, timeout?: number): IPCRequest {
    return new IPCRequest(MessageType.CUSTOM_REQUEST, data, timeout);
  }

  /**
   * Create a broadcast request
   */
  static broadcast(data: Serializable, timeout?: number): IPCRequest {
    return new IPCRequest(MessageType.BROADCAST_REQUEST, data, timeout);
  }

  /**
   * Create an eval request
   */
  static eval(script: string, context?: any, timeout?: number): IPCRequest {
    return new IPCRequest(MessageType.EVAL_REQUEST, { script, context }, timeout);
  }

  /**
   * Create a manager eval request
   */
  static managerEval(script: string, context?: any, timeout?: number): IPCRequest {
    return new IPCRequest(MessageType.MANAGER_EVAL_REQUEST, { script, context }, timeout);
  }
}

/**
 * IPC reply message implementation
 */
export class IPCReply extends IPCMessage implements IIPCReply {
  public _replyTo: string;
  public error?: boolean;
  public declare _type: MessageType.CUSTOM_REPLY | MessageType.BROADCAST_RESPONSE | MessageType.EVAL_RESPONSE | MessageType.MANAGER_EVAL_RESPONSE;

  constructor(type: MessageType.CUSTOM_REPLY | MessageType.BROADCAST_RESPONSE | MessageType.EVAL_RESPONSE | MessageType.MANAGER_EVAL_RESPONSE, replyTo: string, data?: Serializable, error?: boolean, nonce?: string) {
    super(type, data, nonce);
    this._replyTo = replyTo;
    this.error = error ?? undefined;
  }

  /**
   * Create a custom reply
   */
  static customReply(replyTo: string, data: Serializable): IPCReply {
    return new IPCReply(MessageType.CUSTOM_REPLY, replyTo, data);
  }

  /**
   * Create a broadcast response
   */
  static broadcast(replyTo: string, data: Serializable): IPCReply {
    return new IPCReply(MessageType.BROADCAST_RESPONSE, replyTo, data);
  }

  /**
   * Create an eval response
   */
  static eval(replyTo: string, result: any): IPCReply {
    return new IPCReply(MessageType.EVAL_RESPONSE, replyTo, result);
  }

  /**
   * Create a manager eval response
   */
  static managerEval(replyTo: string, result: any): IPCReply {
    return new IPCReply(MessageType.MANAGER_EVAL_RESPONSE, replyTo, result);
  }

  /**
   * Create an error reply
   */
  static error(replyTo: string, error: Error, type: MessageType.CUSTOM_REPLY | MessageType.BROADCAST_RESPONSE | MessageType.EVAL_RESPONSE | MessageType.MANAGER_EVAL_RESPONSE = MessageType.CUSTOM_REPLY): IPCReply {
    return new IPCReply(type, replyTo, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }, true);
  }
}