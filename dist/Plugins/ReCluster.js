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
exports.ReClusterManager = void 0;
var Util_1 = require("../Util/Util");
var ReClusterManager = (function () {
    function ReClusterManager(options) {
        if (!options)
            this.options = {};
        this.options = options;
        this.name = 'recluster';
        this.onProgress = false;
    }
    ReClusterManager.prototype.build = function (manager) {
        manager[this.name] = this;
        this.manager = manager;
        return this;
    };
    ReClusterManager.prototype.start = function (options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _c, delay, timeout, totalShards, totalClusters, shardsPerClusters, shardClusterList, _d, shardList, _e, restartMode;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _c = options || { restartMode: 'gracefulSwitch' }, delay = _c.delay, timeout = _c.timeout, totalShards = _c.totalShards, totalClusters = _c.totalClusters, shardsPerClusters = _c.shardsPerClusters, shardClusterList = _c.shardClusterList, _d = _c.shardList, shardList = _d === void 0 ? (_a = this.manager) === null || _a === void 0 ? void 0 : _a.shardList : _d, _e = _c.restartMode, restartMode = _e === void 0 ? 'gracefulSwitch' : _e;
                        if (this.onProgress)
                            throw new Error('Zero Downtime Reclustering is already in progress');
                        if (!this.manager)
                            throw new Error('Manager is missing on ReClusterManager');
                        if (!totalShards) return [3, 3];
                        if (!((_b = this.manager) === null || _b === void 0 ? void 0 : _b.token))
                            throw new Error('Token must be defined on manager, when totalShards is set on auto');
                        if (!(totalShards === 'auto')) return [3, 2];
                        return [4, (0, Util_1.fetchRecommendedShards)(this.manager.token)];
                    case 1:
                        totalShards = _f.sent();
                        _f.label = 2;
                    case 2:
                        this.manager.totalShards = totalShards;
                        _f.label = 3;
                    case 3:
                        if (totalClusters)
                            this.manager.totalClusters = totalClusters;
                        if (shardsPerClusters) {
                            this.manager.shardsPerClusters = shardsPerClusters;
                            this.manager.totalClusters = Math.ceil(this.manager.totalShards / this.manager.shardsPerClusters);
                        }
                        if (shardList)
                            this.manager.shardList = shardList;
                        else
                            this.manager.shardList = Array.from(Array(this.manager.totalShards).keys());
                        if (shardClusterList)
                            this.manager.shardClusterList = shardClusterList;
                        else
                            this.manager.shardClusterList = (0, Util_1.chunkArray)(this.manager.shardList, Math.ceil(this.manager.shardList.length / this.manager.totalClusters));
                        if (this.manager.shardClusterList.length !== this.manager.totalClusters) {
                            this.manager.totalClusters = this.manager.shardClusterList.length;
                        }
                        this.manager._debug([
                            '[↻][ReClustering] Starting... Zerodowntime Reclustering',
                            "\u251C\u2500\u2500 Mode: ".concat(restartMode),
                            "\u251C\u2500\u2500 Total Shards: ".concat(this.manager.totalShards),
                            "\u251C\u2500\u2500 Total Clusters: ".concat(this.manager.totalClusters),
                            "\u251C\u2500\u2500 Shards Per Cluster: ".concat(this.manager.shardsPerClusters),
                            "\u251C\u2500\u2500 Shard Cluster List: ".concat(this.manager.shardClusterList.join(', ')),
                            "\u2514\u2500\u2500 Shard List: ".concat(this.manager.shardList.join(', ')),
                        ].join('\n'));
                        return [2, this._start({ restartMode: restartMode, timeout: timeout, delay: delay })];
                }
            });
        });
    };
    ReClusterManager.prototype._start = function (_a) {
        var _b;
        var _c = _a.restartMode, restartMode = _c === void 0 ? 'gracefulSwitch' : _c, _d = _a.timeout, timeout = _d === void 0 ? 30000 * 6 : _d, _e = _a.delay, delay = _e === void 0 ? 7000 : _e;
        return __awaiter(this, void 0, void 0, function () {
            var switchClusterAfterReady, newClusters, oldClusters, _loop_1, this_1, i, _i, _f, _g, id, cluster, i, clusterId, cluster, oldCluster;
            var _this = this;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        if (!this.manager)
                            throw new Error('Manager is missing on ReClusterManager');
                        process.env.MAINTENANCE = 'recluster';
                        this.manager.triggerMaintenance('recluster');
                        this.manager._debug('[↻][ReClustering] Enabling Maintenance Mode on all clusters');
                        switchClusterAfterReady = false;
                        switchClusterAfterReady = restartMode === 'rolling';
                        newClusters = new Map();
                        oldClusters = new Map();
                        Array.from(this.manager.clusters.values()).forEach(function (cluster) {
                            oldClusters.set(cluster.id, cluster);
                        });
                        _loop_1 = function (i) {
                            var length = ((_b = this_1.manager.shardClusterList[i]) === null || _b === void 0 ? void 0 : _b.length) || this_1.manager.totalShards / this_1.manager.totalClusters;
                            var clusterId = this_1.manager.clusterList[i] || i;
                            var readyTimeout = timeout !== -1 ? timeout + delay * length : timeout;
                            var spawnDelay = delay * length;
                            this_1.manager.queue.add({
                                run: function () {
                                    var a = [];
                                    for (var _i = 0; _i < arguments.length; _i++) {
                                        a[_i] = arguments[_i];
                                    }
                                    if (!_this.manager)
                                        throw new Error('Manager is missing on ReClusterManager');
                                    var cluster = _this.manager.createCluster(clusterId, _this.manager.shardClusterList[i], _this.manager.totalShards, true);
                                    newClusters.set(clusterId, cluster);
                                    _this.manager._debug("[\u21BB][ReClustering][".concat(clusterId, "] Spawning... Cluster"));
                                    return cluster.spawn.apply(cluster, a).then(function (c) {
                                        if (!_this.manager)
                                            throw new Error('Manager is missing on ReClusterManager');
                                        _this.manager._debug("[\u21BB][ReClustering][".concat(clusterId, "] Cluster Ready"));
                                        if (switchClusterAfterReady) {
                                            var oldCluster = _this.manager.clusters.get(clusterId);
                                            if (oldCluster) {
                                                oldCluster.kill({ force: true, reason: 'reclustering' });
                                                oldClusters.delete(clusterId);
                                            }
                                            _this.manager.clusters.set(clusterId, cluster);
                                            cluster.triggerMaintenance(undefined);
                                            _this.manager._debug("[\u21BB][ReClustering][".concat(clusterId, "] Switched OldCluster to NewCluster and exited Maintenance Mode"));
                                        }
                                        return c;
                                    });
                                },
                                args: [readyTimeout],
                                timeout: spawnDelay,
                            });
                        };
                        this_1 = this;
                        for (i = 0; i < this.manager.totalClusters; i++) {
                            _loop_1(i);
                        }
                        return [4, this.manager.queue.start()];
                    case 1:
                        _h.sent();
                        if (oldClusters.size) {
                            this.manager._debug('[↻][ReClustering] Killing old clusters');
                            for (_i = 0, _f = Array.from(oldClusters); _i < _f.length; _i++) {
                                _g = _f[_i], id = _g[0], cluster = _g[1];
                                cluster.kill({ force: true, reason: 'reclustering' });
                                this.manager._debug("[\u21BB][ReClustering][".concat(id, "] Killed OldCluster"));
                                this.manager.clusters.delete(id);
                            }
                            oldClusters.clear();
                        }
                        if (!switchClusterAfterReady) {
                            this.manager._debug('[↻][ReClustering] Starting exiting Maintenance Mode on all clusters and killing old clusters');
                            for (i = 0; i < this.manager.totalClusters; i++) {
                                clusterId = this.manager.clusterList[i] || i;
                                cluster = newClusters.get(clusterId);
                                oldCluster = this.manager.clusters.get(clusterId);
                                if (!cluster)
                                    continue;
                                if (oldCluster) {
                                    oldCluster.kill({ force: true, reason: 'reclustering' });
                                    oldClusters.delete(clusterId);
                                }
                                this.manager.clusters.set(clusterId, cluster);
                                cluster.triggerMaintenance();
                                this.manager._debug("[\u21BB][ReClustering][".concat(clusterId, "] Switched OldCluster to NewCluster and exited Maintenance Mode"));
                            }
                        }
                        newClusters.clear();
                        this.onProgress = false;
                        process.env.MAINTENANCE = undefined;
                        this.manager._debug('[↻][ReClustering] Finished ReClustering');
                        return [2, { success: true }];
                }
            });
        });
    };
    return ReClusterManager;
}());
exports.ReClusterManager = ReClusterManager;
