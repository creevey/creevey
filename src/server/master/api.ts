import { Data, WebSocket, WebSocketServer } from 'ws';
import type { Request, Response, CreeveyUpdate } from '../../types.js';
import type { TestsManager } from './testsManager.js';
import type Runner from './runner.js';
import { logger } from '../logger.js';

function broadcast(wss: WebSocketServer, message: Response): void {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function send(ws: WebSocket, message: Response): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// The class-based implementation of CreeveyApi for native WebSockets
export class CreeveyApi {
  private runner: Runner | null = null;
  private testsManager: TestsManager;
  private wss: WebSocketServer | null = null;

  constructor(testsManager: TestsManager, runner?: Runner) {
    this.testsManager = testsManager;

    // Use the provided runner in normal mode, or keep as null in update mode
    if (runner) {
      this.runner = runner;
    }
  }

  subscribe(wss: WebSocketServer): void {
    this.wss = wss;

    // If we have a runner, subscribe to its updates
    if (this.runner) {
      this.runner.on('update', (payload: CreeveyUpdate) => {
        this.broadcastUpdate(payload);
      });
    } else {
      // Subscribe to TestsManager updates
      this.testsManager.on('update', (update: CreeveyUpdate) => {
        this.broadcastUpdate(update);
      });
    }
  }

  handleMessage(ws: WebSocket, message: Data): void {
    if (typeof message != 'string') {
      logger().info('unhandled message', message);
      return;
    }

    const command = JSON.parse(message) as Request;

    if (this.runner) {
      // Normal mode handling with runner
      switch (command.type) {
        case 'status': {
          const status = this.runner.status;
          send(ws, { type: 'status', payload: status });
          return;
        }
        case 'start': {
          this.runner.start(command.payload);
          return;
        }
        case 'stop': {
          this.runner.stop();
          return;
        }
        case 'approve': {
          void this.runner.approve(command.payload);
          return;
        }
        case 'approveAll': {
          void this.runner.approveAll();
          return;
        }
      }
    } else {
      // In update mode, only approve and approveAll commands are allowed
      switch (command.type) {
        case 'approve': {
          void this.testsManager.approve(command.payload);
          return;
        }
        case 'approveAll': {
          void this.testsManager.approveAll();
          return;
        }
        case 'status': {
          // In update mode, respond with static status including tests data
          send(ws, {
            type: 'status',
            payload: {
              isRunning: false,
              tests: this.testsManager.getTestsData(),
              browsers: [],
              isUpdateMode: true,
            },
          });
          return;
        }
        default: {
          // Ignore other commands in update mode
          logger().debug(`Command ${command.type} is not available in update mode`);
          return;
        }
      }
    }
  }

  private broadcastUpdate(payload: CreeveyUpdate): void {
    if (!this.wss) return;

    const message: Response = { type: 'update', payload };

    broadcast(this.wss, message);
  }
}
