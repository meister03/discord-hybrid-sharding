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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cluster = void 0;
var events_1 = __importDefault(require("events"));
var path_1 = __importDefault(require("path"));
var Util_1 = require("../Util/Util");
var shared_1 = require("../types/shared");
var IPCMessage_js_1 = require("../Structures/IPCMessage.js");
var IPCHandler_js_1 = require("../Structures/IPCHandler.js");
var Worker_js_1 = require("../Structures/Worker.js");
var Child_js_1 = require("../Structures/Child.js");
var Cluster = (function (_super) {
    __extends(Cluster, _super);
    function Cluster(manager, id, shardList, totalShards) {
        var _this = this;
        var _a;
        _this = _super.call(this) || this;
        _this.THREAD = manager.mode === 'worker' ? Worker_js_1.Worker : Child_js_1.Child;
        _this.manager = manager;
        _this.id = id;
        _this.args = manager.shardArgs || [];
        _this.execArgv = manager.execArgv;
        _this.shardList = shardList;
        _this.totalShards = totalShards;
        _this.env = Object.assign({}, process.env, {
            SHARD_LIST: _this.shardList,
            TOTAL_SHARDS: _this.totalShards,
            CLUSTER_MANAGER: true,
            CLUSTER: _this.id,
            CLUSTER_COUNT: _this.manager.totalClusters,
            DISCORD_TOKEN: _this.manager.token,
        });
        _this.ready = false;
        _this.thread = null;
        _this.restarts = {
            current: (_a = _this.manager.restarts.current) !== null && _a !== void 0 ? _a : 0,
            max: _this.manager.restarts.max,
            interval: _this.manager.restarts.interval,
            reset: undefined,
            resetRestarts: function () {
                _this.restarts.reset = setInterval(function () {
                    _this.restarts.current = 0;
                }, _this.manager.restarts.interval);
            },
            cleanup: function () {
                if (_this.restarts.reset)
                    clearInterval(_this.restarts.reset);
            },
            append: function () {
                _this.restarts.current++;
            },
        };
        return _this;
    }
    Cluster.prototype.spawn = function (spawnTimeout) {
        if (spawnTimeout === void 0) { spawnTimeout = 30000; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.thread)
                            throw new Error('CLUSTER ALREADY SPAWNED | ClusterId: ' + this.id);
                        this.thread = new this.THREAD(path_1.default.resolve(this.manager.file), __assign(__assign({}, this.manager.clusterOptions), { execArgv: this.execArgv, env: this.env, args: this.args, clusterData: __assign(__assign({}, this.env), this.manager.clusterData) }));
                        this.messageHandler = new IPCHandler_js_1.ClusterHandler(this.manager, this, this.thread);
                        this.thread
                            .spawn()
                            .on('message', this._handleMessage.bind(this))
                            .on('exit', this._handleExit.bind(this))
                            .on('error', this._handleError.bind(this));
                        this.emit('spawn', this.thread.process);
                        if (spawnTimeout === -1 || spawnTimeout === Infinity)
                            return [2, this.thread.process];
                        return [4, new Promise(function (resolve, reject) {
                                var cleanup = function () {
                                    clearTimeout(spawnTimeoutTimer);
                                    _this.off('ready', onReady);
                                    _this.off('death', onDeath);
                                };
                                var onReady = function () {
                                    _this.manager.emit('clusterReady', _this);
                                    _this.restarts.cleanup();
                                    _this.restarts.resetRestarts();
                                    cleanup();
                                    resolve('Cluster is ready');
                                };
                                var onDeath = function () {
                                    cleanup();
                                    reject(new Error('CLUSTERING_READY_DIED | ClusterId: ' + _this.id));
                                };
                                var onTimeout = function () {
                                    cleanup();
                                    reject(new Error('CLUSTERING_READY_TIMEOUT | ClusterId: ' + _this.id));
                                };
                                var spawnTimeoutTimer = setTimeout(onTimeout, spawnTimeout);
                                _this.once('ready', onReady);
                                _this.once('death', onDeath);
                            })];
                    case 1:
                        _a.sent();
                        return [2, this.thread.process];
                }
            });
        });
    };
    Cluster.prototype.kill = function (options) {
        var _a, _b, _c;
        (_a = this.thread) === null || _a === void 0 ? void 0 : _a.kill();
        (_c = (_b = this.manager.heartbeat) === null || _b === void 0 ? void 0 : _b.clusters.get(this.id)) === null || _c === void 0 ? void 0 : _c.stop();
        this.restarts.cleanup();
        this._handleExit(false, options);
    };
    Cluster.prototype.respawn = function (_a) {
        var _b, _c;
        var _d = _a === void 0 ? this.manager.spawnOptions : _a, _e = _d.delay, delay = _e === void 0 ? 500 : _e, _f = _d.timeout, timeout = _f === void 0 ? 30000 : _f;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        if (this.thread)
                            this.kill({ force: true });
                        if (!(delay > 0)) return [3, 2];
                        return [4, (0, Util_1.delayFor)(delay)];
                    case 1:
                        _g.sent();
                        _g.label = 2;
                    case 2:
                        (_c = (_b = this.manager.heartbeat) === null || _b === void 0 ? void 0 : _b.clusters.get(this.id)) === null || _c === void 0 ? void 0 : _c.stop();
                        return [2, this.spawn(timeout)];
                }
            });
        });
    };
    Cluster.prototype.send = function (message) {
        var _a, _b;
        if (typeof message === 'object')
            (_a = this.thread) === null || _a === void 0 ? void 0 : _a.send(new IPCMessage_js_1.BaseMessage(message).toJSON());
        else
            return (_b = this.thread) === null || _b === void 0 ? void 0 : _b.send(message);
    };
    Cluster.prototype.request = function (message) {
        message._type = shared_1.messageType.CUSTOM_REQUEST;
        this.send(message);
        return this.manager.promise.create(message, message.options);
    };
    Cluster.prototype.eval = function (script, context, timeout) {
        return __awaiter(this, void 0, void 0, function () {
            var _eval, nonce, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _eval = typeof script === 'function' ? "(".concat(script, ")(this, ").concat(JSON.stringify(context), ")") : script;
                        if (!this.thread)
                            return [2, Promise.reject(new Error('CLUSTERING_NO_CHILD_EXISTS | ClusterId: ' + this.id))];
                        nonce = (0, Util_1.generateNonce)();
                        message = { nonce: nonce, _eval: _eval, options: { timeout: timeout }, _type: shared_1.messageType.CLIENT_EVAL_REQUEST };
                        return [4, this.send(message)];
                    case 1:
                        _a.sent();
                        return [4, this.manager.promise.create(message, message.options)];
                    case 2: return [2, _a.sent()];
                }
            });
        });
    };
    Cluster.prototype.triggerMaintenance = function (reason) {
        var _type = reason ? shared_1.messageType.CLIENT_MAINTENANCE_ENABLE : shared_1.messageType.CLIENT_MAINTENANCE_DISABLE;
        return this.send({ _type: _type, maintenance: reason });
    };
    Cluster.prototype._handleMessage = function (message) {
        if (!message)
            return;
        var emit = this.messageHandler.handleMessage(message);
        if (!emit)
            return;
        var emitMessage;
        if (typeof message === 'object') {
            emitMessage = new IPCMessage_js_1.IPCMessage(this, message);
            if (emitMessage._type === shared_1.messageType.CUSTOM_REQUEST)
                this.manager.emit('clientRequest', emitMessage);
        }
        else
            emitMessage = message;
        this.emit('message', emitMessage);
    };
    Cluster.prototype._handleExit = function (respawn, options) {
        var _this = this;
        var _a;
        if (respawn === void 0) { respawn = this.manager.respawn; }
        if (!options)
            options = {};
        if ((options === null || options === void 0 ? void 0 : options.reason) !== 'reclustering')
            this.emit('death', this, (_a = this.thread) === null || _a === void 0 ? void 0 : _a.process);
        if (respawn) {
            this.manager._debug('[DEATH] Cluster died, attempting respawn | Restarts Left: ' +
                (this.restarts.max - this.restarts.current), this.id);
        }
        else {
            this.manager._debug('[KILL] Cluster killed with reason: ' + ((options === null || options === void 0 ? void 0 : options.reason) || 'not given'), this.id);
        }
        this.ready = false;
        this.thread = null;
        if (!respawn)
            return;
        if (this.restarts.current >= this.restarts.max)
            this.manager._debug('[ATTEMPTED_RESPAWN] Attempted Respawn Declined | Max Restarts have been exceeded', this.id);
        if (respawn && this.restarts.current < this.restarts.max)
            this.spawn().catch(function (err) { return _this.emit('error', err); });
        this.restarts.append();
    };
    Cluster.prototype._handleError = function (error) {
        this.manager.emit('error', error);
    };
    return Cluster;
}(events_1.default));
exports.Cluster = Cluster;
