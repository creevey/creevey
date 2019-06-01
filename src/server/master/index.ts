import master from "./master";
import creeveyServer from "./server";
import creeveyApi from "./api";
import { Config, Options, isDefined } from "../../types";

export default async function(config: Config, options: Options) {
  const runner = await master(config);
  if (options.ui) {
    creeveyServer(creeveyApi(runner), config.reportDir);
  } else {
    runner.once("stop", () => {
      const isSuccess = Object.values(runner.status.testsById)
        .filter(isDefined)
        .filter(({ skip }) => !skip)
        .every(({ status }) => status == "success");
      // TODO output summary
      process.exit(isSuccess ? 0 : -1);
    });
    // TODO grep
    runner.start(Object.keys(runner.status.testsById));
  }
}
