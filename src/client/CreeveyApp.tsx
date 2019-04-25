import React from "react";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import Spinner from "@skbkontur/react-ui/Spinner";
import { CreeveyStatus, Tests as ApiTests, TestUpdate, Response, Request, isTest } from "../types";
import { TestTree } from "./TestTree";
import { CreeveyContex, Tests, Test } from "./CreeveyContext";
import { toogleChecked } from "./helpers";

interface CreeveyAppState {
  tests: Tests | null;
  isRunning: boolean;
}

function extendsTests(tests: ApiTests, path: string[]): Tests {
  const children = Object.entries(tests).reduce(
    (extendedTests, [title, subTests]) => ({
      ...extendedTests,
      [title]: isTest(subTests) ? { ...subTests, checked: true } : extendsTests(subTests, [...path, title])
    }),
    {}
  );
  // TODO status
  return {
    path,
    status: "unknown",
    checked: true,
    indeterminate: false,
    children
  };
}

function getCheckedTests(tests: Tests | Test): Test[] {
  if (isTest(tests)) {
    return tests.checked ? [tests] : [];
  }
  if (!tests.checked && !tests.indeterminate) {
    return [];
  }
  return Object.values(tests.children).reduce(
    (checkedTests: Test[], subTests) => [...checkedTests, ...getCheckedTests(subTests)],
    []
  );
}

function updateTestStatus(tests: Tests, path: string[], update: TestUpdate): Tests {
  const [title, ...restPath] = path;
  const subTests = tests.children[title];
  const newTests = { ...tests, children: { ...tests.children } };
  if (isTest(subTests)) {
    const { retry, status, images } = update;
    newTests.children[title] = {
      ...subTests,
      retries: retry,
      result: { ...(subTests.result || {}), [retry]: { status, images } }
    };
  } else {
    newTests.children[title] = updateTestStatus(subTests, restPath, update);
  }

  return newTests;
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
    if (!this.state.tests) return;

    this.start(getCheckedTests(this.state.tests).map(test => test.id));
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

  handleTest = (test: TestUpdate) => {
    this.setState(state => {
      if (!state.tests) {
        return state;
      }

      return { ...state, tests: updateTestStatus(state.tests, test.path, test) };
    });
  };

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
