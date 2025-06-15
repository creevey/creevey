import { createBirpc } from 'birpc';
import { Worker } from 'cluster';
import { 
  WorkerMessage, 
  StoriesMessage, 
  TestMessage, 
  TestResult, 
  StoryInput, 
  CaptureOptions 
} from '../types.js';

// RPC interfaces defining the API between master and worker processes

/**
 * Methods that can be called on worker processes from the master
 */
export interface WorkerRPC {
  // Test execution
  startTest(test: { id: string; path: string[]; retries: number }): Promise<void>;
  
  // Stories management  
  updateStories(stories: [string, StoryInput[]][]): Promise<void>;
  captureStory(options?: CaptureOptions): Promise<void>;
  
  // Lifecycle management
  shutdown(): Promise<void>;
}

/**
 * Methods that can be called on master process from workers
 */
export interface MasterRPC {
  // Worker lifecycle events
  onWorkerReady(): Promise<void>;
  onWorkerError(error: { subtype: 'browser' | 'test' | 'unknown'; error: string }): Promise<void>;
  
  // Test result reporting
  onTestEnd(result: TestResult): Promise<void>;
  
  // Stories events
  onStoriesCapture(): Promise<void>;
  
  // Port assignment (for Docker containers)
  onPortRequest(): Promise<number>;
}

/**
 * Creates a birpc instance for master to communicate with worker processes
 */
export function createWorkerRPC(worker: Worker, masterFunctions: Partial<MasterRPC>) {
  return createBirpc<WorkerRPC>(masterFunctions, {
    post: (data) => worker.send(data),
    on: (fn) => worker.on('message', fn),
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });
}

/**
 * Creates a birpc instance for worker to communicate with master process
 */
export function createMasterRPC(workerFunctions: Partial<WorkerRPC>) {
  return createBirpc<MasterRPC>(workerFunctions, {
    post: (data) => process.send?.(data),
    on: (fn) => process.on('message', fn),
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });
}

/**
 * Legacy message type conversion utilities for gradual migration
 */
export class MessageConverter {
  static workerMessageToRPC(message: WorkerMessage): { method: keyof MasterRPC; args: any[] } {
    switch (message.type) {
      case 'ready':
        return { method: 'onWorkerReady', args: [] };
      case 'error':
        return { method: 'onWorkerError', args: [message.payload] };
      default:
        throw new Error(`Unknown worker message type: ${message.type}`);
    }
  }
  
  static testMessageToRPC(message: TestMessage): { method: keyof MasterRPC | keyof WorkerRPC; args: any[] } {
    switch (message.type) {
      case 'start':
        return { method: 'startTest', args: [message.payload] };
      case 'end':
        return { method: 'onTestEnd', args: [message.payload] };
      default:
        throw new Error(`Unknown test message type: ${message.type}`);
    }
  }
  
  static storiesMessageToRPC(message: StoriesMessage): { method: keyof WorkerRPC | keyof MasterRPC; args: any[] } {
    switch (message.type) {
      case 'update':
        return { method: 'updateStories', args: [message.payload] };
      case 'capture':
        return { method: 'captureStory', args: [message.payload] };
      default:
        throw new Error(`Unknown stories message type: ${message.type}`);
    }
  }
}