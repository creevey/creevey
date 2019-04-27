import Runner from "./runner";
import server from "./ws-server";
import { Config } from "../../types";

export default function master(config: Config) {
  const runner = new Runner(config);

  runner.loadTests();

  server(runner);
}
