import React, { useContext } from 'react';
import { CreeveyTest } from '../../../../types';
import { TestStatusIcon } from './TestStatusIcon';
import { CreeveyContext } from '../../../shared/CreeveyContext';
import { SideBarContext } from './SideBar';
import { Button, Container, CheckboxContainer, SuiteContainer } from './SuiteLink';
import { Checkbox } from './Checkbox';

export interface TestLinkProps {
  title: string;
  opened: boolean;
  test: CreeveyTest;
}

export function TestLink({ title, opened, test }: TestLinkProps): JSX.Element {
  const { onSuiteToggle } = useContext(CreeveyContext);
  const { onOpenTest } = useContext(SideBarContext);

  const emptyResults = (test?.results?.length ?? 0) == 0;

  const handleCheck = (value: boolean): void => onSuiteToggle(test.path, value);
  const handleOpen = (): void => onOpenTest(test.path);

  return (
    <Container disabled={emptyResults}>
      <Button onClick={handleOpen} active={opened}>
        <TestStatusIcon inverted={opened} status={test.status} skip={test.skip} />
        <SuiteContainer padding={(test.path.length + 8) * 8}>{title}</SuiteContainer>
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
