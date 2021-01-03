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
const createSVG = `<svg width="95" height="109" viewBox="0 0 95 109" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="1.5" y="1.5" width="81" height="95" fill="#C4C4C4" stroke="#595959" stroke-width="3"/>
<circle cx="82.5" cy="96.5" r="11" fill="#C4C4C4" stroke="#595959" stroke-width="3"/>
<rect x="90" y="95" width="3" height="15" transform="rotate(90 90 95)" fill="#595959"/>
<rect x="90" y="95" width="3" height="15" transform="rotate(90 90 95)" fill="#595959"/>
<rect x="90" y="95" width="3" height="15" transform="rotate(90 90 95)" fill="#595959"/>
<rect x="81" y="89" width="3" height="15" fill="#595959"/>
<rect x="81" y="89" width="3" height="15" fill="#595959"/>
<rect x="81" y="89" width="3" height="15" fill="#595959"/>
<rect x="16" y="37.6808" width="13" height="45.3191" fill="#595959"/>
<rect x="36" y="12" width="13" height="71" fill="#595959"/>
<rect x="56" y="49.7659" width="13" height="33.234" fill="#595959"/>
</svg>`

const Overview = ({ onViewSelect, views, onCreateView }) => {
  return (
    <div>
      <HorizontalCard
        onClick={() => {
            const newView = new View(`Visualization ${views.length}`);
            // create view in redux store
            onCreateView(newView)
            // select view
            onViewSelect(newView.viewId);
    }}
        svgString={createSVG}
        cardTitle={'Create a visualization'}
        cardDescription={'Create a new visualization from a vega spec. Add your visualization and annotate it ✏'}
        ></HorizontalCard>
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
      <HorizontalCard
        onClick={() => onViewSelect(view.viewId)}
        cardDescription={'Edit an existing visualization and vega-fi its annotations.'}
        cardTitle={view.viewName.slice(0, 30)}
       ></HorizontalCard>
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
  cardDescription ='',
}) => {
  return (
    <div className={"card-body"} onClick={onClick}>
      <img
        className={"card-image"}
        alt={"Visualization of the vega view created by the user."}
        height={50}
        width={50}
        src={`data:image/svg+xml;base64,${btoa(svgString)}`}
      />
      <div className={"card-title"}><p>{cardTitle}</p></div>
      <div className={"card-description"}><p>{cardDescription}</p></div>
    </div>
  );
};

export default Overview;
