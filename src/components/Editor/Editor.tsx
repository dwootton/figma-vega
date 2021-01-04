import * as React from "react";
import * as ReactDOM from "react-dom";
//@ts-ignore
import { IconButton, Input, Switch } from "react-figma-ui";
//@ts-ignore
import embed from "vega-embed";

//@ts-ignore
import { ControlledEditor, DiffEditor } from "@monaco-editor/react";

const Editor = ({ view, onBack, onEditView }) => {
  console.log("dywootto views", view);
  const spec = view.visualizationSpec ? view.visualizationSpec : {};
  const annotationSpec = view.annotationSpec ? view.annotationSpec : { marks: [] };

  const visualizationNodeId = view.visualizationNodeId ? view.visualizationNodeId : "";
  const viewName = view.viewName ? view.viewName : "";

  const [svgString, setSvgString] = React.useState("");
  const [message, setMessage] = React.useState("");

  function updateVisualizationSpec(newSpec) {
    console.log("setting viewSpec", view.viewId, viewName, newSpec);
    onEditView(view.viewId, { visualizationSpec: newSpec });
  }
  function updateAnnotationSpec(newSpec) {
    console.log("setting viewSpec", view.viewId, viewName, newSpec);
    onEditView(view.viewId, { annotationSpec: newSpec });
  }
  function setViewName2(newName) {
    onEditView(view.viewId, { viewName: newName });
  }

  function onFetch() {
    const textToWrite = 'Look it copied'!;
    //    navigator.clipboard.writeText(textToWrite);

    var dummy = document.createElement("input");
  document.body.appendChild(dummy);
  dummy.setAttribute("value", textToWrite);
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
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

  function onCreate(visualizationId) {
    // TODO: check if valid vega spec, if not don't create
    const result = embed("#vis", view.visualizationSpec);
    result
      .then((embedResult) => {
        console.log("embed result", embedResult);
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
      })
      .catch((err) => {
        console.log("invalid vega spec!", err);
        setMessage("To create a visualization, input a valid vega spec.");
      });
  }

  function onPreview(value, updateType) {
    console.log("preview value", value);

    //@ts-ignore
    let specString = value; //.target.value;//document.getElementById("vegaSpec").value;
    try {
      const tempSpec = JSON.parse(specString);
      setMessage("");
      if (updateType === "VISUALIZATION") {
        updateVisualizationSpec(tempSpec);
      } else if (updateType === "ANNOTATIONS") {
        updateAnnotationSpec(tempSpec);
      }
      //
    } catch (e) {
      setMessage("Not a valid spec");
    }
  }

  React.useEffect(() => {
    console.log("updating vis spec!", JSON.stringify(view.visualizationSpec));
    const mergedSpec = mergeVisualizationAndAnnotationSpec(
      view.visualizationSpec,
      view.annotationSpec
    );
    console.log("merged spec", mergedSpec, view.visualizationSpec, view.annotationSpec);
    const result = embed("#vis", mergedSpec);
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
  }, [view.visualizationSpec, view.annotationSpec]);

  return (
    <div>
      <div style={{ display: "flex" }}>
        {" "}
        <IconButton
          onClick={onBack}
          style={{ cursor: "pointer" }}
          iconProps={{ iconName: "back" }}></IconButton>{" "}
        <div>
          {" "}
          <Input
            value={viewName}
            style={{ width: "250px", marginLeft: "24px" }}
            placeholder='Enter Visualization Name'
            onChange={(event) => {
              setViewName2(event.target.value);
            }}></Input>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <VegaSpec
          currentSpec={spec}
          onCreate={() => onCreate(view.viewId)}
          visualizationNodeId={visualizationNodeId}
          annotationSpec={annotationSpec}
          onFetch={onFetch}
          onPreview={onPreview}></VegaSpec>
        <Visualization errorMessage={message}></Visualization>
      </div>
    </div>
  );
};

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

const VegaSpec = ({
  currentSpec,
  annotationSpec,
  visualizationNodeId,
  onCreate,
  onFetch,
  onPreview,
}) => {
  const [formattingFunctions, setFormattingFunctions] = React.useState([]);

  const isSavedToDocument = !!visualizationNodeId;

  function handleEditorDidMount(event, editor) {
    const handler = editor.onDidChangeModelDecorations((_) => {
      handler.dispose();
      const copy = Object.assign([], formattingFunctions);
      copy.push(editor.getAction("editor.action.formatDocument").run);
      setFormattingFunctions(copy);
    });
  }

  return (
    <div style={{ width: "100%", height: "250px" }}>
      <span>Vega Spec for Visualization:</span>
      <ControlledEditor
        width='300'
        height='300'
        language='json'
        editorDidMount={handleEditorDidMount}
        options={{ formatOnPaste: true, minimap: { enabled: false },lineNumbers: 'off',
        glyphMargin: false,
        folding: false,
        // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0
       }}
        value={JSON.stringify(currentSpec,undefined,2)}
        onChange={(ev, value) => {
          onPreview(value, "VISUALIZATION");
          formattingFunctions.forEach((func) => {
            func();
          });
        }}
      />
      <span>Vega Spec for Annotations:</span>
      <ControlledEditor
        width='300'
        height='100'
        language='json'
        editorDidMount={handleEditorDidMount}
        options={{ formatOnPaste: true, minimap: { enabled: false } ,lineNumbers: 'off',
        glyphMargin: false,
        folding: false,
        // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0
      }}
        value={JSON.stringify(annotationSpec,undefined,2)}
        onChange={(ev, value) => {
          onPreview(value, "ANNOTATIONS");
          formattingFunctions.forEach((func) => {
            func();
          });
        }}
      />

      <button id='create' onClick={onCreate}>
        {isSavedToDocument ? "Update" : "Create"}
      </button>
      <button id='fetch' disabled={!isSavedToDocument} onClick={onFetch}>
        Fetch
      </button>
    </div>
  );
};

const Visualization = ({ errorMessage }) => {
  return (
    <div style={{ width: "100%", height: "250px", overflow:"scroll" }}>
      {errorMessage && (
        <div style={{ color: "#D8000C", backgroundColor: "#FFBABA", border: 0, padding: "10px" }}>
          {errorMessage}
          {". Showing last successful visaulization."}
        </div>
      )}

      <image id='vis' style={{ width: "250px", height: "400px" }}></image>
    </div>
  );
};

export default Editor;
