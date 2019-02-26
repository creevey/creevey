import { promisify } from "util";
import fs, { Stats } from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import mkdirp from "mkdirp";

import { Config } from "../types";

const statAsync = promisify(fs.stat);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirpAsync = promisify(mkdirp);

async function getStat(filePath: string): Promise<Stats | null> {
  try {
    return await statAsync(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return Promise.resolve(null);
    }
    throw error;
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

function compareImages(expect: Buffer, actual: Buffer): Buffer {
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

  pixelmatch(expectImageData, actualImageData, diffImage.data, width, height, { threshold: 0 });

  return PNG.sync.write(diffImage);
}

async function saveImages(imageDir: string, imageName: string, expect: Buffer, actual: Buffer, diff: Buffer) {
  const imagePath = path.join(imageDir, `${imageName}`);

  await mkdirpAsync(imageDir);

  return Promise.all([
    writeFileAsync(`${imagePath}-expect.png`, expect),
    writeFileAsync(`${imagePath}-actual.png`, actual),
    writeFileAsync(`${imagePath}-diff.png`, diff)
  ]);
}

// NOTE Chai don't have right types, see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/29922
export default (config: Config, context: string[]) =>
  function chaiImage({ Assertion }: any, utils: Chai.ChaiUtils) {
    utils.addMethod(Assertion.prototype, "matchImage", async function matchImage(imageName: string) {
      const actualBase64: string = utils.flag(this, "object");
      const actual = Buffer.from(actualBase64, "base64");

      // context => [browser, kind, story, test]
      const expectImageDir = path.join(config.screenDir, ...context);
      const expectImageStat = await getStat(path.join(expectImageDir, `${imageName}.png`));

      const reportImageDir = path.join(config.reportDir, ...context);

      if (!expectImageStat) {
        await mkdirpAsync(reportImageDir);
        await writeFileAsync(path.join(reportImageDir, `${imageName}-actual.png`), actual);

        throw new Error(`Expected image '${imageName}' does not exists`);
      }

      const expect = await readFileAsync(path.join(expectImageDir, `${imageName}.png`));

      const equalBySize = expectImageStat.size === actual.length;
      const equalByContent = actual.equals(expect);

      if (equalBySize && equalByContent) {
        return;
      }

      const diff = compareImages(expect, actual);

      await saveImages(reportImageDir, imageName, expect, actual, diff);

      // NOTE В случае, если имеющие одинаковый размер картинки не будут отличаться по содержимому, то код можно упростить
      throw new Error(`Expected image '${imageName}' to match ${equalBySize ? "but was equal by size" : ""}`);
    });
  };
