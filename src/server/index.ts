import path from "path";
import cluster from "cluster";
import { readConfig } from "../config";
import { Options } from "../types";

export default async function(options: Options) {
  const config = readConfig(path.resolve(options.config));
  const { browser, parser } = options;

  // TODO output error if parse && ui
  if (parser) {
    require("./master/parser").default(config);
  } else if (cluster.isMaster) {
    console.log("[CreeveyMaster]:", `Started with pid ${process.pid}`);

    require("./master").default(config, options);
  } else if (cluster.isWorker) {
    console.log("[CreeveyWorker]:", `Started ${browser}:${process.pid}`);

    // TODO Check browser type
    require("./worker").default(config, options);
  }
}
