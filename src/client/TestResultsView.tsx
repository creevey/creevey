import React from "react";
import SidePage from "@skbkontur/react-ui/SidePage";
import Button from "@skbkontur/react-ui/Button";
import { Test } from "./CreeveyContext";

interface TestResultsProps {
  test: Test;
  onClose: () => void;
}

export class TestResultsView extends React.Component<TestResultsProps> {
  render() {
    const {
      onClose,
      test: { results = {} }
    } = this.props;
    return (
      <SidePage onClose={onClose}>
        <SidePage.Header>Title</SidePage.Header>
        <SidePage.Body>
          <SidePage.Container>{JSON.stringify(results)}</SidePage.Container>
        </SidePage.Body>
        <SidePage.Footer panel>
          <Button onClick={onClose}>Close</Button>
        </SidePage.Footer>
      </SidePage>
    );
  }
}
