class BaseMessage{
    constructor(message = {}){
        this._sCustom = true;
        this.nonce = message.nonce || Date.now().toString(36) + Math.random().toString(36);
        message.nonce = this.nonce;
        this.destructMessage(message);
    }

    destructMessage(message){
        for (let [key, value] of Object.entries(message)) {
            this[key] = value;
        }
        this._sCustom = true;
        this.nonce = message.nonce;
        return message;
    }

    toJSON(){
        return this;
    }
}
class IPCMessage extends BaseMessage{
    constructor(instance, message){
        super(message)
        this.instance = instance;
        this.raw = new BaseMessage(message).toJSON()
    }

    async send(message = {}){
        if(typeof message !== 'object') throw new TypeError('The Message has to be a object')
        message = new BaseMessage(message);
        return this.instance.send(message.toJSON())
    }

    async request(message = {}){
        if(typeof message !== 'object') throw new TypeError('The Message has to be a object')
        message.nonce = this.nonce;
        message._sRequest = true;
        message._sReply = false;
        message = new BaseMessage(message);
        return this.instance.request(message.toJSON());
    }

    async reply(message = {}){
        if(typeof message !== 'object') throw new TypeError('The Message has to be a object')
        message.nonce = this.raw.nonce;
        message._sReply = true;
        message._sRequest  = false;
        message = new BaseMessage(message);
        return this.instance.send(message.toJSON());
    }

    
}
module.exports = {IPCMessage, BaseMessage};
