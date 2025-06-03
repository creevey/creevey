import { Config, ImagesError } from '../../types.js';
import { getOdiffAssert, getPixelmatchAssert, ImageContext } from '../compare.js';

function toBuffer(bufferOrBase64: Buffer | string) {
  return typeof bufferOrBase64 === 'string' ? Buffer.from(bufferOrBase64, 'base64') : bufferOrBase64;
}

export async function getMatchers(ctx: ImageContext, config: Config) {
  // TODO Replace with `import from`
  const { default: pixelmatch } = await import('pixelmatch');

  const assertImage = getPixelmatchAssert(pixelmatch, ctx, config);

  return {
    matchImage: async (image: Buffer | string, imageName?: string) => {
      const errorMessage = await assertImage(toBuffer(image), imageName);
      if (errorMessage) {
        throw createImageError(imageName ? { [imageName]: errorMessage } : errorMessage);
      }
    },
    matchImages: async (images: Record<string, Buffer | string>) => {
      const errors: Record<string, string> = {};
      await Promise.all(
        Object.entries(images).map(async ([imageName, image]) => {
          const errorMessage = await assertImage(toBuffer(image), imageName);
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

export async function getOdiffMatchers(ctx: ImageContext, config: Config) {
  const { compare } = await import('odiff-bin');

  const assertImage = getOdiffAssert(compare, ctx, config);

  return {
    matchImage: async (image: Buffer | string, imageName?: string) => {
      const errorMessage = await assertImage(toBuffer(image), imageName);
      if (errorMessage) {
        throw createImageError(imageName ? { [imageName]: errorMessage } : errorMessage);
      }
    },
    matchImages: async (images: Record<string, Buffer | string>) => {
      const errors: Record<string, string> = {};
      await Promise.all(
        Object.entries(images).map(async ([imageName, image]) => {
          const errorMessage = await assertImage(toBuffer(image), imageName);
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
