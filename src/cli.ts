#!/usr/bin/env node

import creevey from "./creevey";
import { readConfig } from "./utils";

creevey(readConfig());
