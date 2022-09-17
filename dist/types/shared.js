export const Events = {
    ERROR: 'warn',
    WARN: 'error',
};
export const DefaultOptions = {
    http: {
        api: 'https://discord.com/api',
        version: '10',
    },
};
export const Endpoints = {
    botGateway: '/gateway/bot',
};
export var messageType;
(function (messageType) {
    messageType[messageType["CLIENT_SPAWN_NEXT_CLUSTER"] = 0] = "CLIENT_SPAWN_NEXT_CLUSTER";
    messageType[messageType["CLIENT_RESPAWN"] = 1] = "CLIENT_RESPAWN";
    messageType[messageType["CLIENT_RESPAWN_ALL"] = 2] = "CLIENT_RESPAWN_ALL";
    messageType[messageType["CLIENT_MAINTENANCE"] = 3] = "CLIENT_MAINTENANCE";
    messageType[messageType["CLIENT_MAINTENANCE_ENABLE"] = 4] = "CLIENT_MAINTENANCE_ENABLE";
    messageType[messageType["CLIENT_MAINTENANCE_DISABLE"] = 5] = "CLIENT_MAINTENANCE_DISABLE";
    messageType[messageType["CLIENT_MAINTENANCE_ALL"] = 6] = "CLIENT_MAINTENANCE_ALL";
    messageType[messageType["CLIENT_READY"] = 7] = "CLIENT_READY";
    messageType[messageType["CUSTOM_REQUEST"] = 8] = "CUSTOM_REQUEST";
    messageType[messageType["CUSTOM_REPLY"] = 9] = "CUSTOM_REPLY";
    messageType[messageType["CUSTOM_MESSAGE"] = 10] = "CUSTOM_MESSAGE";
    messageType[messageType["HEARTBEAT"] = 11] = "HEARTBEAT";
    messageType[messageType["HEARTBEAT_ACK"] = 12] = "HEARTBEAT_ACK";
    messageType[messageType["CLIENT_BROADCAST_REQUEST"] = 13] = "CLIENT_BROADCAST_REQUEST";
    messageType[messageType["CLIENT_BROADCAST_RESPONSE"] = 14] = "CLIENT_BROADCAST_RESPONSE";
    messageType[messageType["CLIENT_EVAL_REQUEST"] = 15] = "CLIENT_EVAL_REQUEST";
    messageType[messageType["CLIENT_EVAL_RESPONSE"] = 16] = "CLIENT_EVAL_RESPONSE";
    messageType[messageType["CLIENT_MANAGER_EVAL_REQUEST"] = 17] = "CLIENT_MANAGER_EVAL_REQUEST";
    messageType[messageType["CLIENT_MANAGER_EVAL_RESPONSE"] = 18] = "CLIENT_MANAGER_EVAL_RESPONSE";
    messageType[messageType["MANAGER_BROADCAST_REQUEST"] = 19] = "MANAGER_BROADCAST_REQUEST";
    messageType[messageType["MANAGER_BROADCAST_RESPONSE"] = 20] = "MANAGER_BROADCAST_RESPONSE";
})(messageType || (messageType = {}));
