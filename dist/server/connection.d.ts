import type { Config } from '../types';
import type { Options } from '../schema.js';
export declare function getStorybookUrl({ storybookUrl }: Config, { storybookStart }: Options): [string, string | undefined];
export declare function checkIsStorybookConnected(url: string): Promise<boolean>;
