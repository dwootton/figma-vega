import * as React from "react";
import * as ReactDOM from "react-dom";
//@ts-ignore
import { IconButton, Input,Switch } from "react-figma-ui";
//@ts-ignore
import embed from "vega-embed";

//@ts-ignore
import  { ControlledEditor, DiffEditor } from "@monaco-editor/react";
import { view } from "paper";



const Editor = ({ view, onBack, onEditView }) => {
  console.log("dywootto views", view);
  const spec = view.visualizationSpec ? view.visualizationSpec : {};
  const visualizationNodeId = view.visualizationNodeId ? view.visualizationNodeId : '';
  const [savedSpec,setSavedSpec] = React.useState(spec);
  const viewName = view.viewName ? view.viewName : "";

  const [svgString, setSvgString] = React.useState("");
  const [message, setMessage] = React.useState("");

  function setSpec2(newSpec) {
    console.log('setting viewSpec',view.viewId,viewName)
    onEditView(view.viewId, { visualizationSpec: newSpec });
  }
  function setViewName2(newName) {
    onEditView(view.viewId, { viewName: newName });
  }

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
      console.log('embed result',embedResult);
      setSavedSpec(spec);
      parent.postMessage(
        {
          pluginMessage: {
            type: "create",
            vegaSpec: JSON.stringify(spec),
            svgToRender: svgString,
            viewId: visualizationId,
            name: viewName,
          },
        },
        "*"
      );
    }).catch((err)=>{
      console.log('invalid vega spec!',err)
      setMessage("To create a visualization, input a valid vega spec.");

    })
    
  }

  function onPreview(value) {
    console.log('preview value',JSON.stringify(value));

    //@ts-ignore
    let specString = value//.target.value;//document.getElementById("vegaSpec").value;
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
          currentSpec={spec}
          savedSpec={savedSpec}
          onCreate={() => onCreate(view.viewId)}
          visualizationNodeId={visualizationNodeId}
          annotationSpec={{}}
          onFetch={onFetch}
          onPreview={onPreview}></VegaSpec>
        <Visualization errorMessage={message}></Visualization>
      </div>
    </div>
  );
};

const VegaSpec = ({currentSpec,savedSpec,annotationSpec,visualizationNodeId,onCreate, onFetch, onPreview }) => {
  const [showOriginal,setShowOriginal] = React.useState(false);
  function toggleShowOriginal(){
    setShowOriginal(!showOriginal);
  }
  return (
    <div style={{ width: "100%", height: "250px" }}>
      {/*<Switch id="originalSwitch" checked={showOriginal} onChange={toggleShowOriginal}>Show Original</Switch>

      <textarea
        wrap="soft"
        placeholder='Copy Vega Spec here.'
        id='vegaSpec'
        style={{ border: "none", width: "100%", height: "100%", resize: "none",whiteSpace:'nowrap',overflow:'auto', outline:'none' }}
     onChange={onPreview}>{JSON.stringify(initialSpec)}</textarea>
     { showOriginal &&  <DiffEditor
        width="300"
        height="400"
        language="json"
        options={{	renderSideBySide: false,enableSplitViewResizing: false , readOnly:true  }}
        original={JSON.stringify(savedSpec)}
        value={JSON.stringify(currentSpec, undefined, 2)}
      />}*/}
       {!showOriginal &&  <ControlledEditor
        width="300"
        height="400"
        language="json"
        options={{minimap:{enabled:false}}}
        value={JSON.stringify(currentSpec)}
        onChange={(ev,value)=>onPreview(value)}
      />}
    
      <button id='create' onClick={onCreate}>
        {visualizationNodeId? 'Update':'Create'}
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
