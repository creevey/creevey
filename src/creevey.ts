import cluster from "cluster";
import { Config, Workers } from "./types";

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

  // Types?
  const workers: Workers = {};

  Object.keys(config.browsers).forEach(browser => {
    const browserConfig = config.browsers[browser];
    workers[browser] = Array.from({ length: browserConfig.limit }).map(() =>
      cluster.fork({ browser, config: JSON.stringify(config.browsers[browser]) })
    );
  });

  apiServer(config, workers);
} else {
  console.log(`Worker ${process.pid} started`);
  require("./server/worker");
}
