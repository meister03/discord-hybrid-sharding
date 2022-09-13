"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCMessage = exports.BaseMessage = void 0;
var Util_1 = require("../Util/Util");
var shared_1 = require("../types/shared");
var BaseMessage = (function () {
    function BaseMessage(message) {
        this.nonce = message.nonce || (0, Util_1.generateNonce)();
        message.nonce = this.nonce;
        this._raw = this.destructMessage(message);
    }
    BaseMessage.prototype.destructMessage = function (message) {
        for (var _i = 0, _a = Object.entries(message); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            this[key] = value;
        }
        if (message.nonce)
            this.nonce = message.nonce;
        this._type = message._type || shared_1.messageType.CUSTOM_MESSAGE;
        return message;
    };
    BaseMessage.prototype.toJSON = function () {
        return this._raw;
    };
    return BaseMessage;
}());
exports.BaseMessage = BaseMessage;
var IPCMessage = (function (_super) {
    __extends(IPCMessage, _super);
    function IPCMessage(instance, message) {
        var _this = _super.call(this, message) || this;
        _this.instance = instance;
        _this.raw = new BaseMessage(message).toJSON();
        return _this;
    }
    IPCMessage.prototype.send = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var baseMessage;
            return __generator(this, function (_a) {
                if (typeof message !== 'object')
                    throw new TypeError('The Message has to be a object');
                baseMessage = new BaseMessage(__assign(__assign({}, message), { _type: shared_1.messageType.CUSTOM_MESSAGE }));
                return [2, this.instance.send(baseMessage.toJSON())];
            });
        });
    };
    IPCMessage.prototype.request = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var baseMessage;
            return __generator(this, function (_a) {
                if (typeof message !== 'object')
                    throw new TypeError('The Message has to be a object');
                baseMessage = new BaseMessage(__assign(__assign({}, message), { _type: shared_1.messageType.CUSTOM_REQUEST, nonce: this.nonce }));
                return [2, this.instance.request(baseMessage.toJSON())];
            });
        });
    };
    IPCMessage.prototype.reply = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var baseMessage;
            return __generator(this, function (_a) {
                if (typeof message !== 'object')
                    throw new TypeError('The Message has to be a object');
                baseMessage = new BaseMessage(__assign(__assign({}, message), { _type: shared_1.messageType.CUSTOM_REPLY, nonce: this.nonce, _result: message }));
                return [2, this.instance.send(baseMessage.toJSON())];
            });
        });
    };
    return IPCMessage;
}(BaseMessage));
exports.IPCMessage = IPCMessage;
