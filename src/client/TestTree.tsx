import React from "react";
import Checkbox from "@skbkontur/react-ui/Checkbox";
import Gapped from "@skbkontur/react-ui/Gapped";
import ArrowTriangleRightIcon from "@skbkontur/react-icons/ArrowTriangleRight";
import { isTest } from "../types";
import { Tests, Test, CreeveyContex } from "./CreeveyContext";

interface TestTreeProps {
  title: string;
  tests: Tests | Test;
}

interface TestTreeState {
  opened: boolean;
}

export class TestTree extends React.Component<TestTreeProps, TestTreeState> {
  static contextType = CreeveyContex;
  context: React.ContextType<typeof CreeveyContex> = this.context;
  state: TestTreeState = { opened: false };
  checkbox = React.createRef<Checkbox>();

  componentDidUpdate(prevProps: TestTreeProps) {
    if (!this.checkbox.current || isTest(prevProps.tests) || isTest(this.props.tests)) {
      return;
    }
    if (!prevProps.tests.indeterminate && this.props.tests.indeterminate) {
      this.checkbox.current.setIndeterminate();
    }
    if (prevProps.tests.indeterminate && !this.props.tests.indeterminate) {
      this.checkbox.current.resetIndeterminate();
    }
  }
  render() {
    const checkbox = (
      <Gapped gap={5}>
        <Checkbox ref={this.checkbox} checked={this.props.tests.checked} onChange={this.handleCheck} />
        {this.props.title}
      </Gapped>
    );
    if (isTest(this.props.tests)) {
      return (
        <div style={{ marginLeft: "20px" }}>
          <Gapped gap={5}>{checkbox}</Gapped>
        </div>
      );
    }
    return (
      <>
        <Gapped gap={5}>
          <span
            style={{
              display: "inline-block",
              cursor: "pointer",
              transform: this.state.opened ? "rotate(45deg)" : ""
            }}
          >
            <ArrowTriangleRightIcon onClick={this.handleSubTreeOpen} />
          </span>
          {checkbox}
        </Gapped>
        {this.state.opened && (
          <div style={{ marginLeft: "20px" }}>
            {Object.entries(this.props.tests.children).map(([title, suite]) => (
              <TestTree key={title} title={title} tests={suite} />
            ))}
          </div>
        )}
      </>
    );
  }

  handleSubTreeOpen = () => this.setState(({ opened }) => ({ opened: !opened }));
  handleCheck = (_: React.ChangeEvent, checked: boolean) => {
    this.context.onTestToogle(this.props.tests.path, checked);
  };
}
