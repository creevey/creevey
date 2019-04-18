import React from "react";
import Checkbox from "@skbkontur/react-ui/Checkbox";
import Gapped from "@skbkontur/react-ui/Gapped";
import ArrowTriangleRightIcon from "@skbkontur/react-icons/ArrowTriangleRight";
import { Test, Tests, isTest } from "../types";

interface TestTreeContextType {
  checked: boolean;
  indeterminate: boolean;
  onChange: (title: string, checked: boolean) => void;
}
interface TestTreeProps {
  title: string;
  tests: Tests | Test;
}
interface TestTreeState {
  opened: boolean;
  checked: boolean | { [title: string]: boolean };
  indeterminate: boolean;
}

function checkedDic<T>(obj: { [key: string]: T }, value: boolean) {
  return Object.keys(obj).reduce((checked, title) => ({ ...checked, [title]: value }), {});
}

function defaultTestTreeState(props: TestTreeProps, context: TestTreeContextType) {
  return {
    opened: false,
    checked: isTest(props.tests) ? context.checked : checkedDic(props.tests, context.checked),
    indeterminate: false
  };
}

export const TestTreeContext = React.createContext<TestTreeContextType>({
  checked: true,
  indeterminate: false,
  onChange: () => {}
});

export class TestTree extends React.Component<TestTreeProps, TestTreeState> {
  static contextType = TestTreeContext;
  context: React.ContextType<typeof TestTreeContext> = this.context;
  state: TestTreeState = defaultTestTreeState(this.props, this.context);
  checkbox = React.createRef<Checkbox>();
  render() {
    console.log(this.state);
    const checkbox = (
      <Gapped gap={5}>
        <Checkbox ref={this.checkbox} checked={this.checked} onChange={this.handleCheck} />
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
        {isTest(this.props.tests) ||
          (this.state.opened && (
            <TestTreeContext.Provider
              value={{
                checked: this.checked,
                indeterminate: this.state.indeterminate,
                onChange: this.handleChildCheck
              }}
            >
              <div style={{ marginLeft: "20px" }}>
                {Object.entries(this.props.tests).map(([title, suite]) => (
                  <TestTree key={title} title={title} tests={suite} />
                ))}
              </div>
            </TestTreeContext.Provider>
          ))}
      </>
    );
  }

  get checked() {
    return typeof this.state.checked == "boolean"
      ? this.state.checked
      : Object.values(this.state.checked).every(x => x);
  }

  handleSubTreeOpen = () => {
    console.log("click");
    this.setState(({ opened }) => ({ opened: !opened }));
  };
  handleCheck = (_: React.ChangeEvent, checked: boolean) => {
    this.setState(state => ({
      checked: typeof state.checked == "boolean" ? checked : checkedDic(state.checked, checked),
      indeterminate: false
    }));
    this.context.onChange(this.props.title, checked);
  };
  handleChildCheck = (title: string, checked: boolean) => {
    // TODO update state => call onChange
    // false && true =>
  };
}
