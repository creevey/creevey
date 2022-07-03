import cluster from 'cluster';
import {
  WorkerMessage,
  StoriesMessage,
  TestMessage,
  WebpackMessage,
  DockerMessage,
  ProcessMessage,
  WorkerHandler,
  StoriesHandler,
  TestHandler,
  WebpackHandler,
  DockerHandler,
  ShutdownHandler,
} from '../types';

function emitMessage<T>(message: T): boolean {
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

export function emitWebpackMessage(message: WebpackMessage): boolean {
  return emitMessage({ scope: 'webpack', ...message });
}

export function emitDockerMessage(message: DockerMessage): boolean {
  return emitMessage({ scope: 'docker', ...message });
}

export function emitShutdownMessage(): boolean {
  return emitMessage({ scope: 'shutdown' });
}

interface Handlers {
  worker: Set<WorkerHandler>;
  stories: Set<StoriesHandler>;
  test: Set<TestHandler>;
  webpack: Set<WebpackHandler>;
  docker: Set<DockerHandler>;
  shutdown: Set<ShutdownHandler>;
}

function createHandlers(): Handlers {
  return Object.assign(Object.create(null) as unknown, {
    worker: new Set<WorkerHandler>(),
    stories: new Set<StoriesHandler>(),
    test: new Set<TestHandler>(),
    webpack: new Set<WebpackHandler>(),
    docker: new Set<DockerHandler>(),
    shutdown: new Set<ShutdownHandler>(),
  });
}

const handlers = createHandlers();

const handler = (message: ProcessMessage): void => {
  switch (message.scope) {
    case 'worker':
      return handlers.worker.forEach((h) => h(message));
    case 'stories':
      return handlers.stories.forEach((h) => h(message));
    case 'test':
      return handlers.test.forEach((h) => h(message));
    case 'webpack':
      return handlers.webpack.forEach((h) => h(message));
    case 'docker':
      return handlers.docker.forEach((h) => h(message));
    case 'shutdown':
      return handlers.shutdown.forEach((h) => h(message));
  }
};
process.on('message', handler);

export function sendStoriesMessage(target: NodeJS.Process | cluster.Worker, message: StoriesMessage): void {
  target.send?.({ scope: 'stories', ...message });
}
export function sendTestMessage(target: NodeJS.Process | cluster.Worker, message: TestMessage): void {
  target.send?.({ scope: 'test', ...message });
}
export function sendDockerMessage(target: NodeJS.Process | cluster.Worker, message: DockerMessage): void {
  target.send?.({ scope: 'docker', ...message });
}
export function sendShutdownMessage(target: NodeJS.Process | cluster.Worker): void {
  target.send?.({ scope: 'shutdown' });
}

export function subscribeOn(scope: 'worker', handler: WorkerHandler): () => void;
export function subscribeOn(scope: 'stories', handler: StoriesHandler): () => void;
export function subscribeOn(scope: 'test', handler: TestHandler): () => void;
export function subscribeOn(scope: 'webpack', handler: WebpackHandler): () => void;
export function subscribeOn(scope: 'docker', handler: DockerHandler): () => void;
export function subscribeOn(scope: 'shutdown', handler: ShutdownHandler): () => void;
export function subscribeOn(
  scope: 'worker' | 'stories' | 'test' | 'webpack' | 'docker' | 'shutdown',
  handler: WorkerHandler | StoriesHandler | TestHandler | WebpackHandler | DockerHandler | ShutdownHandler,
): () => void;

export function subscribeOn(
  scope: 'worker' | 'stories' | 'test' | 'webpack' | 'docker' | 'shutdown',
  handler: WorkerHandler | StoriesHandler | TestHandler | WebpackHandler | DockerHandler | ShutdownHandler,
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
    case 'webpack': {
      const webpackHandler = handler as WebpackHandler;
      handlers.webpack.add(webpackHandler);
      return () => handlers.webpack.delete(webpackHandler);
    }
    case 'docker': {
      const dockerHandler = handler as DockerHandler;
      handlers.docker.add(dockerHandler);
      return () => handlers.docker.delete(dockerHandler);
    }
    case 'shutdown': {
      const shutdownHandler = handler as ShutdownHandler;
      handlers.shutdown.add(shutdownHandler);
      return () => handlers.shutdown.delete(shutdownHandler);
    }
  }
}

const workers = new Map<cluster.Worker, Handlers>();

export function subscribeOnWorker(worker: cluster.Worker, scope: 'worker', handler: WorkerHandler): () => void;
export function subscribeOnWorker(worker: cluster.Worker, scope: 'stories', handler: StoriesHandler): () => void;
export function subscribeOnWorker(worker: cluster.Worker, scope: 'test', handler: TestHandler): () => void;
export function subscribeOnWorker(worker: cluster.Worker, scope: 'webpack', handler: WebpackHandler): () => void;
export function subscribeOnWorker(worker: cluster.Worker, scope: 'docker', handler: DockerHandler): () => void;
export function subscribeOnWorker(worker: cluster.Worker, scope: 'shutdown', handler: ShutdownHandler): () => void;
export function subscribeOnWorker(
  worker: cluster.Worker,
  scope: 'worker' | 'stories' | 'test' | 'webpack' | 'docker' | 'shutdown',
  handler: WorkerHandler | StoriesHandler | TestHandler | WebpackHandler | DockerHandler | ShutdownHandler,
): () => void;

export function subscribeOnWorker(
  worker: cluster.Worker,
  scope: 'worker' | 'stories' | 'test' | 'webpack' | 'docker' | 'shutdown',
  handler: WorkerHandler | StoriesHandler | TestHandler | WebpackHandler | DockerHandler | ShutdownHandler,
): () => void {
  const workerHandlers = workers.get(worker) ?? createHandlers();
  if (!workers.has(worker)) {
    workers.set(worker, workerHandlers);
    worker.once('exit', () => workers.delete(worker));
    worker.on('message', (message: ProcessMessage): void => {
      switch (message.scope) {
        case 'worker':
          return workerHandlers.worker.forEach((h) => h(message));
        case 'stories':
          return workerHandlers.stories.forEach((h) => h(message));
        case 'test':
          return workerHandlers.test.forEach((h) => h(message));
        case 'webpack':
          return workerHandlers.webpack.forEach((h) => h(message));
        case 'docker':
          return workerHandlers.docker.forEach((h) => h(message));
        case 'shutdown':
          return workerHandlers.shutdown.forEach((h) => h(message));
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
    case 'webpack': {
      const webpackHandler = handler as WebpackHandler;
      workerHandlers.webpack.add(webpackHandler);
      return () => workerHandlers.webpack.delete(webpackHandler);
    }
    case 'docker': {
      const dockerHandler = handler as DockerHandler;
      workerHandlers.docker.add(dockerHandler);
      return () => workerHandlers.docker.delete(dockerHandler);
    }
    case 'shutdown': {
      const shutdownHandler = handler as ShutdownHandler;
      workerHandlers.shutdown.add(shutdownHandler);
      return () => workerHandlers.shutdown.delete(shutdownHandler);
    }
  }
}
