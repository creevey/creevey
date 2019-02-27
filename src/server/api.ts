import http from "http";
import Koa from "koa";
import WebSocket from "ws";
import { Command } from "../types";
import Runner from "./runner";

export default function creeveyServer(runner: Runner) {
  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server });

  // TODO maybe event types
  runner.on("message", message => {
    wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  });

  wss.on("connection", ws => {
    ws.on("close", () => console.log("connection close"));
    ws.on("message", message => {
      if (typeof message != "string") {
        return;
      }

      const command: Command = JSON.parse(message);

      switch (command.type) {
        case "getTests": {
          ws.send(JSON.stringify(runner.getTests()));
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
      }
    });
    console.log("connection open");
  });

  server.listen(3000);
}
