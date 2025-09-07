// Example: Basic Discord bot with hybrid sharding
import { ClusterManager } from '@hybrid-sharding/discord';
import path from 'path';

const manager = new ClusterManager(path.join(__dirname, 'bot.js'), {
  totalShards: 'auto', // Fetch from Discord
  totalClusters: 2,   // Use 2 clusters
  mode: 'process',    // Use child processes
  token: process.env.DISCORD_TOKEN,
  respawn: true,
  clientOptions: {
    // Discord.js client options
    // intents: [...],
    // partials: [...]
  }
});

// Handle cluster events
manager.on('clusterCreate', cluster => {
  console.log(`✅ Cluster ${cluster.id} created`);
  
  // Listen to cluster messages
  cluster.on('message', message => {
    console.log(`📨 Message from cluster ${cluster.id}:`, message);
  });
});

manager.on('clusterReady', cluster => {
  console.log(`🚀 Cluster ${cluster.id} ready`);
});

manager.on('clusterError', (cluster, error) => {
  console.error(`❌ Cluster ${cluster.id} error:`, error);
});

manager.on('ready', () => {
  console.log('🎉 All clusters ready!');
  
  // Example: Broadcast evaluation across all clusters
  manager.broadcastEval('this.guilds.cache.size')
    .then(results => {
      const totalGuilds = results.reduce((a, b) => a + b, 0);
      console.log(`📊 Total guilds across all clusters: ${totalGuilds}`);
    })
    .catch(console.error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Graceful shutdown initiated...');
  await manager.kill();
  process.exit(0);
});

// Start the cluster manager
manager.spawn().catch(console.error);