import path from "path";
import http from "http";
import Koa from "koa";
import serve from "koa-static";
import WebSocket from "ws";
import { Request, Response, TestUpdate } from "../types";
import Runner from "./runner";

export default function apiServer(runner: Runner) {
  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server });

  app.use(serve(path.join(__dirname, "../client")));

  // TODO maybe event types
  runner.on("test", (payload: TestUpdate) => {
    wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        // TODO
        // test
        // image
        const message: Response = { type: "test", payload };
        ws.send(JSON.stringify(message));
      }
    });
  });

  wss.on("connection", ws => {
    console.log("[WebSocketServer]:", "Connection open");

    ws.on("error", error => console.log("[WebSocket]:", error));
    ws.on("open", () => console.log("[WebSocket]:", "Connection open"));
    ws.on("close", () => console.log("[WebSocket]:", "Connection close"));
    ws.on("message", message => {
      if (typeof message != "string") {
        console.log("[WebSocket]:", "unhandled message", message);
        return;
      }

      const command: Request = JSON.parse(message);
      console.log("[WebSocket]:", "message", message);

      switch (command.type) {
        case "status": {
          const message: Response = { type: command.type, payload: runner.status };
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
      }
    });
  });

  wss.on("error", error => console.log("[WebSocketServer]:", error));

  server.listen(3000);
}
