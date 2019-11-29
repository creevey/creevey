import path from 'path';
import { readdir } from 'fs';
import { promisify } from 'util';

const readdirAsync = promisify(readdir);

export class Loader {
  constructor(private testRegex: RegExp, private loadCallback: (filePath: string) => void) {}
  public async loadTests(directory: string): Promise<void> {
    const dirContent = await readdirAsync(directory, { withFileTypes: true });
    for (const dirent of dirContent) {
      const direntPath = path.join(directory, dirent.name);
      if (dirent.isFile() && this.testRegex.test(direntPath)) {
        this.loadCallback(direntPath);
      } else if (dirent.isDirectory()) {
        await this.loadTests(direntPath);
      }
    }
  }
}
