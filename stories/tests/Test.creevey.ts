import { CreeveyTestController } from 'src/types.js';
import { kind, story, test } from '../../src/server/testsFiles/parser.js';

kind('TestKind', () => {
  story('Story', ({ setStoryParameters }) => {
    setStoryParameters({
      skip: false,
      waitForReady: false,
      captureElement: 'span[data-test-id~="x"]',
      ignoreElements: [],
    });

    test('idletest', async function (this: CreeveyTestController) {
      await this.expect(await this.takeScreenshot()).to.matchImage('idleimage');
    });

    test('idletest2', async function (this: CreeveyTestController) {
      await this.expect(await this.takeScreenshot()).to.matchImage('idleimage2');
    });
  });
});
