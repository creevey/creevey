import { Config, Options } from '../types';
import { subscribeOn } from './messages';
import { loadTestsFromStories, saveStoriesJson, saveTestsJson } from './stories';

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

  const tests = await loadTestsFromStories(Object.keys(config.browsers), async (listener) => {
    const stories = await config.storiesProvider(config, { watch: false, debug: options.debug }, listener);
    if (options.extract) saveStoriesJson(stories, options.extract);
    return stories;
  });

  if (options.tests) saveTestsJson(tests);

  // eslint-disable-next-line no-process-exit
  process.exit(0);
}
