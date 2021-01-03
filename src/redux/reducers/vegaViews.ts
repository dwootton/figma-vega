import { ADD_VEGA_VIEW, ALTER_VEGA_VIEW ,DELETE_VEGA_VIEW} from "./../actionTypes";

const initialState : IView[] = [];

interface IView {
    viewId: string; // internal property for identifying ui
    viewNodeId: string; // property for identifying on figma scenegraph
    visualizationSpec: string; // stringified JSON specification of Vega Vis
    annotationSpec: string; // stringified JSON specification for annotations
    vegaPaddingWidth:string; // width of padding inherent in vega visualization 
    vegaPaddingHeight:string;// height of padding inherent in vega visualization 
    annotationNodeId:string; // property for identifying annotations on figma scenegraph
    visualizationNodeId:string; // property for identifying annotations on figma scenegraph
}

export default function(state = initialState, action) {
  switch (action.type) {
    case ADD_VEGA_VIEW: {  
        console.log('adding vega view',JSON.stringify(action),JSON.stringify(state));

      return [
        ...state,
        
            action.payload.viewData
        
       
      ];
    }
    case ALTER_VEGA_VIEW: {
        
      const { viewId, alteredView } = action.payload;
      const currentViewsCopy = [...state];
      const viewIndex = currentViewsCopy.findIndex(view=>view.viewId === viewId);
      console.log(currentViewsCopy,viewId, alteredView,action)
      if(viewIndex > -1){
        const copyValue = Object.assign({},currentViewsCopy[viewIndex])
        currentViewsCopy[viewIndex] = Object.assign(copyValue,alteredView);
      }

      return currentViewsCopy;
    }
    case DELETE_VEGA_VIEW: {
        const { viewId } = action.payload;
        let currentViewsCopy = [...state];
        const viewIndex = currentViewsCopy.findIndex(view=>view.viewId === viewId);
        if(viewIndex > -1){
            currentViewsCopy = [...currentViewsCopy.slice(0,viewIndex),...currentViewsCopy.slice(viewIndex+1)]
        }
        return currentViewsCopy;
  
    }
    default:
      return state;
  }
}
