import React from "react";
import { CreeveyStatus, Tests as ApiTests, TestUpdate, Response, Request, isTest } from "../types";
import { CreeveyContex, Tests, Test } from "./CreeveyContext";

interface CreeveyApiState {
  tests: Tests | null;
  isRunning: boolean;
}

function extendsTests(tests: ApiTests): Tests {
  return {
    checked: true,
    indeterminate: false,
    children: Object.entries(tests).reduce(
      (extendedTests, [title, subTests]) => ({
        ...extendedTests,
        [title]: isTest(subTests) ? { ...subTests, checked: true } : extendsTests(subTests)
      }),
      {}
    )
  };
}

function getTestsByPath(tests: Tests, path: string[]): (Tests | Test)[] {
  let subTests: Tests | Test = { ...tests };

  return path.map(token => {
    if ("children" in subTests) {
      return (subTests = { ...subTests.children[token] });
    }
    return subTests;
  });
}

function updateTests(tests: Tests | Test, checked: boolean): Tests | Test {
  if ("children" in tests) {
    return {
      checked,
      indeterminate: false,
      children: Object.entries(tests.children).reduce(
        (children, [title, child]) => ({ ...children, [title]: updateTests(child, checked) }),
        {}
      )
    };
  } else {
    return { ...tests, checked };
  }
}

function recalcTest(tests: Tests): Tests {
  const children = Object.values(tests.children);
  const checked = children.every(test => test.checked);
  const indeterminate =
    children.some(test => ("indeterminate" in test ? test.indeterminate : false)) ||
    (!checked && children.some(test => test.checked));
  return { ...tests, checked, indeterminate };
}

export class CreeveyApi extends React.Component<{}, CreeveyApiState> {
  state: CreeveyApiState = { tests: null, isRunning: false };
  private ws: WebSocket;

  constructor(props: {}) {
    super(props);

    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.addEventListener("message", this.handleMessage);
    this.ws.addEventListener("open", () => this.getStatus());
  }

  render() {
    return (
      <CreeveyContex.Provider
        value={{
          isRunning: this.state.isRunning,
          tests: this.state.tests,
          start: this.handleStart,
          stop: this.handleStop,
          onTestToogle: this.handleTestToogle
        }}
      >
        {this.props.children}
      </CreeveyContex.Provider>
    );
  }

  handleStart = () => {
    // this.start(Object.keys(this.state.testIds).filter(id => this.state.testIds[id]));
  };

  handleStop = () => this.stop();

  handleTestToogle = (path: string[], checked: boolean) => {
    this.setState(state => {
      if (!state.tests) return state;

      // TODO
      const [test, ...restTests] = getTestsByPath(state.tests, path).reverse();

      path
        .slice(0, -1)
        .reverse()
        .reduce((x, token, index) => {
          const test = restTests[index];
          if ("children" in test) {
            test.children = { ...test.children, [token]: x };
            return recalcTest(test);
          }
          return test;
        }, updateTests(test, checked));

      const x = updateTests(test, checked);
      restTests;
    });
  };

  handleStatus = (status: CreeveyStatus) => {
    this.setState({
      isRunning: status.isRunning,
      tests: extendsTests(status.tests)
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
