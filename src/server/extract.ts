import { writeFileSync } from 'fs';
import { Config, Options, isObject } from '../types';
import { subscribeOn } from './messages';
import { loadTestsFromStories, storybookApi } from './stories';
import { removeProps, saveTestJson } from './utils';

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

  const tests = await loadTestsFromStories(config, Object.keys(config.browsers), { debug: options.debug });

  if (options.extract == 'tests') {
    saveTestJson(tests);
  } else {
    const storiesData = storybookApi?.clientApi.store().getStoriesJsonData();
    // TODO Fix args stories
    removeProps(storiesData ?? {}, ['stories', () => true, 'parameters', '__isArgsStory']);
    Object.values(storiesData?.stories ?? {}).forEach(
      (story) =>
        isObject(story) && 'parameters' in story && isObject(story.parameters) && delete story.parameters.__isArgsStory,
    );
    writeFileSync('stories.json', JSON.stringify(storiesData, null, 2));
  }
  // eslint-disable-next-line no-process-exit
  process.exit(0);
}
