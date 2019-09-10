import { configure, addDecorator } from "@storybook/react";
import { withCreevey } from "../src/storybook";

addDecorator(withCreevey());

const req = require.context("../stories", true, /\.stories\.tsx$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
