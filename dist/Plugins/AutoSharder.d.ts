import { ClusterClient, ClusterManager, DjsDiscordClient } from "../";
export interface AutoResharderSendData {
    clusterId: number;
    shardData: {
        shardId: number;
        guildCount: number;
    }[];
}
interface AutoResharderClusterClientOptions {
    /**
     * How often to send the data (the faster the bot grows, the more often you should send the data)
     * @default 60e3
     */
    sendDataIntervalMS: number;
    /**
     * Function to send the required Data for the AUTORESHARDING
     * @param cluster
     * @returns sendData can be either sync or async
     *
     * @example
     * ```ts
     * sendDataFunction: (cluster:ClusterClient<DjsDiscordClient>) => {
     *       return {
     *           clusterId: cluster.id,
     *           shardData: cluster.info.SHARD_LIST.map(shardId => ({ shardId, guildCount: cluster.client.guilds.cache.filter(g => g.shardId === shardId).size }))
     *       }
     * }
     * ```
     */
    sendDataFunction: (cluster: ClusterClient<DjsDiscordClient>) => Promise<AutoResharderSendData> | AutoResharderSendData;
    debug?: boolean;
}
interface AutoResharderManagerOptions {
    ShardsPerCluster: number | 'useManagerOption';
    MinGuildsPerShard: 'auto' | number;
    MaxGuildsPerShard: number;
    restartOptions?: {
        /** The restartMode of the clusterManager, gracefulSwitch = waits until all new clusters have spawned with maintenance mode, rolling = Once the Cluster is Ready, the old cluster will be killed  */
        restartMode?: 'gracefulSwitch' | 'rolling';
        /** The delay to wait between each cluster spawn */
        delay?: number;
        /** The readyTimeout to wait until the cluster spawn promise is rejected */
        timeout?: number;
    };
    debug?: boolean;
}
export declare class AutoResharderClusterClient {
    private clusterClient;
    /** The Options of the AutoResharderClusterClient */
    private options;
    /** The Stored Interval */
    private interval;
    /** Wether it is running or not */
    private started;
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
    constructor(clusterClient: ClusterClient<DjsDiscordClient>, options?: Partial<AutoResharderClusterClientOptions>);
    private validate;
    /**
     * Stops the Function and interval
     * @returns
     */
    stop(): boolean;
    /**
     * Start it manually after you stopped it (on initialization it automatically starts the function)
     * @param newOptions
     * @param executeSendData Wether it should send the data immediately or as normal: after the interval is reached.
     * @returns
     */
    start(newOptions?: Partial<AutoResharderClusterClientOptions>, executeSendData?: boolean): Promise<boolean>;
    /**
     * Restart the function and interval, if needed
     * @param newOptions Optinally change the options to your new options
     * @param executeSendData Wether it should send the data immediately or as normal: after the interval is reached.
     * @returns
     */
    reStart(newOptions?: Partial<AutoResharderClusterClientOptions>, executeSendData?: boolean): Promise<boolean>;
    /**
     * Initializes the interval
     * @param executeSendData Wether it should send the data immediately or as normal: after the interval is reached.
     * @returns
     */
    private initialize;
    private sendData;
}
export declare class AutoResharderManager {
    name: 'autoresharder';
    onProgress: Boolean;
    private manager?;
    private clusterDatas;
    private options;
    private clustersListening;
    private isReClustering;
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
    constructor(options?: Partial<AutoResharderManagerOptions>);
    build(manager: ClusterManager): this;
    private initialize;
    private checkReCluster;
    private validate;
}
export {};
//# sourceMappingURL=AutoSharder.d.ts.map