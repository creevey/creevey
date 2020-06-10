import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

import { DiffOptions } from '../../types';

function normalizeImageSize(image: PNG, width: number, height: number): Buffer {
  const normalizedImage = Buffer.alloc(4 * width * height);

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

function compareImages(expect: Buffer, actual: Buffer, diffOptions: DiffOptions): { isEqual: boolean; diff: Buffer } {
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

  pixelmatch(expectImageData, actualImageData, diffImage.data, width, height, diffOptions);

  return {
    isEqual: !hasDiffPixels(diffImage.data),
    diff: PNG.sync.write(diffImage),
  };
}

export default function (
  getExpected: (
    imageName?: string,
  ) => Promise<
    | { expected: Buffer | null; onCompare: (actual: Buffer, expect?: Buffer, diff?: Buffer) => Promise<void> }
    | Buffer
    | null
  >,
  diffOptions: DiffOptions,
) {
  return function chaiImage({ Assertion }: Chai.ChaiStatic, utils: Chai.ChaiUtils): void {
    async function assertImage(actual: Buffer, imageName?: string): Promise<void> {
      let onCompare: (actual: Buffer, expect?: Buffer, diff?: Buffer) => Promise<void> = () => Promise.resolve();
      let expected = await getExpected(imageName);
      if (!(expected instanceof Buffer) && expected != null) ({ expected, onCompare } = expected);

      if (expected == null) {
        await onCompare(actual);
        throw new Error(imageName ? `Expected image '${imageName}' does not exists` : 'Expected image does not exists');
      }

      if (actual.equals(expected)) return await onCompare(actual);

      const { isEqual, diff } = compareImages(expected, actual, diffOptions);

      if (isEqual) return await onCompare(actual);

      await onCompare(actual, expected, diff);

      // TODO rewrite message
      throw new Error(imageName ? `Expected image '${imageName}' to match` : 'Expected image to match');
    }

    utils.addMethod(Assertion.prototype, 'matchImage', async function matchImage(
      this: Record<string, unknown>,
      imageName?: string,
    ) {
      const actual = utils.flag(this, 'object') as string | Buffer;

      await assertImage(typeof actual == 'string' ? Buffer.from(actual, 'base64') : actual, imageName);
    });

    utils.addMethod(Assertion.prototype, 'matchImages', async function matchImages(this: Record<string, unknown>) {
      await Promise.all(
        Object.entries<string | Buffer>(utils.flag(this, 'object')).map(([imageName, imageOrBase64]) =>
          assertImage(
            typeof imageOrBase64 == 'string' ? Buffer.from(imageOrBase64, 'base64') : imageOrBase64,
            imageName,
          ),
        ),
      );
    });
  };
}
