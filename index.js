module.exports = {
    Manager: require('./src/Core/ClusterManager.js'),
    Client: require('./src/Core/ClusterClient.js'),
    data: require('./src/Structures/Data.js'),
    Util: require('./src/Util/Util.js'),
    IPCMessage: require('./src/Structures/IPCMessage.js').IPCMessage,
    BaseMessage: require('./src/Structures/IPCMessage.js').BaseMessage,
    HeartbeatManager: require('./src/Plugins/HeartbeatSystem.js'),
    ReClusterManager: require('./src/Plugins/ReCluster.js'),
};
