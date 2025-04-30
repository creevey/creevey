import { Request, Response } from 'hyper-express';
import cluster from 'cluster';
import { emitStoriesMessage, sendStoriesMessage } from '../../messages.js';
import { isDefined, StoryInput } from '../../../types.js';
import { deserializeStory } from '../../../shared/index.js';

export function createStoriesHandler() {
  let setStoriesCounter = 0;

  // TODO We need this handler for getting stories updates from a browser
  return async (request: Request, response: Response): Promise<void> => {
    const { setStoriesCounter: counter, stories } = await request.json<
      {
        setStoriesCounter: number;
        stories: [string, StoryInput[]][];
      },
      {
        setStoriesCounter: number;
        stories: [string, StoryInput[]][];
      }
    >({
      setStoriesCounter: 0,
      stories: [],
    });

    if (setStoriesCounter >= counter) {
      response.send();
      return;
    }

    const deserializedStories = stories.map<[string, StoryInput[]]>(([file, stories]) => [
      file,
      stories.map(deserializeStory),
    ]);

    setStoriesCounter = counter;
    emitStoriesMessage({ type: 'update', payload: deserializedStories });

    Object.values(cluster.workers ?? {})
      .filter(isDefined)
      .filter((worker) => worker.isConnected())
      .forEach((worker) => {
        sendStoriesMessage(worker, { type: 'update', payload: deserializedStories });
      });

    response.send();
  };
}
