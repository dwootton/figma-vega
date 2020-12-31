import * as React from "react";
import * as ReactDOM from "react-dom";
//@ts-ignore
import {IconButton} from "react-figma-ui";
//@ts-ignore
import embed from "vega-embed";

const Editor = ({ view, onBack, onEditView }) => {
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
    <div>
      <ToolBar onBack={onBack}></ToolBar>

      <div style={{ display: "flex" }} >
        <VegaSpec
          onCreate={() => onCreate(view.viewId)}
          onFetch={onFetch}
          onPreview={onPreview}></VegaSpec>
        <Visualization errorMessage={message}></Visualization>
      </div>
    </div>
  );
};

const ToolBar = ({onBack}) => {
  return <div> <IconButton onClick={onBack} iconProps={{iconName:'back'}}></IconButton>       <h2>VegaFi</h2>
  </div>;
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

export default Editor;
