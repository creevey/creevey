import { Data, WebSocket, WebSocketServer } from 'ws';
import type { TestsManager } from './testsManager.js';
import type Runner from './runner.js';
export declare class CreeveyApi {
    private runner;
    private testsManager;
    private wss;
    constructor(testsManager: TestsManager, runner?: Runner);
    subscribe(wss: WebSocketServer): void;
    handleMessage(ws: WebSocket, message: Data): void;
    private broadcastUpdate;
}
