
const Util = require('../Util/Util.js');
class PromiseHandler{
    constructor(){
        this.nonce = new Map();
    }
    resolve(message){
        const promise = this.nonce.get(message.nonce);
        if(promise){
            if(promise.timeout) clearTimeout(promise.timeout);
            this.nonce.delete(message.nonce);
            if(message._error){
                promise.reject(message._error + new Error().stack);
            }
            else{
                promise.resolve(message._result);
            }
        }
    }
    insertResult({nonce, _result, _error}){
        const promise = this.nonce.get(nonce);
        if(promise){
            if(!promise.results) promise.results = [];
            if(_error) this.resolve({nonce, _error});
            promise.results.push(_result);
            if(promise.options.limit === promise.results.length){
                this.resolve({nonce: nonce, _result: promise.results});
            }
            this.nonce.set(nonce, promise);
        }
    }

    async create(message, options = {}){
        if(!message.nonce) message.nonce = Util.generateNonce();
        const promise = await new Promise((resolve, reject) => {
            let timeout = undefined;
            if(message.timeout){
                timeout = setTimeout(() => {
                    this.nonce.delete(message.nonce);
                    reject(new Error('Promise timed out'));
                }, message.timeout);
            }
            this.nonce.set(message.nonce, {resolve, reject, options});
        });
        return promise;
    }
}
module.exports = PromiseHandler;