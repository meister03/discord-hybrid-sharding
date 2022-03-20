# Changes

```diff
- ShardClientUtil.js
+ ClusterClient.js:
   -> Change Shard to Cluster
   -> Add Info Function, which parses out Process.Env or Worker Data
   -> Copy BroadcastEval Function from v13 Lib and adapt to hybrid-sharding
   -> Add Heartbeat System
- Shard.js
+ Cluster.js
   -> Change Shard to Cluster
   -> Add new Error Event
   -> Change Spawn Options
      -> Add Heartbeat System
- ShardManager.js
+ ClusterManager.js
    --> Change Shard to Cluster
    --> Add Chunk Function
    --> Add Option to Accept Internal Shard List
    --> Add private Properties
    --> Add Heartbeat System

+ Util.js
   --> Copy Discord.js Util Functions for making Library zero Dep

+ Util.js
   --> Copy Discord.js Constants for making Library zero Dep

+ IPCMessage.js
   --> Add IPC Message System with `.reply`, `.send`, `.request`
```
