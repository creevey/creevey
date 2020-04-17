import { addDecorator, addParameters } from "@storybook/react";
import { withCreevey } from "creevey";

addParameters({ creevey: { captureElement: "#root" } });
addDecorator(withCreevey());
