import cluster from 'cluster';
import { isWebpackMessage } from '../../types';
import { emitWebpackMessage } from '../messages';

export function startWebpackCompiler(): Promise<string> {
  return new Promise((resolve, reject) => {
    cluster.setupMaster({ args: ['--webpack', ...process.argv.slice(2)] });
    const webpackCompiler = cluster.fork({ NODE_ENV: 'test' });

    webpackCompiler.on('message', (message: unknown) => {
      if (!isWebpackMessage(message)) return;

      Object.values(cluster.workers)
        .filter((worker) => worker != webpackCompiler)
        .forEach((worker) => worker?.send(message));
      switch (message.type) {
        case 'success':
          return resolve(message.payload.filePath);
        case 'fail':
          return reject();
        case 'rebuild succeeded':
        case 'rebuild failed':
          return emitWebpackMessage(message);
      }
    });
  });
}
