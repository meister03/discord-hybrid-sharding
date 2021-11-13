module.exports = {
    Manager: require("./src/ClusterManager.js"),
    Client: require("./src/ClusterClient.js"),
    data: require("./src/ClusterClient.js").getinfo(),
    IPCMessage: require('./src/IPCMessage.js').IPCMessage,
    BaseMessage: require('./src/IPCMessage.js').BaseMessage,
};