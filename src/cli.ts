#!/usr/bin/env node

import creevey from "./server";
import { readConfig } from "./utils";

creevey(readConfig());
