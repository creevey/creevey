import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import uuid from "uuid";
import { Config, Test } from "../types";
import Pool from "./pool";

export default class Runner extends EventEmitter {
  private testDir: string;
  private tests: { [id: string]: Test } = {};
  private pools: Pool[];
  constructor(config: Config) {
    super();

    this.pools = Object.keys(config.browsers).map(browser => {
      const pool = new Pool(config, browser);

      // TODO maybe types
      pool.on("message", this.emit.bind(this, "message"));

      return pool;
    });
    this.testDir = config.testDir;
  }

  loadTests() {
    const tests = this.tests;
    let suites: string[] = [];

    function describe(title: string, describeFn: () => void) {
      suites = [title, ...suites];
      describeFn();
      [, ...suites] = suites;
    }

    function it(title: string) {
      const test: Test = { id: uuid.v4(), suites, title };

      tests[test.id] = test;

      return test;
    }

    it.skip = function skip(browsers: string[], title: string) {
      it(title).skip = browsers;
    };

    // @ts-ignore
    global.describe = describe;
    // @ts-ignore
    global.it = it;

    fs.readdirSync(this.testDir).forEach(file => require(path.join(this.testDir, file)));
  }

  start(ids: string[]) {
    // TODO send runner status

    const tests = ids.map(id => this.tests[id]);

    this.pools.forEach(pool => pool.start(tests));
  }

  stop() {
    // TODO send runner status

    this.pools.forEach(pool => pool.stop());
  }

  getTests() {
    return this.tests;
  }
}
