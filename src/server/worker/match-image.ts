import path from 'path';
import { Stats } from 'fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises';
import { compare } from 'odiff-bin';
import { PNG } from 'pngjs';
import { Config, DiffOptions, Images, ImagesError } from '../../types.js';
import assert from 'assert';

export interface ImageContext {
  attachments: string[];
  testFullPath: string[];
  images: Partial<Record<string, Images>>;
}

interface ImagePaths {
  imageName: string;
  actualImageName: string;
  expectImageName: string;
  diffImageName: string;
  expectImageDir: string;
  reportImageDir: string;
}

async function getStat(filePath: string): Promise<Stats | null> {
  try {
    return await stat(filePath);
  } catch (error) {
    if (typeof error == 'object' && error && (error as { code?: unknown }).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function getLastImageNumber(imageDir: string, imageName: string): Promise<number> {
  const actualImagesRegexp = new RegExp(`${imageName}-actual-(\\d+)\\.png`);

  try {
    return (
      (await readdir(imageDir))
        .map((filename) => filename.replace(actualImagesRegexp, '$1'))
        .map(Number)
        .filter((x) => !isNaN(x))
        .sort((a, b) => b - a)[0] ?? 0
    );
  } catch (_error) {
    return 0;
  }
}

async function readExpected(expectImageDir: string, imageName: string): Promise<Buffer> {
  const expected = await readFile(path.join(expectImageDir, `${imageName}.png`));

  return expected;
}

async function saveImages(imageDir: string, images: { name: string; data: Buffer }[]): Promise<string[]> {
  const files: string[] = [];
  await mkdir(imageDir, { recursive: true });
  for (const { name, data } of images) {
    const filePath = path.join(imageDir, name);
    await writeFile(filePath, data);
    files.push(filePath);
  }
  return files;
}

async function getImagePaths(config: Config, testFullPath: string[], assertImageName?: string): Promise<ImagePaths> {
  const testPath = [...testFullPath];
  const imageName = assertImageName ?? testPath.pop();

  assert(typeof imageName === 'string', `Can't get image name from empty test scope`);

  const expectImageDir = path.join(config.screenDir, ...testPath);
  const reportImageDir = path.join(config.reportDir, ...testPath);
  const imageNumber = (await getLastImageNumber(reportImageDir, imageName)) + 1;
  const actualImageName = `${imageName}-actual-${imageNumber}.png`;
  const expectImageName = `${imageName}-expect-${imageNumber}.png`;
  const diffImageName = `${imageName}-diff-${imageNumber}.png`;

  return { imageName, actualImageName, expectImageName, diffImageName, expectImageDir, reportImageDir };
}

async function getExpected(
  ctx: ImageContext,
  { imageName, actualImageName, expectImageName, diffImageName, expectImageDir, reportImageDir }: ImagePaths,
): Promise<{
  expected: Buffer | null;
  onCompare: (actual: Buffer, expect?: Buffer, diff?: Buffer) => Promise<void>;
}> {
  const onCompare = async (actual: Buffer, expect?: Buffer, diff?: Buffer): Promise<void> => {
    const imagesMeta: { name: string; data: Buffer }[] = [];
    const image = (ctx.images[imageName] = ctx.images[imageName] ?? { actual: actualImageName });

    imagesMeta.push({ name: image.actual, data: actual });

    if (diff && expect) {
      image.expect = expectImageName;
      image.diff = diffImageName;
      imagesMeta.push({ name: image.expect, data: expect });
      imagesMeta.push({ name: image.diff, data: diff });
    }
    ctx.attachments = await saveImages(reportImageDir, imagesMeta);
  };

  const expectImageStat = await getStat(path.join(expectImageDir, `${imageName}.png`));
  if (!expectImageStat) return { expected: null, onCompare };

  const expected = await readExpected(expectImageDir, imageName);

  return { expected, onCompare };
}

async function getOdiffExpected(
  ctx: ImageContext,
  imageOrBase64: string | Buffer,
  { imageName, actualImageName, expectImageName, diffImageName, expectImageDir, reportImageDir }: ImagePaths,
): Promise<{ actual: string; expect: string; diff: string }> {
  const expected = await readExpected(expectImageDir, imageName);

  const image = (ctx.images[imageName] = ctx.images[imageName] ?? { actual: actualImageName });
  image.expect = expectImageName;
  image.diff = diffImageName;

  const actual = typeof imageOrBase64 == 'string' ? Buffer.from(imageOrBase64, 'base64') : imageOrBase64;
  const imagesMeta = [
    { name: image.actual, data: actual },
    { name: expectImageName, data: expected },
  ];

  ctx.attachments = await saveImages(reportImageDir, imagesMeta);

  return {
    actual: path.join(reportImageDir, actualImageName),
    expect: path.join(reportImageDir, expectImageName),
    diff: path.join(reportImageDir, diffImageName),
  };
}

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

export async function getMatchers(ctx: ImageContext, config: Config) {
  // TODO Replace with `import from`
  const { default: pixelmatch } = await import('pixelmatch');

  async function assertImage(actual: Buffer, imageName?: string): Promise<string | undefined> {
    const { expected, onCompare } = await getExpected(ctx, await getImagePaths(config, ctx.testFullPath, imageName));

    if (expected == null) {
      await onCompare(actual);
      return imageName ? `Expected image '${imageName}' does not exists` : 'Expected image does not exists';
    }

    if (actual.equals(expected)) {
      await onCompare(actual);
      return;
    }

    const { isEqual, diff } = compareImages(expected, actual, pixelmatch, config.diffOptions);

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
        Object.entries(images).map(async ([imageName, imageOrBase64]) => {
          const errorMessage = await assertImage(
            typeof imageOrBase64 == 'string' ? Buffer.from(imageOrBase64, 'base64') : imageOrBase64,
            imageName,
          );
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

export function getOdiffMatchers(ctx: ImageContext, config: Config) {
  const diffOptions = {
    ...config.odiffOptions,
    noFailOnFsErrors: true,
  };

  async function assertImage(image: string | Buffer, imageName?: string): Promise<string | undefined> {
    const { actual, expect, diff } = await getOdiffExpected(
      ctx,
      image,
      await getImagePaths(config, ctx.testFullPath, imageName),
    );
    const result = await compare(actual, expect, diff, diffOptions);
    if (!result.match) {
      if (result.reason == 'file-not-exists') {
        return imageName ? `Expected image '${imageName}' does not exists` : 'Expected image does not exists';
      }
      return imageName ? `Expected image '${imageName}' to match` : 'Expected image to match';
    }
  }

  return {
    matchImage: async (image: string | Buffer, imageName?: string) => {
      const errorMessage = await assertImage(image, imageName);
      if (errorMessage) {
        throw createImageError(imageName ? { [imageName]: errorMessage } : errorMessage);
      }
    },
    matchImages: async (images: Record<string, string | Buffer>) => {
      const errors: Record<string, string> = {};
      await Promise.all(
        Object.entries(images).map(async ([imageName, image]) => {
          const errorMessage = await assertImage(image, imageName);
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
