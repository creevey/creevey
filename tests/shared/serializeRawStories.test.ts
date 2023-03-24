import { expect } from 'chai';
import { CreeveyStoryParams, StoriesRaw } from '../../src/types';
import { serializeRawStories, deserializeRawStories } from '../../src/shared';

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
        name: 'story',
        kind: 'test',
        parameters: {
          fileName: '',
          options: {},
          creevey: creeveyParams,
        },
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
