import { EventEmitter } from "events";
import { Command, Message } from "../types";

// TODO subscribe
// TODO runner status
export class CreeveyAPI extends EventEmitter {
  private ws: WebSocket;
  constructor() {
    super();
    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.addEventListener("message", this.handleMessage);
  }

  private handleMessage(message: MessageEvent) {
    const data: Message = JSON.parse(message.data);
    switch (data.type) {
      case "getTests": {
        this.emit("tests", data.payload);
        return;
      }
      case "testStatus": {
        this.emit("status", data.payload);
      }
    }
    console.log(data);
  }

  private send(command: Command) {
    this.ws.send(JSON.stringify(command));
  }

  public getTests() {
    this.send({ type: "getTests" });
  }

  public start(ids: string[]) {
    this.send({ type: "start", payload: ids });
  }

  public stop() {
    this.send({ type: "stop" });
  }
}
