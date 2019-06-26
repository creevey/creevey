import path from "path";
import http from "http";
import Koa from "koa";
import serve from "koa-static";
import mount from "koa-mount";
import WebSocket from "ws";
import { CreeveyApi } from "./api";

export default function server(api: CreeveyApi, reportDir: string) {
  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server });

  app.use(serve(path.join(__dirname, "../../client")));
  app.use(mount("/report", serve(reportDir)));

  api.subscribe(wss);

  wss.on("connection", ws => {
    console.log("[WebSocketServer]:", "Connection open");

    ws.on("error", error => console.log("[WebSocket]:", error));
    ws.on("open", () => console.log("[WebSocket]:", "Connection open"));
    ws.on("close", () => console.log("[WebSocket]:", "Connection close"));
    ws.on("message", api.handleMessage);
  });

  wss.on("error", error => console.log("[WebSocketServer]:", error));

  server.listen(3000, () => console.log("[CreeveyServer]:", "Started on http://localhost:3000"));
}
