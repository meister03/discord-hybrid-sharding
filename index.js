module.exports = {
    Manager: require("./ClusterManager.js"),
    Client: require("./ClusterClient.js"),
    data: (require("worker_threads").workerData ? require("worker_threads").workerData : require("child_process") ),
};