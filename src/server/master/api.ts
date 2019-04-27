import WebSocket from "ws";
import Runner from "./runner";
import { Request, Response, TestUpdate, CreeveyStatus } from "../../types";

export interface CreeveyApi {
  subscribe: (wss: WebSocket.Server) => void;
  handleMessage: (ws: WebSocket, message: WebSocket.Data) => void;
}

function broadcast(wss: WebSocket.Server, message: Response) {
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

export default function creeveyApi(runner: Runner): CreeveyApi {
  return {
    subscribe(wss: WebSocket.Server) {
      runner.on("test", (payload: TestUpdate) => broadcast(wss, { type: "test", payload }));
      runner.on("start", (payload: string[]) => broadcast(wss, { type: "start", payload }));
      runner.on("stop", () => broadcast(wss, { type: "stop" }));
    },

    handleMessage(ws: WebSocket, message: WebSocket.Data) {
      if (typeof message != "string") {
        console.log("[WebSocket]:", "unhandled message", message);
        return;
      }

      const command: Request = JSON.parse(message);
      console.log("[WebSocket]:", "message", message);

      switch (command.type) {
        case "status": {
          const payload: CreeveyStatus = runner.status;
          const message: Response = { type: command.type, payload };
          ws.send(JSON.stringify(message));
          return;
        }
        case "start": {
          runner.start(command.payload);
          return;
        }
        case "stop": {
          runner.stop();
          return;
        }
        // case 'approve': {
        //   TODO
        // }
      }
    }
  };
}
