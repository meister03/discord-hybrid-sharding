"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heartbeat = exports.HeartbeatManager = void 0;
var shared_1 = require("../types/shared");
var HeartbeatManager = (function () {
    function HeartbeatManager(options) {
        if (!options)
            options = {};
        this.options = options;
        if (!this.options.interval)
            this.options.interval = 20000;
        if (!this.options.maxMissedHeartbeats)
            this.options.maxMissedHeartbeats = 5;
        this.clusters = new Map();
        this.manager = null;
        this.name = 'heartbeat';
    }
    HeartbeatManager.prototype.build = function (manager) {
        manager[this.name] = this;
        this.manager = manager;
        this.start();
    };
    HeartbeatManager.prototype.start = function () {
        var _this = this;
        var _a;
        (_a = this.manager) === null || _a === void 0 ? void 0 : _a.on('clusterReady', function (cluster) {
            var _a;
            if (_this.clusters.has(cluster.id))
                (_a = _this.clusters.get(cluster.id)) === null || _a === void 0 ? void 0 : _a.stop();
            _this.clusters.set(cluster.id, new Heartbeat(_this, cluster, _this.options));
        });
    };
    HeartbeatManager.prototype.stop = function (cluster, reason) {
        var _a, _b, _c, _d, _e;
        if (!this.clusters.has(cluster.id))
            return;
        (_a = this.clusters.get(cluster.id)) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = this.manager) === null || _b === void 0 ? void 0 : _b._debug("[Heartbeat_MISSING] ".concat(reason), cluster.id);
        if (cluster.restarts.current < cluster.restarts.max) {
            cluster.respawn((_c = this.manager) === null || _c === void 0 ? void 0 : _c.spawnOptions);
            (_d = this.manager) === null || _d === void 0 ? void 0 : _d._debug('[Heartbeat_MISSING] Attempted Respawn', cluster.id);
        }
        else {
            (_e = this.manager) === null || _e === void 0 ? void 0 : _e._debug('[Heartbeat_MISSING] Respawn Rejected | Max Restarts of Cluster Reached', cluster.id);
        }
    };
    HeartbeatManager.prototype.ack = function (id, date) {
        var _a;
        if (!this.clusters.has(id))
            return;
        (_a = this.clusters.get(id)) === null || _a === void 0 ? void 0 : _a.ack(date);
    };
    return HeartbeatManager;
}());
exports.HeartbeatManager = HeartbeatManager;
var Heartbeat = (function () {
    function Heartbeat(manager, instance, options) {
        this.manager = manager;
        this.options = options;
        this.interval = undefined;
        this.heartbeats = new Map();
        this.instance = instance;
        this.start();
    }
    Heartbeat.prototype.ack = function (date) {
        return this.heartbeats.delete(date);
    };
    Heartbeat.prototype.start = function () {
        var _this = this;
        return (this.interval = setInterval(function () {
            var _a;
            var start = Date.now();
            _this.heartbeats.set(start, true);
            (_a = _this.instance.send({ _type: shared_1.messageType.HEARTBEAT, date: start })) === null || _a === void 0 ? void 0 : _a.catch(function () { return null; });
            if (_this.heartbeats.size > _this.options.maxMissedHeartbeats) {
                _this.manager.stop(_this.instance, "Missed ".concat(_this.heartbeats.size, " Heartbeat Acks | Attempting Respawn"));
            }
        }, this.options.interval));
    };
    Heartbeat.prototype.stop = function () {
        this.heartbeats.clear();
        clearInterval(this.interval);
    };
    Heartbeat.prototype.resume = function () {
        this.start();
    };
    return Heartbeat;
}());
exports.Heartbeat = Heartbeat;
