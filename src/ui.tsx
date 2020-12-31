import * as React from "react";
import * as ReactDOM from "react-dom";
import * as paper from "paper";
import * as reactRedux from "react-redux";
import store from "./redux/store";
import {} from "./redux/actions";
import { Provider, connect } from "react-redux";

//@ts-ignore
import * as svgpath from "svgpath";
//@ts-ignore
import * as pathUtils from "svg-path-utils";
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
  startUpViews: "startUpViews",
  finishedCreate: "finishedCreate",
});

declare function require(path: string): any;

onmessage = (event) => {
  if (event.data.pluginMessage.type === pluginTypes.modifyPath) {
    const vectorPaths = event.data.pluginMessage.data;
    console.log("vector paths", vectorPaths);

    let pathString: string = vectorPaths.map((path) => path.data).join(" ");
    // go through, break up by Z
    // invert every other path
    // join.
    //

    // if a object must have been outlined, invert its path for appropriate styling despite "even-odd " fill rule
    if (event.data.pluginMessage.outlinedStroke) {
      let utils = new pathUtils.SVGPathUtils();
      const paths = pathString.split(/[zZ]/).filter((path) => path !== "");

      // for every other path, inverse it
      for (let i = 0; i < paths.length; i = i + 2) {
        paths[i] = utils.inversePath(paths[i]);
      }

      pathString = paths.join("Z ");
    }

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
          viewNodeId: event.data.pluginMessage.viewNodeId,
          nodeId: event.data.pluginMessage.nodeId,
          object: scaledSVGString,
        },
      },
      "*"
    );
  } else if (event.data.pluginMessage.type === pluginTypes.finishedMarks) {
    const specString = event.data.pluginMessage.specString;
    console.log(event.data.pluginMessage.specString);
    // I can add this to update redux state
  } else if (event.data.pluginMessage.type === pluginTypes.startUpViews) {
    const viewsData = event.data.pluginMessage.viewsData;
    console.log("views data", viewsData);
    for (const view of viewsData) {
      const addAction = { type: "ADD_VEGA_VIEW", payload: { viewData: view } };

      store.dispatch(addAction);
    }

    const propertiesToExtract = [
      "visualizationSpec",
      "annotationSpec",
      "vegaPaddingWidth",
      "vegaPaddingHeight",
      "annotationsId",
      "visualizationId",
    ];

    // add views data to redux store.
  } else if (event.data.pluginMessage.type === pluginTypes.finishedCreate) {
    // add the figma node id for the vega view
    const viewNodeId = event.data.pluginMessage.viewNodeId;
    const annotationsNodeId = event.data.pluginMessage.annotationsNodeId;
    const visualizationNodeId = event.data.pluginMessage.visualizationNodeId;

    const viewId = event.data.pluginMessage.viewId;

    console.log("created Node Id", viewId, viewNodeId);
    const alterActions = {
      type: "ALTER_VEGA_VIEW",
      payload: { viewId: viewId, view: { viewNodeId: viewNodeId, annotationsNodeId: annotationsNodeId,visualizationNodeId:visualizationNodeId} },
    };

    store.dispatch(alterActions);
  }

  // read the svg string
  // simplify it
  // translate it to the middle
  //
};
const channel = new MessageChannel();
const VIEW_ENUM = Object.freeze({ OVERVIEW: "OVERVIEW", VIEW: "VIEW" });
const AppWithRedux = ({ views }) => {
  // on load, send message to document to find all vega nodes
  const [selectedViewId, setSelectedViewId] = React.useState();
  function onBack() {
    setSelectedViewId(null);
  }
  function onViewSelect(viewId) {
    setSelectedViewId(viewId);
  }

  function onEditView(id, alteredView) {}

  // fetch vega views from the scenegraph and populate redux store.
  React.useEffect(() => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "startUp",
        },
      },
      "*"
    );
  }, []);

  return (
    <div>
      {!selectedViewId && <Overview onViewSelect={onViewSelect} views={views}></Overview>}
      {selectedViewId && (
        <Editor
          onBack={onBack}
          onEditView={onEditView}
          view={views.find((view) => view.viewId === selectedViewId)}></Editor>
      )}
    </div>
  );
};

const OverviewPresent = ({ onViewSelect, views }) => {
  return <div></div>;
};

// export default Todo;
const Overview = connect(null, { toggleTodo })(OverviewPresent);

// return all nodes + annotation layers

const mapStateToProps = (state) => {
  const views = state.views;
  return { views };
};

const App = connect(mapStateToProps)(AppWithRedux);

const Editor = ({ view, onBack }) => {
  console.log("dywootto views", view);
  const [svgString, setSvgString] = React.useState("");
  const [spec, setSpec] = React.useState({});
  const [message, setMessage] = React.useState("");
  console.log(svgString);
  function onFetch() {
    parent.postMessage(
      {
        pluginMessage: {
          type: "fetch",
          viewId: view.viewId,
          object: svgString,
        },
      },
      "*"
    ); //
  }
  function onCreate(visualizationId) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "create",
          vegaSpec: JSON.stringify(spec),
          object: svgString,
          id: visualizationId,
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
        <VegaSpec
          onCreate={() => onCreate("312798")}
          onFetch={onFetch}
          onPreview={onPreview}></VegaSpec>
        <Visualization errorMessage={message}></Visualization>
      </div>
    </div>
  );
};

const VegaSpec = ({ onCreate, onFetch, onPreview }) => {
  return (
    <div style={{ width: "100%", height: "250px" }}>
      <textarea
        placeholder='Copy Vega Spec here.'
        id='vegaSpec'
        style={{ border: "none", width: "100%", height: "100%", resize: "none" }}
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
    <div style={{ width: "100%", height: "250px" }}>
      {errorMessage && (
        <div style={{ color: "#D8000C", backgroundColor: "#FFBABA", border: 0, padding: "10px" }}>
          {errorMessage}
          {". Showing last successful visaulization."}
        </div>
      )}

      <image id='vis' style={{ width: "250px" }}></image>
    </div>
  );
};

ReactDOM.render(
  <Provider store={store}>
    {" "}
    <App />{" "}
  </Provider>,
  document.getElementById("react-page")
);
