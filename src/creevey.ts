import cluster from "cluster";
import Runner from "./server/runner";
import { readConfig } from "./utils";

// TODO binary
// TODO args to config

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // TODO Types
  const apiServer = require("./server/api").default;

  const runner = new Runner(readConfig());

  apiServer(runner);
} else {
  console.log(`Worker ${process.pid} started`);
  require("./server/worker");
}
