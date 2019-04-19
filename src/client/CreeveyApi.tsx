import React from "react";
import { CreeveyStatus, Tests, isTest, TestUpdate, Response, Request } from "../types";
import { CreeveyContex } from "./CreeveyContext";

interface CreeveyApiState {
  testIds: { [id: string]: boolean };
  tests: Tests | null;
  isRunning: boolean;
}

function getTestIds(tests: Tests): { [id: string]: boolean } {
  return Object.values(tests).reduce(
    (ids, test) => ({ ...ids, ...(isTest(test) ? { [test.id]: true } : getTestIds(test)) }),
    {}
  );
}

export class CreeveyApi extends React.Component<{}, CreeveyApiState> {
  state: CreeveyApiState = { testIds: {}, tests: null, isRunning: false };
  private ws: WebSocket;

  constructor(props: {}) {
    super(props);

    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.addEventListener("message", this.handleMessage);
    this.ws.addEventListener("open", () => this.getTests());
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
    this.start(Object.keys(this.state.testIds).filter(id => this.state.testIds[id]));
  };
  handleStop = () => this.stop();
  handleTestToogle = (id: string, checked: boolean) =>
    this.setState(({ testIds: ids }) => ({ testIds: { ...ids, [id]: checked } }));

  handleStatus = (status: CreeveyStatus) => {
    this.setState({ ...status, testIds: getTestIds(status.tests) });
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

  public getTests() {
    this.send({ type: "status" });
  }

  private start(ids: string[]) {
    this.send({ type: "start", payload: ids });
  }

  public stop() {
    this.send({ type: "stop" });
  }
}
