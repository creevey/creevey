import React from "react";

import { BlendView, SideBySideView, SlideView, SwapView } from "../src/client/ImagesView";

import octocatExpect from "./fixtures/octocat-expect.png";
import octocatDiff from "./fixtures/octocat-diff.png";
import octocatActual from "./fixtures/octocat-actual.png";

export default { title: "ImagesViews" };

export const Blend = () => <BlendView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />;
export const SideBySide = () => <SideBySideView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />;
export const Slide = () => <SlideView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />;
export const Swap = () => <SwapView expect={octocatExpect} diff={octocatDiff} actual={octocatActual} />;
