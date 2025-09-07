// Example: Generic process management with the core package
import { 
  WorkerProcess, 
  ChildProcessWrapper, 
  Queue,
  IPCMessage, 
  IPCRequest,
  MessageType,
  PromiseHandler 
} from '@hybrid-sharding/core';
import path from 'path';

class TaskManager {
  private workers: WorkerProcess[] = [];
  private queue = new Queue<any>({ concurrency: 2 });
  private promiseHandler = new PromiseHandler();

  constructor(private workerFile: string, private workerCount: number = 4) {}

  async start() {
    console.log(`🚀 Starting ${this.workerCount} workers...`);

    // Create workers
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new WorkerProcess(this.workerFile, {
        processData: { workerId: i }
      });

      const process = worker.spawn();
      
      // Handle worker messages
      process.on('message', (message: any) => {
        this.handleWorkerMessage(worker, message);
      });

      process.on('error', (error) => {
        console.error(`❌ Worker ${i} error:`, error);
      });

      process.on('exit', (code) => {
        console.log(`🔄 Worker ${i} exited with code ${code}`);
        // Auto-respawn in production
      });

      this.workers.push(worker);
      console.log(`✅ Worker ${i} started`);
    }

    // Set up task queue processor
    this.queue.setProcessor(async (task) => {
      return this.processTask(task);
    });

    console.log('🎉 All workers ready!');
  }

  private handleWorkerMessage(worker: WorkerProcess, message: any) {
    if (message._type === MessageType.CUSTOM_REPLY && message._replyTo) {
      // Handle response to a request
      this.promiseHandler.resolve(message._replyTo, message.data);
    } else if (message._type === MessageType.CUSTOM_MESSAGE) {
      // Handle regular message
      console.log('📨 Worker message:', message.data);
    }
  }

  async addTask(task: any): Promise<any> {
    return this.queue.add(task);
  }

  private async processTask(task: any): Promise<any> {
    // Find least busy worker (simplified)
    const worker = this.workers[Math.floor(Math.random() * this.workers.length)];
    
    // Create request
    const request = IPCRequest.custom(task, 30000); // 30 second timeout
    const promise = this.promiseHandler.create(request.nonce!, 30000);
    
    // Send to worker
    await worker.send(request);
    
    // Wait for response
    return promise;
  }

  async broadcastMessage(data: any): Promise<void> {
    const message = IPCMessage.custom(data);
    
    await Promise.all(
      this.workers.map(worker => worker.send(message))
    );
  }

  async shutdown() {
    console.log('🛑 Shutting down workers...');
    
    this.queue.stop();
    this.promiseHandler.clear(new Error('Shutting down'));
    
    await Promise.all(
      this.workers.map(worker => worker.kill())
    );
    
    console.log('✅ All workers stopped');
  }
}

// Example usage
async function main() {
  const taskManager = new TaskManager(path.join(__dirname, 'worker.js'), 4);
  
  await taskManager.start();
  
  // Add some tasks
  console.log('📝 Adding tasks...');
  
  const tasks = [
    { type: 'calculate', data: { operation: 'add', a: 5, b: 3 } },
    { type: 'calculate', data: { operation: 'multiply', a: 4, b: 7 } },
    { type: 'process', data: { items: [1, 2, 3, 4, 5] } },
    { type: 'fetch', data: { url: 'https://api.example.com/data' } }
  ];
  
  try {
    const results = await Promise.all(
      tasks.map(task => taskManager.addTask(task))
    );
    
    console.log('📊 Task results:', results);
    
    // Broadcast a message to all workers
    await taskManager.broadcastMessage({ 
      type: 'status_update', 
      message: 'All tasks completed!' 
    });
    
  } catch (error) {
    console.error('❌ Task processing error:', error);
  }
  
  // Graceful shutdown
  setTimeout(() => {
    taskManager.shutdown().then(() => {
      process.exit(0);
    });
  }, 2000);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  process.exit(0);
});

// Run the example
main().catch(console.error);