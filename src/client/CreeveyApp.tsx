import React from "react";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import Spinner from "@skbkontur/react-ui/Spinner";
import { CreeveyStatus, Tests as ApiTests, TestUpdate, Response, Request, isTest } from "../types";
import { TestTree } from "./TestTree";
import { CreeveyContex, Tests, Test } from "./CreeveyContext";

interface CreeveyAppState {
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

function getTestsByPath(tests: Tests, path: string[]): Tests | Test {
  return path.reduce((subTests: Tests | Test, pathToken) => {
    if ("children" in subTests) {
      return subTests.children[pathToken];
    }
    return subTests;
  }, tests);
}

function checkTests(tests: Tests | Test, checked: boolean): Tests | Test {
  if ("children" in tests) {
    return {
      checked,
      indeterminate: false,
      children: Object.entries(tests.children).reduce(
        (children, [title, child]) => ({ ...children, [title]: checkTests(child, checked) }),
        {}
      )
    };
  } else {
    return { ...tests, checked };
  }
}

function updateTest(tests: Tests): Tests {
  const children = Object.values(tests.children);
  const checked = children.every(test => test.checked);
  const indeterminate =
    children.some(test => ("indeterminate" in test ? test.indeterminate : false)) ||
    (!checked && children.some(test => test.checked));
  return { ...tests, checked, indeterminate };
}

export class CreeveyApp extends React.Component<{}, CreeveyAppState> {
  state: CreeveyAppState = { tests: null, isRunning: false };
  private ws: WebSocket;

  constructor(props) {
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
    // this.start(Object.keys(this.state.testIds).filter(id => this.state.testIds[id]));
  };

  handleStop = () => this.stop();

  handleTestToogle = (path: string[], checked: boolean) => {
    this.setState(state => {
      if (!state.tests) return state;

      const { tests } = state;
      const checkedTests = checkTests(getTestsByPath(tests, path), checked);
      const rootTests = path
        .slice(0, -1)
        .map((_, index, tokens) => tokens.slice(0, tokens.length - index))
        .reduce((subTests, parentPath) => {
          const parentTests = getTestsByPath(tests, parentPath);
          if ("children" in parentTests) {
            const lastToken = path.slice(parentPath.length)[0];
            return updateTest({ ...parentTests, children: { ...parentTests.children, [lastToken]: subTests } });
          }
          return subTests;
        }, checkedTests);

      return { ...state, tests: updateTest({ ...tests, children: { ...tests.children, [path[0]]: rootTests } }) };
    });

    // TODO Delete code below
    this.setState(state => {
      if (!state.tests) return state;

      // const [head, ...tail] = path;
      const tests = { ...state.tests };
      const [subTests, token] = path.reduce(
        ([[parentToken, parentTests], ...rest]: (Tests | Test)[], token) => {
          if ("children" in parent) {
            const subTests = { ...parent.children[token] };
            parent.children = { ...parent.children, [token]: subTests };
            return [subTests, parent, ...rest];
          }
          return [parent, ...rest];
        },
        [["<Root>", tests]]
      );

      const tests = getTestsByPath(state.tests, path.slice(0, -1)).reverse();

      path
        .slice(0, -1)
        .reverse()
        .reduce((x, token, index) => {
          const test = restTests[index];
          if ("children" in test) {
            test.children = { ...test.children, [token]: x };
            return updateTest(test);
          }
          return test;
        }, checkTests(test, checked));

      const x = checkTests(test, checked);
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
