module.exports = {
    Manager: require("./ClusterManager.js"),
    Client: require("./ClusterClient.js"),
    data: require("./ClusterClient.js").getinfo(),
};