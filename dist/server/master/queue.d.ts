import { Worker } from '../../types.js';
type MaybeWorker = Worker | {
    error: string;
};
export declare class WorkerQueue {
    private useQueue;
    private isProcessing;
    private queue;
    constructor(useQueue: boolean);
    forkWorker(browser: string, storybookUrl: string, gridUrl?: string, retry?: number): Promise<MaybeWorker>;
    private process;
}
export {};
