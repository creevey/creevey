import React from 'react';
import { isTest, CreeveySuite, CreeveyTest } from '../../../types';
import { TestLink } from './TestLink';
import { SuiteLink } from './SuiteLink';

interface TestTreeProps {
  title: string;
  testOrSuite: CreeveySuite | CreeveyTest;
}

export class TestTree extends React.Component<TestTreeProps> {
  render() {
    const { testOrSuite, title } = this.props;

    if (isTest(testOrSuite)) {
      return <TestLink title={title} test={testOrSuite} />;
    }
    return (
      <SuiteLink title={title} suite={testOrSuite}>
        {Object.entries(testOrSuite.children).map(([childTitle, suite]) => (
          <TestTree key={childTitle} title={childTitle} testOrSuite={suite} />
        ))}
      </SuiteLink>
    );
  }
}
