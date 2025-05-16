import { Request, Response } from 'hyper-express';
import path from 'path';
import fs from 'fs';
import { logger } from '../../logger.js';

export function createStaticFileHandler(baseDir: string, pathPrefix?: string) {
  return (request: Request, response: Response): void => {
    try {
      const decodedPath = decodeURIComponent(request.path);
      const relativePath = pathPrefix ? decodedPath.replace(pathPrefix, '') : decodedPath;
      let filePath = path.join(baseDir, relativePath || 'index.html');

      // If the path points to a directory, append index.html
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

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
