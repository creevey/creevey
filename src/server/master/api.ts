import WebSocket from "ws";
import Runner from "./runner";
import { Request, Response, CreeveyUpdate } from "../../types";

export interface CreeveyApi {
  subscribe: (wss: WebSocket.Server) => void;
  handleMessage: (message: WebSocket.Data) => void;
}

function broadcast(wss: WebSocket.Server, message: Response) {
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

export default function creeveyApi(runner: Runner): CreeveyApi {
  let seq = 0;
  return {
    subscribe(wss: WebSocket.Server) {
      wss.on("connection", ws => {
        const message: Response = { type: "status", seq, payload: runner.status };
        ws.send(JSON.stringify(message));
      });
      runner.on("update", (payload: CreeveyUpdate) => {
        seq += 1;
        broadcast(wss, { type: "update", seq, payload });
      });
    },

    handleMessage(message: WebSocket.Data) {
      if (typeof message != "string") {
        console.log("[WebSocket]:", "unhandled message", message);
        return;
      }

      const command: Request = JSON.parse(message);
      // console.log("[WebSocket]:", "message", message);

      switch (command.type) {
        case "start": {
          runner.start(command.payload);
          return;
        }
        case "stop": {
          runner.stop();
          return;
        }
        case "approve": {
          runner.approve(command.payload);
          return;
        }
      }
    }
  };
}
