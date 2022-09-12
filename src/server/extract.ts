import { denormalizeStoryParameters } from '../shared.js';
import { Config, Options } from '../types.js';
import { subscribeOn } from './messages.js';
import { loadTestsFromStories, saveStoriesJson, saveTestsJson } from './stories.js';
import { isStorybookVersionGreaterThan, isStorybookVersionLessThan } from './storybook/helpers.js';
import { extractStoriesData } from './storybook/providers/nodejs.js';

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
      void (async () => (await import('./loaders/webpack/compile.js')).default(config, options))();
    });
  }

  const tests = await loadTestsFromStories(Object.keys(config.browsers), async () => {
    const data = await extractStoriesData(config, { watch: false, debug: options.debug });
    const stories =
      isStorybookVersionLessThan(6) || isStorybookVersionGreaterThan(6, 3)
        ? data.stories
        : denormalizeStoryParameters(data);

    if (options.extract) saveStoriesJson(data, options.extract);

    return stories;
  });

  if (options.tests) saveTestsJson(tests);

  // eslint-disable-next-line no-process-exit
  process.exit(0);
}
