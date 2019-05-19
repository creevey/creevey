#!/usr/bin/env node

import path from "path";
import minimist from "minimist";
import creevey from "./server";
import { readConfig } from "./config";

const argv = minimist(process.argv.slice(2), { string: "config", default: { config: "./creevey" } });
const configPath = path.resolve(argv.config);

creevey(readConfig(configPath));
