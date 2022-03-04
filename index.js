module.exports = {
    Manager: require("./src/Core/ClusterManager.js"),
    Client: require("./src/Core/ClusterClient.js"),
    data: require("./src/Core/ClusterClient.js").getinfo(),
    Util: require("./src/Util.js"),
    IPCMessage: require('./src/IPCMessage.js').IPCMessage,
    BaseMessage: require('./src/IPCMessage.js').BaseMessage,
};