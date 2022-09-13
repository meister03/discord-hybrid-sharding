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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterClient = void 0;
var IPCMessage_1 = require("../Structures/IPCMessage");
var shared_1 = require("../types/shared");
var Data_1 = require("../Structures/Data");
var Worker_1 = require("../Structures/Worker");
var Child_1 = require("../Structures/Child");
var IPCHandler_1 = require("../Structures/IPCHandler");
var PromiseHandler_1 = require("../Structures/PromiseHandler");
var events_1 = __importDefault(require("events"));
var Util_1 = require("../Util/Util");
var ClusterClient = (function (_super) {
    __extends(ClusterClient, _super);
    function ClusterClient(client) {
        var _this = this;
        var _a, _b, _c;
        _this = _super.call(this) || this;
        _this.client = client;
        _this.mode = _this.info.CLUSTER_MANAGER_MODE;
        var mode = _this.mode;
        _this.queue = {
            mode: _this.info.CLUSTER_QUEUE_MODE,
        };
        _this.maintenance = _this.info.MAINTENANCE;
        if (_this.maintenance === 'undefined')
            _this.maintenance = false;
        if (!_this.maintenance) {
            setTimeout(function () { return _this.triggerClusterReady(); }, 100);
        }
        _this.ready = false;
        _this.process = null;
        if (mode === 'process')
            _this.process = new Child_1.ChildClient();
        else if (mode === 'worker')
            _this.process = new Worker_1.WorkerClient();
        _this.messageHandler = new IPCHandler_1.ClusterClientHandler(_this, _this.process);
        _this.promise = new PromiseHandler_1.PromiseHandler();
        (_b = (_a = _this.process) === null || _a === void 0 ? void 0 : _a.ipc) === null || _b === void 0 ? void 0 : _b.on('message', _this._handleMessage.bind(_this));
        (_c = client.on) === null || _c === void 0 ? void 0 : _c.call(client, 'ready', function () {
            _this.triggerReady();
        });
        return _this;
    }
    Object.defineProperty(ClusterClient.prototype, "id", {
        get: function () {
            return this.info.CLUSTER;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ClusterClient.prototype, "ids", {
        get: function () {
            if (!this.client.ws)
                return this.info.SHARD_LIST;
            return this.client.ws.shards;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ClusterClient.prototype, "count", {
        get: function () {
            return this.info.CLUSTER_COUNT;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ClusterClient.prototype, "info", {
        get: function () {
            return (0, Data_1.getInfo)();
        },
        enumerable: false,
        configurable: true
    });
    ClusterClient.prototype.send = function (message) {
        var _a;
        if (typeof message === 'object')
            message = new IPCMessage_1.BaseMessage(message).toJSON();
        return (_a = this.process) === null || _a === void 0 ? void 0 : _a.send(message);
    };
    ClusterClient.prototype.fetchClientValues = function (prop, cluster) {
        return this.broadcastEval("this.".concat(prop), { cluster: cluster });
    };
    ClusterClient.prototype.evalOnManager = function (script, options) {
        return __awaiter(this, void 0, void 0, function () {
            var evalOptions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        evalOptions = options || { _type: undefined };
                        evalOptions._type = shared_1.messageType.CLIENT_MANAGER_EVAL_REQUEST;
                        return [4, this.broadcastEval(script, evalOptions)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    ClusterClient.prototype.broadcastEval = function (script, options) {
        return __awaiter(this, void 0, void 0, function () {
            var broadcastOptions, nonce, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!script || (typeof script !== 'string' && typeof script !== 'function'))
                            throw new TypeError('Script for BroadcastEvaling has not been provided or must be a valid String/Function!');
                        broadcastOptions = options || { context: undefined, _type: undefined, timeout: undefined };
                        script = typeof script === 'function' ? "(".concat(script, ")(this, ").concat(JSON.stringify(broadcastOptions.context), ")") : script;
                        nonce = (0, Util_1.generateNonce)();
                        message = { nonce: nonce, _eval: script, options: options, _type: broadcastOptions._type || shared_1.messageType.CLIENT_BROADCAST_REQUEST };
                        return [4, this.send(message)];
                    case 1:
                        _a.sent();
                        return [4, this.promise.create(message, broadcastOptions)];
                    case 2: return [2, _a.sent()];
                }
            });
        });
    };
    ClusterClient.prototype.request = function (message) {
        var rawMessage = message || { _type: undefined };
        rawMessage._type = shared_1.messageType.CUSTOM_REQUEST;
        this.send(rawMessage);
        return this.promise.create(rawMessage, {});
    };
    ClusterClient.prototype.respawnAll = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.clusterDelay, clusterDelay = _c === void 0 ? 5000 : _c, _d = _b.respawnDelay, respawnDelay = _d === void 0 ? 7000 : _d, _e = _b.timeout, timeout = _e === void 0 ? 30000 : _e;
        return this.send({ _type: shared_1.messageType.CLIENT_RESPAWN_ALL, options: { clusterDelay: clusterDelay, respawnDelay: respawnDelay, timeout: timeout } });
    };
    ClusterClient.prototype._handleMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var emit, emitMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!message)
                            return [2];
                        return [4, this.messageHandler.handleMessage(message)];
                    case 1:
                        emit = _a.sent();
                        if (!emit)
                            return [2];
                        if (typeof message === 'object')
                            emitMessage = new IPCMessage_1.IPCMessage(this, message);
                        else
                            emitMessage = message;
                        this.emit('message', emitMessage);
                        return [2];
                }
            });
        });
    };
    ClusterClient.prototype._eval = function (script) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client._eval) return [3, 2];
                        return [4, this.client._eval(script)];
                    case 1: return [2, _a.sent()];
                    case 2:
                        this.client._eval = function (_) {
                            return eval(_);
                        }.bind(this.client);
                        return [4, this.client._eval(script)];
                    case 3: return [2, _a.sent()];
                }
            });
        });
    };
    ClusterClient.prototype._respond = function (type, message) {
        var _this = this;
        var _a;
        (_a = this.send(message)) === null || _a === void 0 ? void 0 : _a.catch(function (err) {
            var _a, _b;
            var error = { err: err, message: '' };
            error.message = "Error when sending ".concat(type, " response to master process: ").concat(err.message);
            (_b = (_a = _this.client).emit) === null || _b === void 0 ? void 0 : _b.call(_a, shared_1.Events.ERROR, error);
        });
    };
    ClusterClient.prototype.triggerReady = function () {
        var _a;
        (_a = this.process) === null || _a === void 0 ? void 0 : _a.send({ _type: shared_1.messageType.CLIENT_READY });
        this.ready = true;
        return this.ready;
    };
    ClusterClient.prototype.triggerClusterReady = function () {
        return this.emit('ready', this);
    };
    ClusterClient.prototype.triggerMaintenance = function (maintenance, all) {
        var _a;
        if (all === void 0) { all = false; }
        var _type = shared_1.messageType.CLIENT_MAINTENANCE;
        if (all)
            _type = shared_1.messageType.CLIENT_MAINTENANCE_ALL;
        (_a = this.process) === null || _a === void 0 ? void 0 : _a.send({ _type: _type, maintenance: maintenance });
        this.maintenance = maintenance;
        return this.maintenance;
    };
    ClusterClient.prototype.spawnNextCluster = function () {
        var _a;
        if (this.queue.mode === 'auto')
            throw new Error('Next Cluster can just be spawned when the queue is not on auto mode.');
        return (_a = this.process) === null || _a === void 0 ? void 0 : _a.send({ _type: shared_1.messageType.CLIENT_SPAWN_NEXT_CLUSTER });
    };
    ClusterClient.getInfo = function () {
        return (0, Data_1.getInfo)();
    };
    return ClusterClient;
}(events_1.default));
exports.ClusterClient = ClusterClient;
