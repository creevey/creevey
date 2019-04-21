import React from "react";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import Spinner from "@skbkontur/react-ui/Spinner";
import { TestTree } from "./TestTree";
import { CreeveyContex } from "./CreeveyContext";

export class CreeveyApp extends React.Component {
  static contextType = CreeveyContex;
  context: React.ContextType<typeof CreeveyContex> = this.context;
  render() {
    return (
      <>
        <TopBar>
          <TopBar.Item>
            <Logotype locale={{ prefix: "c", suffix: "lin" }} suffix="creevey" />
          </TopBar.Item>
          {this.context.isRunning ? (
            <TopBar.Item onClick={this.context.stop}>
              <Spinner type="mini" caption="Running" />
            </TopBar.Item>
          ) : (
            <TopBar.Item onClick={this.context.start}>Start</TopBar.Item>
          )}
        </TopBar>
        {this.context.tests ? (
          Object.entries(this.context.tests).map(([title, suite]) => (
            <TestTree key={title} title={title} tests={suite} tree={this.context.tree[title]} />
          ))
        ) : (
          <Loader type="big" active />
        )}
      </>
    );
  }
}
