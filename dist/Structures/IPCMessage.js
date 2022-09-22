"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCMessage = exports.BaseMessage = void 0;
const Util_1 = require("../Util/Util");
const shared_1 = require("../types/shared");
class BaseMessage {
    nonce;
    _raw;
    constructor(message) {
        /**
         * Creates a Message ID for identifying it for further Usage such as on replies
         */
        this.nonce = message.nonce || (0, Util_1.generateNonce)();
        message.nonce = this.nonce;
        /**
         * Destructs the Message Object and initializes it on the Constructor
         */
        this._raw = this.destructMessage(message);
    }
    /**
     * Destructs the Message Object and initializes it on the Constructor
     */
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
        /**
         * Instance, which can be the ParentCluster or the ClusterClient
         */
        this.instance = instance;
        /**
         * The Base Message, which is saved on the raw field.
         */
        this.raw = new BaseMessage(message).toJSON();
    }
    /**
     * Sends a message to the cluster's process/worker or to the ParentCluster.
     */
    async send(message) {
        if (typeof message !== 'object')
            throw new TypeError('The Message has to be a object');
        const baseMessage = new BaseMessage({ ...message, _type: shared_1.messageType.CUSTOM_MESSAGE });
        return this.instance.send(baseMessage.toJSON());
    }
    /**
     * Sends a Request to the cluster's process/worker or to the ParentCluster.
     */
    async request(message) {
        if (typeof message !== 'object')
            throw new TypeError('The Message has to be a object');
        const baseMessage = new BaseMessage({ ...message, _type: shared_1.messageType.CUSTOM_REQUEST, nonce: this.nonce });
        return this.instance.request(baseMessage.toJSON());
    }
    /**
     * Sends a Reply to Message from the cluster's process/worker or the ParentCluster.
     */
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
