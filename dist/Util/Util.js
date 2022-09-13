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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRecommendedShards = exports.shardIdForGuildId = exports.makePlainError = exports.delayFor = exports.chunkArray = exports.generateNonce = void 0;
var node_fetch_1 = __importDefault(require("node-fetch"));
var shared_1 = require("../types/shared");
function generateNonce() {
    return Date.now().toString(36) + Math.random().toString(36);
}
exports.generateNonce = generateNonce;
function chunkArray(array, chunkSize) {
    var R = [];
    for (var i = 0; i < array.length; i += chunkSize)
        R.push(array.slice(i, i + chunkSize));
    return R;
}
exports.chunkArray = chunkArray;
function delayFor(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
exports.delayFor = delayFor;
function makePlainError(err) {
    return {
        name: err['name'],
        message: err['message'],
        stack: err['stack'],
    };
}
exports.makePlainError = makePlainError;
function shardIdForGuildId(guildId, totalShards) {
    if (totalShards === void 0) { totalShards = 1; }
    var shard = Number(BigInt(guildId) >> BigInt(22)) % totalShards;
    if (shard < 0)
        throw new Error('SHARD_MISCALCULATION_SHARDID_SMALLER_THAN_0 ' + "Calculated Shard: ".concat(shard, ", guildId: ").concat(guildId, ", totalShards: ").concat(totalShards));
    return shard;
}
exports.shardIdForGuildId = shardIdForGuildId;
function fetchRecommendedShards(token, guildsPerShard) {
    if (guildsPerShard === void 0) { guildsPerShard = 1000; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!token)
                throw new Error('DISCORD_TOKEN_MISSING');
            return [2, (0, node_fetch_1.default)("".concat(shared_1.DefaultOptions.http.api, "/v").concat(shared_1.DefaultOptions.http.version).concat(shared_1.Endpoints.botGateway), {
                    method: 'GET',
                    headers: { Authorization: "Bot ".concat(token.replace(/^Bot\s*/i, '')) },
                })
                    .then(function (res) {
                    if (res.ok)
                        return res.json();
                    if (res.status === 401)
                        throw new Error('DISCORD_TOKEN_INVALID');
                    throw res;
                })
                    .then(function (data) { return data.shards * (1000 / guildsPerShard); })];
        });
    });
}
exports.fetchRecommendedShards = fetchRecommendedShards;
