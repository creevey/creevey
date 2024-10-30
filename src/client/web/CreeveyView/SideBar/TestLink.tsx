import React, { useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { CreeveyTest } from '../../../../types.js';
import { TestStatusIcon } from './TestStatusIcon.js';
import { CreeveyContext } from '../../CreeveyContext.js';
import { SideBarContext } from './SideBar.js';
import { KeyboardEventsContext } from '../../KeyboardEventsContext.js';
import { Button, Container, SuiteContainer, SuiteTitle } from './SuiteLink.js';
import { Checkbox, CheckboxContainer } from './Checkbox.js';
import { getTestPath } from '../../../shared/helpers.js';

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

  const emptyResults = (test.results?.length ?? 0) == 0;
  const testPath = useMemo(() => getTestPath(test), [test]);

  const isTestFocused = useMemo(
    () =>
      Array.isArray(sidebarFocusedItem) &&
      testPath.length === sidebarFocusedItem.length &&
      testPath.every((x) => sidebarFocusedItem.includes(x)),
    [testPath, sidebarFocusedItem],
  );

  const handleCheck = useCallback(
    (value: boolean): void => {
      onSuiteToggle(testPath, value);
    },
    [testPath, onSuiteToggle],
  );

  useEffect(() => {
    if (isTestFocused) buttonRef.current?.focus();
  }, [isTestFocused]);

  const handleOpen = useCallback((): void => {
    onOpenTest(test);
    setSidebarFocusedItem(getTestPath(test));
  }, [test, onOpenTest, setSidebarFocusedItem]);

  return (
    <Container disabled={emptyResults} active={opened} focused={isTestFocused}>
      {/* NOTE Little hack to allow click on checkbox and don't trigger Button click */}
      {/* We can use other approach, but checkbox has vertical-align: top */}
      <CheckboxContainer>
        <Checkbox
          checked={test.skip ? false : test.checked}
          disabled={Boolean(test.skip)}
          onValueChange={handleCheck}
        />
      </CheckboxContainer>
      <Button onClick={handleOpen} disabled={emptyResults} ref={buttonRef}>
        <SuiteContainer padding={(testPath.length + 1) * 8}>
          <TestStatusIcon inverted={opened} status={test.status} skip={test.skip} />
          <SuiteTitle>{title}</SuiteTitle>
        </SuiteContainer>
      </Button>
    </Container>
  );
}
