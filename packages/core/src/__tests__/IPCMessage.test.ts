import { IPCMessage, IPCRequest, IPCReply, generateNonce } from '../ipc/IPCMessage';
import { MessageType } from '../interfaces/IIPC';

describe('IPCMessage', () => {
  describe('generateNonce', () => {
    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      
      expect(nonce1).toBeTruthy();
      expect(nonce2).toBeTruthy();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('IPCMessage', () => {
    it('should create a basic message', () => {
      const data = { test: 'value' };
      const message = new IPCMessage(MessageType.CUSTOM_MESSAGE, data);
      
      expect(message._type).toBe(MessageType.CUSTOM_MESSAGE);
      expect(message.data).toEqual(data);
      expect(message.nonce).toBeTruthy();
      expect(message.timestamp).toBeGreaterThan(0);
    });

    it('should create static messages', () => {
      const customMessage = IPCMessage.custom({ test: 'data' });
      expect(customMessage._type).toBe(MessageType.CUSTOM_MESSAGE);
      
      const heartbeat = IPCMessage.heartbeat();
      expect(heartbeat._type).toBe(MessageType.HEARTBEAT);
      
      const heartbeatAck = IPCMessage.heartbeatAck();
      expect(heartbeatAck._type).toBe(MessageType.HEARTBEAT_ACK);
    });

    it('should set source and target', () => {
      const message = new IPCMessage(MessageType.CUSTOM_MESSAGE);
      
      message.setSource(1);
      message.setTarget(2);
      
      expect(message._source).toBe(1);
      expect(message._target).toBe(2);
    });

    it('should serialize and deserialize', () => {
      const original = new IPCMessage(MessageType.CUSTOM_MESSAGE, { test: 'value' });
      original.setSource(1).setTarget(2);
      
      const json = original.toJSON();
      const restored = IPCMessage.fromJSON(json);
      
      expect(restored._type).toBe(original._type);
      expect(restored.data).toEqual(original.data);
      expect(restored.nonce).toBe(original.nonce);
      expect(restored._source).toBe(original._source);
      expect(restored._target).toBe(original._target);
    });
  });

  describe('IPCRequest', () => {
    it('should create request messages', () => {
      const request = IPCRequest.custom({ action: 'test' }, 5000);
      
      expect(request._type).toBe(MessageType.CUSTOM_REQUEST);
      expect(request.data).toEqual({ action: 'test' });
      expect(request.timeout).toBe(5000);
    });

    it('should create different request types', () => {
      const broadcast = IPCRequest.broadcast({ msg: 'hello' });
      expect(broadcast._type).toBe(MessageType.BROADCAST_REQUEST);
      
      const evalReq = IPCRequest.eval('1 + 1', { context: 'test' });
      expect(evalReq._type).toBe(MessageType.EVAL_REQUEST);
      expect(evalReq.data).toEqual({ script: '1 + 1', context: { context: 'test' } });
      
      const managerEval = IPCRequest.managerEval('process.version');
      expect(managerEval._type).toBe(MessageType.MANAGER_EVAL_REQUEST);
    });
  });

  describe('IPCReply', () => {
    it('should create reply messages', () => {
      const originalNonce = generateNonce();
      const reply = IPCReply.customReply(originalNonce, { result: 'success' });
      
      expect(reply._type).toBe(MessageType.CUSTOM_REPLY);
      expect(reply._replyTo).toBe(originalNonce);
      expect(reply.data).toEqual({ result: 'success' });
      expect(reply.error).toBeUndefined();
    });

    it('should create different reply types', () => {
      const nonce = generateNonce();
      
      const broadcast = IPCReply.broadcast(nonce, { result: 'done' });
      expect(broadcast._type).toBe(MessageType.BROADCAST_RESPONSE);
      
      const evalReply = IPCReply.eval(nonce, 42);
      expect(evalReply._type).toBe(MessageType.EVAL_RESPONSE);
      
      const managerEval = IPCReply.managerEval(nonce, 'result');
      expect(managerEval._type).toBe(MessageType.MANAGER_EVAL_RESPONSE);
    });

    it('should create error replies', () => {
      const nonce = generateNonce();
      const error = new Error('Test error');
      const errorReply = IPCReply.error(nonce, error);
      
      expect(errorReply._replyTo).toBe(nonce);
      expect(errorReply.error).toBe(true);
      expect(errorReply.data).toEqual({
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    });
  });
});