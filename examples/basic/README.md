# Basic Discord Bot Example

This example demonstrates how to use the Discord Hybrid Sharding monorepo packages to create a scalable Discord bot.

## Structure

- `manager.ts` - The cluster manager that spawns and manages multiple bot processes
- `bot.ts` - The bot code that runs in each cluster/process

## Features Demonstrated

1. **Process Management**: Using child processes for better isolation
2. **Shard Distribution**: Automatic distribution of Discord shards across clusters
3. **IPC Communication**: Inter-process communication between clusters
4. **Broadcast Evaluation**: Running code across all clusters and collecting results
5. **Graceful Shutdown**: Proper cleanup when stopping the bot
6. **Error Handling**: Comprehensive error handling and logging

## Setup

1. Install dependencies:
```bash
npm install @hybrid-sharding/discord discord.js
```

2. Set your Discord bot token:
```bash
export DISCORD_TOKEN="your_bot_token_here"
```

3. Build the TypeScript files:
```bash
npx tsc manager.ts --target ES2020 --module commonjs --esModuleInterop
npx tsc bot.ts --target ES2020 --module commonjs --esModuleInterop
```

4. Run the manager:
```bash
node manager.js
```

## Commands

Once the bot is running, you can use these commands in Discord:

- `!cluster` - Get information about the current cluster
- `!stats` - Get statistics across all clusters

## Configuration Options

The manager can be configured with various options:

```typescript
const manager = new ClusterManager('./bot.js', {
  totalShards: 'auto',    // Auto-fetch from Discord API
  totalClusters: 4,       // Number of clusters to spawn
  mode: 'process',        // Use child processes (or 'worker' for worker threads)
  respawn: true,          // Auto-respawn crashed clusters
  token: 'YOUR_TOKEN',    // Discord bot token
  shardsPerCluster: 2,    // Shards per cluster (optional)
  restarts: {             // Restart limits
    max: 5,
    interval: 60000 * 60
  }
});
```

## Production Considerations

1. **Environment Variables**: Use environment variables for sensitive data
2. **Logging**: Implement proper logging (Winston, Pino, etc.)
3. **Monitoring**: Add health checks and monitoring
4. **Error Handling**: Implement comprehensive error handling
5. **Graceful Shutdown**: Handle process signals properly
6. **Resource Limits**: Set appropriate memory and CPU limits

## Scaling

This setup can easily scale to handle large Discord bots:

- **Small bots** (< 1,000 guilds): 1-2 clusters
- **Medium bots** (1,000-10,000 guilds): 2-4 clusters  
- **Large bots** (10,000+ guilds): 4-8+ clusters

The optimal number depends on your bot's specific workload and available resources.