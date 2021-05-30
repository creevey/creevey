import path from 'path';
import fs, { Dirent, mkdirSync } from 'fs';
import micromatch from 'micromatch';
import { Config, isDefined, ServerTest } from '../types';

function tryToLoadTestsMeta(reportDir: string): Partial<{ [id: string]: ServerTest }> | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(`${reportDir}/tests.json`) as Partial<{ [id: string]: ServerTest }>;
  } catch (_) {
    /* noop */
  }
}
const actualRegex = /^(.*)-actual-(\d+)\.png$/i;

function approve(
  dirents: Dirent[],
  srcPath: string,
  dstPath: string,
  testPaths: string[][] | null,
  isMatch: (value: string) => boolean,
): void {
  dirents
    .filter((dirent) => dirent.isFile())
    .map((dirent) => actualRegex.exec(dirent.name))
    .filter(isDefined)
    .filter(
      ([fileName, imageName]) =>
        testPaths?.find(([token]) => token == imageName) && isMatch(path.join(srcPath, fileName)),
    )
    .reduce(
      (images, [, imageName, retry]) =>
        Number(retry) > (images.get(imageName) ?? -1) ? images.set(imageName, Number(retry)) : images,
      new Map<string, number>(),
    )
    .forEach((retry, imageName) => {
      mkdirSync(dstPath, { recursive: true });
      fs.copyFileSync(path.join(srcPath, `${imageName}-actual-${retry}.png`), path.join(dstPath, `${imageName}.png`));
    });
}

function traverse(
  srcPath: string,
  dstPath: string,
  testPaths: string[][] | null,
  isMatch: (value: string) => boolean,
): void {
  const dirents = fs.readdirSync(srcPath, { withFileTypes: true });
  approve(dirents, srcPath, dstPath, testPaths, isMatch);
  dirents
    .filter((dirent) => dirent.isDirectory())
    .map(
      (dirent) =>
        [
          dirent.name,
          testPaths?.map(([token, ...restPath]) => (token == dirent.name ? restPath : null)).filter(isDefined),
        ] as [string, string[][] | null],
    )
    .filter(([, paths]) => !paths || paths.length > 0)
    .forEach(([dirname, paths]) => traverse(path.join(srcPath, dirname), path.join(dstPath, dirname), paths, isMatch));
}

export default function update(config: Config, grepPattern?: string): void {
  const { reportDir, screenDir } = config;
  const isMatch = grepPattern ? micromatch.matcher(grepPattern, { contains: true }) : () => true;

  const tests = tryToLoadTestsMeta(reportDir);
  let testPaths: string[][] | null = null;

  if (tests) {
    testPaths = Object.values(tests)
      .filter(isDefined)
      .map(({ storyPath, testName, browser }) => [...storyPath, ...(testName ? [testName] : []), browser]);
  }

  traverse(reportDir, screenDir, testPaths, (value: string) => isMatch(path.relative(reportDir, value)));
}
