#!/usr/bin/env node

import minimist from "minimist";
import creevey from "./server";
import { Options } from "./types";

const argv = minimist<Options>(process.argv.slice(2), {
  string: ["config", "browser", "reporter"],
  boolean: ["parser", "ui", "update"],
  default: { config: "./creevey", parser: false, ui: false }
});

creevey(argv);
