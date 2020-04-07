import { addDecorator, addParameters } from "@storybook/angular";
import { withCreevey } from "creevey";

addParameters({ creevey: { captureElement: "#root" } });
addDecorator(withCreevey());
