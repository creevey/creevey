import React, { useState, Fragment, useCallback } from 'react';
import { withCreeveyTests } from './utils';
import { Test, isDefined, TestStatus } from '../types';
import { Tabs } from '@storybook/components';
import { ResultsPage } from './ResultsPage';

interface PanelProps {
  statuses: Test[];
}

const PanelInternal = ({ statuses }: PanelProps): JSX.Element => {
  const [selectedItem, setSelectedItem] = useState(0);
  const browsers = statuses
    .map((x) => x.path)
    .filter(isDefined)
    .map((x) => x[0]);

  const handleBrowserChange = useCallback((id) => setSelectedItem(Number(id)), []);
  const result = statuses[selectedItem];

  return (
    <Fragment>
      <Tabs selected={`${selectedItem}`} actions={{ onSelect: handleBrowserChange }}>
        {browsers.map((x, i) => (
          <div key={x} id={`${i}`} title={`${x} ${getEmogyByTestStatus(result.status, result.skip)}`} />
        ))}
      </Tabs>
      {statuses.length ? (
        <ResultsPage id={result.id} path={result.path} results={result.results} approved={result.approved} />
      ) : null}
    </Fragment>
  );
};

function getEmogyByTestStatus(status: TestStatus | undefined, skip: string | boolean): string {
  switch (status) {
    case 'failed': {
      return '❌';
    }
    case 'success': {
      return '✔';
    }
    case 'running': {
      return '🟡';
    }
    case 'pending': {
      return '🕗';
    }
    default: {
      if (skip) return '⏸';
      return '';
    }
  }
}

export const Panel = withCreeveyTests(PanelInternal);
