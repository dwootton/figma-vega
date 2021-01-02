import * as React from "react";
//@ts-ignore
import { IconButton, Button } from "react-figma-ui";
import View from "../../common/models/view";
interface IView {
  viewId: string; // internal property for identifying ui
  viewName: string; // internal property for identifying ui
  viewNodeId: string; // property for identifying on figma scenegraph
  visualizationSpec: string; // stringified JSON specification of Vega Vis
  annotationSpec: string; // stringified JSON specification for annotations
  vegaPaddingWidth: string; // width of padding inherent in vega visualization
  vegaPaddingHeight: string; // height of padding inherent in vega visualization
  annotationsNodeId: string; // property for identifying annotations on figma scenegraph
  visualizationNodeId: string; // property for identifying annotations on figma scenegraph
}

const Overview = ({ onViewSelect, views, onCreateView }) => {
  return (
    <div>
      <IconButton
        onClick={() => onCreateView(new View())}
        iconProps={{ iconName: "plus" , width:50,height:50}}></IconButton>
      <Gallery views={views} onViewSelect={onViewSelect}></Gallery>
    </div>
  );
};

const Gallery = ({ views, onViewSelect }) => {
  return (
    <div>
      {views &&
        views.map((view) => {
          return <GalleryItem view={view} onViewSelect={onViewSelect}></GalleryItem>;
        })}
    </div>
  );
};

const GalleryItem = ({ view, onViewSelect }) => {
  return (
    <div>
      <Button onClick={() => onViewSelect(view.viewId)}>{view.viewId}</Button>
    </div>
  );
};

export default Overview;
