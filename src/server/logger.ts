import chalk from 'chalk';
import Logger from 'loglevel';
import prefix from 'loglevel-plugin-prefix';

export const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};

let rootName = 'Creevey';

prefix.reg(Logger);
prefix.apply(Logger, {
  format(level, name = rootName) {
    const levelColor = colors[level.toUpperCase() as keyof typeof colors];
    return `[${name}:${chalk.gray(process.pid)}] ${levelColor(level.padEnd(5))} =>`;
  },
});

export const setRootName = (newName: string) => (rootName = newName);

export const logger = () => Logger.getLogger(rootName);
