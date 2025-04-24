import WebSocket from 'ws';
import Runner from './runner.js';
import { Request, Response, CreeveyUpdate } from '../../types.js';
import { logger } from '../logger.js';
import { TestsManager } from './testsManager.js';

function broadcast(wss: WebSocket.Server, message: Response): void {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// The class-based implementation of CreeveyApi
export class CreeveyApi {
  private runner: Runner | null = null;
  private testsManager: TestsManager;
  private wss: WebSocket.Server | null = null;

  constructor(testsManager: TestsManager, runner?: Runner) {
    this.testsManager = testsManager;

    // Use the provided runner in normal mode, or keep as null in update mode
    if (runner) {
      this.runner = runner;
    }
  }

  subscribe(wss: WebSocket.Server): void {
    this.wss = wss;

    // If we have a runner, subscribe to its updates
    if (this.runner) {
      this.runner.on('update', (payload: CreeveyUpdate) => {
        this.broadcastUpdate(payload);
      });
    }
  }

  handleMessage(ws: WebSocket, message: WebSocket.Data): void {
    if (typeof message != 'string') {
      logger().info('unhandled message', message);
      return;
    }

    const command = JSON.parse(message) as Request;

    if (this.runner) {
      // Normal mode handling with runner
      switch (command.type) {
        case 'status': {
          ws.send(JSON.stringify({ type: 'status', payload: this.runner.status }));
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
          void this.testsManager.approve(command.payload).then((update) => {
            if (update) this.broadcastUpdate(update);
          });
          return;
        }
        case 'approveAll': {
          void this.testsManager.approveAll().then((update) => {
            this.broadcastUpdate(update);
          });
          return;
        }
        case 'status': {
          // In update mode, respond with static status including tests data
          ws.send(
            JSON.stringify({
              type: 'status',
              payload: {
                isRunning: false,
                tests: this.testsManager.getTestsData(),
                browsers: [],
                isUpdateMode: true,
              },
            }),
          );
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

    broadcast(this.wss, { type: 'update', payload });
  }
}
