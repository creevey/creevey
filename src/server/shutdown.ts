import cluster from 'cluster';
import { subscribeOn } from './messages.js';
import { shutdownOnException, isShuttingDown } from './utils.js';

if (cluster.isWorker) {
  subscribeOn('shutdown', () => {
    isShuttingDown.current = true;
  });
}

process.on('uncaughtException', shutdownOnException);
process.on('unhandledRejection', shutdownOnException);
// TODO SIGINT Stuck with selenium
process.on('SIGINT', () => {
  if (isShuttingDown.current) {
    process.exit(-1);
  }
  isShuttingDown.current = true;
});
