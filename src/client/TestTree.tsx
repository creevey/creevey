import React from "react";
import Checkbox from "@skbkontur/react-ui/Checkbox";
import Gapped from "@skbkontur/react-ui/Gapped";
import ArrowTriangleRightIcon from "@skbkontur/react-icons/ArrowTriangleRight";
import { Test, Tests, isTest } from "../types";

// TODO count checked
export const TestTreeContext = React.createContext<{
  checked: boolean;
  onChange: (state: "checked" | "uncheked" | "indeterminate") => void;
}>({ checked: true, onChange: () => {} });

export class TestTree extends React.Component<
  { title: string; tests: Tests | Test },
  { opened: boolean; checked: boolean; indeterminate: boolean }
> {
  static contextType = TestTreeContext;
  state = { opened: false, checked: this.context.checked, indeterminate: false };
  checkbox = React.createRef<Checkbox>();
  render() {
    const checkbox = (
      <Gapped gap={5}>
        <Checkbox ref={this.checkbox} checked={this.state.checked} onChange={this.handleCheck} />
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
            <ArrowTriangleRightIcon onClick={this.openSubTree} />
          </span>
          {checkbox}
        </Gapped>
        {isTest(this.props.tests) ||
          (this.state.opened && (
            <div style={{ marginLeft: "20px" }}>
              {Object.entries(this.props.tests).map(([title, suite]) => (
                <TestTree title={title} tests={suite} />
              ))}
            </div>
          ))}
      </>
    );
  }

  openSubTree = () => this.setState(({ opened }) => ({ opened: !opened }));
  handleCheck = (_: React.ChangeEvent, checked: boolean) => {
    this.setState({ checked });
    this.context.onChange(checked);
  };
}
