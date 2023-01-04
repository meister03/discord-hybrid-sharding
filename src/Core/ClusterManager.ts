import fs from 'fs';
import path from 'path';
import os from 'os';
import EventEmitter from 'events';

import { chunkArray, delayFor, fetchRecommendedShards, makePlainError, shardIdForGuildId } from '../Util/Util';
import { Queue } from '../Structures/Queue';
import { Cluster } from './Cluster';
import { PromiseHandler } from '../Structures/PromiseHandler';
import {
    Awaitable,
    ClusterManagerEvents,
    ClusterManagerOptions,
    ClusterManagerSpawnOptions,
    ClusterRestartOptions,
    DjsDiscordClient,
    evalOptions,
    Plugin,
    QueueOptions,
    Serialized,
} from '../types/shared';
import { ChildProcessOptions } from '../Structures/Child';
import { WorkerThreadOptions } from '../Structures/Worker';
import { BaseMessage } from '../Structures/IPCMessage';
import { HeartbeatManager } from '../Plugins/HeartbeatSystem';
import { ReClusterManager } from '../Plugins/ReCluster';

export class ClusterManager extends EventEmitter {
    /**
     * Whether clusters should automatically respawn upon exiting
     */
    respawn: boolean;

    /**
     * How many times a cluster can maximally restart in the given interval
     */
    restarts: ClusterRestartOptions;

    /**
     * Data, which is passed to the workerData or the processEnv
     */
    clusterData: object;

    /**
     * Options, which is passed when forking a child or creating a thread
     */
    clusterOptions: ChildProcessOptions | WorkerThreadOptions | {};

    /**
     * Path to the bot script file
     */
    file: string;
    /**
     * Amount of internal shards in total
     */
    totalShards: number | -1;

    /**
     * Amount of total clusters to spawn
     */
    totalClusters: number | -1;

    /**
     * Amount of Shards per Clusters
     */
    shardsPerClusters: number | undefined;

    /** Mode for Clusters to spawn with */
    mode: 'worker' | 'process';

    /**
     * An array of arguments to pass to clusters (only when {@link ClusterManager#mode} is `process`)
     */
    shardArgs: string[];

    /**
     * An array of arguments to pass to the executable (only when {@link ClusterManager#mode} is `process`)
     */
    execArgv: string[];

    /**
     * List of internal shard ids this cluster manager spawns
     */
    shardList: number[];

    /**
     * Token to use for obtaining the automatic internal shards count, and passing to bot script
     */
    token: string | null;

    /**
     * A collection of all clusters the manager spawned
     */
    clusters: Map<number, Cluster>;
    shardClusterList: number[][];

    /**
     * An Array of IDS[Number], which should be assigned to the spawned Clusters
     */
    clusterList: number[];
    spawnOptions: ClusterManagerSpawnOptions;
    queue: Queue;
    promise: PromiseHandler;

    /** HeartbeatManager Plugin */
    heartbeat?: HeartbeatManager;
    /** Reclustering Plugin */
    recluster?: ReClusterManager;
    constructor(file: string, options: ClusterManagerOptions) {
        super();
        if (!options) options = {};

        if (options.keepAlive)
            throw new Error(
                'keepAlive is not supported anymore on and above v1.6.0. Import it as plugin ("HeartbeatManager"), therefore check the libs readme',
            );

        this.respawn = options.respawn ?? true;

        this.restarts = options.restarts || { max: 3, interval: 60000 * 60, current: 0 };

        this.clusterData = options.clusterData || {};

        this.clusterOptions = options.clusterOptions || {};

        this.file = file;
        if (!file) throw new Error('CLIENT_INVALID_OPTION | No File specified.');
        if (!path.isAbsolute(file)) this.file = path.resolve(process.cwd(), file);
        const stats = fs.statSync(this.file);
        if (!stats.isFile()) throw new Error('CLIENT_INVALID_OPTION | Provided is file is not type of file');

        this.totalShards = options.totalShards === 'auto' ? -1 : options.totalShards ?? -1;
        if (this.totalShards !== -1) {
            if (typeof this.totalShards !== 'number' || isNaN(this.totalShards)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of internal shards must be a number.');
            }
            if (this.totalShards < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of internal shards must be at least 1.');
            if (!Number.isInteger(this.totalShards)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of internal shards must be an integer.');
            }
        }

        this.totalClusters = options.totalClusters === 'auto' ? -1 : options.totalClusters ?? -1;
        if (this.totalClusters !== -1) {
            if (typeof this.totalClusters !== 'number' || isNaN(this.totalClusters)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of Clusters must be a number.');
            }
            if (this.totalClusters < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be at least 1.');
            if (!Number.isInteger(this.totalClusters)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be an integer.');
            }
        }

        this.shardsPerClusters = options.shardsPerClusters;
        if (this.shardsPerClusters) {
            if (typeof this.shardsPerClusters !== 'number' || isNaN(this.shardsPerClusters)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of ShardsPerClusters must be a number.');
            }
            if (this.shardsPerClusters < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of shardsPerClusters must be at least 1.');
            if (!Number.isInteger(this.shardsPerClusters)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Shards Per Clusters must be an integer.');
            }
        }

        this.mode = options.mode || 'process';
        if (this.mode !== 'worker' && this.mode !== 'process') {
            throw new RangeError('CLIENT_INVALID_OPTION' + 'Cluster mode must be ' + '"worker" or "process"');
        }

        this.shardArgs = options.shardArgs ?? [];

        this.execArgv = options.execArgv ?? [];

        this.shardList = options.shardList ?? [];
        if (this.shardList.length) {
            if (!Array.isArray(this.shardList)) {
                throw new TypeError('CLIENT_INVALID_OPTION | shardList must be an array.');
            }
            this.shardList = Array.from(new Set(this.shardList));
            if (this.shardList.length < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | shardList must contain at least 1 ID.');
            if (
                this.shardList.some(
                    shardID =>
                        typeof shardID !== 'number' || isNaN(shardID) || !Number.isInteger(shardID) || shardID < 0,
                )
            ) {
                throw new TypeError('CLIENT_INVALID_OPTION | shardList has to contain an array of positive integers.');
            }
        }

        if (!options.token) options.token = process.env.DISCORD_TOKEN;

        this.token = options.token ? options.token.replace(/^Bot\s*/i, '') : null;

        this.clusters = new Map();
        this.shardClusterList = [];
        process.env.SHARD_LIST = undefined;
        process.env.TOTAL_SHARDS = this.totalShards as any;
        process.env.CLUSTER = undefined;
        process.env.CLUSTER_COUNT = this.totalClusters as any;
        process.env.CLUSTER_MANAGER = 'true';
        process.env.CLUSTER_MANAGER_MODE = this.mode;
        process.env.DISCORD_TOKEN = String(this.token);
        process.env.MAINTENANCE = undefined;

        if (options.queue?.auto) process.env.CLUSTER_QUEUE_MODE = 'auto';
        else process.env.CLUSTER_QUEUE_MODE = 'manual';

        this.clusterList = options.clusterList || [];

        this.spawnOptions = options.spawnOptions || { delay: 7000, timeout: -1 };
        if (!this.spawnOptions.delay) this.spawnOptions.delay = 7000;

        if (!options.queue) options.queue = { auto: true };
        if (!options.queue.timeout) options.queue.timeout = this.spawnOptions.delay;
        this.queue = new Queue(options.queue as Required<QueueOptions>);

        this._debug(`[START] Cluster Manager has been initialized`);

        this.promise = new PromiseHandler();
    }

    /**
     * Spawns multiple internal shards.
     */
    public async spawn({ amount = this.totalShards, delay = 7000, timeout = -1 } = this.spawnOptions) {
        if (delay < 7000) {
            process.emitWarning(
                `Spawn Delay (delay: ${delay}) is smaller than 7s, this can cause global rate limits on /gateway/bot`,
                {
                    code: 'CLUSTER_MANAGER',
                },
            );
        }

        if (amount === -1 || amount === 'auto') {
            if (!this.token) throw new Error('A Token must be provided, when totalShards is set on auto.');
            amount = await fetchRecommendedShards(this.token, 1000);
            this.totalShards = amount as number;
            this._debug(`Discord recommended a total shard count of ${amount}`);
        } else {
            if (typeof amount !== 'number' || isNaN(amount)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be a number.');
            }
            if (amount < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be at least 1.');
            if (!Number.isInteger(amount)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Internal Shards must be an integer.');
            }
        }
        let clusterAmount = this.totalClusters;
        if (clusterAmount === -1) {
            clusterAmount = os.cpus().length;
            this.totalClusters = clusterAmount;
        } else {
            if (typeof clusterAmount !== 'number' || isNaN(clusterAmount)) {
                throw new TypeError('CLIENT_INVALID_OPTION | Amount of Clusters must be a number.');
            }
            if (clusterAmount < 1)
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be at least 1.');
            if (!Number.isInteger(clusterAmount)) {
                throw new RangeError('CLIENT_INVALID_OPTION | Amount of Clusters must be an integer.');
            }
        }

        if (!this.shardList.length) this.shardList = Array.from(Array(amount).keys());

        //Calculate Shards per Cluster:
        if (this.shardsPerClusters) this.totalClusters = Math.ceil(this.shardList.length / this.shardsPerClusters);

        this.shardClusterList = chunkArray(
            this.shardList,
            (!isNaN(this.shardsPerClusters as any) ? this.shardsPerClusters as number : Math.ceil(this.shardList.length / (this.totalClusters as number))),
        );

        if (this.shardClusterList.length !== this.totalClusters) {
            this.totalClusters = this.shardClusterList.length;
        }
        if (this.shardList.some(shardID => shardID >= amount)) {
            throw new RangeError('CLIENT_INVALID_OPTION | Shard IDs must be smaller than the amount of shards.');
        }
        this._debug(`[Spawning Clusters]
    ClusterCount: ${this.totalClusters}
    ShardCount: ${amount}
    ShardList: ${this.shardClusterList.join(', ')}`);
        for (let i = 0; i < this.totalClusters; i++) {
            const clusterId = this.clusterList[i] || i;
            if (this.shardClusterList[i]) {
                const length = this.shardClusterList[i]?.length as number;
                const readyTimeout = timeout !== -1 ? timeout + delay * length : timeout;
                const spawnDelay = delay * length;
                this.queue.add({
                    run: (...a) => {
                        const cluster = this.createCluster(
                            clusterId,
                            this.shardClusterList[i] as number[],
                            this.totalShards,
                        );
                        return cluster.spawn(...a);
                    },
                    args: [readyTimeout],
                    timeout: spawnDelay,
                });
            }
        }
        return this.queue.start();
    }

    /**
     * Sends a message to all clusters.
     */
    public broadcast(message: BaseMessage) {
        const promises = [];
        for (const cluster of Array.from(this.clusters.values())) promises.push(cluster.send(message));
        return Promise.all(promises);
    }
    /**
     * Creates a single cluster.
     * <warn>Using this method is usually not necessary if you use the spawn method.</warn>
     * <info>This is usually not necessary to manually specify.</info>
     * @returns Note that the created cluster needs to be explicitly spawned using its spawn method.
     */
    public createCluster(id: number, shardsToSpawn: number[], totalShards: number, recluster = false) {
        const cluster = new Cluster(this, id, shardsToSpawn, totalShards);
        if (!recluster) this.clusters.set(id, cluster);
        /**
         * Emitted upon creating a cluster.
         * @event ClusterManager#clusterCreate
         * @param {Cluster} cluster Cluster that was created
         */
        // @todo clusterReady event
        this.emit('clusterCreate', cluster);

        this._debug(`[CREATE] Created Cluster ${cluster.id}`);
        return cluster;
    }
    /**
     * Evaluates a script on all clusters, or a given cluster, in the context of the {@link Client}s.
     * @returns Results of the script execution
     */
    public broadcastEval(script: string): Promise<any[]>;
    public broadcastEval(script: string, options?: evalOptions): Promise<any>;
    public broadcastEval<T>(fn: (client: DjsDiscordClient) => Awaitable<T>): Promise<Serialized<T>[]>;
    public broadcastEval<T>(
        fn: (client: DjsDiscordClient) => Awaitable<T>,
        options?: { cluster?: number; timeout?: number },
    ): Promise<Serialized<T>>;
    public broadcastEval<T, P>(
        fn: (client: DjsDiscordClient, context: Serialized<P>) => Awaitable<T>,
        options?: evalOptions<P>,
    ): Promise<Serialized<T>[]>;
    public broadcastEval<T, P>(
        fn: (client: DjsDiscordClient, context: Serialized<P>) => Awaitable<T>,
        options?: evalOptions<P>,
    ): Promise<Serialized<T>>;
    public async broadcastEval<T, P>(
        script:
            | string
            | ((client: DjsDiscordClient, context?: Serialized<P>) => Awaitable<T> | Promise<Serialized<T>>),
        evalOptions?: evalOptions | evalOptions<P>,
    ) {
        const options = evalOptions ?? {};
        if (!script || (typeof script !== 'string' && typeof script !== 'function'))
            return Promise.reject(new TypeError('ClUSTERING_INVALID_EVAL_BROADCAST'));
        script = typeof script === 'function' ? `(${script})(this, ${JSON.stringify(options.context)})` : script;

        if (Object.prototype.hasOwnProperty.call(options, 'cluster')) {
            if (typeof options.cluster === 'number') {
                if (options.cluster < 0) throw new RangeError('CLUSTER_ID_OUT_OF_RANGE');
            }
            if (Array.isArray(options.cluster)) {
                if (options.cluster.length === 0) throw new RangeError('ARRAY_MUST_CONTAIN_ONE CLUSTER_ID');
            }
        }
        if (options.guildId) {
            options.shard = shardIdForGuildId(options.guildId, this.totalShards);
        }
        if (options.shard) {
            if (typeof options.shard === 'number') {
                if (options.shard < 0) throw new RangeError('SHARD_ID_OUT_OF_RANGE');
            }
            if (Array.isArray(options.shard)) {
                // @todo Support Array of Shards
                if (options.shard.length === 0) throw new RangeError('ARRAY_MUST_CONTAIN_ONE SHARD_ID');
            }
            options.cluster = Array.from(this.clusters.values()).find(c =>
                c.shardList.includes(options.shard as number),
            )?.id;
        }
        return this._performOnClusters('eval', [script], options.cluster, options.timeout);
    }
    /**
     * Fetches a client property value of each cluster, or a given cluster.
     * @param prop Name of the client property to get, using periods for nesting
     * @param cluster Cluster to fetch property from, all if undefined
     * @example
     * manager.fetchClientValues('guilds.cache.size')
     *   .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
     *   .catch(console.error);
     */
    public fetchClientValues(prop: string, cluster?: number) {
        return this.broadcastEval(`this.${prop}`, { cluster });
    }

    /**
     * Runs a method with given arguments on all clusters, or a given cluster.
     * @param method Method name to run on each cluster
     * @param args Arguments to pass through to the method call
     * @param cluster cluster to run on, all if undefined
     * @param timeout the amount of time to wait until the promise will be rejected
     * @returns Results of the method execution
     * @private
     */
    private _performOnClusters(method: 'eval', args: any[], cluster?: number | number[], timeout?: number) {
        if (this.clusters.size === 0) return Promise.reject(new Error('CLUSTERING_NO_CLUSTERS'));

        if (typeof cluster === 'number') {
            if (this.clusters.has(cluster))
                return (
                    this.clusters
                        .get(cluster)
                        // @ts-expect-error
                        ?.[method](...args, undefined, timeout)
                        .then((e: any) => [e])
                );
            return Promise.reject(new Error('CLUSTERING_CLUSTER_NOT_FOUND FOR ClusterId: ' + cluster));
        }
        let clusters = Array.from(this.clusters.values());
        if (cluster) clusters = clusters.filter(c => cluster.includes(c.id));
        if (clusters.length === 0) return Promise.reject(new Error('CLUSTERING_NO_CLUSTERS_FOUND'));

        /* if (this.clusters.size !== this.totalClusters && !cluster) return Promise.reject(new Error('CLUSTERING_IN_PROCESS')); */

        const promises = [];

        // @ts-expect-error
        for (const cl of clusters) promises.push(cl[method](...args, undefined, timeout));
        return Promise.all(promises);
    }

    /**
     * Kills all running clusters and respawns them.
     * @param options Options for respawning shards
     */
    public async respawnAll({ clusterDelay = 5500, respawnDelay = 500, timeout = -1 } = {}) {
        this.promise.nonce.clear();
        let s = 0;
        let i = 0;
        for (const cluster of Array.from(this.clusters.values())) {
            const promises: any[] = [cluster.respawn({ delay: respawnDelay, timeout })];
            const length = this.shardClusterList[i]?.length || this.totalShards / this.totalClusters;
            if (++s < this.clusters.size && clusterDelay > 0) promises.push(delayFor(length * clusterDelay));
            i++;
            await Promise.all(promises); // eslint-disable-line no-await-in-loop
        }
        this._debug('Respawning all Clusters');
        return this.clusters;
    }

    //Custom Functions:

    /**
     * Runs a method with given arguments on the Manager itself
     */
    public async evalOnManager(script: string) {
        script = typeof script === 'function' ? `(${script})(this)` : script;
        let result;
        let error;
        try {
            result = await eval(script);
        } catch (err) {
            error = err;
        }
        return { _result: result, _error: error ? makePlainError(error) : null };
    }

    /**
     * Runs a method with given arguments on the provided Cluster Client
     * @returns Results of the script execution
     * @private
     */
    public evalOnCluster(script: string, options: evalOptions) {
        return this.broadcastEval(script, options)?.then((r: any[]) => r[0]);
    }

    /**
     * Adds a plugin to the cluster manager
     */
    public extend(...plugins: Plugin[]) {
        if (!plugins) throw new Error('NO_PLUGINS_PROVIDED');
        if (!Array.isArray(plugins)) plugins = [plugins];
        for (const plugin of plugins) {
            if (!plugin) throw new Error('PLUGIN_NOT_PROVIDED');
            if (typeof plugin !== 'object') throw new Error('PLUGIN_NOT_A_OBJECT');
            plugin.build(this);
        }
    }

    /**
     * @param reason If maintenance should be enabled on all clusters with a given reason or disabled when nonce provided
     */
    triggerMaintenance(reason: string) {
        return Array.from(this.clusters.values()).forEach(cluster => cluster.triggerMaintenance(reason));
    }
    /**
     * Logs out the Debug Messages
     * <warn>Using this method just emits the Debug Event.</warn>
     * <info>This is usually not necessary to manually specify.</info>
     */
    public _debug(message: string, cluster?: number) {
        let log;
        if (cluster === undefined) {
            log = `[CM => Manager] ` + message;
        } else {
            log = `[CM => Cluster ${cluster}] ` + message;
        }
        /**
         * Emitted upon receiving a message
         * @event ClusterManager#debug
         * @param {string} Message, which was received
         */
        this.emit('debug', log);
        return log;
    }
}

// Credits for EventEmitter typings: https://github.com/discordjs/discord.js/blob/main/packages/rest/src/lib/RequestManager.ts#L159 | See attached license
export interface ClusterManager {
    emit: (<K extends keyof ClusterManagerEvents>(event: K, ...args: ClusterManagerEvents[K]) => boolean) &
    (<S extends string | symbol>(event: Exclude<S, keyof ClusterManagerEvents>, ...args: any[]) => boolean);

    off: (<K extends keyof ClusterManagerEvents>(
        event: K,
        listener: (...args: ClusterManagerEvents[K]) => void,
    ) => this) &
    (<S extends string | symbol>(
        event: Exclude<S, keyof ClusterManagerEvents>,
        listener: (...args: any[]) => void,
    ) => this);

    on: (<K extends keyof ClusterManagerEvents>(
        event: K,
        listener: (...args: ClusterManagerEvents[K]) => void,
    ) => this) &
    (<S extends string | symbol>(
        event: Exclude<S, keyof ClusterManagerEvents>,
        listener: (...args: any[]) => void,
    ) => this);

    once: (<K extends keyof ClusterManagerEvents>(
        event: K,
        listener: (...args: ClusterManagerEvents[K]) => void,
    ) => this) &
    (<S extends string | symbol>(
        event: Exclude<S, keyof ClusterManagerEvents>,
        listener: (...args: any[]) => void,
    ) => this);

    removeAllListeners: (<K extends keyof ClusterManagerEvents>(event?: K) => this) &
    (<S extends string | symbol>(event?: Exclude<S, keyof ClusterManagerEvents>) => this);
}
