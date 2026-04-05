import { Config } from '../types.js';
/**
 * UI Update Mode implementation.
 * This mode allows users to review and approve screenshots from the browser interface.
 * It combines the functionality of both --ui and --update flags.
 *
 * @param config Creevey configuration
 * @param port Port to run the server on
 */
export declare function report(config: Config, reportDir: string, port: number): Promise<void>;
