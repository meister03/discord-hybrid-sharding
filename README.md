<p align="center"><a href="https://nodei.co/npm/discord-hybrid-sharding/"><img src="https://nodei.co/npm/discord-hybrid-sharding.png"></a></p>
<p align="center"><img src="https://img.shields.io/npm/v/discord-hybrid-sharding"> <img src="https://img.shields.io/npm/dm/discord-hybrid-sharding?label=downloads"> <img src="https://img.shields.io/npm/l/discord-hybrid-sharding"> <img src="https://img.shields.io/github/repo-size/meister03/discord-hybrid-sharding">  <a href="https://discord.gg/YTdNBHh"><img src="https://discordapp.com/api/guilds/697129454761410600/widget.png" alt="Discord server"/></a></p>

# Discord-Hybrid-Sharding
The first package which combines Sharding Manager & Internal Sharding to save a lot of resources, which allows Clustering!

Aka: "Mixing both: if you need `x` shards for `n` process"

When you are interested on auto-scaling & cross hosting on Machines. Look on this Package `npmjs.com/discord-cross-hosting`

## Why?
The Sharding Manager is very heavy and it uses more than 300mb on a light usage for every shard, during internal sharding just uses 20% of it. Internal Sharding reaches their limit on more than 14000 Guilds and it becomes slow when your bot gets bigger.
Your only solution is to convert to the Sharding Manager. Thatsway this new Package will solve all your problems, because it spawns Shards, which has Internal Shards. **You can save up to 60% on resources**

- **Decentral Eval Function -> Listenerless, Less Memory Leaks & Cluster or Client has not to be ready
- Heartbeat System -> Respawn Unresponsive or Death ClusterClient's
- Memory Efficient -> <60% less memory, when clustering**
- Debug Event -> A good overview of Cluster Informations
- EvalOnManager Function & Other Cool Functions you need...

**Scroll down to check our new Functions.**

## How does it Work?
There are Clusters/Master Shards, which are like normal shards on the sharding manager and the clusters spawns in addition internal shards. So you do not have to spawn so much normal Shards (master shards ), which you can replace with internal shards.
"for process `n` , `n` internal shards"

Example: `A 4k Discord Bot`
Normaly we would spawn 4 shards with the Sharding Manager, but we start here with 2 Clusters/MasterShards, which spawns 2 internal shards ==> We save 2 shards in comparision to the Sharding Manager.

### See below for the Guide

**If you need help feel free to join our <a href="https://discord.gg/YTdNBHh">discord server</a>. We will provied you all help ☺**
# Download
You can download it from npm:
```cli
npm i discord-hybrid-sharding
```

# Discord.js v13
- We also support the v13 Library Version
- When your Broadcastevals are currently strings, dont change them since they are supported
- But when you want to broadcast functions with the contexts. `Easily add the Option usev13, which is shown below.`
- The methods `Manager#spawn()` accepts just seperate values, not a object like in v13 | e.g `Manager#spawn(undefined, undefined, -1)`

# Setting Up

**[Checkout our Documentation here](https://infinitytmbots.github.io/discord-hybrid-sharding)**

First we include the module into the project (into your shard/cluster file).
Filename: Cluster.js
```js
const Cluster = require("discord-hybrid-sharding");
let {token} = require("./config.json");
const manager = new Cluster.Manager(`${__dirname}/bot.js`,{
                                       totalShards: 7 ,
                                      ///See below for more options
                                       totalClusters: 2, 
                                       mode: "process" ,  //you can also choose worker
                                       token: token,
                                       usev13: true //When you do not use v13 turn it to false
                                    })
manager.on('clusterCreate', cluster => console.log(`Launched Cluster ${cluster.id}`));
manager.spawn(undefined, undefined, -1)
```
### Sometimes the Cluster.Manager can choose a less amount of total Clusters, when it finds out, that a new cluster is not needed (in very rare cases...)

After that, you have to insert the code below in your bot.js file
FileName: Bot.js //You can name your file after you wish
```js
const Cluster = require("discord-hybrid-sharding");
const Discord = require("discord.js");
const client = new Discord.Client({
 	shards: Cluster.data.SHARD_LIST,        //  A Array of Shard list, which will get spawned
	shardCount: Cluster.data.TOTAL_SHARDS, // The Number of Total Shards
});
const usev13 = true; //When you do not use v13, turn this value to false
client.cluster = new Cluster.Client(client, usev13); //Init the CLient & So we can also access broadcastEval...
client.login("Your_Token");
```

# Evaling over Clusters

*Following examples assume that your `Discord.Client` is called `client`.*

```js
let guildcount = (await client.cluster.broadcastEval(`this.guilds.cache.size`)).reduce((acc, guildCount) => Number(acc + guildCount), 0);
message.channel.send(`I am in ${guildcount} guilds`)

For v13:
client.cluster.broadcastEval(c => c.guilds.cache.size)
		.then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
.........
```
# Cluster.Manager 
| Option | Type | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| totalShards | number/string| 'auto'| The Number of Internal Shards, which should be spawned |
| totalClusters | number/string| 'auto' | The Number of Processes/Clusters which should be spawned |
| shardList | Array[Number] | not-required | On Cross hosting or spawning specific shards you can provided a shardList of internal Shards id, which should get spawned |
| mode | "worker/process" | worker | The Cluster.Manager Mode for the processes |
| token | string | not-required | The Bot token is just required, when you set the totalShards on auto |

The Manager.spawn option are the same like Sharding Manager
**[Checkout our Documentation here](https://infinitytmbots.github.io/discord-hybrid-sharding)**

# Cluster Events
| Event |  Description |
| ------------- | -------------- |
|clusterCreate  | When a Cluster is spawned the Event is triggered|



# Cluster Client Properties
You have all properties like broadcasteval..., just replace client.shard with client.cluster
Other Properties:
| Property |  Description |
| ------------- | -------------- |
|client.cluster.count  | gives the amount of all clusters|
|client.cluster.id  | gives the current cluster|
|client.cluster.ids  | gives all internal shards of the cluster|

**Have fun and feel free to contribute/suggest or contact me on my discord server or per dm on Meister#9667**

# Changes | Updating to Discord-Hybrid-Sharding
```diff
- client.shard...
+ client.cluster...
```
Get Current Cluster ID:
```diff
- client.shard.id
+ client.cluster.id
```
Get Current Shard ID:
```diff
- client.shard.id
+ message.guild.shardId
```
Get Total Shard Count:
```diff
- client.shard.count
+ client.cluster.info.TOTAL_SHARDS
```
Get all ShardID's in the current Cluster:
```diff
- client.shard.id
+ [...client.cluster.ids.keys()]
```

# New Functions & Event:

## `HeartbeatSystem`:
- Check if the Cluster/Client sends the Heartbeat on the given Interval 
- When the Client does not, it will be marked as Death or Unresponsive
- The Cluster will be respawned, when the given amount of missed Heartbeats have been reached
```js
const manager = new Cluster.Manager(`${__dirname}/bot.js`,{
                                       totalShards: 7 ,
                                       totalClusters: 2, 
                                       keepAlive: {
                                          interval: 2000, ///The Interval to send the Heartbeat
                                          maxMissedHeartbeats: 5, // The maximal Amount of missing Heartbeats until Cluster will be respawned
                                          maxClusterRestarts: 3 ///The maximal Amount of restarts, which can be done in 1 hour with the HeartbeatSystem
                                       }
                                    })
```

## `EvalOnCluster`:
Decentral ClusterClient Eval function, which doesn't open any listeners and minimalizes the chances creating a memory leak during broadcastEvaling.
- Inbuilt Eval Timeout, which resolves after the given Time
- No additional Listeners ==> less memory leak, better than .broadCastEval
- Client & all Clusters has not to be ready
```js
client.cluster.evalOnCluster(`this.cluster.id`, {cluster: 0, timeout: 10000})
```
Evals a Script on the ClusterManager
```diff
+ client.cluster.evalOnManager(`process.memoryUsage().rss/1024/1024`)
```
Listen to some debug Messages and get informed about internal stuff.
```diff
+ manager.on('debug', console.log)
```

Open a PR/Issue when you need other Functions :)

# Bugs, Glitches and Issues
If you encounter any problems feel free to open an issue in our <a href="https://github.com/meister03/discord-hybrid-sharding/issues">github repository or join the discord server.</a>

# Credits
Credits goes to the discord.js libary (See the Changes.md) and to this helpful [server](https://discord.gg/BpeedKh)
