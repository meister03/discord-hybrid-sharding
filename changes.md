# Changes
```diff
- ShardClientUtil.js
+ ClusterClient.js:
   -> Change Shard to Cluster
   -> add Info Function, which parses out Process.Env or Worker Data
   -> copy BroadcastEval Function from v13 Lib and adapt to hybrid-sharding

- Shard.js
+ Cluster.js
   -> Change Shard to Cluster
   -> Add new Error Event
   -> Change Spawn Options
- ShardManager.js
+ ClusterManager.js
    --> Change Shard to Cluster
    --> Add Chunk Function
    --> Add Option to Accept Internal Shard List
    --. Add private Properties

+ Util.js
   --> Copy Discord.js Util Functions for making Library zero Dep
```

