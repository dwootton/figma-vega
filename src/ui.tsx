import * as React from "react";
import * as ReactDOM from "react-dom";
import * as paper from "paper";
//@ts-ignore
import * as svgpath from "svgpath";

import "./ui.css";
import { processSvg } from "./utils";
//@ts-ignore
import { VegaLite } from "react-vega";
//@ts-ignore
import embed from "vega-embed";
import { Path } from "paper";

const pluginTypes = Object.freeze({
  modifyPath: "modifyPath",
  finishedMarks: "finishedMarks",
});

declare function require(path: string): any;
onmessage = (event) => {
  if (event.data.pluginMessage.type === pluginTypes.modifyPath) {
    const vectorPaths = event.data.pluginMessage.data;
    paper.setup("");
    console.log(vectorPaths);
    console.log(paper);
    //
    const pathString: string = vectorPaths.map((path) => path.data).join(" ");
    console.log(pathString);

    let parsedPath = svgpath(pathString);
    console.log("untouched path data", parsedPath);
    const bounds = parsedPath.toBox();
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const maxDimension = Math.max(width, height);
    parsedPath = parsedPath.translate(-width / 2, -height / 2).scale(2 / maxDimension);
    const scaledSVGString = parsedPath.toString();
    console.log(scaledSVGString);
    parent.postMessage(
      {
        pluginMessage: {
          type: "sendScaled",
          nodeId: event.data.pluginMessage.nodeId,
          object: scaledSVGString,
        },
      },
      "*"
    );
  } else if (event.data.pluginMessage.type === pluginTypes.finishedMarks) {
    const specString = event.data.pluginMessage.specString;
    navigator.clipboard.writeText(specString);
  }

  // read the svg string
  // simplify it
  // translate it to the middle
  //
};

const App = () => {
  const [svgString, setSvgString] = React.useState("");
  const [spec, setSpec] = React.useState({});
  const [message, setMessage] = React.useState("");
  console.log(svgString);
  function onFetch() {
    parent.postMessage(
      {
        pluginMessage: {
          type: "fetch",
          object: svgString,
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
    );
  }

  function onPreview() {
    //@ts-ignore
    let specString = document.getElementById("vegaSpec").value;
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
      console.log(embedResult);
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
  }, [spec]);

  return (
    <div style={{ width: 500, height: 300 }}>
      <img src={require("./logo.svg")} />
      <h2>VegaFi</h2>

      <div style={{ display: "flex" }}>
        <VegaSpec onCreate={onCreate} onFetch={onFetch} onPreview={onPreview}></VegaSpec>
        <Visualization errorMessage={message}></Visualization>
      </div>

    </div>
  );
};
const VegaSpec = ({ onCreate, onFetch, onPreview }) => {
  return (
    <div style={{'width':'100%','height':'250px'}}>
      <textarea
      placeholder='Copy Vega Spec here.'
        id='vegaSpec'
        style={{ border:'none', width: "100%", height: "100%", resize:"none" }}
        onChange={onPreview}></textarea>
      <button id='create' onClick={onCreate}>
        Create
      </button>
      <button id='create' onClick={onFetch}>
        Fetch
      </button>
    </div>
  );
};
const Visualization = ({ errorMessage }) => {
  return (
    <div style={{width:'100%',height:'250px'}}>
      {errorMessage && (
        <div style={{ color: "#D8000C", backgroundColor: "#FFBABA", border: 0, padding: "10px" }}>
          {errorMessage}
          {". Showing last successful visaulization."}
        </div>
      )}

        <image id='vis' style={{ width: "250px"}}></image>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("react-page"));
