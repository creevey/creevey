import { PNG } from 'pngjs';
import { DiffOptions, ImagesError } from '../../types.js';

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

function compareImages(
  expect: Buffer,
  actual: Buffer,
  pixelmatch: typeof import('pixelmatch'),
  diffOptions: DiffOptions,
): { isEqual: boolean; diff: Buffer } {
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

export async function getMatchers(
  getExpected: (imageName?: string) => Promise<{
    expected: Buffer | null;
    onCompare: (actual: Buffer, expect?: Buffer, diff?: Buffer) => Promise<void>;
  }>,
  diffOptions: DiffOptions,
) {
  // TODO Replace with `import from`
  const { default: pixelmatch } = await import('pixelmatch');
  async function assertImage(actual: Buffer, imageName?: string): Promise<string | undefined> {
    const { expected, onCompare } = await getExpected(imageName);

    if (expected == null) {
      await onCompare(actual);
      return imageName ? `Expected image '${imageName}' does not exists` : 'Expected image does not exists';
    }

    if (actual.equals(expected)) {
      await onCompare(actual);
      return;
    }

    const { isEqual, diff } = compareImages(expected, actual, pixelmatch, diffOptions);

    if (isEqual) {
      await onCompare(actual);
      return;
    }

    await onCompare(actual, expected, diff);

    return imageName ? `Expected image '${imageName}' to match` : 'Expected image to match';
  }

  return {
    matchImage: async (image: string | Buffer, imageName?: string) => {
      const errorMessage = await assertImage(
        typeof image == 'string' ? Buffer.from(image, 'base64') : image,
        imageName,
      );
      if (errorMessage) {
        throw createImageError(imageName ? { [imageName]: errorMessage } : errorMessage);
      }
    },
    matchImages: async (images: Record<string, string | Buffer>) => {
      const errors: Record<string, string> = {};
      await Promise.all(
        Object.entries<string | Buffer>(images).map(async ([imageName, imageOrBase64]) => {
          let errorMessage: string | undefined;
          try {
            errorMessage = await assertImage(
              typeof imageOrBase64 == 'string' ? Buffer.from(imageOrBase64, 'base64') : imageOrBase64,
              imageName,
            );
          } catch (error) {
            errorMessage = (error as Error).stack;
          }
          if (errorMessage) {
            errors[imageName] = errorMessage;
          }
        }),
      );
      if (Object.keys(errors).length > 0) {
        throw createImageError(errors);
      }
    },
  };
}

function createImageError(imageErrors: string | Partial<Record<string, string>>): ImagesError {
  const error = new ImagesError('Expected image to match');
  error.images = imageErrors;
  return error;
}
