import cluster from 'cluster';
import { isWebpackMessage } from '../../../types.js';
import { emitWebpackMessage } from '../../messages.js';

export function startWebpackCompiler(): Promise<void> {
  return new Promise((resolve, reject) => {
    cluster.setupMaster({ args: ['--webpack', ...process.argv.slice(2)] });
    const webpackCompiler = cluster.fork();

    webpackCompiler.on('message', (message: unknown) => {
      if (!isWebpackMessage(message)) return;

      Object.values(cluster.workers ?? {})
        .filter((worker) => worker != webpackCompiler)
        .forEach((worker) => worker?.send(message));
      switch (message.type) {
        case 'success':
          return resolve();
        case 'fail':
          return reject();
        case 'rebuild succeeded':
        case 'rebuild failed':
          return emitWebpackMessage(message);
      }
    });
  });
}
