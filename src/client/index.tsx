import React from "react";
import ReactDOM from "react-dom";
import { CreeveyApp } from "./CreeveyApp";
import { CreeveyApi } from "./CreeveyApi";

import "./index.css";
import Checkbox from "@skbkontur/react-ui/Checkbox";

class Check extends React.Component {
  state = { checked: true };
  render() {
    if (this.props.leaf) {
      return (
        <div style={{ marginLeft: "20px" }}>
          <Checkbox checked={this.props.checked} onChange={(_, v) => this.props.onChange(this.props.title, v)} />
          {this.props.title}
        </div>
      );
    }
    return (
      <div style={{ marginLeft: "20px" }}>
        <Checkbox checked={this.props.checked} />
        {this.props.title}
        {Object.entries(this.props.tree).map(([k, v]) => (
          <Check
            key={k}
            title={k}
            {...(typeof v == "boolean" ? { leaf: true } : { tree: v })}
            checked={this.state.checked}
            onChange={v => console.log(v)}
          />
        ))}
      </div>
    );
  }
}

ReactDOM.render(
  <Check
    title="root"
    tree={{
      a: { aa: { aa1: true }, a1: true },
      b: { ba: { ba1: true, ba2: true }, b1: true, b2: true },
      c: {
        ca: { caa: { caa1: true }, cab: { cab1: true, cab2: true } },
        cb: { cba: { cba1: true, cba2: true }, cbb: { cbb1: true } }
      }
    }}
    checked
  />,
  // <CreeveyApi>
  //   <CreeveyApp />
  // </CreeveyApi>,
  document.getElementById("root")
);
