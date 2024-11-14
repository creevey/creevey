import cluster, { Worker } from 'cluster';
import {
  WorkerMessage,
  StoriesMessage,
  TestMessage,
  ProcessMessage,
  WorkerHandler,
  StoriesHandler,
  TestHandler,
  ShutdownHandler,
} from '../types.js';

function emitMessage(message: unknown): boolean {
  if (cluster.isWorker && !process.connected) return false;
  return (
    process.send?.(message) ??
    // @ts-expect-error: wrong typings `process.emit` return boolean
    process.emit('message', message)
  );
}

export function emitWorkerMessage(message: WorkerMessage): boolean {
  return emitMessage({ scope: 'worker', ...message });
}

export function emitStoriesMessage(message: StoriesMessage): boolean {
  return emitMessage({ scope: 'stories', ...message });
}

export function emitTestMessage(message: TestMessage): boolean {
  return emitMessage({ scope: 'test', ...message });
}

export function emitShutdownMessage(): boolean {
  return emitMessage({ scope: 'shutdown' });
}

interface Handlers {
  worker: Set<WorkerHandler>;
  stories: Set<StoriesHandler>;
  test: Set<TestHandler>;
  shutdown: Set<ShutdownHandler>;
}

function createHandlers(): Handlers {
  return Object.assign(Object.create(null) as Handlers, {
    worker: new Set<WorkerHandler>(),
    stories: new Set<StoriesHandler>(),
    test: new Set<TestHandler>(),
    shutdown: new Set<ShutdownHandler>(),
  });
}

const handlers = createHandlers();

const handler = (message: ProcessMessage): void => {
  switch (message.scope) {
    case 'worker': {
      handlers.worker.forEach((h) => {
        h(message);
      });
      return;
    }
    case 'stories': {
      handlers.stories.forEach((h) => {
        h(message);
      });
      return;
    }
    case 'test': {
      handlers.test.forEach((h) => {
        h(message);
      });
      return;
    }
    case 'shutdown': {
      handlers.shutdown.forEach((h) => {
        h(message);
      });
      return;
    }
  }
};
process.on('message', handler);

export function sendStoriesMessage(target: NodeJS.Process | Worker, message: StoriesMessage): void {
  target.send?.({ scope: 'stories', ...message });
}
export function sendTestMessage(target: NodeJS.Process | Worker, message: TestMessage): void {
  target.send?.({ scope: 'test', ...message });
}
export function sendShutdownMessage(target: NodeJS.Process | Worker): void {
  target.send?.({ scope: 'shutdown' });
}
export function sendWorkerMessage(target: NodeJS.Process | Worker, message: WorkerMessage): void {
  target.send?.({ scope: 'worker', ...message });
}

export function subscribeOn(scope: 'worker', handler: WorkerHandler): () => void;
export function subscribeOn(scope: 'stories', handler: StoriesHandler): () => void;
export function subscribeOn(scope: 'test', handler: TestHandler): () => void;
export function subscribeOn(scope: 'shutdown', handler: ShutdownHandler): () => void;
export function subscribeOn(
  scope: 'worker' | 'stories' | 'test' | 'shutdown',
  handler: WorkerHandler | StoriesHandler | TestHandler | ShutdownHandler,
): () => void;

export function subscribeOn(
  scope: 'worker' | 'stories' | 'test' | 'shutdown',
  handler: WorkerHandler | StoriesHandler | TestHandler | ShutdownHandler,
): () => void {
  switch (scope) {
    case 'worker': {
      const workerHandler = handler as WorkerHandler;
      handlers.worker.add(workerHandler);
      return () => handlers.worker.delete(workerHandler);
    }
    case 'stories': {
      const storiesHandler = handler as StoriesHandler;
      handlers.stories.add(storiesHandler);
      return () => handlers.stories.delete(storiesHandler);
    }
    case 'test': {
      const testHandler = handler as TestHandler;
      handlers.test.add(testHandler);
      return () => handlers.test.delete(testHandler);
    }
    case 'shutdown': {
      const shutdownHandler = handler as ShutdownHandler;
      handlers.shutdown.add(shutdownHandler);
      return () => handlers.shutdown.delete(shutdownHandler);
    }
  }
}

const workers = new Map<Worker, Handlers>();

export function subscribeOnWorker(worker: Worker, scope: 'worker', handler: WorkerHandler): () => void;
export function subscribeOnWorker(worker: Worker, scope: 'stories', handler: StoriesHandler): () => void;
export function subscribeOnWorker(worker: Worker, scope: 'test', handler: TestHandler): () => void;
export function subscribeOnWorker(worker: Worker, scope: 'shutdown', handler: ShutdownHandler): () => void;
export function subscribeOnWorker(
  worker: Worker,
  scope: 'worker' | 'stories' | 'test' | 'shutdown',
  handler: WorkerHandler | StoriesHandler | TestHandler | ShutdownHandler,
): () => void;

export function subscribeOnWorker(
  worker: Worker,
  scope: 'worker' | 'stories' | 'test' | 'shutdown',
  handler: WorkerHandler | StoriesHandler | TestHandler | ShutdownHandler,
): () => void {
  const workerHandlers = workers.get(worker) ?? createHandlers();
  if (!workers.has(worker)) {
    workers.set(worker, workerHandlers);
    worker.once('exit', () => workers.delete(worker));
    worker.on('message', (message: ProcessMessage): void => {
      switch (message.scope) {
        case 'worker': {
          workerHandlers.worker.forEach((h) => {
            h(message);
          });
          return;
        }
        case 'stories': {
          workerHandlers.stories.forEach((h) => {
            h(message);
          });
          return;
        }
        case 'test': {
          workerHandlers.test.forEach((h) => {
            h(message);
          });
          return;
        }
        case 'shutdown': {
          workerHandlers.shutdown.forEach((h) => {
            h(message);
          });
          return;
        }
      }
    });
  }

  switch (scope) {
    case 'worker': {
      const workerHandler = handler as WorkerHandler;
      workerHandlers.worker.add(workerHandler);
      return () => workerHandlers.worker.delete(workerHandler);
    }
    case 'stories': {
      const storiesHandler = handler as StoriesHandler;
      workerHandlers.stories.add(storiesHandler);
      return () => workerHandlers.stories.delete(storiesHandler);
    }
    case 'test': {
      const testHandler = handler as TestHandler;
      workerHandlers.test.add(testHandler);
      return () => workerHandlers.test.delete(testHandler);
    }
    case 'shutdown': {
      const shutdownHandler = handler as ShutdownHandler;
      workerHandlers.shutdown.add(shutdownHandler);
      return () => workerHandlers.shutdown.delete(shutdownHandler);
    }
  }
}
