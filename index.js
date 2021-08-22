module.exports = {
    Manager: require("./src/ClusterManager.js"),
    Client: require("./src/ClusterClient.js"),
    data: require("./src/ClusterClient.js").getinfo(),
};