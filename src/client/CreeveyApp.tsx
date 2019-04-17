import React from "react";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import Spinner from "@skbkontur/react-ui/Spinner";
import { CreeveyStatus, Tests } from "../types";
import { CreeveyAPI } from "./api";
import { TestTree } from "./TestTree";

export class CreeveyApp extends React.Component<{}, { tests: Tests | null; isRunning: boolean }> {
  state: { tests: Tests | null; isRunning: boolean } = { tests: null, isRunning: false };
  api = new CreeveyAPI();

  componentDidMount() {
    this.api.once("ready", () => {
      this.api.on("status", (status: CreeveyStatus) => {
        this.setState(status);
      });
      this.api.getTests();
    });
  }

  render() {
    return (
      <>
        <TopBar>
          <TopBar.Item>
            <Logotype locale={{ prefix: "C", suffix: "lin" }} suffix="Creevey" />
          </TopBar.Item>
          {this.state.isRunning && (
            <TopBar.Item onClick={this.handleClick}>
              <Spinner type="mini" caption="Running" />
            </TopBar.Item>
          )}
        </TopBar>
        {this.state.tests ? (
          Object.entries(this.state.tests).map(([title, suite]) => <TestTree title={title} tests={suite} />)
        ) : (
          <Loader type="big" active />
        )}
      </>
    );
  }

  handleClick = () => this.api.stop();
}
