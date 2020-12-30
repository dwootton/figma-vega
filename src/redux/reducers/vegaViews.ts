import { ADD_VEGA_VIEW, ALTER_VEGA_VIEW ,DELETE_VEGA_VIEW} from "../actionTypes";



const initialState = {
  allIds: [],
  byIds: {}
};

export default function(state = initialState, action) {
  switch (action.type) {
    case ADD_VEGA_VIEW: {
      const { id, content } = action.payload;
      return {
        ...state,
        allIds: [...state.allIds, id],
        byIds: {
          ...state.byIds,
          [id]: {
            content,
            completed: false
          }
        }
      };
    }
    case ALTER_VEGA_VIEW: {
      const { id } = action.payload;
      return {
        ...state,
        byIds: {
          ...state.byIds,
          [id]: {
            ...state.byIds[id],
            completed: !state.byIds[id].completed
          }
        }
      };
    }
    case DELETE_VEGA_VIEW: {
        
    }
    default:
      return state;
  }
}
