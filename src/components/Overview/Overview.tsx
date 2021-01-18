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
  annotationNodeId: string; // property for identifying annotations on figma scenegraph
  visualizationNodeId: string; // property for identifying annotations on figma scenegraph
}
const createSVG = `
<svg width="146" height="163" viewBox="0 0 146 163" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="146" height="163" fill="white" fill-opacity="0.01"/>
<rect x="64" y="31" width="17" height="102" fill="#C4C4C4"/>
<rect x="123.5" y="73.5" width="17" height="102" transform="rotate(90 123.5 73.5)" fill="#C4C4C4"/>
</svg>
`;


const Overview = ({ onViewSelect, views, onCreateView }) => {
  return (
    <ul style={{ "list-style": "none" , margin:'auto', width:300}}>
      <HorizontalCard
        onClick={() => {
          const newView = new View({ viewName: `Visualization ${views.length}` });
          // create view in redux store
          onCreateView(newView);
          // select view
          onViewSelect(newView.viewId);
        }}
        svgString={createSVG}
        cardTitle={"Create a visualization"}
        cardDescription={
          "Create a new visualization from a vega spec. Add your visualization and annotate it ✏"
        }></HorizontalCard>
      <Gallery views={views} onViewSelect={onViewSelect}></Gallery>
    </ul>
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
      <HorizontalCard
        onClick={() => onViewSelect(view.viewId)}
        cardDescription={"Edit an existing visualization and vega-fi its annotations."}
        cardTitle={view.viewName.slice(0, 30)}></HorizontalCard>
    </div>
  );
};

const HorizontalCard = ({
  onClick,
  svgString = `<svg width="53" height="89" viewBox="0 0 53 89" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect y="32.1915" width="13" height="56.8085" fill="#595959"/>
  <rect x="20" width="13" height="89" fill="#595959"/>
  <rect x="40" y="47.3405" width="13" height="41.6596" fill="#595959"/>
  </svg>  
`,
  cardTitle,
  cardDescription = "",
}) => {
  return (
    <li>
      <div className={"card-body"} onClick={onClick}>
        <img
          className={"card-image"}
          alt={"Visualization of the vega view created by the user."}
          height={50}
          width={50}
          src={`data:image/svg+xml;base64,${btoa(svgString)}`}
        />
        <div className={"card-title"}>
          <p>{cardTitle}</p>
        </div>
        <div className={"card-description"}>
          <p>{cardDescription}</p>
        </div>
      </div>
    </li>
  );
};

export default Overview;
