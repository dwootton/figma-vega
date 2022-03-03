import { ADD_VEGA_VIEW, ALTER_VEGA_VIEW } from "./actionTypes";
let nextTodoId = 0;
// central store created for each "created visualization"
//
export const addView = (view) => ({
    type: ADD_VEGA_VIEW,
    payload: {
        viewData: Object.assign({}, view)
    },
});
export const editView = (viewId, viewData) => ({
    type: ALTER_VEGA_VIEW,
    payload: {
        viewId: viewId,
        view: viewData,
    },
});
