import cluster from "cluster";
import Runner from "./server/runner";
import { Config } from "./types";

// TODO args to config

export default function creevey(config: Config) {
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // TODO Types
    const apiServer = require("./server/api").default;

    const runner = new Runner(config);

    apiServer(runner);
  } else {
    console.log(`Worker ${process.pid} started`);
    require("./server/worker");
  }
}
