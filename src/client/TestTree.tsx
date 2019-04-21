import React from "react";
import Checkbox from "@skbkontur/react-ui/Checkbox";
import Gapped from "@skbkontur/react-ui/Gapped";
import ArrowTriangleRightIcon from "@skbkontur/react-icons/ArrowTriangleRight";
import { Test, Tests, isTest } from "../types";
import { TestTree } from "./CreeveyContext";



interface TestTreeContextType {
  onChange: (title: string, checked: boolean, indeterminate: boolean) => void;
}
interface TestTreeProps {
  title: string;
  tests: Tests | Test;
  tree: TestTree;
}
interface TestTreeState {
  opened: boolean;
  checked: { [title: string]: { checked: boolean; indeterminate: boolean } };
}

function id<T>(x: T) {
  return x;
}

// TODO types
function checkedFactory<T>(obj: { [key: string]: T }, value: boolean) {
  return Object.keys(obj).reduce(
    (checked, title) => ({ ...checked, [title]: { checked: value, indeterminate: false } }),
    {}
  );
}

function defaultTestTreeState(props: TestTreeProps) {
  return {
    opened: false,
    checked: isTest(props.tests) ? {} : checkedFactory(props.tests, props.checked)
  };
}

export const TestTreeContext = React.createContext<TestTreeContextType>({ onChange: () => {} });

export class TestTree extends React.Component<TestTreeProps, TestTreeState> {
  static defaultProps = { checked: true, indeterminate: false };
  state: TestTreeState = defaultTestTreeState(this.props);
  checkbox = React.createRef<Checkbox>();
  componentDidUpdate(prevProps: TestTreeProps, prevState: TestTreeState) {
    if (prevProps.checked != this.props.checked && !this.props.indeterminate) {
      this.setState({
        checked: isTest(this.props.tests) ? {} : checkedFactory(this.props.tests, this.props.checked)
      });
    }
    if (!this.checkbox.current) {
      return;
    }
    if (!prevProps.indeterminate && this.props.indeterminate) {
      this.checkbox.current.setIndeterminate();
    }
    if (prevProps.indeterminate && !this.props.indeterminate) {
      this.checkbox.current.resetIndeterminate();
    }
  }
  render() {
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
            <div style={{ marginLeft: "20px" }}>
              {Object.entries(this.props.tests).map(([title, suite]) => (
                <TestTree key={title} title={title} tests={suite} onChange={this.handleChildCheck} />
              ))}
            </div>
          ))}
      </>
    );
  }

  get checked() {
    return isTest(this.props.tests)
      ? this.props.checked
      : Object.values(this.state.checked).some(x => x.indeterminate) ||
          Object.values(this.state.checked).every(x => x.checked);
  }

  handleSubTreeOpen = () => this.setState(({ opened }) => ({ opened: !opened }));
  handleCheck = (_: React.ChangeEvent, checked: boolean) => {
    const indeterminate = false;
    this.setState(state => ({ checked: checkedFactory(state.checked, checked) }));
    this.context.onChange(this.props.title, checked, indeterminate);
  };
  handleChildCheck = (title: string, childChecked: boolean, childIndeterminate: boolean) => {
    this.setState(state => {
      const newState = { ...state };
      newState.checked = {
        ...state.checked,
        [title]: { checked: childChecked, indeterminate: childIndeterminate }
      };
      const checkedValues = Object.values(newState.checked).map(x => x.checked);
      const checked = checkedValues.every(id);
      const indeterminate = childIndeterminate || (!checked && checkedValues.some(id));
      this.context.onChange(this.props.title, checked, indeterminate);
      console.log(this.props.title, newState, indeterminate);
      return newState;
    });
  };
}

/*
{
  checked: true,
  indeterminate: true,
  children: {
    1: {
      checked: true,
      indeterminate: true,
      children: {
        11:
        12:
      }
    }
    2
    3
  }
}
*/
