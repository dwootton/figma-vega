import * as React from "react";
import * as ReactDOM from "react-dom";
import "./ui.css";
import { processSvg } from "./utils";
//@ts-ignore
import embed from 'vega-embed';
const App = () => {
    const [svgString, setSvgString] = React.useState('');
    function onCreate() {
        parent.postMessage({
            pluginMessage: {
                type: "create",
                object: svgString,
            },
        }, "*"); //
        console.log(processSvg(`<svg width=100 height=100><rect width=10 height=15 x=20 y=50></rect></svg>`));
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
            ] },
    };
    //
    React.useEffect(() => {
        const result = embed('#vis', spec);
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
        React.createElement("button", { id: 'create', onClick: onCreate }, "Create"),
        React.createElement("button", { onClick: onCancel }, "Cancel"),
        React.createElement("h2", null, "Rectangle Creator in dev"),
        React.createElement("div", { id: "vis" })));
};
ReactDOM.render(React.createElement(App, null), document.getElementById("react-page"));
