import React from "react";
import ReactDOM from "react-dom";
import { CreeveyApp } from "./CreeveyApp";
import { CreeveyApi } from "./CreeveyApi";

import "./index.css";

ReactDOM.render(
  <CreeveyApi>
    <CreeveyApp />
  </CreeveyApi>,
  document.getElementById("root")
);
