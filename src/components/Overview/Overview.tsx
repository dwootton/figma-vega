import * as React from "react";
//@ts-ignore
import  {IconButton, Button} from "react-figma-ui";

const Overview = ({ onViewSelect, views, onCreateView }) => {
  return (
    <div>
      <IconButton onClick={onCreateView} iconProps={{iconName:'plus'}}></IconButton>
        <Gallery views={views} onViewSelect={onViewSelect}></Gallery>
    </div>
  );
};

const Gallery = ({views,onViewSelect})=>{
    return <div>
        {views.map(view=>{
            return <GalleryItem view={view} onViewSelect={onViewSelect}></GalleryItem>
})}
    </div>
}

const GalleryItem = ({view, onViewSelect}) =>{
    return <div>
        <Button onClick={()=>onViewSelect(view.viewId)}>{view.viewId}</Button>
    </div>
}

export default Overview;
