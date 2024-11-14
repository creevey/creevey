import Logger from 'loglevel';
export default function (
  matchImage: (image: Buffer, imageName?: string) => Promise<void>,
  matchImages: (images: Record<string, Buffer>) => Promise<void>,
  logger: Logger.Logger,
) {
  let isWarningShown = false;
  return function chaiImage({ Assertion }: Chai.ChaiStatic, utils: Chai.ChaiUtils): void {
    utils.addMethod(
      Assertion.prototype,
      'matchImage',
      async function (this: Record<string, unknown>, imageName?: string) {
        if (!isWarningShown) {
          logger.warn(
            '`expect(...).to.matchImage()` is deprecated and will be removed in the next major release. Please use `context.matchImage()` instead.',
          );
          isWarningShown = true;
        }
        const image = utils.flag(this, 'object') as Buffer;
        await matchImage(image, imageName);
      },
    );

    utils.addMethod(Assertion.prototype, 'matchImages', async function (this: Record<string, unknown>) {
      if (!isWarningShown) {
        logger.warn(
          '`expect(...).to.matchImages()` is deprecated and will be removed in the next major release. Please use `context.matchImages()` instead.',
        );
        isWarningShown = true;
      }
      const images = utils.flag(this, 'object') as Record<string, Buffer>;
      await matchImages(images);
    });
  };
}
