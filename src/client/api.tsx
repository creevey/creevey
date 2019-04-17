import { EventEmitter } from "events";
import { Request, Response } from "../types";

// TODO subscribe
// TODO runner status
export class CreeveyAPI extends EventEmitter {
  private ws: WebSocket;
  constructor() {
    super();
    this.ws = new WebSocket(`ws://${window.location.host}`);
    this.ws.addEventListener("message", this.handleMessage);
    this.ws.addEventListener("open", () => this.emit("ready"));
  }

  private handleMessage = (message: MessageEvent) => {
    const data: Response = JSON.parse(message.data);
    switch (data.type) {
      case "status": {
        this.emit("status", data.payload);
        return;
      }
      case "test": {
        this.emit("test", data.payload);
      }
    }
    console.log(data);
  };

  private send(command: Request) {
    this.ws.send(JSON.stringify(command));
  }

  public getTests() {
    this.send({ type: "status" });
  }

  public start(ids: string[]) {
    this.send({ type: "start", payload: ids });
  }

  public stop() {
    this.send({ type: "stop" });
  }
}
