import { Config } from '../types.js';
import { Options, WorkerOptions } from '../schema.js';
export declare const defaultBrowser = "chrome";
export declare const defaultConfig: Omit<Config, 'gridUrl' | 'tsConfig' | 'webdriver'>;
export declare function readConfig(options: Options | WorkerOptions): Promise<Config>;
