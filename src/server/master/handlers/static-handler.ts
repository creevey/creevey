import path from 'path';
import fs from 'fs';

export function staticHandler(baseDir: string, pathPrefix?: string) {
  return (requestedPath: string): string | undefined => {
    const relativePath = pathPrefix ? requestedPath.replace(pathPrefix, '') : requestedPath;
    let filePath = path.join(baseDir, relativePath || 'index.html');

    // If the path points to a directory, append index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    return fs.existsSync(filePath) ? filePath : undefined;
  };
}
