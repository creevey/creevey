import { expect } from 'chai';
import { CreeveyStoryParams, StoriesRaw } from '../../src/types.js';
import { serializeRawStories, deserializeRawStories } from '../../src/shared/index.js';

describe('serializes raw stories with creevey params', () => {
  const getStories = (): StoriesRaw => {
    const creeveyParams: CreeveyStoryParams = {
      captureElement: 'body',
      ignoreElements: ['button', '#ignore-me'],
      skip: {
        legacy: { in: 'browser' },
        flacky: { stories: new RegExp('button', 'i'), tests: /click/gi },
      },
    };

    return {
      'test-story': {
        id: 'test-story',
        componentId: 'button',
        title: 'Button Test Story',
        name: 'story',
        story: 'story',
        kind: 'test',
        parameters: {
          fileName: '',
          options: {},
          creevey: creeveyParams,
        },
        tags: [],
        initialArgs: {},
        argTypes: {},
      },
    };
  };

  it('serializes and deserializes without losses', () => {
    const stories = getStories();
    const serialized = serializeRawStories(stories);
    const deserialized = deserializeRawStories(serialized);

    expect(deserialized).to.deep.equal(stories);
  });

  it('serializes, stringifies, parses and deserializes without losses', () => {
    const stories = getStories();
    const serialized = serializeRawStories(stories);
    const stringified = JSON.stringify(serialized);
    const parsed = JSON.parse(stringified) as StoriesRaw;
    const deserialized = deserializeRawStories(parsed);

    expect(deserialized).to.deep.equal(stories);
  });
});
