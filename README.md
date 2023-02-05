<p align="center"><a href="https://nodei.co/npm/discord-hybrid-sharding/"><img src="https://nodei.co/npm/discord-hybrid-sharding.png"></a></p>
<p align="center"><img src="https://img.shields.io/npm/v/discord-hybrid-sharding"> <img src="https://img.shields.io/npm/dm/discord-hybrid-sharding?label=downloads"> <img src="https://img.shields.io/npm/l/discord-hybrid-sharding"> <img src="https://img.shields.io/github/repo-size/meister03/discord-hybrid-sharding">  <a href="https://discord.gg/YTdNBHh"><img src="https://discordapp.com/api/guilds/697129454761410600/widget.png" alt="Discord server"/></a></p>

# Discord-Hybrid-Sharding

One first package which combines sharding manager & internal sharding to save a lot of resources, which allows clustering!

In other words: "Mixing both: if you need `x` shards for `n` process!"

**[NEW: TypeScript Rewrite | Upgrade Guide](https://gist.github.com/meister03/882ba6f6d805384f27336dd5ba389a54)**
**[NEW: Clustering Support for all JS Libraries](#Use-with-other-libraries)**

If you are interested in auto-scaling & cross-hosting on other machines, check out this package `npmjs.com/discord-cross-hosting`

### Featured by Discord Creators

[Private Community for Verified Bot Developers. ](https://discord.gg/R3hPevRtUV)
[Meet big bot and small bot developers and have a nice exchange...](https://discord.gg/R3hPevRtUV)

<p>
<a href="https://discord.gg/R3hPevRtUV">
<img src="https://media.discordapp.net/attachments/980770619161448489/982938274677018624/banner.png?width=320&height=80">
</a>
</p>

## Why?

The sharding manager is very heavy and uses more than 300MB per shard during light usage, while internal sharding uses just 20% of it. Internal sharding reaches its' limits at 14000 guilds and becomes slow when your bot gets bigger.

Your only solution becomes converting to the sharding manager. That's why this new package will solve all your problems (tested by many bots with 20-170k guilds), because it spawns shards, which has internal shards. **You can save up to 60% on resources!**

-   **Zero Downtime ReClustering/ReSharding/Restarts**
-   **Decentralized BroadCastEval function -> Listenerless, less memory leaks & cluster/client doesn't have to be ready**
-   **Heartbeat System -> Respawn unresponsive or dead `ClusterClient`s**
-   **IPC System -> Client <-> ClusterManager -> `.request()`, `.reply()`, `.send()`**
-   **Fine-grained control over the cluster queue -> `manager.queue.next(), .stop(), .resume()`**
-   Memory efficient -> 60% less memory when clustering
-   Debug event -> A good overview of cluster information
-   EvalOnManager function & other cool functions you need...
-   `Strings` & `Functions with Context` support on `.broadcastEval()`
-   Optional timeout feature on `.broadcastEval()` to prevent memory leaks
-   **[Supports cross-hosting: `Shard/Cluster` managing and cross-host communication (`.broadcastEval()`, `IPC`)](https://npmjs.com/discord-cross-hosting)**
-   **[Supports syncing Discord rate limits globally](https://npmjs.com/discord-cross-ratelimit)**
    **Scroll down to check our new functions!**

## How does it work?

There are clusters/master shards, which behave like regular shards in the sharding manager and spawns clusters in addition to internal shards. You do not have to spawn as many regular Shards (master shards), which can be replaced with internal shards.
"for process `n` , `n` internal shards"

Example: `A Discord bot with 4000 guilds`
Normally we would spawn 4 shards with the Sharding Manager (`~4 x 300MB memory`), but in this case we start with 2 clusters/master shards, which spawns 2 internal shards ==> We just saved 2 shards in comparison to the regular Sharding Manager (`~2 x 300MB memory`).

### See below for the Guide

**If you need help, feel free to join our <a href="https://discord.gg/YTdNBHh">Discord server</a>. ☺**

# Download

```cli
npm i discord-hybrid-sharding
------ or ---------------------
yarn add discord-hybrid-sharding
```

# Supports all Discord.js Versions & all other Libraries (Eris, Discordeno)

-   **Full Discord.js v12, v13, v14 support**
-   `Strings` and `Functions` with `context` are supported in `.broadcastEval()`
-   Most public methods accept sole objects, such as `.spawn({ amount: 20, timeout: -1 })`
-   Very similar functions to the Discord.js ShardingManager and more for the advanced usage

# Setting up

**[Click to open documentation](https://sharding.js.org)**

First, add the module into your project (into your shard/cluster file).
Filename: `Cluster.js`

```js
// Typescript: import { ClusterManager } from 'discord-hybrid-sharding'
const { ClusterManager } = require('discord-hybrid-sharding');

const manager = new ClusterManager(`${__dirname}/bot.js`, {
    totalShards: 7, // or 'auto'
    /// Check below for more options
    shardsPerClusters: 2,
    // totalClusters: 7,
    mode: 'process', // you can also choose "worker"
    token: 'YOUR_TOKEN',
});

manager.on('clusterCreate', cluster => console.log(`Launched Cluster ${cluster.id}`));
manager.spawn({ timeout: -1 });
```

After that, insert the code below into your `bot.js` file

```js
// Typescript: import { ClusterClient, getInfo } from 'discord-hybrid-sharding'
const { ClusterClient, getInfo } = require('discord-hybrid-sharding');
const Discord = require('discord.js');

const client = new Discord.Client({
    shards: getInfo().SHARD_LIST, // An array of shards that will get spawned
    shardCount: getInfo().TOTAL_SHARDS, // Total number of shards
});

client.cluster = new ClusterClient(client); // initialize the Client, so we access the .broadcastEval()
client.login('YOUR_TOKEN');
```

# Eval-ing over clusters

_Following examples assume that your `Discord.Client` is called `client`._

```js
client.cluster
    .broadcastEval(`this.guilds.cache.size`)
    .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`));

// or with a callback function
client.cluster
    .broadcastEval(c => c.guilds.cache.size)
    .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`));
```

# ClusterManager

| Option            | Type                  | Default  | Description                                                                                                                       |
| ----------------- | --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| totalShards       | number or string      | "auto"   | Amount of internal shards which will be spawned                                                                                   |
| totalClusters     | number or string      | "auto"   | Amount of processes/clusters which will be spawned                                                                                |
| shardsPerClusters | number or string      | -        | Amount of shards which will be in one process/cluster                                                                             |
| shardList         | Array[number]         | -        | OPTIONAL - On cross-hosting or spawning specific shards you can provide a shardList of internal Shard IDs, which will get spawned |
| mode              | "worker" or "process" | "worker" | ClusterManager mode for the processes                                                                                            |
| token             | string                | -        | OPTIONAL -Bot token is only required totalShards are set to "auto"                                                                |

The Manager.spawn options are the same as for Sharding Manager

# Cluster Events

| Event         | Description                           |
| ------------- | ------------------------------------- |
| clusterCreate | Triggered when a Cluster gets spawned |

# Cluster Client Properties

All properties like for `.broadcastEval()` are available, just replace the `client.shard` with `client.cluster`
Other properties:
| Property | Description |
| ------------- | -------------- |
| client.cluster.count | Returns the amount of all clusters |
| client.cluster.id | Returns the current cluster ID |
| client.cluster.ids | Returns all internal shards of the cluster |

**Feel free to contribute/suggest or contact me on my Discord server or in DM: Meister#9667**

# Changes | Migrating to Discord-Hybrid-Sharding

Options are now labelled as `cluster` instead of `shard`:

```diff
- client.shard...
+ client.cluster...

- .broadcastEval((c, context) => c.guilds.cache.get(context.guildId), { context: { guildId: '1234' }, shard: 0 })
+ .broadcastEval((c, context) => c.guilds.cache.get(context.guildId), { context: { guildId: '1234' }, cluster: 0 })
```

Small changes in naming conventions:

```diff
- client.shard.respawnAll({ shardDelay = 5000, respawnDelay = 500, timeout = 30000 })
+ client.cluster.respawnAll({ clusterDelay: 5000, respawnDelay: 5500, timeout: 30000 })

- manager.shard.respawnAll({ shardDelay = 5000, respawnDelay = 500, timeout = 30000 })
+ manager.respawnAll({ clusterDelay: 5000, respawnDelay: 5500, timeout: 30000 })

```

Get current cluster ID:

```diff
- client.shard.id
+ client.cluster.id
```

Get current shard ID:

```diff
- client.shard.id
+ message.guild.shardId
```

Get total shards count:

```diff
- client.shard.count
+ client.cluster.info.TOTAL_SHARDS
```

Get all ShardID's in the current cluster:

```diff
- client.shard.id
+ [...client.cluster.ids.keys()]
```

# New functions & events:

## `Zero Downtime Reclustering`:

Zero Downtime Reclustering is a Plugin, which is used to reshard/recluster or even restart your bot with having a theoretical outage of some seconds.
There are two options for the `restartMode`:

-   `gracefulSwitch`: Spawns all new Clusters with the provided Info in maintenance mode, once all clusters have been spawned and the DiscordClient is ready, the clusters will exit maintenance mode, where as it will fire the `client.cluster.on('ready')` event. In order to load the Database and listen to events. Moreover all Clusters will be gracefully killed, once all clusters exited maintenance mode.
-   `rolling`: Spawns the Clusters with the provided Info in maintenance mode, once the DiscordClient is ready of the Cluster, the Cluster will exit maintenance mode, where as it will fire the `client.cluster.on('ready')` event. In order to load the Database and listen to events. Moreover the OldCluster will be killed, since the Cluster has exited maintenance mode. Not recommended, when shardData has not been updated.

Cluster.js

```js
// Typescript: import { ClusterManager, ReClusterManager  } from 'discord-hybrid-sharding'
const { ClusterManager, ReClusterManager } = require('discord-hybrid-sharding');
const manager = new ClusterManager(`${__dirname}/bot.js`, {...});

manager.extend(
    new ReClusterManager()
)
... ///SOME CODE
// Start reclustering
const optional = {totalShards, totalClusters....}
manager.recluster?.start({restartMode: 'gracefulSwitch', ...optional})
```

Bot.js

```js
// Typescript: import { ClusterClient, getInfo } from 'discord-hybrid-sharding'
const { ClusterClient, getInfo } = require('discord-hybrid-sharding');
const client = new Discord.Client(...)
client.cluster = new Cluster.Client(client);

if (client.cluster.maintenance) console.log(`Bot on maintenance mode with ${client.cluster.maintenance}`);

client.cluster.on('ready', () => {
    // Load Events
    // Handle Database stuff, to not process outdated data
});

client.login(token);
```

## `HeartbeatSystem`

-   Checks if Cluster/Client sends a heartbeat on a given interval
-   When the Client doesn't send a heartbeat, it will be marked as dead/unresponsive
-   Cluster will get respawned after the given amount of missed heartbeats has been reached

```js
// Typescript: import { ClusterManager, HeartbeatManager  } from 'discord-hybrid-sharding'
const { ClusterManager, HeartbeatManager } = require('discord-hybrid-sharding');
const manager = new ClusterManager(`${__dirname}/bot.js`, {...});

manager.extend(
    new HeartbeatManager({
        interval: 2000, // Interval to send a heartbeat
        maxMissedHeartbeats: 5, // Maximum amount of missed Heartbeats until Cluster will get respawned
    })
)
```

## `Control Restarts`

-   Cap the amount of restarts per cluster to a given amount on a given interval

```js
const manager = new ClusterManager(`${__dirname}/bot.js`, {
    ...YourOptions,
    restarts: {
        max: 5, // Maximum amount of restarts per cluster
        interval: 60000 * 60, // Interval to reset restarts
    },
});
```

## `IPC System`

-   The IPC System allows you to listen to your messages
-   You can communicate between the cluster and the client
-   This allows you to send requests from the client to the cluster and reply to them and vice versa
-   You can also send normal messages which do not need to be replied

ClusterManager | `cluster.js`

```js
// Typescript: import { ClusterManager, messageType } from 'discord-hybrid-sharding'
const { ClusterManager, messageType } = require('discord-hybrid-sharding');
const manager = new ClusterManager(`${__dirname}/testbot.js`, {
    totalShards: 1,
    totalClusters: 1,
});

manager.on('clusterCreate', cluster => {
    cluster.on('message', message => {
        console.log(message);
        if (message._type !== messageType.CUSTOM_REQUEST) return; // Check if the message needs a reply
        message.reply({ content: 'hello world' });
    });
    setInterval(() => {
        cluster.send({ content: 'I am alive' }); // Send a message to the client
        cluster.request({ content: 'Are you alive?', alive: true }).then(e => console.log(e)); // Send a message to the client
    }, 5000);
});
manager.spawn({ timeout: -1 });
```

ClusterClient | `client.js`

```js
// Typescript: import { ClusterClient, getInfo, messageType } from 'discord-hybrid-sharding'
const { ClusterClient, getInfo, messageType} = require('discord-hybrid-sharding');
const Discord = require('discord.js');
const client = new Discord.Client({
    shards: getInfo().SHARD_LIST, // An array of shards that will get spawned
    shardCount: getInfo().data.TOTAL_SHARDS, // Total number of shards
});

client.cluster = new ClusterClient(client);
client.cluster.on('message', message => {
    console.log(message);
    if (message._type !== messageType.CUSTOM_REQUEST) return; // Check if the message needs a reply
    if(message.alive) message.reply({ content: 'Yes I am!' }):
});
setInterval(() => {
    client.cluster.send({ content: 'I am alive as well!' });
}, 5000);
client.login('YOUR_TOKEN');
```

## Control Cluster queue:

With a complex code-base, you probably need a fine-grained control over the cluster spawn queue in order to respect rate limits.

The queue system can be controlled from the cluster manager.

```js
const manager = new ClusterManager(`${__dirname}/bot.js`, {
    totalShards: 8,
    shardsPerClusters: 2,
    queue: {
        auto: false,
    },
});
```

The `auto` property is set with `true` by default, which automatically queues the clusters, when running `manager.spawn()`

When the auto mode has been disabled, then you have to manually manage the queue.

Cluster.js

```js
manager.spawn();
manager.queue.next();
```

The `manager.queue.next()` function will spawn the next cluster in the queue.
Now you can call the function `client.cluster.spawnNextCluster()` from the client to spawn the next cluster.

| Property                          | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| manager.queue.start()             | Starts the queue and resolves, when the queue is empty |
| manager.queue.stop()              | Stops the queue and blocks all `.next` requests        |
| manager.queue.resume()            | Resumes the queue and allows `.next` requests again    |
| manager.queue.next()              | Spawns the next cluster in the queue                   |
| client.cluster.spawnNextCluster() | Triggers the spawn of the next cluster in the queue    |

## Other Features:

Evals a Script on the ClusterManager:

```
client.cluster.evalOnManager('process.memoryUsage().rss / 1024 ** 2');
```

Listen to debug messages and internal stuff:

```
manager.on('debug', console.log);
```

Optional Timeout on broadcastEval (Promise will get rejected after given time):

```
client.cluster.broadcastEval('new Promise((resolve, reject) => {})', { timeout: 10000 });
```

Open a PR/Issue when you need other Functions :)

# Use with other libraries:

Using the package with other libraries requires some minor changes:

-   The Cluster.js will stay the same, scroll up to get the Code
-   Your Bot.js file will have some additional code

```js
// Typescript: import { ClusterClient, getInfo } from 'discord-hybrid-sharding'
const { ClusterClient, getInfo } = require('discord-hybrid-sharding');

///Create your Discord Client:
/* Use the Data below for telling the Client, which shards to spawn */
const lastShard = getInfo().LAST_SHARD_ID;
const firstShard = getInfo().FIRST_SHARD_ID;
const totalShards = getInfo().TOTAL_SHARDS;
const shardList = getInfo().SHARD_LIST;

client.cluster = new ClusterClient(client);

///When the Client is ready, You can listen to the client's ready event:
// Just add, when the client.on('ready') does not exist
client.cluster.triggerReady();
```

**The upper code is a pseudo code and shows how you can use this package with other libraries**

With some minor changes, you can even use this Package for clustering normal processes.

# Bugs, glitches and issues

If you encounter any problems feel free to open an issue in our <a href="https://github.com/meister03/discord-hybrid-sharding/issues">GitHub repository or join the Discord server.</a>

# Credits

Credits goes to the discord.js library for the Base Code (See `changes.md`) and to this helpful [server](https://discord.gg/BpeedKh)
