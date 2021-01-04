class View {
  viewId: string; // internal property for identifying ui
  viewName : string; // display name for the view
  viewNodeId: string; // property for identifying on figma scenegraph
  visualizationSpec: string; // stringified JSON specification of Vega Vis
  annotationSpec: string; // stringified JSON specification for annotations
  vegaPaddingWidth: string; // width of padding inherent in vega visualization
  vegaPaddingHeight: string; // height of padding inherent in vega visualization
  annotationNodeId: string; // property for identifying annotations on figma scenegraph
  visualizationNodeId: string; // property for identifying annotations on figma scenegraph

  constructor(viewObject) {
    this.viewId = viewObject.viewId? viewObject.viewId: makeID(5);
    this.viewName = viewObject.viewName ? viewObject.viewName :'';
    this.viewNodeId = viewObject.viewNodeId? viewObject.viewNodeId: null;
    this.visualizationSpec = viewObject.visualizationSpec? JSON.parse(viewObject.visualizationSpec): {};
    this.annotationSpec = viewObject.annotationSpec? JSON.parse(viewObject.annotationSpec): {marks:[]};
    this.vegaPaddingWidth = viewObject.vegaPaddingWidth? viewObject.vegaPaddingWidth: null;
    this.vegaPaddingHeight = viewObject.vegaPaddingHeight? viewObject.vegaPaddingHeight: null;
    this.annotationNodeId = viewObject.annotationNodeId? viewObject.annotationNodeId: null;
    this.visualizationNodeId = viewObject.visualizationNodeId? viewObject.visualizationNodeId: null;
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