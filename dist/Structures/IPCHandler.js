"use strict";
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
exports.ClusterClientHandler = exports.ClusterHandler = void 0;
var shared_1 = require("../types/shared");
var Util_1 = require("../Util/Util");
var ClusterHandler = (function () {
    function ClusterHandler(manager, cluster, ipc) {
        this.manager = manager;
        this.cluster = cluster;
        this.ipc = ipc;
    }
    ClusterHandler.prototype.handleMessage = function (message) {
        var _this = this;
        var _a, _b;
        if (message._type === shared_1.messageType.CLIENT_READY) {
            this.cluster.ready = true;
            this.cluster.emit('ready');
            this.cluster.manager._debug('Ready', this.cluster.id);
            return;
        }
        if (message._type === shared_1.messageType.CLIENT_BROADCAST_REQUEST) {
            (_a = this.cluster.manager
                .broadcastEval(message._eval, message.options)) === null || _a === void 0 ? void 0 : _a.then(function (results) {
                return _this.ipc.send({
                    nonce: message.nonce,
                    _type: shared_1.messageType.CLIENT_BROADCAST_RESPONSE,
                    _result: results,
                });
            }).catch(function (err) {
                return _this.ipc.send({
                    nonce: message.nonce,
                    _type: shared_1.messageType.CLIENT_BROADCAST_RESPONSE,
                    _error: (0, Util_1.makePlainError)(err),
                });
            });
            return;
        }
        if (message._type === shared_1.messageType.CLIENT_MANAGER_EVAL_REQUEST) {
            this.cluster.manager.evalOnManager(message._eval).then(function (result) {
                if (result._error)
                    _this.ipc.send({
                        nonce: message.nonce,
                        _type: shared_1.messageType.CLIENT_MANAGER_EVAL_RESPONSE,
                        _error: (0, Util_1.makePlainError)(result._error),
                    });
                return _this.ipc.send({
                    nonce: message.nonce,
                    _type: shared_1.messageType.CLIENT_MANAGER_EVAL_RESPONSE,
                    _result: result._result,
                });
            });
            return;
        }
        if (message._type === shared_1.messageType.CLIENT_EVAL_RESPONSE) {
            this.cluster.manager.promise.resolve(message);
            return;
        }
        if (message._type === shared_1.messageType.CLIENT_RESPAWN_ALL) {
            this.cluster.manager.respawnAll(message.options);
            return;
        }
        if (message._type === shared_1.messageType.CLIENT_RESPAWN) {
            this.cluster.respawn(message.options);
            return;
        }
        if (message._type === shared_1.messageType.CLIENT_MAINTENANCE) {
            this.cluster.triggerMaintenance(message.maintenance);
            return;
        }
        if (message._type === shared_1.messageType.CLIENT_MAINTENANCE_ALL) {
            this.cluster.manager.triggerMaintenance(message.maintenance);
            return;
        }
        if (message._type === shared_1.messageType.CLIENT_SPAWN_NEXT_CLUSTER) {
            this.cluster.manager.queue.next();
            return;
        }
        if (message._type === shared_1.messageType.HEARTBEAT_ACK) {
            (_b = this.cluster.manager.heartbeat) === null || _b === void 0 ? void 0 : _b.ack(this.cluster.id, message.date);
            return;
        }
        if (message._type === shared_1.messageType.CUSTOM_REPLY) {
            this.cluster.manager.promise.resolve(message);
            return;
        }
        return true;
    };
    return ClusterHandler;
}());
exports.ClusterHandler = ClusterHandler;
var ClusterClientHandler = (function () {
    function ClusterClientHandler(client, ipc) {
        this.client = client;
        this.ipc = ipc;
    }
    ClusterClientHandler.prototype.handleMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, err_1;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!(message._type === shared_1.messageType.CLIENT_EVAL_REQUEST)) return [3, 5];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        if (!message._eval)
                            throw new Error("Eval Script not provided");
                        _b = (_a = this.client)._respond;
                        _c = ['eval'];
                        _d = {
                            _eval: message._eval
                        };
                        return [4, this.client._eval(message._eval)];
                    case 2:
                        _b.apply(_a, _c.concat([(_d._result = _e.sent(),
                                _d._type = shared_1.messageType.CLIENT_EVAL_RESPONSE,
                                _d.nonce = message.nonce,
                                _d)]));
                        return [3, 4];
                    case 3:
                        err_1 = _e.sent();
                        this.client._respond('eval', {
                            _eval: message._eval,
                            _error: (0, Util_1.makePlainError)(err_1),
                            _type: shared_1.messageType.CLIENT_EVAL_RESPONSE,
                            nonce: message.nonce,
                        });
                        return [3, 4];
                    case 4: return [2, null];
                    case 5:
                        if (message._type === shared_1.messageType.CLIENT_MANAGER_EVAL_RESPONSE) {
                            this.client.promise.resolve({ _result: message._result, _error: message._error, nonce: message.nonce });
                            return [2, null];
                        }
                        if (message._type === shared_1.messageType.CLIENT_BROADCAST_RESPONSE) {
                            this.client.promise.resolve({ _result: message._result, _error: message._error, nonce: message.nonce });
                            return [2, null];
                        }
                        if (message._type === shared_1.messageType.HEARTBEAT) {
                            this.client.send({ _type: shared_1.messageType.HEARTBEAT_ACK, date: message.date });
                            return [2, null];
                        }
                        if (message._type === shared_1.messageType.CLIENT_MAINTENANCE_DISABLE) {
                            this.client.maintenance = false;
                            this.client.triggerClusterReady();
                            return [2, null];
                        }
                        if (message._type === shared_1.messageType.CLIENT_MAINTENANCE_ENABLE) {
                            this.client.maintenance = message.maintenance || true;
                            return [2, null];
                        }
                        if (message._type === shared_1.messageType.CUSTOM_REPLY) {
                            this.client.promise.resolve(message);
                            return [2, null];
                        }
                        return [2, true];
                }
            });
        });
    };
    return ClusterClientHandler;
}());
exports.ClusterClientHandler = ClusterClientHandler;
