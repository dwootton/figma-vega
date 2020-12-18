import * as React from "react";
import * as ReactDOM from "react-dom";
import "./ui.css";
import { processSvg } from "./utils";
//@ts-ignore
import { VegaLite } from "react-vega";
//@ts-ignore
import embed from 'vega-embed';

declare function require(path: string): any;

const App = () => {
    const [svgString,setSvgString] = React.useState('');
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

  function onCancel() {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  }
  const barData = {
    table: ,
  };
  const spec = {
    render: "svg",
    width: 400,
    height: 200,
    mark: "bar",
    encoding: {
      x: { field: "a", type: "ordinal" },
      y: { field: "b", type: "quantitative" },
    },
    data: { values: [
        { a: "A", b: 28 },
        { a: "B", b: 55 },
        { a: "C", b: 43 },
        { a: "D", b: 91 },
        { a: "E", b: 81 },
        { a: "F", b: 53 },
        { a: "G", b: 19 },
        { a: "H", b: 87 },
        { a: "I", b: 52 },
      ] }, // note: vega-lite data attribute is a plain object instead of an array
  };

  

  //

  React.useEffect(() => {
    const result =  embed('#vis', spec);
    result.then((embedResult)=>{
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

    })

   
  });
  return (
    <div style={{width:500,height:750}}>
      <img src={require("./logo.svg")} />
      <button id='create' onClick={onCreate}>
        Create
      </button>
      <button onClick={onCancel}>Cancel</button>
      <h2>Rectangle Creator in dev</h2>
      <div id="vis"></div>
      
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("react-page"));
