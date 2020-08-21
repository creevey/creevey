import cluster from 'cluster';
import { WebpackMessage } from '../../types';
import { emitMessage } from '../utils';

export function startWebpackCompiler(): Promise<string> {
  return new Promise((resolve, reject) => {
    cluster.setupMaster({ args: ['--webpack', ...process.argv.slice(2)] });
    const webpackCompiler = cluster.fork({ NODE_ENV: 'test' });

    webpackCompiler.on('message', (message: WebpackMessage) => {
      Object.values(cluster.workers)
        .filter((worker) => worker != webpackCompiler)
        .forEach((worker) => worker?.send(message));
      switch (message.type) {
        case 'ready':
          return resolve(message.payload.filePath);
        case 'failed':
          return reject();
        case 'rebuild started':
        case 'rebuild succeeded':
        case 'rebuild failed':
          return emitMessage<WebpackMessage>(message);
      }
    });
  });
}
