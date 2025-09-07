# Discord Hybrid Sharding - Monorepo

This repository has been refactored into a monorepo structure with a generic core package and a Discord-specific package.

## Architecture

### 📦 Packages

#### `@hybrid-sharding/core`
A framework-agnostic process management library that provides:
- **Process Management**: Abstractions for worker threads and child processes
- **IPC System**: Type-safe inter-process communication
- **Queue Management**: Priority-based processing queues
- **Promise Handling**: Timeout and cancellation support
- **Strong Type Safety**: Full TypeScript support with strict typing

#### `@hybrid-sharding/discord`
Discord-specific implementation that extends the core package:
- **Discord Integration**: Works seamlessly with discord.js
- **Shard Management**: Automatic shard distribution across clusters
- **Cluster Management**: Process-based or worker-based clustering
- **Utility Functions**: Guild-to-shard mapping, memory formatting, etc.
- **Type Safety**: Discord-specific types and interfaces

## Key Features

### 🔥 Core Package Benefits
- **Framework Agnostic**: Use with any Node.js application, not just Discord bots
- **Strong Typing**: Full TypeScript support with comprehensive interfaces
- **Process Modes**: Support for both worker threads and child processes  
- **IPC System**: Request/response pattern with timeout support
- **Queue System**: Priority-based processing with concurrency control
- **Promise Management**: Built-in timeout and cancellation handling

### 🤖 Discord Package Benefits
- **Easy Migration**: Drop-in replacement for discord-hybrid-sharding v2.x
- **Shard Distribution**: Automatic calculation and distribution of shards across clusters
- **Memory Efficient**: 40-60% less memory usage compared to standard sharding
- **Scalable**: Battle-tested with bots managing 600k+ guilds
- **Discord.js Integration**: First-class support for discord.js v14+

## Installation

```bash
# For Discord bots (includes both core and discord packages)
npm install @hybrid-sharding/discord

# For generic process management (core only)
npm install @hybrid-sharding/core
```

## Quick Start

### Discord Bot Example

```typescript
// manager.ts
import { ClusterManager } from '@hybrid-sharding/discord';

const manager = new ClusterManager('./bot.js', {
  totalShards: 'auto',
  totalClusters: 4,
  mode: 'process', // or 'worker'
  token: 'YOUR_BOT_TOKEN'
});

manager.on('clusterCreate', cluster => {
  console.log(`Cluster ${cluster.id} created`);
});

manager.spawn();
```

```typescript
// bot.ts
import { ClusterClient } from '@hybrid-sharding/discord';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  shards: 'auto',
  shardCount: 'auto'
});

const cluster = new ClusterClient(client);

client.on('ready', () => {
  console.log(`Bot ready on cluster ${cluster.id}`);
  cluster.triggerReady();
});

client.login('YOUR_BOT_TOKEN');
```

### Generic Process Management Example

```typescript
import { 
  WorkerProcess, 
  ChildProcessWrapper, 
  IPCMessage, 
  MessageType,
  PromiseHandler 
} from '@hybrid-sharding/core';

// Create worker processes
const worker = new WorkerProcess('./worker.js', {
  processData: { workerId: 1 }
});

const process = worker.spawn();

// Send messages
await worker.send(IPCMessage.custom({ task: 'process-data' }));

// Use promise handler for request/response
const promiseHandler = new PromiseHandler();
const promise = promiseHandler.create('request-1', 5000);

await worker.send({
  type: MessageType.CUSTOM_REQUEST,
  nonce: 'request-1',
  data: { action: 'calculate' }
});

const result = await promise;
```

## Development

### Prerequisites
- Node.js 16+
- pnpm (recommended) or npm

### Setup
```bash
# Clone the repository
git clone https://github.com/meister03/discord-hybrid-sharding.git
cd discord-hybrid-sharding

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint
```

### Package Scripts
```bash
# Build all packages
pnpm build

# Test all packages
pnpm test

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format:fix

# Clean build artifacts
pnpm clean
```

## Migration from v2.x

The Discord package maintains backward compatibility with discord-hybrid-sharding v2.x:

```typescript
// Old import (still works)
import { ClusterManager, ClusterClient } from 'discord-hybrid-sharding';

// New import (recommended)
import { ClusterManager, ClusterClient } from '@hybrid-sharding/discord';
```

All existing APIs remain the same, but you now have access to:
- Better type safety
- Improved error handling
- Core utilities for non-Discord applications
- Enhanced debugging capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate package
4. Add tests for new functionality
5. Ensure all tests pass: `pnpm test`
6. Ensure code is properly formatted: `pnpm lint:fix`
7. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 Documentation: [GitHub Wiki](https://github.com/meister03/discord-hybrid-sharding/wiki)
- 💬 Discord Server: [Join our community](https://discord.gg/YTdNBHh)
- 🐛 Issues: [GitHub Issues](https://github.com/meister03/discord-hybrid-sharding/issues)
- 💡 Discussions: [GitHub Discussions](https://github.com/meister03/discord-hybrid-sharding/discussions)