import Runner from "./runner";
import creeveyServer from "./server";
import { Config } from "../../types";
import creeveyApi from "./api";

export default function master(config: Config) {
  const runner = new Runner(config);

  runner.loadTests();

  creeveyServer(creeveyApi(runner));
}
