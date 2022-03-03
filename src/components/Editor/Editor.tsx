import * as React from "react";
import * as ReactDOM from "react-dom";
//@ts-ignore
import { store } from "react-notifications-component";

//@ts-ignore
import { Button, Title, Icon } from "react-figma-plugin-ds";

//@ts-ignore
import embed from "vega-embed";

//@ts-ignore
import { ControlledEditor, DiffEditor } from "@monaco-editor/react";
//@ts-ignore
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

const Editor = ({ view, onBack, onEditView }) => {
  const spec = view.visualizationSpec ? view.visualizationSpec : {};
  const annotationSpec = view.annotationSpec ? view.annotationSpec : { marks: [] };

  const visualizationNodeId = view.visualizationNodeId ? view.visualizationNodeId : "";
  const viewName = view.viewName ? view.viewName : "";

  const [svgString, setSvgString] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [unsavedSpec, setUnsavedSet] = React.useState(spec);

  function updateVisualizationSpec(newSpec) {
    console.log("setting viewSpec", view.viewId, viewName, newSpec);
    onEditView(view.viewId, { visualizationSpec: newSpec });
  }

  function setViewName2(newName) {
    onEditView(view.viewId, { viewName: newName });
  }

  function onFetch() {
    // clear current marks
    onEditView(view.viewId, { annotationSpec: { marks: [] } });
    console.log("sending for fetch", view.viewNodeId);
    parent.postMessage(
      {
        pluginMessage: {
          type: "fetch",
          annotationNodeId: view.annotationNodeId,
          viewNodeId: view.viewNodeId,
          viewId: view.viewId,
        },
      },
      "*"
    ); //
  }

  function onFetchSVG() {
    onEditView(view.viewId, { annotationSpec: { marks: [] } });

    parent.postMessage(
      {
        pluginMessage: {
          type: "fetchSVG",
          annotationNodeId: view.annotationNodeId,
          viewNodeId: view.viewNodeId,
          viewId: view.viewId,
        },
      },
      "*"
    ); //
  }

  function onCreate(visualizationId) {
    // TODO: check if valid vega spec, if not don't create
    const result = embed("#vis", view.visualizationSpec);
    result
      .then((embedResult) => {
        console.log("embed result", embedResult);
        if (view.viewNodeId) {
          // update
          parent.postMessage(
            {
              pluginMessage: {
                type: "update",
                vegaSpec: JSON.stringify(spec),
                svgToRender: svgString,
                visualizationNodeId: visualizationNodeId,
                annotationNodeId: view.annotationNodeId,
                viewNodeId: view.viewNodeId,
                viewId: view.viewId,
                viewName: viewName,
              },
            },
            "*"
          );
        } else {
          // create
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
        }
      })
      .catch((err) => {
        console.log("invalid vega spec!", err);
        setMessage("To create a visualization, input a valid vega spec.");
      });
  }

  function onPreview() {
    //@ts-ignore
    let specString = unsavedSpec; //.target.value;//document.getElementById("vegaSpec").value;
    try {
      const tempSpec = JSON.parse(specString);
      setMessage("");
      updateVisualizationSpec(tempSpec);

      //
    } catch (e) {
      setMessage("Not a valid spec");
    }
  }

  React.useEffect(() => {
    console.log("updating vis spec!", JSON.stringify(view.visualizationSpec));

    const result = embed("#vis", view.visualizationSpec);
    result.then((embedResult) => {
      console.log(embedResult);
      console.log(embedResult.view);
      embedResult.view
        .toSVG()
        .then(function (svg) {
          // process svg string
          console.log("in created svg", svg);
          setSvgString(svg);
        })
        .catch(function (err) {
          console.error(err);
        });
    });
  }, [view.visualizationSpec]);

  React.useEffect(() => {
    console.log("in annotation use effect", view.annotationSpec);
    if (view.annotationSpec && view.annotationSpec.marks && view.annotationSpec.marks.length > 0) {
      // merge specs
      const mergedSpec = mergeVisualizationAndAnnotationSpec(
        view.visualizationSpec,
        view.annotationSpec
      );
      console.log("merged!", mergedSpec);

      copyToClipboard(JSON.stringify(mergedSpec, undefined, 2));
      console.log("about to add notification!");
      store.addNotification({
        title: "Annotated Vega Spec Copied!",
        message: (
          <Text
            addToEditor={() => {
              onEditView(view.viewId, { visualizationSpec: mergedSpec });
            }}
          />
        ),
        type: "success",
        insert: "top",
        container: "top-full",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 3000,
          onScreen: true,
        },
      });
    }
  }, [view.annotationSpec]);

  const isSavedToDocument = !!visualizationNodeId;

  return (
    <div>
      <div style={{ display: "flex", "width":"100%","border-bottom": "1px solid #4F4F4F" }}>
        {" "}
        <div style={{ cursor: "pointer" }}>
        <Icon onClick={onBack}  name={"back"}></Icon>{" "}

        </div>
        <div>
          {" "}
          <Title
            size="xlarge"
            className={'viewTitle'}
            styles={{ width: "350px", margin:'0px 0px 0px 24px' }}
            
            >{viewName}</Title>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <VegaSpec
          currentSpec={spec}
          visualizationNodeId={visualizationNodeId}
          annotationSpec={annotationSpec}
          onChange={setUnsavedSet}></VegaSpec>
        <Visualization errorMessage={message}></Visualization>
      </div>
      <div style={{ display: "flex", margin: "8px" }}>
        <Button className={'actionButton left'} id='preview' onClick={onPreview} isSecondary>
          Preview Visualization
        </Button>
     
        <Button className={'actionButton right'} id='fetch' disabled={!isSavedToDocument} onClick={onFetchSVG} isSecondary>
          Get Annotations
        </Button>
        <Button className={'actionButton'} id='create' onClick={() => onCreate(view.viewId)}>
          {isSavedToDocument ? "Update Document" : "Save to Document"}
        </Button>
      </div>
    </div>
  );
};
const Text = ({ addToEditor }) => {
  return (
    <div>
      Updated Vega specification has been copied to your clipboard.{" "}
      <span style={{ textDecoration: "underline" }} onClick={addToEditor}>
        Add to Vega Editor?
      </span>
    </div>
  );
};

function copyToClipboard(text) {
  var dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
}

function mergeVisualizationAndAnnotationSpec(visualizationSpec, annotationSpec) {
  // when annotation spec is changed, update visualization spec
  const specCopy = Object.assign({}, visualizationSpec);

  // merge annotations onto specification
  if (specCopy.marks) {
    for (const mark of annotationSpec.marks) {
      const currentMarkIndex = specCopy.marks.findIndex(
        (existingMark) => JSON.stringify(existingMark) === JSON.stringify(mark)
      );
      if (currentMarkIndex === -1) {
        specCopy.marks.push(mark);
      }
    }
  } else {
    if (annotationSpec.marks && annotationSpec.marks.length > 0) {
      specCopy.marks = annotationSpec.marks;
    }
  }
  return specCopy;
}

const VegaSpec = ({ currentSpec, annotationSpec, visualizationNodeId, onChange }) => {
  const [editor, setEditor] = React.useState(null);
  const [width, setWidth] = React.useState(200);
  const [formattingFunctions, setFormattingFunctions] = React.useState([]);

  React.useEffect(() => {
    if (editor) {
      editor.getAction("editor.action.formatDocument").run();
    }
  }, [currentSpec]);

  function handleEditorDidMount(event, editor) {
    setEditor(editor);
  }
  console.log("resize!", ResizableBox);
  return (
    <div>
      <ResizableBox width={300} height={550} axis={"x"} handleSize={[8, 8]} resizeHandles={["e"]}>
        <ControlledEditor
          language='json'
          editorDidMount={handleEditorDidMount}
          options={{
            formatOnPaste: true,
            minimap: { enabled: false },
            lineNumbers: "off",
            smoothScrolling: true,
            selectionHighlight: false,
            glyphMargin: false,
            folding: false,
            // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
          }}
          value={currentSpec ? JSON.stringify(currentSpec, undefined, 2) : "Paste Vega Spec here"}
          onChange={(ev, value) => {
            onChange(value);
          }}
        />
      </ResizableBox>
    </div>
  );
};

const Visualization = ({ errorMessage }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "550px",
        "border-left": "2px solid whitesmoke",
        overflow: "scroll",
        backgroundColor: "whitesmoke",
      }}>
      {errorMessage && (
        <div style={{ color: "#D8000C", backgroundColor: "#FFBABA", border: 0, padding: "10px" }}>
          {errorMessage}
          {". Showing last successful visualization."}
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          padding: "8px",
          height: "fit-content",
          width: "fit-content",
          pointerEvents: "none",
        }}
        id={"vis"}></div>
    </div>
  );
};

export default Editor;
