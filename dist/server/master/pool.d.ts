import { EventEmitter } from 'events';
import { Config } from '../../types.js';
import { WorkerQueue } from './queue.js';
export default class Pool extends EventEmitter {
    scheduler: WorkerQueue;
    private browser;
    private maxRetries;
    private config;
    private workers;
    private queue;
    private forcedStop;
    private failFast;
    private gridUrl?;
    private storybookUrl;
    get isRunning(): boolean;
    constructor(scheduler: WorkerQueue, config: Config, browser: string, gridUrl?: string);
    init(): Promise<void>;
    start(tests: {
        id: string;
        path: string[];
    }[]): boolean;
    stop(): void;
    process(): void;
    private sendStatus;
    private getFreeWorker;
    private get aliveWorkers();
    private get freeWorkers();
    private exitHandler;
    private shouldRetry;
    private handleTestResult;
    private subscribe;
}
