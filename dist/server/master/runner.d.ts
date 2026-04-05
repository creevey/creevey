import { EventEmitter } from 'events';
import { Config, CreeveyStatus, ApprovePayload, ServerTest } from '../../types.js';
import type { TestsManager } from './testsManager.js';
export default class Runner extends EventEmitter {
    private failFast;
    private browsers;
    private scheduler;
    private pools;
    private fakeRunner;
    private config;
    testsManager: TestsManager;
    get isRunning(): boolean;
    constructor(config: Config, testsManager: TestsManager, gridUrl?: string);
    private handlePoolMessage;
    private handlePoolStop;
    init(): Promise<void>;
    updateTests(testsDiff: Partial<Record<string, ServerTest>>): void;
    start(ids: string[]): void;
    stop(): void;
    get status(): CreeveyStatus;
    approveAll(): Promise<void>;
    approve(payload: ApprovePayload): Promise<void>;
    private sendUpdate;
}
