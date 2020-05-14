import cluster from 'cluster';
import { WebpackMessage } from '../../types';
import { emitMessage } from '../../utils';

export function startWebpackCompiler(): Promise<string> {
  return new Promise((resolve, reject) => {
    cluster.setupMaster({ args: ['--webpack', ...process.argv.slice(2)] });
    const webpackCompiler = cluster.fork();

    webpackCompiler.on('message', (message: WebpackMessage) => {
      Object.values(cluster.workers).forEach((worker) => worker?.send(message));
      switch (message.type) {
        case 'ready':
          return resolve(message.payload.filePath);
        case 'failed':
          return reject();
        default:
          return emitMessage<WebpackMessage>(message);
      }
    });
  });
}
