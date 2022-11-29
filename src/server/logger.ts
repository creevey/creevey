import chalk from 'chalk';
import { default as Logger } from 'loglevel';
import prefix from 'loglevel-plugin-prefix';

export { getLogger } from 'loglevel';

export const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};

prefix.reg(Logger);
prefix.apply(Logger, {
  format(level, name = 'Creevey') {
    const levelColor = colors[level.toUpperCase() as keyof typeof colors];
    return `[${name}:${chalk.gray(process.pid)}] ${levelColor(level)} =>`;
  },
});

export const logger = Logger.getLogger('Creevey');
