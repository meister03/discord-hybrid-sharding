<p align="center"><a href="https://nodei.co/npm/discord-hybrid-sharding/"><img src="https://nodei.co/npm/discord-hybrid-sharding.png"></a></p>
<p align="center"><img src="https://img.shields.io/npm/v/discord-hybrid-sharding"> <img src="https://img.shields.io/github/repo-size/meister03/disord-hybrid-sharding"> <img src="https://img.shields.io/npm/l/discord-hybrid-sharding"> <img src="https://img.shields.io/github/contributors/discord-hybrid-sharding">  <a href="https://discord.gg/YTdNBHh"><img src="https://discordapp.com/api/guilds/697129454761410600/widget.png" alt="Discord server"/></a></p>

# Discord-Hybrid-Sharding
The first package which combines Sharding Manager & Internal Sharding to save a lot of resources

## Why?
The Sharding Manager is very heavy and it uses more than 300mb for every shard on a light usage, during internal sharding just uses 20% of it. Internal Sharding reaches their limit on more than 14000 Guilds and it becomes slow when you bot gets bigger. Your only solution is convert to Sharding Manager. Thatsway this new Package will solve all your problems, because it spawns Shards, which has Internal Shards. **You can save up to 60% on resources**

**If you need help feel free to join our <a href="https://discord.gg/YTdNBHh">discord server</a>. We will provied you all help ☺**
# Download
You can download it from npm:
```cli
npm i discord-hybrid-sharding
```

# Setting Up
First we include the module into the project (into your shard/cluster file).
Filename: Cluster.js
```js
const Cluster = require("discord-hybrid-sharding");
let {token} = require("./config.json");
const manager = new Cluster.Manager(`${__dirname}/bot.js`,{
                                       totalShards: 7 ,
                                       totalClusters: 2, 
                                       mode: "worker" ,  //you can also choose process
                                       token: token
                                    })
manager.on('clusterCreate', cluster => console.log(`Launched Cluster ${cluster.id}`));
manager.spawn(undefined, undefined, -1)
```

After that, you have to insert the code below in your bot.js file
FileName: Bot.js //You can name your file after you wish
```js
const Cluster = require("discord-hybrid-sharding");
const client = new Discord.Client({
 	shards: Cluster.data.SHARD_LIST,        //  A Array of Shard list, which will get spawned
	shardCount: Cluster.data.TOTAL_SHARDS, // The Number of Total Shards
});
client.cluster = new Cluster.Client(client); //Init the CLient & So we can also access broadcastEval...
client.login("Your_Token");
```

# Evaling over Clusters

*Following examples assume that your `Discord.Client` is called `client`.*

```js
	let guildcount = (await client.cluster.broadcastEval(`this.guilds.cache.size`)).reduce((acc, guildCount) => Number(acc + guildCount), 0);
  message.channel.send(`I am in ${guildcount} guilds`)
.........
```
# Cluster.Manager 
| Option | Type | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| totalShards | number/string| 'auto'| The Number of Internal Shards, which should be spawned |
| totalClusters | number/string| 'auto' | The Number of Processes/Clusters which should be spawned |
| mode | "worker/process" | worker | The Cluster.Manager Mode for the processes |
| token | string | not-required | The Bot token is just required, when you set the totalShards on auto |
The Manager.spawn option are the same like Sharding Manager
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

# Bugs, Glitches and Issues
If you encounter any problems fell free to open an issue in our <a href="https://github.com/meister03/discord-hybrid-sharding/issues">github repository or join the discord server.</a>

# Credits
Credits goes to the discord.js libary since some structures are copied and to this helpful [server]()