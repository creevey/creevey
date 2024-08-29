import React, { useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { CreeveyTest } from '../../../../types';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveyContext } from '../../CreeveyContext';
import { SideBarContext } from './SideBar';
import { KeyboardEventsContext } from '../../KeyboardEventsContext';
import { Button, Container, SuiteContainer } from './SuiteLink';
import { Checkbox, CheckboxContainer } from './Checkbox';
import { getTestPath } from '../../../shared/helpers';

export interface TestLinkProps {
  title: string;
  opened: boolean;
  test: CreeveyTest;
}

export function TestLink({ title, opened, test }: TestLinkProps): JSX.Element {
  const { onSuiteToggle } = useContext(CreeveyContext);
  const { onOpenTest } = useContext(SideBarContext);
  const { sidebarFocusedItem, setSidebarFocusedItem } = useContext(KeyboardEventsContext);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const emptyResults = (test?.results?.length ?? 0) == 0;
  const testPath = useMemo(() => getTestPath(test), [test]);

  const isTestFocused = useMemo(
    () =>
      Array.isArray(sidebarFocusedItem) &&
      testPath.length === sidebarFocusedItem.length &&
      testPath.every((x) => sidebarFocusedItem.includes(x)),
    [testPath, sidebarFocusedItem],
  );

  const handleCheck = useCallback((value: boolean): void => onSuiteToggle(testPath, value), [testPath, onSuiteToggle]);

  useEffect(() => {
    if (isTestFocused) buttonRef.current?.focus();
  }, [isTestFocused]);

  const handleOpen = useCallback((): void => {
    onOpenTest(test);
    setSidebarFocusedItem(getTestPath(test));
  }, [test, onOpenTest, setSidebarFocusedItem]);

  return (
    <Container disabled={emptyResults}>
      <Button onClick={handleOpen} active={opened} focused={isTestFocused} disabled={emptyResults} ref={buttonRef}>
        <TestStatusIcon inverted={opened} status={test.status} skip={test.skip} />
        <SuiteContainer padding={(testPath.length + 8) * 8}>{title}</SuiteContainer>
      </Button>
      {/* NOTE Little hack to allow click on checkbox and don't trigger Button click */}
      {/* We can use other approach, but checkbox has vertical-align: top */}
      <CheckboxContainer>
        <Checkbox
          checked={test.skip ? false : test.checked}
          disabled={Boolean(test.skip)}
          onValueChange={handleCheck}
        />
      </CheckboxContainer>
    </Container>
  );
}
