#!/usr/bin/env node

import minimist from "minimist";
import creevey from "./server";
import { Options } from "./types";

const argv = minimist<Options>(process.argv.slice(2), {
  string: ["config", "browser"],
  boolean: ["parser"],
  default: { config: "./creevey", parser: false }
});

creevey(argv);
