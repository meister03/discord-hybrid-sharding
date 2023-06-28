# Changes

```diff
- ShardClientUtil.js
+ ClusterClient.js:
   -> Change Shard to Cluster
   -> Add Info Function, which parses out Process.Env or Worker Data
   -> Remove Broadcast Logic of Discord.js
   -> Convert to Typescript
- Shard.js
+ Cluster.js
   -> Change Shard to Cluster
   -> Add new Error Event
   -> Change Spawn Options
   -> Convert to Typescript
- ShardManager.js
+ ClusterManager.js
    --> Change Shard to Cluster
    --> Add Chunk Function
    --> Add Option to Accept Internal Shard List
    --> Add private Properties
    -> Convert to Typescript

+ Util.js
   --> Copy Discord.js Util Functions for making Library zero Dep
   -> Convert to Typescript

+ Util.js
   --> Copy Discord.js Constants for making Library zero Dep
   -> Convert to Typescript

+ interface ClusterManager, Cluster, ClusterClient
  --> Handy Event Emitter Typings from @discordjs/rest
```

**Every file, which is not listed above follows the License of the Repo**
