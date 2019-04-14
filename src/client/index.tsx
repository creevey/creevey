import React from "react";
import ReactDOM from "react-dom";

const App = (): JSX.Element => <div>{"Hello React"}</div>;

ReactDOM.render(<App />, document.getElementById("root"));

const ws = new WebSocket(`ws://${window.location.host}`);
const logger = (m: MessageEvent) => console.log(JSON.parse(m.data));
ws.addEventListener("message", logger);

window.ws = ws;
