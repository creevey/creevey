import React from "react";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import Spinner from "@skbkontur/react-ui/Spinner";
import { CreeveyStatus, Tests as ApiTests, TestUpdate, Response, Request, isTest } from "../types";
import { TestTree } from "./TestTree";
import { CreeveyContex, Tests } from "./CreeveyContext";
import { toogleChecked } from "./helpers";

interface CreeveyAppState {
  tests: Tests | null;
  isRunning: boolean;
}

function extendsTests(tests: ApiTests, path: string[]): Tests {
  return {
    path,
    checked: true,
    indeterminate: false,
    children: Object.entries(tests).reduce(
      (extendedTests, [title, subTests]) => ({
        ...extendedTests,
        [title]: isTest(subTests) ? { ...subTests, checked: true } : extendsTests(subTests, [...path, title])
      }),
      {}
    )
  };
}

export class CreeveyApp extends React.Component<{}, CreeveyAppState> {
  state: CreeveyAppState = { tests: null, isRunning: false };
  private ws: WebSocket;

  constructor(props: {}) {
    super(props);

    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.addEventListener("message", this.handleMessage);
    this.ws.addEventListener("open", () => this.getStatus());
  }
  render() {
    const { tests } = this.state;
    return (
      <CreeveyContex.Provider value={{ onTestToogle: this.handleTestToogle }}>
        <TopBar>
          <TopBar.Item>
            <Logotype locale={{ prefix: "c", suffix: "lin" }} suffix="creevey" />
          </TopBar.Item>
          {this.state.isRunning ? (
            <TopBar.Item onClick={this.handleStop}>
              <Spinner type="mini" caption="Running" />
            </TopBar.Item>
          ) : (
            <TopBar.Item onClick={this.handleStart}>Start</TopBar.Item>
          )}
        </TopBar>
        {tests ? <TestTree title="<Root>" tests={tests} /> : <Loader type="big" active />}
      </CreeveyContex.Provider>
    );
  }

  handleStart = () => {
    this.start([]);
  };

  handleStop = () => this.stop();

  handleTestToogle = (path: string[], checked: boolean) => {
    this.setState(state => {
      if (!state.tests) return state;

      return { ...state, tests: toogleChecked(state.tests, path, checked) };
    });
  };

  handleStatus = (status: CreeveyStatus) => {
    this.setState({
      isRunning: status.isRunning,
      tests: extendsTests(status.tests, [])
    });
  };

  handleTest = (test: TestUpdate) => console.log(test);

  private handleMessage = (message: MessageEvent) => {
    const data: Response = JSON.parse(message.data);
    switch (data.type) {
      case "status": {
        this.handleStatus(data.payload);
        return;
      }
      case "test": {
        this.handleTest(data.payload);
      }
    }
  };

  private send(command: Request) {
    this.ws.send(JSON.stringify(command));
  }

  public getStatus() {
    this.send({ type: "status" });
  }

  private start(ids: string[]) {
    this.send({ type: "start", payload: ids });
  }

  public stop() {
    this.send({ type: "stop" });
  }
}
