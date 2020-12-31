import { ADD_VEGA_VIEW, ALTER_VEGA_VIEW, DELETE_VEGA_VIEW } from "./actionTypes";

let nextTodoId = 0;

// central store created for each "created visualization"
//
function makeID(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const addView = view => ({
  type: ADD_VEGA_VIEW,
  payload: {
    viewData: {
      viewId:makeID(5),
      ...view
    }
  }
});

export const editView = (viewId, viewData) => ({
  type: ALTER_VEGA_VIEW,
  payload: {
    viewId: viewId, alteredView: viewData
  }
})