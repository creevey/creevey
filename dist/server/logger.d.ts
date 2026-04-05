import chalk from 'chalk';
import Logger from 'loglevel';
export declare const colors: {
    TRACE: chalk.Chalk;
    DEBUG: chalk.Chalk;
    INFO: chalk.Chalk;
    WARN: chalk.Chalk;
    ERROR: chalk.Chalk;
};
export declare const setRootName: (newName: string) => string;
export declare const logger: () => Logger.Logger;
