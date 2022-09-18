"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCMessage = exports.BaseMessage = void 0;
const Util_1 = require("../Util/Util");
const shared_1 = require("../types/shared");
class BaseMessage {
    nonce;
    _raw;
    constructor(message) {
        this.nonce = message.nonce || (0, Util_1.generateNonce)();
        message.nonce = this.nonce;
        this._raw = this.destructMessage(message);
    }
    destructMessage(message) {
        for (const [key, value] of Object.entries(message)) {
            this[key] = value;
        }
        if (message.nonce)
            this.nonce = message.nonce;
        this._type = message._type || shared_1.messageType.CUSTOM_MESSAGE;
        return message;
    }
    toJSON() {
        return this._raw;
    }
}
exports.BaseMessage = BaseMessage;
class IPCMessage extends BaseMessage {
    raw;
    instance;
    constructor(instance, message) {
        super(message);
        this.instance = instance;
        this.raw = new BaseMessage(message).toJSON();
    }
    async send(message) {
        if (typeof message !== 'object')
            throw new TypeError('The Message has to be a object');
        const baseMessage = new BaseMessage({ ...message, _type: shared_1.messageType.CUSTOM_MESSAGE });
        return this.instance.send(baseMessage.toJSON());
    }
    async request(message) {
        if (typeof message !== 'object')
            throw new TypeError('The Message has to be a object');
        const baseMessage = new BaseMessage({ ...message, _type: shared_1.messageType.CUSTOM_REQUEST, nonce: this.nonce });
        return this.instance.request(baseMessage.toJSON());
    }
    async reply(message) {
        if (typeof message !== 'object')
            throw new TypeError('The Message has to be a object');
        const baseMessage = new BaseMessage({
            ...message,
            _type: shared_1.messageType.CUSTOM_REPLY,
            nonce: this.nonce,
            _result: message,
        });
        return this.instance.send(baseMessage.toJSON());
    }
}
exports.IPCMessage = IPCMessage;
