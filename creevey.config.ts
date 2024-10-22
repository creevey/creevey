const path = require("path");
const { hybridStoriesProvider } = require("./src/index");
const { execSync } = require("child_process");

const resolverStorybookUrl = (port) => {
  const ip = execSync(
    'curl -X GET https://fake.testkontur.ru/ip -H "Accept: */*"',
    { stdio: "pipe" }
  ).toString();
  return `http://${ip}:${port}`;
};

const config = {
  storybookUrl: resolverStorybookUrl(6006),
  storybookDir: path.join(__dirname, ".storybook"),
  reportDir: path.join(__dirname, "report"),
  screenDir: path.join(__dirname, "images"),
  gridUrl: "https://grid.skbkontur.ru/common/wd/hub",
  diffOptions: { threshold: 0, includeAA: false },
  storiesProvider: hybridStoriesProvider,
  testsDir: path.join(__dirname),
  browsers: {
    chrome: {
      browserName: "chrome",
      viewport: { width: 1024, height: 720 },
      platformName: "linux",
      name: "infrafront/chrome8px",
      browserVersion: "127.0",
      "se:teamname": "front_infra"
    },
  },
};

module.exports = config;
