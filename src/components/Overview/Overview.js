import * as React from "react";
//@ts-ignore
import { Button, Select } from "react-figma-plugin-ds";
import View from "../../common/models/view";
const createSVG = `
<svg width="146" height="163" viewBox="0 0 146 163" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="146" height="163" fill="white" fill-opacity="0.01"/>
<rect x="64" y="31" width="17" height="102" fill="#C4C4C4"/>
<rect x="123.5" y="73.5" width="17" height="102" transform="rotate(90 123.5 73.5)" fill="#C4C4C4"/>
</svg>
`;
const Overview = ({ onCreateView, onViewSelect, views }) => {
    // Example options
    const options = views.map((view) => {
        return { value: view.viewId, label: view.viewName };
    });
    console.log(options, views);
    function onChanged(viewId) {
        console.log("in change", viewId);
        onViewSelect(viewId);
    }
    return (React.createElement("div", { style: { width: "225px", height: "100%", margin: "auto", marginTop: "200px" }, className: "overviewBody" },
        React.createElement(Button, { className: 'createView', tint: 'primary', onClick: () => {
                const newView = new View({ viewName: `Visualization ${views.length}` });
                // create view in redux store
                onCreateView(newView);
                // select view
                onViewSelect(newView.viewId);
            } }, "Create Visualization"),
        React.createElement("div", { style: { margin: "24px auto" } },
            "or",
            React.createElement("div", { style: { margin: "24px auto" } },
                React.createElement(Select, { className: "dropDownButton", disabled: (views === null || views === void 0 ? void 0 : views.length) === 0, placeholder: 'Select Vega View', options: options, onChange: (selected) => {
                        console.log("dwootton in select", selected);
                        onViewSelect(selected.value);
                    } })))));
};
const OldOverview = ({ onViewSelect, views, onCreateView }) => {
    return (React.createElement("ul", { style: { "list-style": "none", margin: "auto", width: 300 } },
        React.createElement(HorizontalCard, { onClick: () => {
                const newView = new View({ viewName: `Visualization ${views.length}` });
                // create view in redux store
                onCreateView(newView);
                // select view
                onViewSelect(newView.viewId);
            }, svgString: createSVG, cardTitle: "Create a visualization", cardDescription: "Create a new visualization from a vega spec. Add your visualization and annotate it ✏" }),
        React.createElement(Gallery, { views: views, onViewSelect: onViewSelect })));
};
const Gallery = ({ views, onViewSelect }) => {
    return (React.createElement("div", null, views &&
        views.map((view) => {
            return React.createElement(GalleryItem, { view: view, onViewSelect: onViewSelect });
        })));
};
const GalleryItem = ({ view, onViewSelect }) => {
    return (React.createElement("div", null,
        React.createElement(HorizontalCard, { onClick: () => onViewSelect(view.viewId), cardDescription: "Edit an existing visualization and vega-fi its annotations.", cardTitle: view.viewName.slice(0, 30) })));
};
const HorizontalCard = ({ onClick, svgString = `<svg width="53" height="89" viewBox="0 0 53 89" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect y="32.1915" width="13" height="56.8085" fill="#595959"/>
  <rect x="20" width="13" height="89" fill="#595959"/>
  <rect x="40" y="47.3405" width="13" height="41.6596" fill="#595959"/>
  </svg>  
`, cardTitle, cardDescription = "", }) => {
    return (React.createElement("li", null,
        React.createElement("div", { className: "card-body", onClick: onClick },
            React.createElement("img", { className: "card-image", alt: "Visualization of the vega view created by the user.", height: 50, width: 50, src: `data:image/svg+xml;base64,${btoa(svgString)}` }),
            React.createElement("div", { className: "card-title" },
                React.createElement("p", null, cardTitle)),
            React.createElement("div", { className: "card-description" },
                React.createElement("p", null, cardDescription)))));
};
export default Overview;
