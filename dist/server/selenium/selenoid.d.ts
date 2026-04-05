import { Config } from '../../types.js';
export declare function startSelenoidStandalone(config: Config, debug: boolean): Promise<void>;
export declare function startSelenoidContainer(config: Config, debug: boolean): Promise<string>;
