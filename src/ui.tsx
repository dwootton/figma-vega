import * as React from "react";
import * as ReactDOM from "react-dom";
import * as paper from 'paper';
//@ts-ignore
import * as svgpath from 'svgpath';

import "./ui.css";
import { processSvg } from "./utils";
//@ts-ignore
import { VegaLite } from "react-vega";
//@ts-ignore
import embed from "vega-embed";
import { Path } from "paper";

const pluginTypes = Object.freeze({
  "modifyPath":"modifyPath"
})



declare function require(path: string): any;
onmessage = (event) => {
  if(event.data.pluginMessage.type === pluginTypes.modifyPath){
    const vectorPaths = event.data.pluginMessage.data;
    paper.setup('');
    console.log(vectorPaths);
    console.log(paper);
    //
    const pathString : string = vectorPaths.map(path=>path.data).join(' ');
    console.log(pathString);

    let parsedPath = svgpath(pathString);
    console.log('untouched path data',parsedPath);
    const bounds = parsedPath.toBox();
    const width = bounds.maxX-bounds.minX;
    const height = bounds.maxY-bounds.minY;
    const maxDimension = Math.max(width, height);
    parsedPath = parsedPath.translate(-width/2,-height/2).scale(2 / maxDimension)   
    const scaledSVGString = parsedPath.toString();
    console.log(scaledSVGString);
    parent.postMessage(
      {
        pluginMessage: {
          type: "sendScaled",
          nodeId:event.data.pluginMessage.nodeId,
          object: scaledSVGString

        },
      },
      "*"
    ); //*/

  }
  console.log("got this from the plugin code", event.data)
  // read the svg string 
  // simplify it
  // translate it to the middle 
  // 

}

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
          object: svgString

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
