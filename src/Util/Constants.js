exports.Events = {
    ERROR: 'warn',
    WARN: 'error',
};

exports.DefaultOptions = {
    http: {
        api: 'https://discord.com/api',
        version: '9',
    },
};

exports.Endpoints = {
    botGateway: '/gateway/bot',
};

exports.messageType = createEnum([
    'CLIENT_SPAWN_NEXT_CLUSTER',
    'CLIENT_RESPAWN',
    'CLIENT_RESPAWN_ALL',
    'CLIENT_READY',
    'CUSTOM_REQUEST',
    'CUSTOM_REPLY',
    'CUSTOM_MESSAGE',
    'HEARTBEAT',
    'HEARTBEAT_ACK',
    'CLIENT_BROADCAST_REQUEST',
    'CLIENT_BROADCAST_RESPONSE',
    'CLIENT_EVAL_REQUEST',
    'CLIENT_EVAL_RESPONSE',
    'CLIENT_MANAGER_EVAL_REQUEST',
    'CLIENT_MANAGER_EVAL_RESPONSE',
    'MANAGER_BROADCAST_REQUEST',
    'MANAGER_BROADCAST_RESPONSE',
]);

function createEnum(keys) {
    const obj = {};
    for (const [index, key] of keys.entries()) {
        if (key === null) continue;
        obj[key] = index;
        obj[index] = key;
    }
    return obj;
}