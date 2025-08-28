import { FakeSuite, FakeTest, Images, isDefined, TEST_EVENTS } from '../../types.js';
import EventEmitter from 'events';

export class TeamcityReporter {
  constructor(runner: EventEmitter, options: { reportDir: string }) {
    const { reportDir } = options;

    runner.on(TEST_EVENTS.SUITE_BEGIN, (suite: FakeSuite) => {
      console.log(`##teamcity[testSuiteStarted name='${this.escape(suite.title)}' flowId='${process.pid}']`);
    });

    runner.on(TEST_EVENTS.TEST_BEGIN, (test: FakeTest) => {
      console.log(`##teamcity[testStarted name='${this.escape(test.title)}' flowId='${test.creevey.workerId}']`);
    });

    runner.on(TEST_EVENTS.TEST_PASS, (test: FakeTest) => {
      console.log(`##teamcity[testFinished name='${this.escape(test.title)}' flowId='${test.creevey.workerId}']`);
    });

    runner.on(TEST_EVENTS.TEST_FAIL, (test: FakeTest, error: Error) => {
      const browserName = this.escape(test.creevey.browserName);
      Object.entries(test.creevey.images).forEach(([name, image]) => {
        if (!image) return;
        const filePath = test
          .titlePath()
          .slice(0, -1)
          .concat(name == browserName ? [] : [browserName])
          .map(this.escape)
          .join('/');

        const { error: _, ...rest } = image;
        Object.values(rest as Partial<Images>)
          .filter(isDefined)
          .forEach((fileName) => {
            console.log(`##teamcity[publishArtifacts '${reportDir}/${filePath}/${fileName} => report/${filePath}']`);
            console.log(
              `##teamcity[testMetadata testName='${this.escape(
                test.title,
              )}' type='image' value='report/${filePath}/${fileName}' flowId='${test.creevey.workerId}']`,
            );
          });
      });

      // Output failed test as passed due TC don't support retry mechanic
      // https://teamcity-support.jetbrains.com/hc/en-us/community/posts/207216829-Count-test-as-successful-if-at-least-one-try-is-successful?page=1#community_comment_207394125

      if (test.creevey.willRetry)
        console.log(`##teamcity[testFinished name='${this.escape(test.title)}' flowId='${test.creevey.workerId}']`);
      else
        console.log(
          `##teamcity[testFailed name='${this.escape(test.title)}' message='${this.escape(
            error.message,
          )}' details='${this.escape(error.stack ?? '')}' flowId='${test.creevey.workerId}']`,
        );
    });

    runner.on(TEST_EVENTS.SUITE_END, (suite: FakeSuite) => {
      console.log(`##teamcity[testSuiteFinished name='${this.escape(suite.title)}' flowId='${process.pid}']`);
    });
  }

  private escape = (str: string): string => {
    if (!str) return '';
    return (
      str
        .toString()
        // eslint-disable-next-line no-control-regex
        .replace(/\x1B.*?m/g, '')
        .replace(/\|/g, '||')
        .replace(/\n/g, '|n')
        .replace(/\r/g, '|r')
        .replace(/\[/g, '|[')
        .replace(/\]/g, '|]')
        .replace(/\u0085/g, '|x')
        .replace(/\u2028/g, '|l')
        .replace(/\u2029/g, '|p')
        .replace(/'/g, "|'")
    );
  };
}
