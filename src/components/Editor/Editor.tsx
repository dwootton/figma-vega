import * as React from "react";
import * as ReactDOM from "react-dom";
//@ts-ignore
import { IconButton, Input } from "react-figma-ui";
//@ts-ignore
import embed from "vega-embed";


const Editor = ({ view, onBack, onEditView }) => {
  console.log("dywootto views", view);
  const spec = view.visualizationSpec ? view.visualizationSpec : {};
  const [savedSpec,setSavedSpec] = React.useState(spec);
  const viewName = view.viewName ? view.viewName : "";

  const [svgString, setSvgString] = React.useState("");
  const [message, setMessage] = React.useState("");

  function setSpec2(newSpec) {
    onEditView(view.viewId, { visualizationSpec: newSpec });
  }
  function setViewName2(newName) {
    onEditView(view.viewId, { viewName: newName });
  }

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
    // TODO: check if valid vega spec, if not don't create
   const result = embed("#vis", view.visualizationSpec);
    result.then((embedResult) => {
      setSavedSpec(spec);
      parent.postMessage(
        {
          pluginMessage: {
            type: "create",
            vegaSpec: JSON.stringify(spec),
            object: svgString,
            id: visualizationId,
            name: viewName,
          },
        },
        "*"
      );
    }).catch(()=>{
      console.log('invalid vega spec!')
      setMessage("To create a visualization, input a valid vega spec.");

    })
    
  }

  function onPreview() {
    //@ts-ignore
    let specString = document.getElementById("vegaSpec").value;
    try {
      const tempSpec = JSON.parse(specString);
      setMessage("");

      setSpec2(tempSpec);
      //
    } catch (e) {
      setMessage("Not a valid spec");
    }
  }

  React.useEffect(() => {
    const result = embed("#vis", view.visualizationSpec);
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
  }, [view.visualizationSpec]);

  return (
    <div>
      <div style={{display:'flex'}}>
        {" "}
        <IconButton onClick={onBack} style={{'cursor':'pointer'}} iconProps={{ iconName: "back" }}></IconButton>{" "}
        <div>
          {" "}
          <Input
            value={viewName}
            style={{width:'250px', marginLeft:'24px'}}
            placeholder='Enter Visualization Name'
            onChange={(event) => {
              setViewName2(event.target.value);
            }}></Input>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <VegaSpec
          initialSpec={spec}
          onCreate={() => onCreate(view.viewId)}
          onFetch={onFetch}
          onPreview={onPreview}></VegaSpec>
        <Visualization errorMessage={message}></Visualization>
      </div>
    </div>
  );
};

const VegaSpec = ({initialSpec,onCreate, onFetch, onPreview }) => {
  return (
    <div style={{ width: "100%", height: "250px" }}>
      <textarea
        wrap="soft"
        placeholder='Copy Vega Spec here.'
        id='vegaSpec'
        style={{ border: "none", width: "100%", height: "100%", resize: "none",whiteSpace:'nowrap',overflow:'auto', outline:'none' }}
        onChange={onPreview}>{JSON.stringify(initialSpec)}</textarea>
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
