import fs, { Dirent } from "fs";
import path from "path";
import mkdirp from "mkdirp";
import { Config, isDefined } from "../../types";

const actualRegex = /^(.*)-actual-(\d+)\.png$/i;

function approve(dirents: Dirent[], srcPath: string, dstPath: string) {
  const [lastIamge] = dirents
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name.match(actualRegex))
    .filter(isDefined)
    .map(([fileName, imageName, retry]) => [retry, fileName, imageName])
    .sort(([a], [b]) => Number(b) - Number(a));

  if (!lastIamge) return;

  const [, fileName, imageName] = lastIamge;

  mkdirp.sync(dstPath);
  fs.copyFileSync(path.join(srcPath, fileName), path.join(dstPath, `${imageName}.png`));
}

function traverse(srcPath: string, dstPath: string) {
  const dirents = fs.readdirSync(srcPath, { withFileTypes: true });
  approve(dirents, srcPath, dstPath);
  dirents
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .forEach(dirname => traverse(path.join(srcPath, dirname), path.join(dstPath, dirname)));
}

export default function update(config: Config) {
  const { reportDir, screenDir } = config;

  fs.readdirSync(reportDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .forEach(dirname => traverse(path.join(reportDir, dirname), path.join(screenDir, dirname)));
}
