import { Config } from '../../types.js';
import Runner from './runner.js';
export default function master(config: Config, gridUrl?: string): Promise<Runner>;
