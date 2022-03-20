module.exports = {
    Manager: require('./src/Core/ClusterManager.js'),
    Client: require('./src/Core/ClusterClient.js'),
    data: require('./src/Core/ClusterClient.js').getInfo(),
    Util: require('./src/Util/Util.js'),
    IPCMessage: require('./src/Structures/IPCMessage.js').IPCMessage,
    BaseMessage: require('./src/Structures/IPCMessage.js').BaseMessage,
};
