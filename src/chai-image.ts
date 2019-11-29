import { promisify } from 'util';
import fs, { Stats } from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import mkdirp from 'mkdirp';

import { Config, Images } from './types';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirpAsync = promisify(mkdirp);

async function getStat(filePath: string): Promise<Stats | null> {
  try {
    return await statAsync(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function getLastImageNumber(imageDir: string, imageName: string): Promise<number> {
  const actualImagesRegexp = new RegExp(`${imageName}-actual-(\\d+)\\.png`);

  try {
    return (
      (await readdirAsync(imageDir))
        .map(filename => filename.replace(actualImagesRegexp, '$1'))
        .map(Number)
        .filter(x => !isNaN(x))
        .sort((a, b) => b - a)[0] ?? 0
    );
  } catch (_error) {
    return 0;
  }
}

function normalizeImageSize(image: PNG, width: number, height: number): Buffer {
  const normalizedImage = new Buffer(4 * width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (x < image.width && y < image.height) {
        const j = (y * image.width + x) * 4;
        normalizedImage[i + 0] = image.data[j + 0];
        normalizedImage[i + 1] = image.data[j + 1];
        normalizedImage[i + 2] = image.data[j + 2];
        normalizedImage[i + 3] = image.data[j + 3];
      } else {
        normalizedImage[i + 0] = 0;
        normalizedImage[i + 1] = 0;
        normalizedImage[i + 2] = 0;
        normalizedImage[i + 3] = 0;
      }
    }
  }
  return normalizedImage;
}

function hasDiffPixels(diff: Buffer): boolean {
  for (let i = 0; i < diff.length; i += 4) {
    if (diff[i + 0] == 255 && diff[i + 1] == 0 && diff[i + 2] == 0 && diff[i + 3] == 255) return true;
  }
  return false;
}

function compareImages(expect: Buffer, actual: Buffer, threshold: number): { isEqual: boolean; diff: Buffer } {
  const expectImage = PNG.sync.read(expect);
  const actualImage = PNG.sync.read(actual);

  const width = Math.max(actualImage.width, expectImage.width);
  const height = Math.max(actualImage.height, expectImage.height);

  const diffImage = new PNG({ width, height });

  let actualImageData = actualImage.data;
  if (actualImage.width < width || actualImage.height < height) {
    actualImageData = normalizeImageSize(actualImage, width, height);
  }

  let expectImageData = expectImage.data;
  if (expectImage.width < width || expectImage.height < height) {
    expectImageData = normalizeImageSize(expectImage, width, height);
  }

  pixelmatch(expectImageData, actualImageData, diffImage.data, width, height, { threshold, includeAA: true });

  return {
    isEqual: !hasDiffPixels(diffImage.data),
    diff: PNG.sync.write(diffImage),
  };
}

// NOTE Chai don't have right types, see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/29922
export default (
  config: Config,
  context: string[],
  onSaveImage: (imageName: string, imageNumber: number, type: keyof Images) => void = () => {},
) =>
  function chaiImage({ Assertion }: Chai.ChaiStatic, utils: Chai.ChaiUtils) {
    utils.addMethod(Assertion.prototype, 'matchImage', async function matchImage(this: object, imageName?: string) {
      const actualBase64: string = utils.flag(this, 'object');
      const actual = Buffer.from(actualBase64, 'base64');

      // context => [kind, story, test, browser]
      // rootSuite -> kindSuite -> storyTest -> [browsers.png]
      // rootSuite -> kindSuite -> storySuite -> test -> [browsers.png]
      if (!imageName) imageName = context.pop() as string;

      const reportImageDir = path.join(config.reportDir, ...context);
      const imageNumber = (await getLastImageNumber(reportImageDir, imageName)) + 1;

      await mkdirpAsync(reportImageDir);
      await writeFileAsync(path.join(reportImageDir, `${imageName}-actual-${imageNumber}.png`), actual);
      onSaveImage(imageName, imageNumber, 'actual');

      const expectImageDir = path.join(config.screenDir, ...context);
      const expectImageStat = await getStat(path.join(expectImageDir, `${imageName}.png`));

      if (!expectImageStat) {
        throw new Error(`Expected image '${imageName}' does not exists`);
      }

      const expect = await readFileAsync(path.join(expectImageDir, `${imageName}.png`));

      const equalBySize = expect.length === actual.length;

      if (equalBySize && actual.equals(expect)) {
        return;
      }

      const { isEqual, diff } = compareImages(expect, actual, config.threshold);

      if (isEqual) {
        return;
      }

      await writeFileAsync(path.join(reportImageDir, `${imageName}-expect-${imageNumber}.png`), expect);
      onSaveImage(imageName, imageNumber, 'expect');
      await writeFileAsync(path.join(reportImageDir, `${imageName}-diff-${imageNumber}.png`), diff);
      onSaveImage(imageName, imageNumber, 'diff');

      // NOTE В случае, если имеющие одинаковый размер картинки не будут отличаться по содержимому, то код можно упростить
      throw new Error(`Expected image '${imageName}' to match ${equalBySize ? 'but was equal by size' : ''}`);
    });

    utils.addMethod(Assertion.prototype, 'matchImages', function matchImages() {
      // images object
      throw new Error('Not Implemented');
    });
  };
