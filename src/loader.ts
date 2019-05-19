import path from "path";
import { readdir } from "fs";
import { promisify } from "util";

const readdirAsync = promisify(readdir);

export class Loader {
  private testRegex: RegExp;
  constructor(
    { preprocessors, testRegex }: { preprocessors: string[]; testRegex: string },
    private loadCallback: (filePath: string) => void
  ) {
    preprocessors.forEach(require);

    this.testRegex = new RegExp(testRegex);
  }
  public async loadTests(directory: string) {
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
