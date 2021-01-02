import * as React from "react";
import * as ReactDOM from "react-dom";
import * as paper from "paper";
import * as reactRedux from "react-redux";
import store from "./redux/store";
import {addView,editView} from "./redux/actions";
import { Provider, connect } from "react-redux";

//@ts-ignore
import * as svgpath from "svgpath";
//@ts-ignore
import * as pathUtils from "svg-path-utils";
import "./ui.css";
import { processSvg } from "./utils";

import Editor from './components/Editor/Editor';
import Overview from './components/Overview/Overview';
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
const AppWithRedux = ({ views, dispatch }) => {
  // on load, send message to document to find all vega nodes
  const [selectedViewId, setSelectedViewId] = React.useState();
  function onBack() {
    setSelectedViewId(null);
  }
  function onViewSelect(viewId) {
    console.log('moving to selected view!',viewId)
    setSelectedViewId(viewId);
  }
  console.log('views',views);

  function onCreateView(viewData){
    console.log('creating view',JSON.parse(JSON.stringify(viewData)) );
    
    dispatch(addView(viewData));
  }

  function onEditView(id, alteredView) {
    console.log('editing view',id, alteredView)
    dispatch(editView(id, alteredView));

  }

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
      {!selectedViewId && <Overview onViewSelect={onViewSelect} onCreateView={onCreateView} views={views}></Overview>}
      {selectedViewId && (
        <Editor
          onBack={onBack}
          onEditView={onEditView}
          view={views.find((view) => view.viewId === selectedViewId)}></Editor>
      )}
    </div>
  );
};

// export default Todo;

// return all nodes + annotation layers

const mapStateToProps = (state) => {
  console.log('mapping state to props',state);
  const views = state.vegaViews;
  return { views };
};

const App = connect(mapStateToProps)(AppWithRedux);


ReactDOM.render(
  <Provider store={store}>
    {" "}
    <App />{" "}
  </Provider>,
  document.getElementById("react-page")
);
