import React from "react";
import TopBar from "@skbkontur/react-ui/TopBar";
import Logotype from "@skbkontur/react-ui/Logotype";
import Loader from "@skbkontur/react-ui/Loader";
import { CreeveyContext } from "../context";
import { CreeveyAPI } from "../api";
import { TestsTree } from "./TestsTree";

export class CreeveyApp extends React.Component {
  static childContextTypes = CreeveyContext;

  render() {
    return (
      <>
        <TopBar>
          <TopBar.Item>
            <Logotype locale={{ prefix: "C", suffix: "lin" }} suffix="Creevey" />
          </TopBar.Item>
        </TopBar>
        {/* <Loader type="big" active /> */}
        <TestsTree />
      </>
    );
  }
}

CreeveyAPI;
