import React from "react";

import { storiesOf } from "@storybook/react";

import { BlendView, SideBySideView, SlideView, SwapView } from "../src/client/ImagesView";

import octocatExpect from "./fixtures/octocat-expect.png";
import octocatDiff from "./fixtures/octocat-diff.png";
import octocatActual from "./fixtures/octocat-actual.png";

storiesOf("ImagesView", module)
  .add("BlendView", () => <BlendView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />)
  .add("SideBySideView", () => <SideBySideView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />)
  .add("SlideView", () => <SlideView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />)
  .add("SwapView", () => <SwapView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />);
