import { configure, addDecorator } from "@storybook/react";
import { withCreevey } from "../src/storybook";

addDecorator(withCreevey());

configure(require.context("../stories", true, /\.stories\.tsx$/), module);
