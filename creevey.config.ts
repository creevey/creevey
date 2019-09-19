import path from "path";
import { CreeveyConfig } from "./src/types";

const config: CreeveyConfig = {
  gridUrl: "http://screen:shot@grid.testkontur.ru/wd/hub",
  screenDir: path.join(__dirname, "stories", "images"),
  browsers: {
    chrome: {
      browserName: "chrome",
      viewport: { width: 1024, height: 720 }
    }
  }
};

export default config;
