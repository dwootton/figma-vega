import { ADD_VEGA_VIEW, ALTER_VEGA_VIEW ,DELETE_VEGA_VIEW} from "./../actionTypes";

const initialState : IViewStore = {
  views: []
};

interface IViewStore {
    views: IView[];
}
interface IView {
    viewId: string; // internal property for identifying ui
    viewNodeId: string; // property for identifying on figma scenegraph
    visualizationSpec: string; // stringified JSON specification of Vega Vis
    annotationSpec: string; // stringified JSON specification for annotations
    vegaPaddingWidth:string; // width of padding inherent in vega visualization 
    vegaPaddingHeight:string;// height of padding inherent in vega visualization 
    annotationsNodeId:string; // property for identifying annotations on figma scenegraph
    visualizationNodeId:string; // property for identifying annotations on figma scenegraph
}

export default function(state = initialState, action) {
  switch (action.type) {
    case ADD_VEGA_VIEW: {

      return {
        ...state,
        views: [...state.views, 
            action.payload.viewData
        ]
       
      };
    }
    case ALTER_VEGA_VIEW: {
      const { viewId, alteredView } = action.payload;
      const currentViewsCopy = [...state.views];
      const viewIndex = currentViewsCopy.findIndex(view=>view.viewId = viewId);
      if(viewIndex > -1){
        const copyValue = Object.assign({},currentViewsCopy[viewIndex])
        currentViewsCopy[viewIndex] = Object.assign(copyValue,alteredView);
      }

      return {
        ...state,
        views: currentViewsCopy
      };
    }
    case DELETE_VEGA_VIEW: {
        const { viewId } = action.payload;
        const currentViewsCopy = [...state.views];
        const viewIndex = currentViewsCopy.findIndex(view=>view.viewId = viewId);
        if(viewIndex > -1){
          currentViewsCopy.splice(viewIndex, 1);

        }
        return {
            ...state,
            views: currentViewsCopy
          };
  
    }
    default:
      return state;
  }
}
