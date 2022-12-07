import WebSocket from 'ws';
import Runner from './runner';
import { Request, Response, CreeveyUpdate } from '../../types';
import { logger } from '../logger';

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
      runner.on('update', (payload: CreeveyUpdate) => broadcast(wss, { type: 'update', payload }));
    },

    handleMessage(ws: WebSocket, message: WebSocket.Data) {
      if (typeof message === 'object') {
        message = message.toString();
      }

      if (typeof message != 'string') {
        logger.info('unhandled message');
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
      }
    },
  };
}
