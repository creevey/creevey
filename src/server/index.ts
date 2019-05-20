import path from "path";
import cluster from "cluster";
import { readConfig } from "../config";
import { Options } from "../types";

export default function(options: Options) {
  const config = readConfig(path.resolve(options.config));

  if (options.parser) {
    require("./master/parser").default(config);
  } else if (cluster.isMaster) {
    console.log("[CreeveyMaster]:", `Started with pid ${process.pid}`);

    require("./master").default(config);
  } else if (cluster.isWorker) {
    console.log("[CreeveyWorker]:", `Started with pid ${process.pid}`);

    require("./worker").default(config);
  }
}
