import React from "react";
import Loader from "@skbkontur/react-ui/Loader";
import {
  CreeveyStatus,
  Response,
  Request,
  isTest,
  CreeveyUpdate,
  isDefined,
  CreeveySuite,
  CreeveyTest
} from "../types";
import { CreeveyContex } from "./CreeveyContext";
import { toogleChecked, treeifyTests, getCheckedTests, updateTestStatus, getTestsByPath } from "./helpers";
import { CreeveyAppView } from "./CreeveyAppView/CreeveyAppView";
import { CreeveyClientApi } from "./creeveyClientApi";

export interface CreeveyAppProps {
  api?: CreeveyClientApi;
  initialStatus: CreeveyStatus;
}

interface CreeveyAppState {
  tests: CreeveySuite | null;
  isRunning: boolean;
  openedTestPath: string[] | null;
}

export class CreeveyApp extends React.Component<CreeveyAppProps, CreeveyAppState> {
  state: CreeveyAppState = {
    tests: null,
    isRunning: false,
    openedTestPath: null
  };
  private ws?: WebSocket;

  constructor(props: CreeveyAppProps) {
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
    const openedTest = this.getOpenedTest();

    return (
      <CreeveyContex.Provider
        value={{
          onTestResultsOpen: this.handleTestResultsOpen,
          onTestToogle: this.handleTestToogle,
          onImageApprove: this.handleImageApprove
        }}
      >
        {this.state.tests ? (
          <CreeveyAppView
            isRunning={this.state.isRunning}
            title="<Root>"
            tests={this.state.tests}
            onImageApprove={this.handleImageApprove}
            start={this.start}
            stop={this.stop}
            openedTest={openedTest}
          />
        ) : (
          <Loader type="big" active />
        )}
      </CreeveyContex.Provider>
    );
  }

  handleCreeveyData = () => {
    Object.values(__CREEVEY_DATA__)
      .filter(isDefined)
      .forEach(test => (test.path = this.splitLastPathToken(test.path)));
    this.setState({
      tests: treeifyTests(__CREEVEY_DATA__)
    });
  };

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

  handleStatus = ({ isRunning, tests }: CreeveyStatus) => {
    Object.values(tests)
      .filter(isDefined)
      .forEach(test => (test.path = this.splitLastPathToken(test.path)));
    this.setState({
      tests: treeifyTests(tests),
      isRunning
    });
  };

  handleUpdate = ({ isRunning, tests }: CreeveyUpdate) => {
    if (isDefined(isRunning)) {
      this.setState({ isRunning });
    }
    if (isDefined(tests)) {
      this.setState(state => {
        if (!state.tests) return state;
        return {
          ...state,
          tests: Object.values(tests).reduce((tests, test) => {
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
    this.ws.addEventListener('open', () => this.send({ type: 'status'}))
  }

  private getOpenedTest(): CreeveyTest | undefined {
    const { tests, openedTestPath } = this.state;
    if (!tests || !openedTestPath) return;
    const testOrSuite = getTestsByPath(tests, openedTestPath);
    if (isTest(testOrSuite)) return testOrSuite;
  }

  private handleMessage = (message: MessageEvent) => {
    const data: Response = JSON.parse(message.data);
    switch (data.type) {
      case "status": {
        this.handleStatus(data.payload);
        return;
      }
      case "update": {
        this.handleUpdate(data.payload);
        return;
      }
    }
  };

  private send(command: Request) {
    if (!this.ws) return;

    this.ws.send(JSON.stringify(command));
  }

  public start = (tests: CreeveySuite) => {
    this.send({ type: "start", payload: getCheckedTests(tests).map(test => test.id) });
  };

  public stop = () => {
    this.send({ type: "stop" });
  };

  private approve = (id: string, retry: number, image: string) => {
    this.send({ type: "approve", payload: { id, retry, image } });
  };
}
