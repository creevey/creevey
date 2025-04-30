import { Request, Response } from 'hyper-express';

export function pingHandler(_request: Request, response: Response): void {
  response.send('pong');
}
