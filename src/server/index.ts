import cluster from "cluster";
import { Config } from "../types";

export default function(config: Config) {
  if (cluster.isMaster) {
    console.log("[CreeveyMaster]:", `Started with pid ${process.pid}`);

    require("./master").default(config);
  } else {
    console.log("[CreeveyWorker]:", `Started with pid ${process.pid}`);

    require("./worker/worker").default(config);
  }
}
