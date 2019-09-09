import path from "path";
import { Config } from "./src/types";
import { defaultConfig } from "./src/config";

const config: Config = {
  ...defaultConfig,
  gridUrl: "http://screen:shot@grid.testkontur.ru/wd/hub",
  address: {
    host: "localhost",
    port: 6006,
    path: "iframe.html"
  },
  testDir: path.join(__dirname, "tests", "ui"),
  screenDir: path.join(__dirname, "tests", "ui", "images"),
  testRegex: /\.ts$/,
  browsers: {
    chrome: {
      browserName: "chrome",
      resolution: { width: 1040, height: 852 }, // 1024x720
      limit: 1
    }
  }
};

export default config;
