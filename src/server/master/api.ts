import WebSocket from 'ws';
import Runner from './runner.js';
import { Request, Response, CreeveyUpdate } from '../../types.js';
import { logger } from '../logger.js';

export interface CreeveyApi {
  subscribe: (wss: WebSocket.Server) => void;
  handleMessage: (ws: WebSocket, message: WebSocket.Data) => void;
}

function broadcast(wss: WebSocket.Server, message: Response): void {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

export default function creeveyApi(runner: Runner): CreeveyApi {
  return {
    subscribe(wss: WebSocket.Server) {
      runner.on('update', (payload: CreeveyUpdate) => {
        broadcast(wss, { type: 'update', payload });
      });
    },

    handleMessage(ws: WebSocket, message: WebSocket.Data) {
      if (typeof message != 'string') {
        logger.info('unhandled message', message);
        return;
      }

      const command = JSON.parse(message) as Request;

      switch (command.type) {
        case 'status': {
          ws.send(JSON.stringify({ type: 'status', payload: runner.status }));
          return;
        }
        case 'start': {
          runner.start(command.payload);
          return;
        }
        case 'stop': {
          runner.stop();
          return;
        }
        case 'approve': {
          void runner.approve(command.payload);
          return;
        }
        case 'approveAll': {
          void runner.approveAll();
          return;
        }
      }
    },
  };
}
