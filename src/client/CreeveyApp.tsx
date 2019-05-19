import React from "react";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import Spinner from "@skbkontur/react-ui/Spinner";
import { CreeveyStatus, TestUpdate, Response, Request, isTest } from "../types";
import { TestTree } from "./TestTree";
import { CreeveyContex, Suite, Test } from "./CreeveyContext";
import { toogleChecked, treeifyTests, getCheckedTests, updateTestStatus, getTestsByPath } from "./helpers";
import { TestResultsView } from "./TestResultsView";

interface CreeveyAppState {
  pathsById: Partial<{ [id: string]: string[] }>;
  tests: Suite | null;
  isRunning: boolean;
  openedTest: Test | null;
}

export class CreeveyApp extends React.Component<{}, CreeveyAppState> {
  state: CreeveyAppState = {
    pathsById: {},
    tests: null,
    isRunning: false,
    openedTest: null
  };
  private ws: WebSocket;

  constructor(props: {}) {
    super(props);

    // TODO Check host, enter offline mode
    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.addEventListener("message", this.handleMessage);
    this.ws.addEventListener("open", () => this.getStatus());
  }
  render() {
    const { tests, openedTest } = this.state;
    return (
      <CreeveyContex.Provider
        value={{
          onTestResultsOpen: this.handleTestResultsOpen,
          onTestToogle: this.handleTestToogle,
          onImageApprove: this.handleImageApprove
        }}
      >
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
        {tests ? (
          <div style={{ marginLeft: "10px" }}>
            <TestTree title="<Root>" tests={tests} />
          </div>
        ) : (
          <Loader type="big" active />
        )}
        {openedTest && openedTest.results && (
          <TestResultsView test={openedTest} onClose={this.handleTestResultsClose} />
        )}
      </CreeveyContex.Provider>
    );
  }

  handleTestResultsClose = () => this.setState({ openedTest: null });
  handleTestResultsOpen = (path: string[]) => {
    this.setState(state => {
      if (!this.state.tests) return state;

      const testOrSuite = getTestsByPath(this.state.tests, path);

      if (!isTest(testOrSuite)) return state;

      return { ...state, openedTest: testOrSuite };
    });
  };

  handleTestToogle = (path: string[], checked: boolean) => {
    this.setState(state => {
      if (!state.tests) return state;

      return { ...state, tests: toogleChecked(state.tests, path, checked) };
    });
  };

  handleImageApprove = (id: string, retry: number, image: string) => this.approve(id, retry, image);

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

  private stop = () => {
    this.send({ type: "stop" });
  };

  private approve = (id: string, retry: number, image: string) => {
    this.send({ type: "approve", payload: { id, retry, image } });
  };
}
