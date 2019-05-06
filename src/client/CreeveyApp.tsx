import React from "react";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import Spinner from "@skbkontur/react-ui/Spinner";
import { CreeveyStatus, TestUpdate, Response, Request } from "../types";
import { TestTree } from "./TestTree";
import { CreeveyContex, Suite } from "./CreeveyContext";
import { toogleChecked, treeifyTests, getCheckedTests, updateTestStatus } from "./helpers";

interface CreeveyAppState {
  pathsById: {
    [id: string]: string[] | undefined;
  };
  tests: Suite | null;
  isRunning: boolean;
}

export class CreeveyApp extends React.Component<{}, CreeveyAppState> {
  state: CreeveyAppState = { pathsById: {}, tests: null, isRunning: false };
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
            <TopBar.Item onClick={this.stop}>
              <Spinner type="mini" caption="Running" />
            </TopBar.Item>
          ) : (
            <TopBar.Item onClick={this.start}>Start</TopBar.Item>
          )}
        </TopBar>
        {tests ? <TestTree title="<Root>" tests={tests} /> : <Loader type="big" active />}
      </CreeveyContex.Provider>
    );
  }

  handleTestToogle = (path: string[], checked: boolean) => {
    this.setState(state => {
      if (!state.tests) return state;

      return { ...state, tests: toogleChecked(state.tests, path, checked) };
    });
  };

  handleStatus = ({ isRunning, testsById }: CreeveyStatus) => {
    const pathsById = Object.entries(testsById).reduce(
      (obj, [id, test]) => (test ? { ...obj, [id]: [...test.path].reverse() } : obj),
      {}
    );
    this.setState({
      tests: treeifyTests(testsById),
      pathsById,
      isRunning
    });
  };

  handleTest = (test: TestUpdate) => {
    this.setState(state => {
      const path = state.pathsById[test.id];

      if (!state.tests || !path) {
        return state;
      }

      return { ...state, tests: updateTestStatus(state.tests, path, test) };
    });
  };

  private handleMessage = (message: MessageEvent) => {
    const data: Response = JSON.parse(message.data);
    switch (data.type) {
      case "status": {
        this.handleStatus(data.payload);
        return;
      }
      case "start": {
        // TODO update tests status
        this.setState({ isRunning: true });
        return;
      }
      case "stop": {
        this.setState({ isRunning: false });
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

  private start = () => {
    if (!this.state.tests) return;

    this.send({ type: "start", payload: getCheckedTests(this.state.tests).map(test => test.id) });
  };

  public stop = () => {
    this.send({ type: "stop" });
  };
}
