import cluster from 'cluster';
import { emitStoriesMessage, sendStoriesMessage } from '../../messages.js';
import { isDefined, StoryInput } from '../../../types.js';
import { deserializeStory } from '../../../shared/index.js';

export function storiesHandler({ stories }: { stories: [string, StoryInput[]][] }): void {
  const deserializedStories = stories.map<[string, StoryInput[]]>(([file, stories]) => [
    file,
    stories.map(deserializeStory),
  ]);

  emitStoriesMessage({ type: 'update', payload: deserializedStories });

  Object.values(cluster.workers ?? {})
    .filter(isDefined)
    .filter((worker) => worker.isConnected())
    .forEach((worker) => {
      sendStoriesMessage(worker, { type: 'update', payload: deserializedStories });
    });
}
