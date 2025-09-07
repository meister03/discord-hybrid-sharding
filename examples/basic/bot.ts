// Example: Bot running in each cluster
import { ClusterClient } from '@hybrid-sharding/discord';
import { Client, GatewayIntentBits } from 'discord.js';

// Create Discord.js client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  shards: 'auto',
  shardCount: 'auto'
});

// Create cluster client to manage this process
const cluster = new ClusterClient(client);

// Discord.js events
client.on('ready', () => {
  console.log(`🤖 Bot ready as ${client.user?.tag} on cluster ${cluster.id}`);
  console.log(`📊 Cluster ${cluster.id} manages shards: ${cluster.shardIds.join(', ')}`);
  console.log(`🏠 Managing ${client.guilds.cache.size} guilds`);
  
  // Trigger ready state for the cluster manager
  cluster.triggerReady();
});

client.on('shardReady', (shardId) => {
  console.log(`✅ Shard ${shardId} ready on cluster ${cluster.id}`);
});

client.on('shardError', (error, shardId) => {
  console.error(`❌ Shard ${shardId} error on cluster ${cluster.id}:`, error);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // Example command: Get cluster info
  if (message.content === '!cluster') {
    const embed = {
      title: '🔧 Cluster Information',
      fields: [
        { name: 'Cluster ID', value: cluster.id.toString(), inline: true },
        { name: 'Shard IDs', value: cluster.shardIds.join(', '), inline: true },
        { name: 'Total Shards', value: cluster.totalShards.toString(), inline: true },
        { name: 'Guild Count', value: client.guilds.cache.size.toString(), inline: true },
        { name: 'Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true }
      ],
      color: 0x00ff00
    };
    
    message.channel.send({ embeds: [embed] });
  }
  
  // Example command: Get total stats across all clusters
  if (message.content === '!stats') {
    try {
      const results = await cluster.broadcastEval(`({
        guilds: this.guilds.cache.size,
        users: this.users.cache.size,
        channels: this.channels.cache.size,
        uptime: this.uptime
      })`);
      
      const totals = results.reduce((acc, result) => ({
        guilds: acc.guilds + result.guilds,
        users: acc.users + result.users,
        channels: acc.channels + result.channels,
        uptime: Math.max(acc.uptime, result.uptime)
      }), { guilds: 0, users: 0, channels: 0, uptime: 0 });
      
      const embed = {
        title: '📈 Bot Statistics',
        fields: [
          { name: 'Total Guilds', value: totals.guilds.toLocaleString(), inline: true },
          { name: 'Total Users', value: totals.users.toLocaleString(), inline: true },
          { name: 'Total Channels', value: totals.channels.toLocaleString(), inline: true },
          { name: 'Uptime', value: `${Math.round(totals.uptime / 1000 / 60)} minutes`, inline: true },
          { name: 'Clusters', value: results.length.toString(), inline: true }
        ],
        color: 0x0099ff
      };
      
      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error getting stats:', error);
      message.channel.send('❌ Error getting bot statistics');
    }
  }
});

// Handle cluster messages
cluster.on('message', (message) => {
  console.log(`📨 Received message on cluster ${cluster.id}:`, message);
  
  // Handle custom messages from the manager
  if (message.type === 'PING') {
    cluster.send({ type: 'PONG', clusterId: cluster.id, timestamp: Date.now() });
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);