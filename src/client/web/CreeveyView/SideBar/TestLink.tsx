import React, { JSX, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { CreeveyTest } from '../../../../types.js';
import { TestStatusIcon } from './TestStatusIcon.js';
import { useCreeveyContext } from '../../CreeveyContext.js';
import { SideBarContext } from './SideBar.js';
import { Button, Container, SuiteContainer, SuiteTitle } from './SuiteLink.js';
import { Checkbox, CheckboxContainer } from './Checkbox.js';
import { getTestPath } from '../../../shared/helpers.js';
import { styled } from '@storybook/theming';

export interface TestLinkProps {
  title: string;
  opened: boolean;
  test: CreeveyTest;
}

const TestContainer = styled(SuiteContainer)({
  gridTemplateColumns: 'min-content auto',
});

export function TestLink({ title, opened, test }: TestLinkProps): JSX.Element {
  const { onSuiteToggle, sidebarFocusedItem, setSidebarFocusedItem, isUpdateMode } = useCreeveyContext();
  const { onOpenTest } = useContext(SideBarContext);
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
        {!isUpdateMode && (
          <Checkbox
            checked={test.skip ? false : test.checked}
            disabled={Boolean(test.skip)}
            onValueChange={handleCheck}
          />
        )}
      </CheckboxContainer>
      <Button onClick={handleOpen} disabled={emptyResults} ref={buttonRef}>
        <TestContainer padding={(testPath.length + 1) * 8}>
          <TestStatusIcon inverted={opened} status={test.status} skip={test.skip} />
          <SuiteTitle>{title}</SuiteTitle>
        </TestContainer>
      </Button>
    </Container>
  );
}
