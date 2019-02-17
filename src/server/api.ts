import http from "http";
import Koa from "koa";
import WebSocket from "ws";
import { Config, Command, Workers } from "../types";
import startTests from "./start";
import Runner from "./runner";

export default function creeveyServer(config: Config, workers: Workers) {
  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server });

  const runner = new Runner(config);

  let isRunning = false;

  wss.on("connection", ws => {
    runner.subscribe(ws);

    ws.on("close", () => console.log("connection close"));
    ws.on("message", message => {
      if (typeof message != "string") {
        return;
      }

      const command: Command = JSON.parse(message);

      switch (command.type) {
        case "getTests": {
          ws.send(JSON.stringify(tests));
          return;
        }
        case "start": {
          if (isRunning) {
            return;
          }
          isRunning = true;
          startTests(tests, workers).then(() => (isRunning = false));
          return;
        }
        case "stop": {
          if (!isRunning) {
            return;
          }
          isRunning = false;
          // TODO
          return;
        }
      }
    });
    console.log("connection open");
  });

  server.listen(3000);
}

/*
commands:
  - getTests
  - start
  - stop

events:
  - status
*/
