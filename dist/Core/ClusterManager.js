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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterManager = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var os_1 = __importDefault(require("os"));
var events_1 = __importDefault(require("events"));
var Util_1 = require("../Util/Util");
var Queue_1 = require("../Structures/Queue");
var Cluster_1 = require("./Cluster");
var PromiseHandler_1 = require("../Structures/PromiseHandler");
var ClusterManager = (function (_super) {
    __extends(ClusterManager, _super);
    function ClusterManager(file, options) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        _this = _super.call(this) || this;
        if (!options)
            options = {};
        if (options.keepAlive)
            throw new Error('keepAlive is not supported anymore on and above v1.6.0. Import it as plugin ("HeartbeatManager"), therefore check the libs readme');
        _this.respawn = (_a = options.respawn) !== null && _a !== void 0 ? _a : true;
        _this.restarts = options.restarts || { max: 3, interval: 60000 * 60, current: 0 };
        _this.clusterData = options.clusterData || {};
        _this.clusterOptions = options.clusterOptions || {};
        _this.file = file;
        if (!file)
            throw new Error('CLIENT_INVALID_OPTION | No File specified.');
        if (!path_1.default.isAbsolute(file))
            _this.file = path_1.default.resolve(process.cwd(), file);
        var stats = fs_1.default.statSync(_this.file);
        if (!stats.isFile())
            throw new Error('CLIENT_INVALID_OPTION | Provided is file is not type of file');
        _this.totalShards = options.totalShards === 'auto' ? -1 : ((_b = options.totalShards) !== null && _b !== void 0 ? _b : -1);
        if (_this.totalShards !== -1) {
            if (typeof _this.totalShards !== 'number' || isNaN(_this.totalShards)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of internal shards must be a number.');
            }
            if (_this.totalShards < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of internal shards must be at least 1.');
            if (!Number.isInteger(_this.totalShards)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of internal shards must be an integer.');
            }
        }
        _this.totalClusters = options.totalClusters === 'auto' ? -1 : ((_c = options.totalClusters) !== null && _c !== void 0 ? _c : -1);
        ;
        if (_this.totalClusters !== -1) {
            if (typeof _this.totalClusters !== 'number' || isNaN(_this.totalClusters)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of Clusters must be a number.');
            }
            if (_this.totalClusters < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be at least 1.');
            if (!Number.isInteger(_this.totalClusters)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be an integer.');
            }
        }
        _this.shardsPerClusters = options.shardsPerClusters;
        if (_this.shardsPerClusters) {
            if (typeof _this.shardsPerClusters !== 'number' || isNaN(_this.shardsPerClusters)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of ShardsPerClusters must be a number.');
            }
            if (_this.shardsPerClusters < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of shardsPerClusters must be at least 1.');
            if (!Number.isInteger(_this.shardsPerClusters)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Shards Per Clusters must be an integer.');
            }
        }
        _this.mode = options.mode || 'process';
        if (_this.mode !== 'worker' && _this.mode !== 'process') {
            throw new RangeError('CLIENT_INVALID_OPTION' + 'Cluster mode must be ' + '"worker" or "process"');
        }
        _this.shardArgs = (_d = options.shardArgs) !== null && _d !== void 0 ? _d : [];
        _this.execArgv = (_e = options.execArgv) !== null && _e !== void 0 ? _e : [];
        _this.shardList = (_f = options.shardList) !== null && _f !== void 0 ? _f : [];
        if (_this.shardList.length) {
            if (!Array.isArray(_this.shardList)) {
                throw new TypeError('CLIENT_INVALID_OPTION | shardList must be an array.');
            }
            _this.shardList = Array.from(new Set(_this.shardList));
            if (_this.shardList.length < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | shardList must contain at least 1 ID.');
            if (_this.shardList.some(function (shardID) {
                return typeof shardID !== 'number' || isNaN(shardID) || !Number.isInteger(shardID) || shardID < 0;
            })) {
                throw new TypeError('CLIENT_INVALID_OPTION | shardList has to contain an array of positive integers.');
            }
        }
        if (!options.token)
            options.token = process.env.DISCORD_TOKEN;
        _this.token = options.token ? options.token.replace(/^Bot\s*/i, '') : null;
        _this.clusters = new Map();
        _this.shardClusterList = [];
        process.env.SHARD_LIST = undefined;
        process.env.TOTAL_SHARDS = _this.totalShards;
        process.env.CLUSTER = undefined;
        process.env.CLUSTER_COUNT = _this.totalClusters;
        process.env.CLUSTER_MANAGER = 'true';
        process.env.CLUSTER_MANAGER_MODE = _this.mode;
        process.env.DISCORD_TOKEN = String(_this.token);
        process.env.MAINTENANCE = undefined;
        if ((_g = options.queue) === null || _g === void 0 ? void 0 : _g.auto)
            process.env.CLUSTER_QUEUE_MODE = 'auto';
        else
            process.env.CLUSTER_QUEUE_MODE = 'manual';
        _this.clusterList = options.clusterList || [];
        _this.spawnOptions = options.spawnOptions || { delay: 7000, timeout: -1 };
        if (!_this.spawnOptions.delay)
            _this.spawnOptions.delay = 7000;
        if (!options.queue)
            options.queue = { auto: true };
        if (!options.queue.timeout)
            options.queue.timeout = _this.spawnOptions.delay;
        _this.queue = new Queue_1.Queue(options.queue);
        _this._debug("[START] Cluster Manager has been initialized");
        _this.promise = new PromiseHandler_1.PromiseHandler();
        return _this;
    }
    ClusterManager.prototype.spawn = function (_a) {
        var _b;
        var _c = _a === void 0 ? this.spawnOptions : _a, _d = _c.amount, amount = _d === void 0 ? this.totalShards : _d, delay = _c.delay, timeout = _c.timeout;
        return __awaiter(this, void 0, void 0, function () {
            var clusterAmount, _loop_1, this_1, i;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (delay < 7000) {
                            process.emitWarning("Spawn Delay (delay: ".concat(delay, ") is smaller than 7s, this can cause global rate limits on /gateway/bot"), {
                                code: 'CLUSTER_MANAGER',
                            });
                        }
                        if (!(amount === -1)) return [3, 2];
                        if (!this.token)
                            throw new Error('A Token must be provided, when totalShards is set on auto.');
                        return [4, (0, Util_1.fetchRecommendedShards)(this.token, 1000)];
                    case 1:
                        amount = _e.sent();
                        this.totalShards = amount;
                        this._debug("Discord recommended a total shard count of ".concat(amount));
                        return [3, 3];
                    case 2:
                        if (typeof amount !== 'number' || isNaN(amount)) {
                            throw new TypeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be a number.');
                        }
                        if (amount < 1)
                            throw new RangeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be at least 1.');
                        if (!Number.isInteger(amount)) {
                            throw new RangeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be an integer.');
                        }
                        _e.label = 3;
                    case 3:
                        clusterAmount = this.totalClusters;
                        if (clusterAmount === -1) {
                            clusterAmount = os_1.default.cpus().length;
                            this.totalClusters = clusterAmount;
                        }
                        else {
                            if (typeof clusterAmount !== 'number' || isNaN(clusterAmount)) {
                                throw new TypeError('CLIENT_INVALID_OPTION | Amount of Clusters must be a number.');
                            }
                            if (clusterAmount < 1)
                                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be at least 1.');
                            if (!Number.isInteger(clusterAmount)) {
                                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be an integer.');
                            }
                        }
                        if (!this.shardList.length)
                            this.shardList = Array.from(Array(amount).keys());
                        if (this.shardsPerClusters)
                            this.totalClusters = Math.ceil(this.shardList.length / this.shardsPerClusters);
                        this.shardClusterList = (0, Util_1.chunkArray)(this.shardList, Math.ceil(this.shardList.length / this.totalClusters));
                        if (this.shardClusterList.length !== this.totalClusters) {
                            this.totalClusters = this.shardClusterList.length;
                        }
                        if (this.shardList.some(function (shardID) { return shardID >= amount; })) {
                            throw new RangeError('CLIENT_INVALID_OPTION | Shard IDs must be smaller than the amount of shards.');
                        }
                        this._debug("[Spawning Clusters]\n    ClusterCount: ".concat(this.totalClusters, "\n    ShardCount: ").concat(amount, "\n    ShardList: ").concat(this.shardClusterList.join(', ')));
                        _loop_1 = function (i) {
                            var clusterId = this_1.clusterList[i] || i;
                            if (this_1.shardClusterList[i]) {
                                var length = (_b = this_1.shardClusterList[i]) === null || _b === void 0 ? void 0 : _b.length;
                                var readyTimeout = timeout !== -1 ? timeout + delay * length : timeout;
                                var spawnDelay = delay * length;
                                this_1.queue.add({
                                    run: function () {
                                        var a = [];
                                        for (var _i = 0; _i < arguments.length; _i++) {
                                            a[_i] = arguments[_i];
                                        }
                                        var cluster = _this.createCluster(clusterId, _this.shardClusterList[i], _this.totalShards);
                                        return cluster.spawn.apply(cluster, a);
                                    },
                                    args: [readyTimeout],
                                    timeout: spawnDelay,
                                });
                            }
                        };
                        this_1 = this;
                        for (i = 0; i < this.totalClusters; i++) {
                            _loop_1(i);
                        }
                        return [2, this.queue.start()];
                }
            });
        });
    };
    ClusterManager.prototype.broadcast = function (message) {
        var promises = [];
        for (var _i = 0, _a = Array.from(this.clusters.values()); _i < _a.length; _i++) {
            var cluster = _a[_i];
            promises.push(cluster.send(message));
        }
        return Promise.all(promises);
    };
    ClusterManager.prototype.createCluster = function (id, shardsToSpawn, totalShards, recluster) {
        if (recluster === void 0) { recluster = false; }
        var cluster = new Cluster_1.Cluster(this, id, shardsToSpawn, totalShards);
        if (!recluster)
            this.clusters.set(id, cluster);
        this.emit('clusterCreate', cluster);
        this._debug("[CREATE] Created Cluster ".concat(cluster.id));
        return cluster;
    };
    ClusterManager.prototype.broadcastEval = function (script, evalOptions) {
        var _a;
        var options = evalOptions !== null && evalOptions !== void 0 ? evalOptions : {};
        if (!script || (typeof script !== 'string' && typeof script !== 'function'))
            return Promise.reject(new TypeError('ClUSTERING_INVALID_EVAL_BROADCAST'));
        script = typeof script === 'function' ? "(".concat(script, ")(this, ").concat(JSON.stringify(options.context), ")") : script;
        if (Object.prototype.hasOwnProperty.call(options, 'cluster')) {
            if (typeof options.cluster === 'number') {
                if (options.cluster < 0)
                    throw new RangeError('CLUSTER_ID_OUT_OF_RANGE');
            }
            if (Array.isArray(options.cluster)) {
                if (options.cluster.length === 0)
                    throw new RangeError('ARRAY_MUST_CONTAIN_ONE CLUSTER_ID');
            }
        }
        if (options.guildId) {
            options.shard = (0, Util_1.shardIdForGuildId)(options.guildId, this.totalShards);
        }
        if (options.shard) {
            if (typeof options.shard === 'number') {
                if (options.shard < 0)
                    throw new RangeError('SHARD_ID_OUT_OF_RANGE');
            }
            if (Array.isArray(options.shard)) {
                if (options.shard.length === 0)
                    throw new RangeError('ARRAY_MUST_CONTAIN_ONE SHARD_ID');
            }
            options.cluster = (_a = Array.from(this.clusters.values()).find(function (c) { return c.shardList.includes(options.shard); })) === null || _a === void 0 ? void 0 : _a.id;
        }
        return this._performOnClusters('eval', [script], options.cluster, options.timeout);
    };
    ClusterManager.prototype.fetchClientValues = function (prop, cluster) {
        return this.broadcastEval("this.".concat(prop), { cluster: cluster });
    };
    ClusterManager.prototype._performOnClusters = function (method, args, cluster, timeout) {
        var _a;
        if (this.clusters.size === 0)
            return Promise.reject(new Error('CLUSTERING_NO_CLUSTERS'));
        if (typeof cluster === 'number') {
            if (this.clusters.has(cluster))
                return (_a = this.clusters
                    .get(cluster)) === null || _a === void 0 ? void 0 : _a[method].apply(_a, __spreadArray(__spreadArray([], args, false), [undefined, timeout], false)).then(function (e) { return [e]; });
            return Promise.reject(new Error('CLUSTERING_CLUSTER_NOT_FOUND FOR ClusterId: ' + cluster));
        }
        var clusters = Array.from(this.clusters.values());
        if (cluster)
            clusters = clusters.filter(function (c) { return cluster.includes(c.id); });
        if (clusters.length === 0)
            return Promise.reject(new Error('CLUSTERING_NO_CLUSTERS_FOUND'));
        var promises = [];
        for (var _i = 0, clusters_1 = clusters; _i < clusters_1.length; _i++) {
            var cl = clusters_1[_i];
            promises.push(cl[method].apply(cl, __spreadArray(__spreadArray([], args, false), [undefined, timeout], false)));
        }
        return Promise.all(promises);
    };
    ClusterManager.prototype.respawnAll = function (_a) {
        var _b;
        var _c = _a === void 0 ? {} : _a, _d = _c.clusterDelay, clusterDelay = _d === void 0 ? 5500 : _d, _e = _c.respawnDelay, respawnDelay = _e === void 0 ? 500 : _e, _f = _c.timeout, timeout = _f === void 0 ? -1 : _f;
        return __awaiter(this, void 0, void 0, function () {
            var s, i, _i, _g, cluster, promises, length;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        this.promise.nonce.clear();
                        s = 0;
                        i = 0;
                        _i = 0, _g = Array.from(this.clusters.values());
                        _h.label = 1;
                    case 1:
                        if (!(_i < _g.length)) return [3, 4];
                        cluster = _g[_i];
                        promises = [cluster.respawn({ delay: respawnDelay, timeout: timeout })];
                        length = ((_b = this.shardClusterList[i]) === null || _b === void 0 ? void 0 : _b.length) || this.totalShards / this.totalClusters;
                        if (++s < this.clusters.size && clusterDelay > 0)
                            promises.push((0, Util_1.delayFor)(length * clusterDelay));
                        i++;
                        return [4, Promise.all(promises)];
                    case 2:
                        _h.sent();
                        _h.label = 3;
                    case 3:
                        _i++;
                        return [3, 1];
                    case 4:
                        this._debug('Respawning all Clusters');
                        return [2, this.clusters];
                }
            });
        });
    };
    ClusterManager.prototype.evalOnManager = function (script) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        script = typeof script === 'function' ? "(".concat(script, ")(this)") : script;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, eval(script)];
                    case 2:
                        result = _a.sent();
                        return [3, 4];
                    case 3:
                        err_1 = _a.sent();
                        error = err_1;
                        return [3, 4];
                    case 4: return [2, { _result: result, _error: error ? (0, Util_1.makePlainError)(error) : null }];
                }
            });
        });
    };
    ClusterManager.prototype.evalOnCluster = function (script, options) {
        var _a;
        return (_a = this.broadcastEval(script, options)) === null || _a === void 0 ? void 0 : _a.then(function (r) { return r[0]; });
    };
    ClusterManager.prototype.extend = function () {
        var plugins = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            plugins[_i] = arguments[_i];
        }
        if (!plugins)
            throw new Error('NO_PLUGINS_PROVIDED');
        if (!Array.isArray(plugins))
            plugins = [plugins];
        for (var _a = 0, plugins_1 = plugins; _a < plugins_1.length; _a++) {
            var plugin = plugins_1[_a];
            if (!plugin)
                throw new Error('PLUGIN_NOT_PROVIDED');
            if (typeof plugin !== 'object')
                throw new Error('PLUGIN_NOT_A_OBJECT');
            plugin.build(this);
        }
    };
    ClusterManager.prototype.triggerMaintenance = function (reason) {
        return Array.from(this.clusters.values()).forEach(function (cluster) { return cluster.triggerMaintenance(reason); });
    };
    ClusterManager.prototype._debug = function (message, cluster) {
        var log;
        if (cluster === undefined) {
            log = "[CM => Manager] " + message;
        }
        else {
            log = "[CM => Cluster ".concat(cluster, "] ") + message;
        }
        this.emit('debug', log);
        return log;
    };
    return ClusterManager;
}(events_1.default));
exports.ClusterManager = ClusterManager;
