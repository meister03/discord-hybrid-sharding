import { generateNonce } from '../Util/Util';
import { messageType } from '../types/shared';
import { ClusterClient } from '../Core/ClusterClient';
import { Cluster } from '../Core/Cluster';

export interface RawMessage {
    nonce?: string;
    _type?: number;
    [x: string]: any;
}

export class BaseMessage {
    [x: string]: any;
    nonce: string;
    private readonly _raw: RawMessage;
    constructor(message: RawMessage) {
        /**
         * Creates a Message ID for identifying it for further Usage such as on replies
         */
        this.nonce = message.nonce || generateNonce();
        message.nonce = this.nonce;

        /**
         * Destructs the Message Object and initializes it on the Constructor
         */
        this._raw = this.destructMessage(message);
    }

    /**
     * Destructs the Message Object and initializes it on the Constructor
     */
    private destructMessage(message: RawMessage) {
        for (const [key, value] of Object.entries(message)) {
            this[key] = value;
        }
        if (message.nonce) this.nonce = message.nonce;
        this._type = message._type || messageType.CUSTOM_MESSAGE;
        return message;
    }

    public toJSON() {
        return this._raw;
    }
}

export class IPCMessage extends BaseMessage {
    raw: RawMessage;
    instance: ClusterClient<any> | Cluster;
    constructor(instance: ClusterClient<any> | Cluster, message: RawMessage) {
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
    public async send(message: object) {
        if (typeof message !== 'object') throw new TypeError('The Message has to be a object');
        const baseMessage = new BaseMessage({ ...message, _type: messageType.CUSTOM_MESSAGE });
        return this.instance.send(baseMessage.toJSON());
    }

    /**
     * Sends a Request to the cluster's process/worker or to the ParentCluster.
     */
    public async request(message: object) {
        if (typeof message !== 'object') throw new TypeError('The Message has to be a object');
        const baseMessage = new BaseMessage({ ...message, _type: messageType.CUSTOM_REQUEST, nonce: this.nonce });
        return this.instance.request(baseMessage.toJSON());
    }

    /**
     * Sends a Reply to Message from the cluster's process/worker or the ParentCluster.
     */
    public async reply(message: object) {
        if (typeof message !== 'object') throw new TypeError('The Message has to be a object');
        const baseMessage = new BaseMessage({
            ...message,
            _type: messageType.CUSTOM_REPLY,
            nonce: this.nonce,
            _result: message,
        });
        return this.instance.send(baseMessage.toJSON());
    }
}
