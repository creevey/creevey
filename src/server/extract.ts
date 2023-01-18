import { Config, Options } from '../types';
import { subscribeOn } from './messages';
import { loadTestsFromStories, saveStoriesJson, saveTestsJson } from './stories';
import { extractStoriesData } from './storybook/providers/nodejs';

export default async function extract(config: Config, options: Options): Promise<void> {
  if (config.useWebpackToExtractTests && process.env.__CREEVEY_ENV__ != 'test') {
    await new Promise<void>((resolve, reject) => {
      subscribeOn('webpack', (message) => {
        switch (message.type) {
          case 'success':
            return resolve();
          case 'fail':
            return reject();
        }
      });
      void (async () => (await import('./loaders/webpack/compile')).default(config, options))();
    });
  }

  const tests = await loadTestsFromStories(Object.keys(config.browsers), async () => {
    const data = await extractStoriesData(config, { watch: false, debug: options.debug });
    const stories = data.stories;

    if (options.extract) saveStoriesJson(data, options.extract);

    return stories;
  });

  if (options.tests) saveTestsJson(tests);

  // eslint-disable-next-line no-process-exit
  process.exit(0);
}
