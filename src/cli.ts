#!/usr/bin/env node

import minimist from 'minimist';
import chalk from 'chalk';
import creevey from './server';
import { Options } from './types';
import { registerRequireContext } from './utils';

registerRequireContext();

process.on('unhandledRejection', reason => {
  if (process.send) {
    const error = reason instanceof Error ? reason.stack || reason.message : reason;
    console.log(chalk`[{red FAIL}{grey :${process.pid}}]`, error);
    process.send(JSON.stringify({ type: 'error', payload: { status: 'failed', error } }));
  }

  process.exit(-1);
});

const argv = minimist<Options>(process.argv.slice(2), {
  string: ['config', 'browser', 'reporter', 'gridUrl', 'reportDir', 'screenDir'],
  boolean: ['ui', 'update'],
  default: { config: './creevey.config', ui: false, port: 3000 },
  alias: { port: 'p', config: 'c' },
});

creevey(argv);
