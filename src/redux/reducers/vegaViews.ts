import { ADD_VEGA_VIEW, ALTER_VEGA_VIEW ,DELETE_VEGA_VIEW} from "./../actionTypes";

const initialState = {
  views: []
};

export default function(state = initialState, action) {
  switch (action.type) {
    case ADD_VEGA_VIEW: {

      return {
        ...state,
        views: [...state.views, 
            action.viewData
        ]
       
      };
    }
    case ALTER_VEGA_VIEW: {
      const { viewId, alteredView } = action.payload;
      const currentViewsCopy = [...state.views];
      const viewIndex = currentViewsCopy.findIndex(view=>view.viewId = viewId);
      if(viewIndex > -1){
        currentViewsCopy[viewIndex] = alteredView
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
