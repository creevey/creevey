import React from "react";
import { css } from "@emotion/core";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import Spinner from "@skbkontur/react-ui/Spinner";
import { CreeveyStatus, Response, Request, isTest, Test as ApiTest, CreeveyUpdate, isDefined } from "../types";
import { TestTree } from "./TestTree";
import { CreeveyContex, Suite, Test } from "./CreeveyContext";
import { toogleChecked, treeifyTests, getCheckedTests, updateTestStatus, getTestsByPath } from "./helpers";
import { TestResultsView } from "./TestResultsView";

declare global {
  const creeveyData: Partial<{ [id: string]: ApiTest }>;
}

interface CreeveyAppState {
  tests: Suite | null;
  isRunning: boolean;
  openedTestPath: string[] | null;
}

export class CreeveyApp extends React.Component<{}, CreeveyAppState> {
  state: CreeveyAppState = {
    tests: null,
    isRunning: false,
    openedTestPath: null
  };
  private ws?: WebSocket;
  private seq: number = 0;

  constructor(props: {}) {
    super(props);

    if (window.location.host) {
      this.connect();
    } else {
      const script = document.createElement("script");
      script.src = "data.js";
      script.onload = this.handleCreeveyData;
      document.body.appendChild(script);
    }
  }
  render() {
    const { tests } = this.state;
    const openedTest = this.getOpenedTest();
    return (
      <CreeveyContex.Provider
        value={{
          onTestResultsOpen: this.handleTestResultsOpen,
          onTestToogle: this.handleTestToogle,
          onImageApprove: this.handleImageApprove
        }}
      >
        <TopBar>
          <TopBar.Start>
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
          </TopBar.Start>
        </TopBar>
        {tests ? (
          <div
            css={css`
              margin-left: 10px;
            `}
          >
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

  handleCreeveyData = () => {
    Object.values(creeveyData)
      .filter(isDefined)
      .forEach(test => (test.path = this.splitLastPathToken(test.path)));
    this.setState({
      tests: treeifyTests(creeveyData)
    });
  };

  handleTestResultsClose = () => this.setState({ openedTestPath: null });
  handleTestResultsOpen = (path: string[]) => {
    this.setState(state => {
      if (!this.state.tests) return state;

      return { ...state, openedTestPath: path };
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
    Object.values(testsById)
      .filter(isDefined)
      .forEach(test => (test.path = this.splitLastPathToken(test.path)));
    this.setState({
      tests: treeifyTests(testsById),
      isRunning
    });
  };

  handleUpdate = ({ isRunning, testsById }: CreeveyUpdate) => {
    if (isDefined(isRunning)) {
      this.setState({ isRunning });
    }
    if (isDefined(testsById)) {
      this.setState(state => {
        if (!state.tests) return state;
        return {
          ...state,
          tests: Object.values(testsById).reduce((tests, test) => {
            if (!test) return tests;
            return updateTestStatus(tests, this.splitLastPathToken(test.path).reverse(), test);
          }, state.tests)
        };
      });
    }
  };

  private splitLastPathToken(path: string[]) {
    // NOTE: Do some dirty mutable magic
    // ['chrome', 'idle', 'playground', 'Button/Error'] => ['chrome', 'idle', 'playground', 'Error', 'Button']
    return path.splice(path.length - 1, 1, ...path[path.length - 1].split("/").reverse()), path;
  }

  private connect() {
    if (this.ws) {
      this.ws.removeEventListener("message", this.handleMessage);
      this.ws.close();
    }
    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.addEventListener("message", this.handleMessage);
  }

  private getOpenedTest(): Test | undefined {
    const { tests, openedTestPath } = this.state;
    if (!tests || !openedTestPath) return;
    const testOrSuite = getTestsByPath(tests, openedTestPath);
    if (isTest(testOrSuite)) return testOrSuite;
  }

  private handleMessage = (message: MessageEvent) => {
    const data: Response = JSON.parse(message.data);
    switch (data.type) {
      case "status": {
        this.seq = data.seq;
        this.handleStatus(data.payload);
        return;
      }
      case "update": {
        this.seq += 1;
        if (this.seq != data.seq) {
          this.connect();
        } else {
          this.handleUpdate(data.payload);
        }
        return;
      }
    }
  };

  private send(command: Request) {
    if (!this.ws) return;

    this.ws.send(JSON.stringify(command));
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
