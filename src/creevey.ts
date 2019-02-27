import cluster from "cluster";
import { Config } from "./types";
import Runner from "./server/runner";

// TODO binary
// TODO args to config

// TODO main mocha initializer
// TODO child mocha initializer

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // TODO Types
  const apiServer = require("./server/api");

  // TODO read config
  // TODO default config
  const config: Config = require("./config");

  const runner = new Runner(config);

  apiServer(runner);
} else {
  console.log(`Worker ${process.pid} started`);
  require("./server/worker");
}
