"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoResharderManager = exports.AutoResharderClusterClient = void 0;
const __1 = require("../");
class AutoResharderClusterClient {
    clusterClient;
    /** The Options of the AutoResharderClusterClient */
    options = {
        sendDataIntervalMS: 60e3,
        debug: false,
        sendDataFunction: (cluster) => {
            return {
                clusterId: cluster.id,
                shardData: cluster.info.SHARD_LIST.map(shardId => ({
                    shardId,
                    guildCount: cluster.client.guilds.cache.filter(g => g.shardId === shardId).size,
                })),
            };
        },
    };
    /** The Stored Interval */
    interval = null;
    /** Wether it is running or not */
    started = false;
    /**
     * The Cluster client and what it shold contain
     * @param {ClusterClient<DjsDiscordClient>} clusterClient
     * @param {Partial<AutoResharderClusterClientOptions>} [options] the Optional options
     * @param {(cluster:ClusterClient<DjsDiscordClient>) => Promise<AutoResharderSendData> | AutoResharderSendData} options.sendDataFunction Get the relevant data (custom function if you don't use smt like djs, then provide it!)
     * @example
     * ```ts
     * client.cluster = new ClusterManager(client);
     * new AutoResharderClusterClient(client.cluster, {
     *   // optional. Default is 60e3 which sends every minute the data / cluster
     *   sendDataIntervalMS: 60e3,
     *   // optional. Default is a valid function for discord.js Client's
     *   sendDataFunction: (cluster:ClusterClient<DjsDiscordClient>) => {
     *       return {
     *           clusterId: cluster.id,
     *           shardData: cluster.info.SHARD_LIST.map(shardId => ({ shardId, guildCount: cluster.client.guilds.cache.filter(g => g.shardId === shardId).size }))
     *       }
     *   }
     * });
     * ```
     */
    constructor(clusterClient, options) {
        this.clusterClient = clusterClient;
        this.options = {
            ...this.options,
            ...(options || {}),
        };
        this.validate();
        this.initialize();
    }
    validate() {
        if (typeof this.clusterClient !== 'object' ||
            typeof this.clusterClient.id !== 'number' ||
            typeof this.clusterClient.info !== 'object' ||
            !Array.isArray(this.clusterClient.info.SHARD_LIST) ||
            typeof this.clusterClient.send !== 'function')
            throw new SyntaxError('clusterClient must be provided with a valid clusterId, send function and info.SHARD_LISt');
        if (typeof this.options.sendDataIntervalMS !== 'number' || this.options.sendDataIntervalMS < 1000)
            throw new SyntaxError('CLIENT_AutoResharderOptions.sendDataIntervalMS must be a number >= 1000');
        if (typeof this.options.sendDataFunction !== 'function')
            throw new SyntaxError('CLIENT_AutoResharderOptions.sendDataFunction must be a function to return the sendData: { clusterId: number, shardData: { shardId: number; guildCount; number }[] }');
    }
    /**
     * Stops the Function and interval
     * @returns
     */
    stop() {
        // clear the interval just to be sure
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.started === false)
            throw new Error('Not running!');
        return true;
    }
    /**
     * Start it manually after you stopped it (on initialization it automatically starts the function)
     * @param newOptions
     * @param executeSendData Wether it should send the data immediately or as normal: after the interval is reached.
     * @returns
     */
    start(newOptions, executeSendData = false) {
        if (this.started === true)
            throw new Error('Already started');
        // overide the options
        this.options = {
            ...this.options,
            ...(newOptions || {}),
        };
        return this.initialize(executeSendData);
    }
    /**
     * Restart the function and interval, if needed
     * @param newOptions Optinally change the options to your new options
     * @param executeSendData Wether it should send the data immediately or as normal: after the interval is reached.
     * @returns
     */
    reStart(newOptions, executeSendData = false) {
        // clear the interval just to be sure
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        // overide the options
        this.options = {
            ...this.options,
            ...(newOptions || {}),
        };
        return this.initialize(executeSendData);
    }
    /**
     * Initializes the interval
     * @param executeSendData Wether it should send the data immediately or as normal: after the interval is reached.
     * @returns
     */
    async initialize(executeSendData = false) {
        // if interval exists
        if (this.interval)
            clearInterval(this.interval);
        if (executeSendData === true) {
            await this.sendData();
        }
        this.interval = setInterval(() => this.sendData(), this.options.sendDataIntervalMS);
        return true;
    }
    async sendData() {
        this.validate();
        const sendData = await this.options.sendDataFunction(this.clusterClient);
        if (typeof sendData !== 'object' ||
            typeof sendData.clusterId !== 'number' ||
            sendData.clusterId < 0 ||
            !Array.isArray(sendData.shardData) ||
            sendData.shardData.some(v => typeof v.guildCount !== 'number' ||
                v.guildCount < 0 ||
                typeof v.shardId !== 'number' ||
                v.shardId < 0))
            throw new SyntaxError('Invalid sendData, must be like this: { clusterId: number, shardData: { shardId: number; guildCount; number }[] }');
        if (this.options.debug === true)
            console.debug(` CLIENT-AUTORESHARDER :: Sending Data for Cluster #${sendData.clusterId}`);
        return await this.clusterClient.send({
            _type: __1.messageType.CLIENT_AUTORESHARDER_SENDDATA,
            data: sendData,
        });
    }
}
exports.AutoResharderClusterClient = AutoResharderClusterClient;
class AutoResharderManager {
    name;
    manager;
    clustersListening = new Set();
    clusterDatas = [];
    options = {
        ShardsPerCluster: 'useManagerOption',
        MinGuildsPerShard: 1500,
        MaxGuildsPerShard: 2400,
        restartOptions: {
            restartMode: 'gracefulSwitch',
            delay: 7e3,
            timeout: -1,
        },
        debug: false,
    };
    isReClustering = false;
    /**
     * @param options The options when to reshard etc.
     * @example
     *
     * ```ts
     * manager.extend(new AutoResharderManager({
     *    ShardsPerCluster: 'useManagerOption',
     *    MinGuildsPerShard: 1500,
     *    MaxGuildsPerShard: 2400,
     *    restartOptions: {
     *        restartMode: 'gracefulSwitch',
     *        delay: 7e3,
     *        timeout: -1,
     *    },
     *    debug: true,
     *  }))
     * ```
     */
    constructor(options) {
        this.name = 'autoresharder';
        this.options = {
            ...this.options,
            ...(options || {}),
            restartOptions: {
                ...this.options.restartOptions,
                ...(options?.restartOptions || {}),
            },
        };
    }
    build(manager) {
        manager[this.name] = this;
        this.manager = manager;
        this.validate();
        this.initialize();
        return this;
    }
    async checkReCluster() {
        if (!this.manager)
            throw new Error('Manager is missing on AutoResharderManager');
        // check for cross-hosting max cluster amount
        if (this.clusterDatas.length <= this.manager.clusterList.length) {
            if (this.options.debug === true)
                console.debug('MANAGER-AUTORESHARDER :: Not all cluster data(s) reached yet');
            return;
        }
        if (this.isReClustering === true) {
            if (this.options.debug === true)
                console.debug('MANAGER-AUTORESHARDER :: Already re-sharding');
        }
        if (!(0, __1.arraysAreTheSame)(Array.from(Array(this.manager.totalShards).keys()), this.manager.shardList)) {
            // TODO make it work for discord-cross-hosting too
            /*
            to make it work following things must happen:
             - Calculating totalShards stays the same
             - Option 1 without a bridgeManager
             - AutoReshardingManager must retrieve the amount of machines from the bridge and their configuration
             - AutoReshardingManager must then calculate the shardList for every machine based on that
             - AutoReshardingManager must then broadcast to both bridge, machinemanager and clusters to make them work.
             - Option 2 implement a manager just for the bridge
            */
            throw new RangeError("It seems that you are using 'discord-cross-hosting' or a custom shardList specification. With either of those you can't run this plugin (yet)");
            // it must also set the new shardList, totalShards etc. variables on the machine
            // to do that there must be access to the bridge
        }
        const reachedCluster = this.clusterDatas.find(v => v.shardData.some(x => x.guildCount >= this.options.MaxGuildsPerShard));
        if (reachedCluster) {
            if (typeof this.manager.recluster === 'undefined')
                throw new RangeError('ClusterManager must be extended with the ReCluster Plugin!');
            this.isReClustering = true;
            /**
             * The newshards needed amount, calculates based on what you provide for MinGuildsPerShard and MaxGuildsPerShard
             * If 1 shard of all clusters >= MaxGuildsPerShard -> RESHARD!
             * It trys to make so many shards, that on avg. every shard has MinGuildsPerShard aka: totalGuilds / MinGuildsPerShard should be equal to the amount of new shards
             * However the math isn't possible for every situation like that
             * That's why it's done differently:
             * It sums up all guilds from the clusterData, devides it with the minguildscount and ceils it to the next round numebr
             *
             * But then due to possible data problems, it also checks wether the shard amount is bigger than the current, if not the current get's raised by 20% and ceiled to the next rounded number to increase it nonetheless
             */
            const newShardsCount = this.options.MinGuildsPerShard === 'auto'
                ? await (0, __1.fetchRecommendedShards)(this.manager.token)
                : Math.ceil(this.clusterDatas
                    .flatMap(v => v.shardData)
                    .reduce((a, b) => (!isNaN(b?.guildCount) ? b?.guildCount : 0) + (a || 0), 0) /
                    this.options.MinGuildsPerShard);
            const realShardCount = newShardsCount > this.manager.totalShards ? newShardsCount : Math.ceil(this.manager.totalShards * 1.2);
            if (this.options.debug)
                console.debug(`MANAGER-AUTORESHARDER :: Reclustering from [${this.manager.totalShards} Shards] to [${realShardCount} Shards], becaused Cluster #${reachedCluster.clusterId} reached ${reachedCluster.shardData.sort((a, b) => b.guildCount - a.guildCount)[0]?.guildCount} Guilds on 1 Shard: ${reachedCluster.shardData
                    .sort((a, b) => b.guildCount - a.guildCount)
                    .map(x => `[Shard #${x.shardId} - ${x.guildCount} Guilds]`)
                    .join(' - ')}`);
            const finalShardsPerCluster = this.options.ShardsPerCluster === 'useManagerOption'
                ? this.manager.shardsPerClusters ||
                    Math.ceil(this.manager.shardList.length / this.manager.totalClusters)
                : this.options.ShardsPerCluster;
            const data = await this.manager.recluster.start({
                ...this.options.restartOptions,
                shardsPerClusters: finalShardsPerCluster,
                totalShards: realShardCount,
                totalClusters: Math.ceil(realShardCount / finalShardsPerCluster),
                shardList: Array.from(Array(realShardCount).keys()),
            });
            this.isReClustering = false;
            if (this.options.debug === true)
                console.debug(`MANAGER-AUTORESHARDER :: Finished Autoresharding with following data from Manager.Reclustering:`, data);
        }
    }
    initialize() {
        if (!this.manager)
            throw new Error('Manager is missing on AutoResharderManager');
        try {
            this.manager.on('clusterCreate', cluster => {
                if (this.clustersListening.has(cluster.id)) {
                    return;
                }
                this.clustersListening.add(cluster.id);
                cluster.on('message', message => {
                    if (typeof message !== 'object')
                        return;
                    const msg = ('raw' in message ? message.raw : message);
                    if (msg._type !== __1.messageType.CLIENT_AUTORESHARDER_SENDDATA)
                        return;
                    const index = this.clusterDatas.findIndex(v => v.clusterId === msg.data.clusterId);
                    if (index < 0)
                        this.clusterDatas.push(msg.data);
                    else
                        this.clusterDatas[index] = msg.data;
                    if (this.options.debug === true)
                        console.debug(`MANAGER-AUTORESHARDER :: Reached sendData of Cluster #${cluster.id} for:`, msg.data);
                    this.checkReCluster();
                });
            });
        }
        catch (e) {
            console.error(e);
        }
    }
    validate() {
        if (!this.manager)
            throw new Error('Manager is missing on AutoResharderManager');
        if (typeof this.options.ShardsPerCluster === 'string' && this.options.ShardsPerCluster !== 'useManagerOption')
            throw new SyntaxError("AutoResharderManagerOptions.ShardsPerCluster must be 'useManagerOption' or a number >= 1");
        else if (typeof this.options.ShardsPerCluster !== 'number' || this.options.ShardsPerCluster < 1)
            throw new SyntaxError("AutoResharderManagerOptions.ShardsPerCluster must be 'useManagerOption' or a number >= 1");
        if (typeof this.options.MinGuildsPerShard === 'string' && this.options.MinGuildsPerShard !== 'auto')
            throw new SyntaxError("AutoResharderManagerOptions.MinGuildsPerShard must be 'auto' or a number >= 500");
        else if (typeof this.options.MinGuildsPerShard !== 'number' || this.options.MinGuildsPerShard < 500)
            throw new SyntaxError("AutoResharderManagerOptions.MinGuildsPerShard must be 'auto' or a number >= 500");
        if (typeof this.options.MaxGuildsPerShard !== 'number' ||
            (typeof this.options.MinGuildsPerShard === 'number' &&
                this.options.MaxGuildsPerShard <= this.options.MinGuildsPerShard) ||
            this.options.MaxGuildsPerShard > 2500)
            throw new SyntaxError('AutoResharderManagerOptions.MinGuildsPerShard must be higher (if not auto) than AutoResharderManagerOptions.MaxGuildsPerShard and lower than 2500');
        if (typeof this.manager.recluster === 'undefined')
            throw new RangeError('ClusterManager must be extended with the ReCluster Plugin!');
        if (typeof this.options.MinGuildsPerShard === 'string' &&
            this.options.MinGuildsPerShard === 'auto' &&
            this.options.MaxGuildsPerShard <= 2000)
            throw new RangeError("If AutoResharderManagerOptions.MinGuildsPerShard is set to 'auto' than AutoResharderManagerOptions.MaxGuildsPerShard must be a number > 2000");
    }
}
exports.AutoResharderManager = AutoResharderManager;
