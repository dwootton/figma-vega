import * as React from "react";
import * as ReactDOM from "react-dom";
import "./ui.css";
import { processSvg } from "./utils";
//@ts-ignore
import embed from "vega-embed";
const App = () => {
    const [svgString, setSvgString] = React.useState("");
    const [spec, setSpec] = React.useState({});
    const [message, setMessage] = React.useState("");
    console.log(svgString);
    function onFetch() {
        parent.postMessage({
            pluginMessage: {
                type: "fetch",
            },
        }, "*"); //
    }
    function onCreate() {
        parent.postMessage({
            pluginMessage: {
                type: "create",
                object: svgString,
            },
        }, "*"); //
        console.log(processSvg(`<svg width=100 height=100><rect width=10 height=15 x=20 y=50></rect></svg>`));
    }
    function onGenerate() {
        //@ts-ignore
        let specString = document.getElementById("vegaSpec").value; // = "Fifth Avenue, New York City";
        try {
            const tempSpec = JSON.parse(specString);
            setMessage("");
            setSpec(tempSpec);
        }
        catch (e) {
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
    return (React.createElement("div", { style: { width: 500, height: 750 } },
        React.createElement("img", { src: require("./logo.svg") }),
        message,
        React.createElement("button", { id: 'create', onClick: onGenerate }, "Generate Viz"),
        React.createElement("button", { id: 'create', onClick: onCreate }, "Create"),
        React.createElement("button", { id: 'create', onClick: onFetch }, "Fetch"),
        React.createElement("button", { onClick: onCancel }, "Cancel"),
        React.createElement("h2", null, "Rectangle Creator in dev"),
        React.createElement("textarea", { id: 'vegaSpec' }),
        React.createElement("div", { id: 'vis' })));
};
ReactDOM.render(React.createElement(App, null), document.getElementById("react-page"));
