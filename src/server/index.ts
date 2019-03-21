import cluster from "cluster";
import { Config } from "../types";

export default function(config: Config) {
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    require("./master").default(config);
  } else {
    console.log(`Worker ${process.pid} started`);

    require("./worker");
  }
}
