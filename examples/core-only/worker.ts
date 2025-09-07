// Example: Worker process using core package
import { 
  IPCMessage, 
  IPCReply, 
  MessageType, 
  parseClusterInfo 
} from '@hybrid-sharding/core';
import { parentPort, workerData } from 'worker_threads';

class TaskWorker {
  private workerId: number;
  
  constructor() {
    this.workerId = workerData?.workerId || 0;
    console.log(`🔧 Worker ${this.workerId} initialized`);
    
    // Listen for messages from parent
    parentPort?.on('message', (message) => {
      this.handleMessage(message);
    });
  }
  
  private async handleMessage(message: any) {
    try {
      if (message._type === MessageType.CUSTOM_REQUEST) {
        // Handle task request
        const result = await this.processTask(message.data);
        
        // Send reply
        const reply = IPCReply.custom(message.nonce, result);
        parentPort?.postMessage(reply);
        
      } else if (message._type === MessageType.CUSTOM_MESSAGE) {
        // Handle broadcast message
        console.log(`📨 Worker ${this.workerId} received:`, message.data);
        
        // Send acknowledgment
        const ack = IPCMessage.custom({
          workerId: this.workerId,
          message: 'Message received',
          timestamp: Date.now()
        });
        parentPort?.postMessage(ack);
      }
    } catch (error) {
      console.error(`❌ Worker ${this.workerId} error:`, error);
      
      // Send error reply for requests
      if (message._type === MessageType.CUSTOM_REQUEST) {
        const errorReply = IPCReply.error(message.nonce, error as Error);
        parentPort?.postMessage(errorReply);
      }
    }
  }
  
  private async processTask(taskData: any): Promise<any> {
    console.log(`⚙️ Worker ${this.workerId} processing task:`, taskData.type);
    
    // Simulate work
    await this.delay(Math.random() * 1000 + 500);
    
    switch (taskData.type) {
      case 'calculate':
        return this.calculate(taskData.data);
        
      case 'process':
        return this.processItems(taskData.data);
        
      case 'fetch':
        return this.fetchData(taskData.data);
        
      default:
        throw new Error(`Unknown task type: ${taskData.type}`);
    }
  }
  
  private calculate(data: { operation: string; a: number; b: number }): any {
    const { operation, a, b } = data;
    
    let result: number;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        result = a / b;
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return {
      operation,
      inputs: { a, b },
      result,
      workerId: this.workerId,
      processedAt: new Date().toISOString()
    };
  }
  
  private processItems(data: { items: number[] }): any {
    const { items } = data;
    
    const processed = items.map(item => ({
      original: item,
      squared: item * item,
      doubled: item * 2,
      isEven: item % 2 === 0
    }));
    
    return {
      totalItems: items.length,
      processed,
      workerId: this.workerId,
      processedAt: new Date().toISOString()
    };
  }
  
  private async fetchData(data: { url: string }): Promise<any> {
    // Simulate API call
    await this.delay(200);
    
    return {
      url: data.url,
      status: 'success',
      data: {
        id: Math.floor(Math.random() * 1000),
        message: 'Simulated API response',
        timestamp: Date.now()
      },
      workerId: this.workerId,
      fetchedAt: new Date().toISOString()
    };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  public reportStatus() {
    const status = {
      workerId: this.workerId,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
    
    console.log(`📊 Worker ${this.workerId} status:`, status);
    return status;
  }
}

// Create and start the worker
const worker = new TaskWorker();

// Report status periodically
setInterval(() => {
  worker.reportStatus();
}, 30000);

// Handle worker errors
process.on('uncaughtException', (error) => {
  console.error(`❌ Worker ${workerData?.workerId || 0} uncaught exception:`, error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(`❌ Worker ${workerData?.workerId || 0} unhandled rejection:`, error);
  process.exit(1);
});

console.log(`✅ Worker ${workerData?.workerId || 0} ready`);