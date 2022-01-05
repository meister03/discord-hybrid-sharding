<p align="center"><a href="https://nodei.co/npm/discord-hybrid-sharding/"><img src="https://nodei.co/npm/discord-hybrid-sharding.png"></a></p>
<p align="center"><img src="https://img.shields.io/npm/v/discord-hybrid-sharding"> <img src="https://img.shields.io/npm/dm/discord-hybrid-sharding?label=downloads"> <img src="https://img.shields.io/npm/l/discord-hybrid-sharding"> <img src="https://img.shields.io/github/repo-size/meister03/discord-hybrid-sharding">  <a href="https://discord.gg/YTdNBHh"><img src="https://discordapp.com/api/guilds/697129454761410600/widget.png" alt="Discord server"/></a></p>

# Discord-Hybrid-Sharding
The first package which combines Sharding Manager & Internal Sharding to save a lot of resources, which allows Clustering!

Aka: "Mixing both: if you need `x` shards for `n` process"

When you are interested on auto-scaling & cross hosting on Machines. Look on this Package `npmjs.com/discord-cross-hosting`

## Why?
The Sharding Manager is very heavy and it uses more than 300mb on a light usage for every shard, during internal sharding just uses 20% of it. Internal Sharding reaches their limit on more than 14000 Guilds and it becomes slow when your bot gets bigger.
Your only solution is to convert to the Sharding Manager. Thatsway this new Package will solve all your problems (tested by many bots upon 20-170k Guilds), because it spawns Shards, which has Internal Shards. **You can save up to 60% on resources**

- **Decentral ClusterEval Function -> Listenerless, Less Memory Leaks & Cluster/Client has not to be ready**
- **Heartbeat System -> Respawn Unresponsive or Death ClusterClient's**
- **IPC System -> Client <-> ClusterManager -> `.request()`, `.reply()`, `.send()`**
- Memory Efficient -> <60% less memory, when clustering
- Debug Event -> A good overview of Cluster Informations
- EvalOnManager Function & Other Cool Functions you need...
- Support of `Strings` & `Functions with Context` on `broadcastEval`
- Optional Timeout Feature on `.broadcastEval` for preventing memory leaks
- **[Support for Cross-Hosting: `Shard/Cluster` managing and crosshost communication (`broadcastEval`, `IPC`)](https://npmjs.com/discord-cross-hosting)**
- **[Support for syncing Discord Ratelimits globally](https://npmjs.com/discord-cross-ratelimit)**
**Scroll down to check our new Functions.**

## How does it Work?
There are Clusters/Master Shards, which are like normal Shards on the Sharding-Manager and the clusters spawns in addition internal shards. So you do not have to spawn so many normal Shards (master shards ), which you can replace with internal shards.
"for process `n` , `n` internal shards"

Example: `A 4k Discord Bot`
Normaly we would spawn 4 shards with the Sharding Manager (`~ 4 x 300mb Ram`), but we start here with 2 Clusters/MasterShards, which spawns 2 internal shards ==> We save 2 shards in comparision to the Sharding Manager (`~ 2 x 300mb Ram`).

### See below for the Guide

**If you need help feel free to join our <a href="https://discord.gg/YTdNBHh">discord server</a>. We will provied you all help ☺**
# Download
You can download it from npm:
```cli
npm i discord-hybrid-sharding
```

# Discord.js v13
- We also support the v13 Library Version
- `Strings` and `Functions` with `context` are supported on `.broadcastEval`
- Most public methods accept sole Objects such as `.spawn({amount: 20, timeout: -1})`
- Very similar functions to the Discord.js ShardingManager and more for a advanced usage

# Setting Up

**[Checkout our Documentation here](https://sharding.js.org)**

First we include the module into the project (into your shard/cluster file).
Filename: Cluster.js
```js
const Cluster = require("discord-hybrid-sharding");
let {token} = require("./config.json");
const manager = new Cluster.Manager(`${__dirname}/bot.js`,{
                                       totalShards: 7 , //or 'auto'
                                       ///See below for more options
                                       shardsPerClusters: 2, 
                                       //totalClusters: 7,
                                       mode: "process" ,  //you can also choose worker
                                       token: token,
                                    })
manager.on('clusterCreate', cluster => console.log(`Launched Cluster ${cluster.id}`));
manager.spawn({timeout: -1});
```

After that, you have to insert the code below in your bot.js file
FileName: Bot.js //You can name your file after your wish
```js
const Cluster = require("discord-hybrid-sharding");
const Discord = require("discord.js");
const client = new Discord.Client({
   //@ts-ignore
 	shards: Cluster.data.SHARD_LIST,        //  A Array of Shard list, which will get spawned
	shardCount: Cluster.data.TOTAL_SHARDS, // The Number of Total Shards
});
client.cluster = new Cluster.Client(client); //Init the Client & So we can also access broadcastEval...
client.login("Your_Token");
```

# Evaling over Clusters

*Following examples assume that your `Discord.Client` is called `client`.*

```js
client.cluster.broadcastEval(`this.guilds.cache.size`)
      .then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))

//or with functions:
client.cluster.broadcastEval(c => c.guilds.cache.size)
		.then(results => console.log(`${results.reduce((prev, val) => prev + val, 0)} total guilds`))
.........
```
# Cluster.Manager 
| Option | Type | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| totalShards | number/string| 'auto'| The Number of Internal Shards, which should be spawned |
| totalClusters | number/string| 'auto' | The Number of Processes/Clusters which should be spawned |
| shardsPerClusters | number/string| --- | The Number of Shards, which should be in one Processes/Cluster |
| shardList | Array[Number] | not-required | On Cross hosting or spawning specific shards you can provided a shardList of internal Shards id, which should get spawned |
| mode | "worker/process" | worker | The Cluster.Manager Mode for the processes |
| token | string | not-required | The Bot token is just required, when you set the totalShards on auto |

The Manager.spawn option are the same like Sharding Manager
**[Checkout our Documentation here](https://sharding.js.org)**

# Cluster Events
| Event |  Description |
| ------------- | -------------- |
| clusterCreate | When a Cluster is spawned the Event is triggered|



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

The options is `cluster` instead of `shard`:
```diff
- .broadcastEval((c, context) => c.guilds.cache.get(context.guildId), {context: {guildId: `1234`}, shard: 0})
+ .broadcastEval((c, context) => c.guilds.cache.get(context.guildId), {context: {guildId: `1234`}, cluster: 0})
```
Small changing in the naming convention:
```diff
- client.shard.respawnAll({shardDelay = 5000, respawnDelay = 500, timeout = 30000})
- manager.shard.respawnAll({shardDelay = 5000, respawnDelay = 500, timeout = 30000})
+ client.cluster.respawnAll({clusterDelay = 5000, respawnDelay = 5500, timeout = 30000})
+ manager.respawnAll({clusterDelay = 5000, respawnDelay = 5500, timeout = 30000})
```
Rename Property:
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
                                       totalShards: 8 ,
                                       shardsPerClusters: 2, 
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

## `IPC System`:
* The IPC System allows you to listen on your messages, which you sent.
* You can communicate between the Cluster and the Client
* This allows you to send requests from the Client to the Cluster and reply to them and viceversa
* You can also send normal messages, which do not need to be replied

ClusterManager | cluster.js
```js
const Cluster = require("discord-hybrid-sharding");
const manager = new Cluster.Manager(`./testbot.js`,{
                                       totalShards:1,
                                       totalClusters:1,
                                    })
manager.on('clusterCreate', cluster => {

   cluster.on('message',  (message) => {
      console.log(message)
      if(!message._sRequest) return; ///Check if message neeeds a reply
      message.reply({content: 'hello'})
   })
   setInterval(() => {
      cluster.send({content: 'I am alive'}) ///Send a Message to the Client
      cluster.request({content: 'Are you alive?', alive: true}).then(e => console.log(e)) ///Send a Message to the Client
   }, 5000);
});
manager.spawn({timeout: -1})
```

ClusterClient | client.js
```js
const Cluster = require("discord-hybrid-sharding");
const Discord = require("discord.js");
const client = new Discord.Client({
 	shards: Cluster.data.SHARD_LIST,        //  A Array of Shard list, which will get spawned
	shardCount: Cluster.data.TOTAL_SHARDS, // The Number of Total Shards
});
client.cluster = new Cluster.Client(client); 
client.cluster.on('message', (message) => {
	console.log(message)
	if(!message._sRequest) return; ///Check if message neeeds a reply
	if(message.alive) message.reply({content: 'Yes I am!'})
})
setInterval(()=>{
   client.cluster.send({content: 'I am alive too!'})
}, 5000)
client.login("Your_Token");
```
Evals a Script on the ClusterManager:
```diff
+ client.cluster.evalOnManager(`process.memoryUsage().rss/1024/1024`)
```
Listen to some debug Messages and get informed about internal stuff:
```diff
+ manager.on('debug', console.log)
```
Optional Timeout on broadcastEval (Promise will be rejected after the given Time):
```diff
+  client.cluster.broadcastEval(`new Promise((resolve, reject) => {})`, {timeout: 10000})
```

Open a PR/Issue when you need other Functions :)

# Bugs, Glitches and Issues
If you encounter any problems feel free to open an issue in our <a href="https://github.com/meister03/discord-hybrid-sharding/issues">github repository or join the discord server.</a>

# Credits
Credits goes to the discord.js libary (See the Changes.md) and to this helpful [server](https://discord.gg/BpeedKh)
