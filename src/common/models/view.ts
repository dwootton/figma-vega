class View {
  viewId: string; // internal property for identifying ui
  viewName : string; // display name for the view
  viewNodeId: string; // property for identifying on figma scenegraph
  visualizationSpec: string; // stringified JSON specification of Vega Vis
  annotationSpec: string; // stringified JSON specification for annotations
  vegaPaddingWidth: string; // width of padding inherent in vega visualization
  vegaPaddingHeight: string; // height of padding inherent in vega visualization
  annotationsNodeId: string; // property for identifying annotations on figma scenegraph
  visualizationNodeId: string; // property for identifying annotations on figma scenegraph

  constructor(viewName) {
    this.viewId = makeID(5);
    this.viewName = viewName ? viewName :'';
    this.viewNodeId = null;
    this.visualizationSpec = null;
    this.annotationSpec = null;
    this.vegaPaddingWidth = null;
    this.vegaPaddingHeight = null;
    this.annotationsNodeId = null;
    this.visualizationNodeId = null;
  }
}
function makeID(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

export default View;