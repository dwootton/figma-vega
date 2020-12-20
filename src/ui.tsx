import * as React from "react";
import * as ReactDOM from "react-dom";
import "./ui.css";
import { processSvg } from "./utils";
//@ts-ignore
import { VegaLite } from "react-vega";
//@ts-ignore
import embed from "vega-embed";

declare function require(path: string): any;

const App = () => {
  const [svgString, setSvgString] = React.useState("");
  const [spec, setSpec] = React.useState({});
  const [message, setMessage] = React.useState("");
  console.log(svgString);
  function onFetch(){
    parent.postMessage(
      {
        pluginMessage: {
          type: "fetch",
          currentVega: svgString

        },
      },
      "*"
    ); //
  }
  function onCreate() {
    parent.postMessage(
      {
        pluginMessage: {
          type: "create",
          object: svgString,
        },
      },
      "*"
    ); //
    console.log(
      processSvg(`<svg width=100 height=100><rect width=10 height=15 x=20 y=50></rect></svg>`)
    );
  }

  function onGenerate() {
    //@ts-ignore
    let specString = document.getElementById("vegaSpec").value; // = "Fifth Avenue, New York City";
    try {
      const tempSpec = JSON.parse(specString);
      setMessage("");

      setSpec(tempSpec);
    } catch (e) {
      setMessage("Not a valid spec");
    }
  }

  function onCancel() {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  }

  React.useEffect(() => {
    const result = embed("#vis", spec);
    result.then((embedResult) => {
      console.log(embedResult.view);
      embedResult.view
        .toSVG()
        .then(function (svg) {
          // process svg string
          console.log("YOUR SVG STRING", svg);

          setSvgString(svg);
        })
        .catch(function (err) {
          console.error(err);
        });
    });
  });

  return (
    <div style={{ width: 500, height: 750 }}>
      <img src={require("./logo.svg")} />
      {message}
      <button id='create' onClick={onGenerate}>
        Generate Viz
      </button>
      <button id='create' onClick={onCreate}>
        Create
      </button>
      <button id='create' onClick={onFetch}>
        Fetch
      </button>
      <button onClick={onCancel}>Cancel</button>
      <h2>Rectangle Creator in dev</h2>
      <textarea id='vegaSpec'></textarea>
      <div id='vis'></div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("react-page"));
