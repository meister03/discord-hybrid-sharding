"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageType = exports.Endpoints = exports.DefaultOptions = exports.Events = void 0;
exports.Events = {
    ERROR: 'warn',
    WARN: 'error',
};
exports.DefaultOptions = {
    http: {
        api: 'https://discord.com/api',
        version: '10',
    },
};
exports.Endpoints = {
    botGateway: '/gateway/bot',
};
var messageType;
(function (messageType) {
    messageType[messageType["CUSTOM_REQUEST"] = 0] = "CUSTOM_REQUEST";
    messageType[messageType["CUSTOM_MESSAGE"] = 1] = "CUSTOM_MESSAGE";
    messageType[messageType["CUSTOM_REPLY"] = 2] = "CUSTOM_REPLY";
    messageType[messageType["HEARTBEAT"] = 3] = "HEARTBEAT";
    messageType[messageType["HEARTBEAT_ACK"] = 4] = "HEARTBEAT_ACK";
    messageType[messageType["CLIENT_BROADCAST_REQUEST"] = 5] = "CLIENT_BROADCAST_REQUEST";
    messageType[messageType["CLIENT_BROADCAST_RESPONSE"] = 6] = "CLIENT_BROADCAST_RESPONSE";
    messageType[messageType["CLIENT_RESPAWN"] = 7] = "CLIENT_RESPAWN";
    messageType[messageType["CLIENT_RESPAWN_ALL"] = 8] = "CLIENT_RESPAWN_ALL";
    messageType[messageType["CLIENT_MAINTENANCE"] = 9] = "CLIENT_MAINTENANCE";
    messageType[messageType["CLIENT_MAINTENANCE_ENABLE"] = 10] = "CLIENT_MAINTENANCE_ENABLE";
    messageType[messageType["CLIENT_MAINTENANCE_DISABLE"] = 11] = "CLIENT_MAINTENANCE_DISABLE";
    messageType[messageType["CLIENT_MAINTENANCE_ALL"] = 12] = "CLIENT_MAINTENANCE_ALL";
    messageType[messageType["CLIENT_SPAWN_NEXT_CLUSTER"] = 13] = "CLIENT_SPAWN_NEXT_CLUSTER";
    messageType[messageType["CLIENT_READY"] = 14] = "CLIENT_READY";
    messageType[messageType["CLIENT_EVAL_REQUEST"] = 15] = "CLIENT_EVAL_REQUEST";
    messageType[messageType["CLIENT_EVAL_RESPONSE"] = 16] = "CLIENT_EVAL_RESPONSE";
    messageType[messageType["CLIENT_MANAGER_EVAL_REQUEST"] = 17] = "CLIENT_MANAGER_EVAL_REQUEST";
    messageType[messageType["CLIENT_MANAGER_EVAL_RESPONSE"] = 18] = "CLIENT_MANAGER_EVAL_RESPONSE";
    messageType[messageType["MANAGER_BROADCAST_REQUEST"] = 19] = "MANAGER_BROADCAST_REQUEST";
    messageType[messageType["MANAGER_BROADCAST_RESPONSE"] = 20] = "MANAGER_BROADCAST_RESPONSE";
})(messageType = exports.messageType || (exports.messageType = {}));
