import Runner from './runner.js';
import { Request, Response, CreeveyUpdate } from '../../types.js';
import { logger } from '../logger.js';
import { TestsManager } from './testsManager.js';
import HyperExpress from 'hyper-express';

interface CustomWSServer {
  clients: Set<HyperExpress.Websocket>;
  publish: (message: string) => void;
}

// Helper function for HyperExpress WebSocket broadcasting
function broadcastHyperExpress(wss: CustomWSServer, message: Response): void {
  const serializedMessage = JSON.stringify(message);
  wss.publish(serializedMessage);
}

// The class-based implementation of CreeveyApi
export class CreeveyApi {
  private runner: Runner | null = null;
  private testsManager: TestsManager;
  private wss: CustomWSServer | null = null;

  constructor(testsManager: TestsManager, runner?: Runner) {
    this.testsManager = testsManager;

    // Use the provided runner in normal mode, or keep as null in update mode
    if (runner) {
      this.runner = runner;
    }
  }

  subscribe(wss: CustomWSServer): void {
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

  handleMessage(ws: HyperExpress.Websocket, message: string | Buffer): void {
    if (typeof message != 'string') {
      if (Buffer.isBuffer(message)) {
        message = message.toString('utf-8');
      } else {
        logger().info('unhandled message', message);
        return;
      }
    }

    const command = JSON.parse(message) as Request;
    const sendResponse = (response: Response) => {
      ws.send(JSON.stringify(response));
    };

    if (this.runner) {
      // Normal mode handling with runner
      switch (command.type) {
        case 'status': {
          sendResponse({ type: 'status', payload: this.runner.status });
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
          sendResponse({
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

    broadcastHyperExpress(this.wss, message);
  }
}
