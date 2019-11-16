#!/usr/bin/env node

import minimist from "minimist";
import creevey from "./server";
import { Options } from "./types";

process.on("unhandledRejection", reason => {
  console.log(reason);
  process.exit(-1);
});

const argv = minimist<Options>(process.argv.slice(2), {
  string: ["config", "browser", "reporter", "gridUrl"],
  boolean: ["parser", "ui", "update"],
  default: { config: "./creevey.config", parser: false, ui: false, port: 3000 },
  alias: { port: "p", config: "c" }
});

creevey(argv);
