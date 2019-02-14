import http from "http";
import Koa from "koa";
import WebSocket from "ws";
import { Config } from "../types";

import creevey from "../creevey";
import Mocha from "mocha";
import fs from "fs";
import path from "path";

function addTests(mocha: Mocha, testDir: string) {
  fs.readdirSync(testDir).forEach(function(file) {
    mocha.addFile(path.join(testDir, file));
  });
}

export default function creeveyServer(config: Config) {
  const app = new Koa();
  const server = http.createServer(app.callback());
  const wss = new WebSocket.Server({ server });

  creevey(config);
  const mocha = new Mocha();
  addTests(mocha, config.testDir);

  wss.on("connection", ws => {
    ws.on("close", () => console.log("connection close"));
    ws.on("message", _message => {
      console.log(mocha.suite);
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
