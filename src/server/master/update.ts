import fs, { Dirent } from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { Config, isDefined } from '../../types';

const actualRegex = /^(.*)-actual-(\d+)\.png$/i;

function approve(dirents: Dirent[], srcPath: string, dstPath: string): void {
  dirents
    .filter(dirent => dirent.isFile())
    .map(dirent => actualRegex.exec(dirent.name))
    .filter(isDefined)
    .reduce(
      (images, [, imageName, retry]) =>
        Number(retry) > (images.get(imageName) ?? -1) ? images.set(imageName, Number(retry)) : images,
      new Map<string, number>(),
    )
    .forEach((retry, imageName) => {
      mkdirp.sync(dstPath);
      fs.copyFileSync(path.join(srcPath, `${imageName}-actual-${retry}.png`), path.join(dstPath, `${imageName}.png`));
    });
}

function traverse(srcPath: string, dstPath: string): void {
  const dirents = fs.readdirSync(srcPath, { withFileTypes: true });
  approve(dirents, srcPath, dstPath);
  dirents
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .forEach(dirname => traverse(path.join(srcPath, dirname), path.join(dstPath, dirname)));
}

export default function update(config: Config): void {
  const { reportDir, screenDir } = config;

  fs.readdirSync(reportDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .forEach(dirname => traverse(path.join(reportDir, dirname), path.join(screenDir, dirname)));
}
