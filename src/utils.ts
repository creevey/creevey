import path from "path";
import { Config } from "./types";

export function readConfig(): Config {
  const configModule = require(path.join(process.cwd(), "./creevey"));
  const config = configModule && configModule.__esModule ? configModule.default : configModule;

  return config;
}
