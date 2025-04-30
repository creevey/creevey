import { Request, Response } from 'hyper-express';
import path from 'path';
import fs from 'fs';
import { logger } from '../../logger.js';

export function createStaticFileHandler(baseDir: string, pathPrefix?: string) {
  return (request: Request, response: Response): void => {
    try {
      const relativePath = pathPrefix ? request.path.replace(pathPrefix, '') : request.path;
      const filePath = path.join(baseDir, relativePath || 'index.html');

      if (!fs.existsSync(filePath)) {
        response.status(404).send('File not found');
        return;
      }

      response.sendFile(filePath);
    } catch (error) {
      logger().error('Error serving file', error);
      response.status(500).send('Internal server error');
    }
  };
}
