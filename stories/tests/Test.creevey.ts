import { CreeveyTestContext } from 'src/types.js';
import { kind, story, test } from '../../src/server/testsFiles/parser.js';

kind('TestKind', () => {
  story('Story', ({ setStoryParameters }) => {
    setStoryParameters({
      skip: false,
      waitForReady: false,
      captureElement: 'span[data-test-id~="x"]',
      ignoreElements: [],
    });

    test('idletest', async (context: CreeveyTestContext) => {
      await context.matchImage(await context.takeScreenshot(), 'idleimage');
    });

    test('idletest2', async (context: CreeveyTestContext) => {
      await context.matchImage(await context.takeScreenshot(), 'idleimage2');
    });
  });
});
