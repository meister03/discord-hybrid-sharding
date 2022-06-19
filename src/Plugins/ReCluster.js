// @ts-check
const Util = require('../Util/Util.js');
class Manager {
    constructor(options = {}) {
        this.name = 'recluster';
        this.onProgress = false;
    }
    build(manager){
        manager[this.name] = this;
        this.manager = manager;
    }

    async start({totalShards, totalClusters, shardsPerCluster, shardClusterList, shardList, restartMode = 'gracefulSwitch'}){
        if(this.onProgress) throw new Error('Zero Downtime Reclustering is already in progress')
        if(totalShards){
            if(totalShards === 'auto') totalShards = Util.fetchRecommendedShards(this.manager.token);
            this.manager.totalShards = totalShards;
        }
        if(totalClusters) this.manager.totalClusters = totalClusters;
        if(shardsPerCluster) {
            this.manager.shardsPerCluster = shardsPerCluster;
            this.manager.totalClusters = Math.ceil(this.manager.totalShards / this.manager.shardsPerCluster);
        }

        if(shardList) this.manager.shardList = shardList;
        else this.manager.shardList = [...Array(this.manager.shardList).keys()];
        if(shardClusterList) this.manager.shardClusterList = shardClusterList;
        else this.manager.shardList.chunk(Math.ceil(this.manager.shardList.length / this.manager.totalClusters));

        if (this.manager.shardClusterList.length !== this.manager.totalClusters) {
            this.manager.totalClusters = this.manager.shardClusterList.length;
        }
        return this._start({restartMode});
    }

    _start({restartMode}){
        let switchClusterAfterReady = false;
        // when no shard settings have been updated
        if(restartMode === 'rolling') switchClusterAfterReady = true;
        else switchClusterAfterReady = false; //gracefulSwitch, spawn all clusters and kill all old clusters, when new clusters are ready

        const oldClusters = this.manager.clusters;
        

    }
}