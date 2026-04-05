import { WorkerOptions, Options } from '../schema.js';
export default function (command: 'report' | 'test' | 'worker', options: Options | WorkerOptions): Promise<void>;
