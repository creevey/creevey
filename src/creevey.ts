import cluster from "cluster";
import { Config } from "./types";
import Runner from "./server/runner";

// TODO binary
// TODO args to config

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // TODO Types
  const apiServer = require("./server/api").default;

  // TODO read config
  // TODO default config
  const config: Config = require("./config").default;

  const runner = new Runner(config);

  apiServer(runner);
} else {
  console.log(`Worker ${process.pid} started`);
  require("./server/worker");
}
