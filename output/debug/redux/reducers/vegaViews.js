import { ADD_VEGA_VIEW, ALTER_VEGA_VIEW, DELETE_VEGA_VIEW, ADD_ANNOTATION_MARK, } from "./../actionTypes";
//@ts-ignore
import _ from 'lodash';
const initialState = [];
export default function (state = initialState, action) {
    switch (action.type) {
        case ADD_VEGA_VIEW: {
            console.log("adding vega view", JSON.stringify(action), JSON.stringify(state));
            return [...state, action.payload.viewData];
        }
        case ALTER_VEGA_VIEW: {
            const { viewId, view } = action.payload;
            const currentViewsCopy = [...state];
            const viewIndex = currentViewsCopy.findIndex((view) => view.viewId === viewId);
            console.log(currentViewsCopy, viewId, view, action);
            if (viewIndex > -1) {
                const copyValue = Object.assign({}, currentViewsCopy[viewIndex]);
                currentViewsCopy[viewIndex] = Object.assign(copyValue, view);
            }
            return currentViewsCopy;
        }
        case DELETE_VEGA_VIEW: {
            const { viewId } = action.payload;
            let currentViewsCopy = [...state];
            const viewIndex = currentViewsCopy.findIndex((view) => view.viewId === viewId);
            if (viewIndex > -1) {
                currentViewsCopy = [
                    ...currentViewsCopy.slice(0, viewIndex),
                    ...currentViewsCopy.slice(viewIndex + 1),
                ];
            }
            return currentViewsCopy;
        }
        case ADD_ANNOTATION_MARK: {
            const { viewId, annotation } = action.payload;
            const currentViewsCopy = [...state];
            const viewIndex = currentViewsCopy.findIndex((view) => view.viewId === viewId);
            if (viewIndex > -1) {
                const copyValue = _.cloneDeep(currentViewsCopy[viewIndex]);
                if (copyValue.annotationSpec && copyValue.annotationSpec.marks) {
                    copyValue.annotationSpec.marks.push(annotation);
                }
                currentViewsCopy[viewIndex] = copyValue;
            }
            return currentViewsCopy;
        }
        default:
            return state;
    }
}
