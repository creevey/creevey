import Runner from "./runner";
import apiServer from "./api";
import { Config } from "../types";

export default function master(config: Config) {
  const runner = new Runner(config);

  runner.loadTests();

  apiServer(runner);
}
