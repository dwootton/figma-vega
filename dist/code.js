/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/code.ts":
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
//import {createNormalizedPath} from "./helperFunctions";
//import {SVGpath, SVGsegs} from './SVGPaths.js';
// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
// This shows the HTML page in "ui.htmlviewsData".
figma.showUI(__html__);
const PADDING_WIDTH_REGEX = /(?<=translate\()\d+/;
const PADDING_HEIGHT_REGEX = /(?<=translate\(\d+,)\d+/;
const SVG_WIDTH_REGEX = /(?<=width=")\d+/;
const SVG_HEIGHT_REGEX = /(?<=height=")\d+/;
/**
 * Utility function to search through all top level nodes of each page in a figma document
 * returns a list of matching figma nodes
 * @param currentPage
 * @param searchFunction predicate run on each child node of the page
 */
function searchTopLevel(root, searchPredicate) {
    const searchResults = [];
    const nodeIterator = walkTreeToDepth(root, 0, 3);
    let nodeStep = nodeIterator.next();
    while (!nodeStep.done) {
        const node = nodeStep.value;
        if (searchPredicate(node)) {
            searchResults.push(node);
        }
        nodeStep = nodeIterator.next();
    }
    // iterate through all child nodes of current page
    return searchResults;
}
function* walkTreeToDepth(node, currentDepth = 1, maxDepth = 2) {
    yield node;
    const { children } = node;
    if (children && currentDepth <= maxDepth) {
        for (const child of children) {
            yield* walkTreeToDepth(child, currentDepth + 1, maxDepth);
        }
    }
}
function clone(val) {
    const type = typeof val;
    if (val === null) {
        return null;
    }
    else if (type === "undefined" || type === "number" || type === "string" || type === "boolean") {
        return val;
    }
    else if (type === "object") {
        if (val instanceof Array) {
            return val.map((x) => clone(x));
        }
        else if (val instanceof Uint8Array) {
            return new Uint8Array(val);
        }
        else {
            let o = {};
            for (const key in val) {
                o[key] = clone(val[key]);
            }
            return o;
        }
    }
    throw "unknown";
}
function* walkTree(node) {
    yield node;
    const { children } = node;
    if (children) {
        for (const child of children) {
            yield* walkTree(child);
        }
    }
}
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    figma.root.children;
    if (msg.type === "create") {
        // TODO: cast as a create msg type
        const nodes = [];
        const svgString = msg.svgToRender;
        const id = msg.viewId;
        const viewName = msg.name;
        console.log(msg);
        const visualization = figma.createNodeFromSvg(svgString);
        visualization.name = `Visualization Layer - ${viewName}`;
        visualization.locked = true;
        // place annotations layer on top and make transparent
        const newAnnotationsLayer = figma.createFrame();
        const paddingWidthMatches = svgString.match(PADDING_WIDTH_REGEX);
        const paddingHeightMatches = svgString.match(PADDING_HEIGHT_REGEX);
        if (paddingWidthMatches) {
            const widthString = paddingWidthMatches[0];
            newAnnotationsLayer.setPluginData("vegaPaddingWidth", widthString);
        }
        if (paddingHeightMatches) {
            const heightString = paddingHeightMatches[0];
            newAnnotationsLayer.setPluginData("vegaPaddingHeight", heightString);
        }
        const fills = clone(newAnnotationsLayer.fills);
        fills[0].opacity = 0;
        newAnnotationsLayer.fills = fills;
        newAnnotationsLayer.clipsContent = false;
        newAnnotationsLayer.name = `Annotations Layer - ${viewName}`;
        // grab width and height
        // set annotations width and height
        const widthMatches = svgString.match(SVG_WIDTH_REGEX);
        const heightMatches = svgString.match(SVG_HEIGHT_REGEX);
        if (widthMatches && heightMatches) {
            const width = Number(widthMatches[0]);
            const height = Number(heightMatches[0]);
            newAnnotationsLayer.resize(width > 0 ? width : 100, height > 0 ? height : 100);
        }
        //
        const group = figma.group([newAnnotationsLayer, visualization], figma.currentPage);
        group.name = viewName;
        group.setPluginData("viewName", viewName);
        group.setPluginData("viewId", msg.viewId);
        group.setPluginData("type", "vegaView");
        group.setPluginData("annotationSpec", `{"marks":[]}`);
        group.setPluginData("annotationNodeId", newAnnotationsLayer.id);
        group.setPluginData("visualizationSpec", msg.vegaSpec);
        group.setPluginData("visualizationNodeId", visualization.id);
        if (paddingWidthMatches) {
            const widthString = paddingWidthMatches[0];
            group.setPluginData("vegaPaddingWidth", widthString);
        }
        if (paddingHeightMatches) {
            const heightString = paddingHeightMatches[0];
            group.setPluginData("vegaPaddingHeight", heightString);
        }
        figma.ui.postMessage({
            viewId: msg.viewId,
            viewNodeId: group.id,
            visualizationNodeId: visualization.id,
            annotationNodeId: newAnnotationsLayer.id,
            type: "finishedCreate",
        });
    }
    else if (msg.type === "update") {
        const { visualizationNodeId, annotationNodeId, viewNodeId, viewId, viewName, vegaSpec, svgToRender } = msg;
        // delete old vis
        figma.getNodeById(visualizationNodeId).remove();
        const visualization = figma.createNodeFromSvg(svgToRender);
        visualization.name = `Visualization Layer - ${viewName}`;
        visualization.locked = true;
        // place annotations layer on top and make transparent
        let annotationLayer = figma.getNodeById(annotationNodeId);
        if (!annotationLayer) {
            annotationLayer = figma.createFrame();
        }
        const paddingWidthMatches = svgToRender.match(PADDING_WIDTH_REGEX);
        const paddingHeightMatches = svgToRender.match(PADDING_HEIGHT_REGEX);
        if (paddingWidthMatches) {
            const widthString = paddingWidthMatches[0];
            annotationLayer.setPluginData("vegaPaddingWidth", widthString);
        }
        if (paddingHeightMatches) {
            const heightString = paddingHeightMatches[0];
            annotationLayer.setPluginData("vegaPaddingHeight", heightString);
        }
        annotationLayer.name = `Annotations Layer - ${viewName}`;
        // grab width and height
        // set annotations width and height
        const widthMatches = svgToRender.match(SVG_WIDTH_REGEX);
        const heightMatches = svgToRender.match(SVG_HEIGHT_REGEX);
        if (widthMatches && heightMatches) {
            const width = Number(widthMatches[0]);
            const height = Number(heightMatches[0]);
            //@ts-ignore
            annotationLayer.resize(width > 0 ? width : 100, height > 0 ? height : 100);
        }
        let group = figma.getNodeById(viewNodeId);
        if (!group) {
            group = figma.group([annotationLayer, visualization], figma.currentPage);
        }
        //@ts-ignore
        group.appendChild(visualization);
        group.name = viewName;
        group.setPluginData("viewName", viewName);
        group.setPluginData("viewId", viewId);
        group.setPluginData("type", "vegaView");
        group.setPluginData("annotationSpec", `{"marks":[]}`);
        group.setPluginData("visualizationSpec", vegaSpec);
        group.setPluginData("visualizationNodeId", visualization.id);
        if (paddingWidthMatches) {
            const widthString = paddingWidthMatches[0];
            group.setPluginData("vegaPaddingWidth", widthString);
        }
        if (paddingHeightMatches) {
            const heightString = paddingHeightMatches[0];
            group.setPluginData("vegaPaddingHeight", heightString);
        }
        figma.ui.postMessage({
            viewId: viewId,
            viewNodeId: group.id,
            visualizationNodeId: visualization.id,
            annotationNodeId: annotationLayer.id,
            type: "finishedCreate",
        });
    }
    else if (msg.type === "fetch") {
        //const selectedNodeId = msg.viewNodeId;
        console.log("fetching node id", msg.viewNodeId);
        const annotationsId = msg.annotationNodeId;
        const viewNodeId = msg.viewNodeId;
        const viewId = msg.viewId;
        // uses a fetch by id
        const annotationsLayer = figma.getNodeById(annotationsId);
        // find current selection
        //@ts-ignore    //
        // grab annnotations layer,
        // grab plugin data for the width/height padding
        //const newSelection = [figma.flatten(figma.currentPage.selection)];
        console.log(annotationsLayer);
        const nodeIterator = walkTree(annotationsLayer);
        let nodeStep = nodeIterator.next();
        const vectorizedNodePayload = [];
        while (!nodeStep.done) {
            // skip node types
            if (nodeStep.value.type === "FRAME" || nodeStep.value.type === "GROUP") {
                nodeStep = nodeIterator.next();
                continue;
            }
            const node = nodeStep.value.clone();
            console.log("node value", node);
            // if nodeType is group
            const vectorizedSceneNode = vectorize(node);
            const vectorizedNodes = vectorizedSceneNode.map((vectorizedNode) => {
                return { nodeId: vectorizedNode.id, vectorPaths: vectorizedNode.vectorPaths };
            });
            vectorizedNodePayload.push({
                vectorizedNodes: vectorizedNodes,
                outlinedStroke: vectorizedNodes.length > 1,
            });
            nodeStep = nodeIterator.next();
        }
        figma.ui.postMessage({
            nodeCollection: vectorizedNodePayload,
            viewNodeId: viewNodeId,
            viewId: viewId,
            type: "modifyPath",
        });
    }
    else if (msg.type === "sendScaled") {
        const { svgNodeCollection, viewId, viewNodeId } = msg;
        const viewNode = figma.getNodeById(viewNodeId);
        console.log("in send scaled", viewId, viewNode, msg);
        if (viewNode) {
            const visualizationPaddingWidth = Number(viewNode.getPluginData("vegaPaddingWidth"));
            const visualizationPaddingHeight = Number(viewNode.getPluginData("vegaPaddingHeight"));
            const markCollection = [];
            for (const node of svgNodeCollection) {
                const marks = node.map((svgNode) => {
                    const { svgString, nodeId } = svgNode;
                    const vectorizedNode = figma.getNodeById(nodeId);
                    // lines and vector
                    if (vectorizedNode.type !== "VECTOR") {
                        return;
                    }
                    const { width, height, tX, tY, scale } = calculatePlacement(vectorizedNode, visualizationPaddingWidth, visualizationPaddingHeight);
                    const isVisible = calculateIsVisible(vectorizedNode);
                    const strokeSpecs = calculateStrokeSpecs(vectorizedNode);
                    const fillSpecs = calculateFillSpecs(vectorizedNode);
                    const miscSpecs = calculateMiscSpecs(vectorizedNode);
                    const propertySpecs = [].concat(strokeSpecs, fillSpecs, miscSpecs);
                    const translatedSpec = `{
          "type": "symbol",
          "interactive": false,
          "encode": {
            "enter": {
              "shape": {"value": "${svgString}"},
              "size":{"value":${scale}},
              ${propertySpecs.join(",")}
            },
            "update": {
              "width":{"value":${width}},
              "height":{"value":${height}},
              "x": {"value": ${tX}},
              "y": {"value": ${tY}}
            }
          }
         }`;
                    const parsedSpec = JSON.parse(translatedSpec);
                    if (!isVisible) {
                        parsedSpec["encode"]["enter"]["opacity"] = { value: 0 };
                    }
                    vectorizedNode.remove();
                    return parsedSpec;
                });
                markCollection.push(marks);
            }
            const flattenedCollection = markCollection.reduce((acc, val) => acc.concat(val), []);
            console.log('dywootto mark collection', flattenedCollection);
            figma.ui.postMessage({
                annotationSpec: { marks: flattenedCollection },
                viewId: viewId,
                type: "finishedMarks",
            });
        }
    }
    else if (msg.type === "startUp") {
        // scan through document to find all nodes with plugin data type matching vega view
        const currentViews = searchTopLevel(figma.root, (node) => node.getPluginData("type") === "vegaView");
        const viewsData = [];
        for (const view of currentViews) {
            const viewData = extractVegaViewData(view);
            viewsData.push(viewData);
        }
        figma.ui.postMessage({ viewsData: viewsData, type: "startUpViews" });
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    //figma.closePlugin();
};
function extractVegaViewData(node) {
    const propertiesToExtract = [
        "viewId",
        // "viewNodeId", commenting out because it is not a plugin property
        //"viewName",
        "visualizationSpec",
        "annotationSpec",
        "vegaPaddingWidth",
        "vegaPaddingHeight",
        "annotationNodeId",
        "visualizationNodeId",
    ];
    const extractedData = { viewName: node.name, viewNodeId: node.id };
    for (const property of propertiesToExtract) {
        const data = node.getPluginData(property);
        console.log("property", property, "data", data);
        extractedData[property] = data;
    }
    return extractedData;
}
function isNotNone(property) {
    return property !== "NONE";
}
function calculateMiscSpecs(node) {
    const attributes = [];
    if (node.opacity) {
        //@ts-ignore wrong typings ?
        attributes.push(`"opacity": {"value": ${node.opacity}}`);
    }
    if (node.blendMode !== "NORMAL" && BLEND_MODE_MAPPINGS[node.blendMode]) {
        attributes.push(`"blend": {"value": "${BLEND_MODE_MAPPINGS[node.blendMode]}"}`);
    }
    return attributes;
}
function inAny(paintArr, predicate) {
    let flag = false;
    for (const value of paintArr) {
        if (predicate(value)) {
            flag = true;
        }
    }
    return flag;
}
function calculateIsVisible(node) {
    let isVisible = false;
    //@ts-ignore
    if (inAny(node.fills, (paint) => paint.visible && paint.opacity > 0)) {
        isVisible = true;
        //@ts-ignore
    }
    else if (inAny(node.strokes, (paint) => paint.visible && paint.opacity > 0)) {
        isVisible = true;
    }
    return isVisible;
}
const BLEND_MODE_MAPPINGS = {
    DARKEN: "darken",
    MULTIPLY: "multiply",
    COLOR_BURN: "color-burn",
    LIGHTEN: "lighten",
    SCREEN: "screen",
    COLOR_DODGE: "color-dodge",
    OVERLAY: "overlay",
    SOFT_LIGHT: "soft-light",
    HARD_LIGHT: "hard-light",
    DIFFERENCE: "difference",
    EXCLUSION: "exclusion",
    HUE: "hue",
    SATURATION: "saturation",
    COLOR: "color",
    LUMINOSITY: "luminosity",
};
function calculateFillSpecs(node) {
    const attributes = [];
    console.log("in fills spec", node.fills, node.opacity, node.visible);
    if (node.fills && node.fills[0] && node.fills[0].visible) {
        //@ts-ignore wrong typings ?
        const color = node.fills[0].color;
        console.log("colors", color.r, color.g, color.b, rgbPercentToHex(color.r, color.g, color.b));
        attributes.push(`"fill": {"value": "${rgbPercentToHex(color.r, color.g, color.b)}"}`);
        if (node.fills[0].opacity) {
            attributes.push(`"fillOpacity": {"value": ${node.fills[0].opacity}}`);
        }
    }
    return attributes;
}
function calculateStrokeSpecs(node) {
    console.log("in calc spec", node);
    const names = Object.getOwnPropertyNames(node);
    console.log("in calc spec names", names);
    const attributes = [];
    if (node.strokes && node.strokes.length > 0) {
        //@ts-ignore wrong typings ?
        const color = node.strokes[0].color;
        console.log("colors", color.r, color.g, color.b, rgbPercentToHex(color.r, color.g, color.b));
        attributes.push(`"stroke": {"value": "${rgbPercentToHex(color.r, color.g, color.b)}"}`);
        if (node.strokes[0].opacity) {
            attributes.push(`"strokeOpacity": {"value": ${node.strokes[0].opacity}}`);
        }
        if (node.strokeCap === "ROUND" || node.strokeCap === "SQUARE") {
            attributes.push(`"strokeCap": {"value": "round"}`);
        }
        if (node.strokeWeight) {
            attributes.push(`"strokeWidth": {"value": ${node.strokeWeight}}`);
        }
        if (node.dashPattern && node.dashPattern.length > 0) {
            attributes.push(`"strokeDash": {"value": ${node.dashPattern}}`);
        }
        if (node.strokeMiterLimit) {
            attributes.push(`"strokeMiterLimit": {"value": ${node.strokeMiterLimit}}`);
        }
    }
    // return all stroke properties as string
    return attributes;
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbPercentToHex(r, g, b) {
    return ("#" +
        componentToHex(Math.round(r * 255)) +
        componentToHex(Math.round(255 * g)) +
        componentToHex(Math.round(255 * b)));
}
function calculatePlacement(node, paddingX, paddingY) {
    const width = node.width;
    const height = node.height;
    const x = node.x;
    const y = node.y;
    const maxDimension = Math.max(width, height);
    const tX = (1 / 2) * width + x - paddingX; //+ (maxDimension-height)/2; // total translate
    const tY = (1 / 2) * height + y - paddingY; //+ (maxDimension-height)/2; // total translate
    const scale = maxDimension * maxDimension;
    return { width, height, tX, tY, scale };
}
function shouldNodeBeOutlineStrokes(node) {
    console.log("in outline", node);
    // if the item has an arrow end, outline stroke because arrow stroke cap cannot be applied :(
    if (node.type === "VECTOR" &&
        "strokeCap" in node.vectorNetwork.vertices[node.vectorNetwork.vertices.length - 1] &&
        node.vectorNetwork.vertices[node.vectorNetwork.vertices.length - 1].strokeCap !== "NONE") {
        return true;
    }
    else if ("strokeAlign" in node && node.strokeAlign !== "CENTER") {
        //node.strokeAlign = "CENTER";
        // as vega doesn't support inside or center, outline stroke
        return true;
    }
    return false;
}
function vectorize(node) {
    const nodesToReturn = [];
    // if node is text, combine all vector paths
    let vectorNode = figma.flatten([node]);
    // lines and vector paths with strokes
    const outlinedNode = vectorNode.outlineStroke();
    // if no fills, outline stroke
    nodesToReturn.push(vectorNode);
    if (outlinedNode && shouldNodeBeOutlineStrokes(vectorNode)) {
        nodesToReturn.push(outlinedNode);
        // hide the strokes!
        vectorNode.strokes = [];
    }
    return nodesToReturn;
}
function deg2Radian(deg) {
    return deg * (Math.PI / 180);
}
function multiplyMatrices(matrixA, matrixB) {
    let aNumRows = matrixA.length;
    let aNumCols = matrixA[0].length;
    let bNumRows = matrixB.length;
    let bNumCols = matrixB[0].length;
    let newMatrix = new Array(aNumRows);
    for (let r = 0; r < aNumRows; ++r) {
        newMatrix[r] = new Array(bNumCols);
        for (let c = 0; c < bNumCols; ++c) {
            newMatrix[r][c] = 0;
            for (let i = 0; i < aNumCols; ++i) {
                newMatrix[r][c] += matrixA[r][i] * matrixB[i][c];
            }
        }
    }
    return newMatrix;
}
function multiply(a, b) {
    return [
        [
            a[0][0] * b[0][0] + a[0][1] * b[1][0],
            a[0][0] * b[0][1] + a[0][1] * b[1][1],
            a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2],
        ],
        [
            a[1][0] * b[0][0] + a[1][1] * b[1][0],
            a[1][0] * b[0][1] + a[1][1] * b[1][1] + 0,
            a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2],
        ],
    ];
}
// Creates a "move" transform.
function move(x, y) {
    return [
        [1, 0, x],
        [0, 1, y],
    ];
}
// Creates a "rotate" transform.
function rotate(theta) {
    return [
        [Math.cos(theta), Math.sin(theta), 0],
        [-Math.sin(theta), Math.cos(theta), 0],
    ];
}
function calculateXYFromNode(node) {
    let locationRelativeToParentX = node.x;
    let locationRelativeToParentY = node.y;
    let x = node.width / 2;
    let y = node.width / 2;
    let rotationDeg = -node.rotation;
    let rotationRad = (Math.PI * rotationDeg) / 180;
    let xTransform = x - x * Math.cos(rotationRad) + y * Math.sin(rotationRad);
    let yTransform = y - x * Math.sin(rotationRad) + y * Math.cos(rotationRad);
    let rotationTransform = [
        [Math.cos(rotationRad), -Math.sin(rotationRad), xTransform],
        [Math.sin(rotationRad), Math.cos(rotationRad), yTransform],
    ];
    console.log(JSON.stringify(node.relativeTransform));
    node.relativeTransform = rotationTransform;
    console.log(JSON.stringify(node.relativeTransform));
    node.x += locationRelativeToParentX;
    node.y += locationRelativeToParentY;
    console.log(JSON.stringify(node.y), JSON.stringify(node.x));
}
/**
 * Function that calculates the correct XY position ignoring rotation
 * @param node
 */
function newCalculateRelative(originalNode) {
    const node = originalNode.clone();
    console.log(JSON.stringify(node.relativeTransform));
    //const x = originalNode.x;
    //const y = originalNode.y;
    //node.x = 0;
    //node.y = 0;
    console.log(JSON.stringify(node.absoluteTransform));
    //node.rotation = 0;
    console.log(JSON.stringify(node.relativeTransform));
    let transform = JSON.parse(JSON.stringify(node.relativeTransform));
    // move to 0
    let x = transform[0][2];
    let y = transform[1][2];
    transform[0][2] = 0;
    transform[1][2] = 0;
    console.log("from 360", JSON.stringify(transform));
    transform = multiply(rotate(2 * Math.PI - (node.rotation - Math.PI) / 180), transform);
    console.log("from after rot", JSON.stringify(transform));
    transform = multiply(move(x, y), transform);
    console.log("from after move", JSON.stringify(transform));
    const difX = node.x;
    const difY = node.y;
    console.log("calced", difX, difY, x + difX, y + difY);
    console.log(JSON.stringify(node.relativeTransform));
    console.log(multiply(rotate(-node.rotation), transform));
    console.log("from 360", multiply(rotate(-(node.rotation - Math.PI) / 180), node.relativeTransform));
    // rotate back
    const angleInRadians = deg2Radian(-node.rotation);
    console.log(node.relativeTransform);
    const netransform = multiply(rotate(angleInRadians), node.relativeTransform);
    console.log(netransform);
    /*
    console.log(node.relativeTransform)
    let roter = node.rotation;
    node.rotation = 0;
  
    console.log('old x',JSON.stringify(node.x),JSON.stringify(node.y),JSON.stringify(node.relativeTransform));
    node.rotation = roter;
    
    console.log('new x',x,y,JSON.stringify(node.relativeTransform))
  
  
  
    const width = node.width;
    const height = node.height;
    console.log(x, y, width, height);
    const rot = (node.rotation * Math.PI) / 180; // in radians
  
    // note, to calculate distance from rotation, you must flip the sign  (1/2)H because in cartesian coordinates y DECREASES as you
    const realX = x + (1 / 2) * width * Math.cos(rot) /*- -1 * (1 / 2) * height * Math.sin(rot)  - (1 / 2) * width;
      console.log(y,(1 / 2) * width * Math.sin(rot), -1 * (1 / 2) * height * Math.cos(rot), (1 / 2) * height)
  
    const realY =
      y + (1 / 2) * width * Math.sin(rot) /*+ -1 * (1 / 2) * height * Math.cos(rot) +(1 / 2) * height;
    return [realX, realY];*/
    const totalLengthOfHypo = Math.sqrt(node.width * node.width + node.height * node.height);
}
// Calculate the transformation, i.e. the translation and scaling, required
// to get the path to fill the svg area. Note that this assumes uniform
// scaling, a path that has no other transforms applied to it, and no
// differences between the svg viewport and viewBox dimensions.
function getTranslationAndScaling(x, y, width, height) {
    var svgWdth = 2;
    var svgHght = 2;
    var origPathHght = height;
    var origPathWdth = width;
    var origPathY = y;
    var origPathX = x;
    // how much bigger is the svg root element
    // relative to the path in each dimension?
    var scaleBasedOnWdth = svgWdth / origPathWdth;
    var scaleBasedOnHght = svgHght / origPathHght;
    // of the scaling factors determined in each dimension,
    // use the smaller one; otherwise portions of the path
    // will lie outside the viewport (correct term?)
    var scale = Math.min(scaleBasedOnWdth, scaleBasedOnHght);
    // calculate the bounding box parameters
    // after the path has been scaled relative to the origin
    // but before any subsequent translations have been applied
    var scaledPathX = origPathX * scale;
    var scaledPathY = origPathY * scale;
    var scaledPathWdth = origPathWdth * scale;
    var scaledPathHght = origPathHght * scale;
    // calculate the centre points of the scaled but untranslated path
    // as well as of the svg root element
    var scaledPathCentreX = scaledPathX + scaledPathWdth / 2;
    var scaledPathCentreY = scaledPathY + scaledPathHght / 2;
    var svgRootCentreX = 0; // -svgWdth / 2;
    var svgRootCentreY = 0; //-svgHght / 2;
    // calculate translation required to centre the path
    // on the svg root element
    var pathTranslX = svgRootCentreX - scaledPathCentreX;
    var pathTranslY = svgRootCentreY - scaledPathCentreY;
    console.log("scaled path x", scaledPathX, scaledPathWdth, "scaled path y", scaledPathY, scaledPathHght, "factor from scale", (origPathHght - origPathWdth) / 2, "xfactor from g");
    //
    console.log(pathTranslX, pathTranslY, scale);
    return { pathTranslX, pathTranslY, scale };
}
function getTransformedPathDStr(oldPathDStr, pathTranslX, pathTranslY, scale) {
    // constants to help keep track of the types of SVG commands in the path
    var BOTH_X_AND_Y = 1;
    var JUST_X = 2;
    var JUST_Y = 3;
    var NONE = 4;
    var ELLIPTICAL_ARC = 5;
    var ABSOLUTE = 6;
    var RELATIVE = 7;
    // two parallel arrays, with each element being one component of the
    // "d" attribute of the SVG path, with one component being either
    // an instruction (e.g. "M" for moveto, etc.) or numerical value
    // for either an x or y coordinate
    var oldPathDArr = getArrayOfPathDComponents(oldPathDStr);
    var newPathDArr = [];
    console.log(oldPathDArr);
    var commandParams, absOrRel, oldPathDComp, newPathDComp;
    // element index
    var idx = 0;
    while (idx < oldPathDArr.length) {
        var oldPathDComp = oldPathDArr[idx];
        if (/^[A-Za-z]$/.test(oldPathDComp)) {
            // component is a single letter, i.e. an svg path command
            newPathDArr[idx] = oldPathDArr[idx];
            console.log(oldPathDComp);
            console.log(newPathDArr[idx]);
            switch (oldPathDComp.toUpperCase()) {
                case "A": // elliptical arc command...the most complicated one
                    commandParams = ELLIPTICAL_ARC;
                    break;
                case "H": // horizontal line; requires only an x-coordinate
                    commandParams = JUST_X;
                    break;
                case "V": // vertical line; requires only a y-coordinate
                    commandParams = JUST_Y;
                    break;
                case "Z": // close the path
                    commandParams = NONE;
                    break;
                default:
                    // all other commands; all of them require both x and y coordinates
                    commandParams = BOTH_X_AND_Y;
            }
            absOrRel = oldPathDComp === oldPathDComp.toUpperCase() ? ABSOLUTE : RELATIVE;
            // lowercase commands are relative, uppercase are absolute
            idx += 1;
        }
        else {
            // if the component is not a letter, then it is a numeric value
            var translX, translY;
            if (absOrRel === ABSOLUTE) {
                // the translation is required for absolute commands...
                translX = pathTranslX;
                translY = pathTranslY;
            }
            else if (absOrRel === RELATIVE) {
                // ...but not relative ones
                translX = 0;
                translY = 0;
            }
            switch (commandParams) {
                // figure out which of the numeric values following an svg command
                // are required, and then transform the numeric value(s) from the
                // original path d-attribute and place it in the same location in the
                // array that will eventually become the d-attribute for the new path
                case BOTH_X_AND_Y:
                    newPathDArr[idx] = Number(oldPathDArr[idx]) * scale + translX;
                    newPathDArr[idx + 1] = Number(oldPathDArr[idx + 1]) * scale + translY;
                    idx += 2;
                    break;
                case JUST_X:
                    newPathDArr[idx] = Number(oldPathDArr[idx]) * scale + translX;
                    idx += 1;
                    break;
                case JUST_Y:
                    newPathDArr[idx] = Number(oldPathDArr[idx]) * scale + translY;
                    idx += 1;
                    break;
                case ELLIPTICAL_ARC:
                    // the elliptical arc has x and y values in the first and second as well as
                    // the 6th and 7th positions following the command; the intervening values
                    // are not affected by the transformation and so can simply be copied
                    newPathDArr[idx] = Number(oldPathDArr[idx]) * scale + translX;
                    newPathDArr[idx + 1] = Number(oldPathDArr[idx + 1]) * scale + translY;
                    newPathDArr[idx + 2] = Number(oldPathDArr[idx + 2]);
                    newPathDArr[idx + 3] = Number(oldPathDArr[idx + 3]);
                    newPathDArr[idx + 4] = Number(oldPathDArr[idx + 4]);
                    newPathDArr[idx + 5] = Number(oldPathDArr[idx + 5]) * scale + translX;
                    newPathDArr[idx + 6] = Number(oldPathDArr[idx + 6]) * scale + translY;
                    idx += 7;
                    break;
                case NONE:
                    throw new Error("numeric value should not follow the SVG Z/z command");
                    break;
            }
        }
    }
    console.log(newPathDArr);
    return newPathDArr.join(" ");
}
function getArrayOfPathDComponents(str) {
    // assuming the string from the d-attribute of the path has all components
    // separated by a single space, then create an array of components by
    // simply splitting the string at those spaces
    str = standardizePathDStrFormat(str);
    return str.split(" ");
}
function standardizePathDStrFormat(str) {
    // The SVG standard is flexible with respect to how path d-strings are
    // formatted but this makes parsing them more difficult. This function ensures
    // that all SVG path d-string components (i.e. both commands and values) are
    // separated by a single space.
    return str
        .replace(/,/g, " ") // replace each comma with a space
        .replace(/-/g, " -") // precede each minus sign with a space
        .replace(/([A-Za-z])/g, " $1 ") // sandwich each   letter between 2 spaces
        .replace(/  /g, " ") // collapse repeated spaces to a single space
        .replace(/ ([Ee]) /g, "$1") // remove flanking spaces around exponent symbols
        .replace(/^ /g, "") // trim any leading space
        .replace(/ $/g, ""); // trim any tailing space
}
figma.ui.resize(750, 650);

// Using relative transformation matrix (gives skewed x value for non-rotated)
//console.log('relx',rel[0][2] + (1/2)*width*rel[0][0] -(-1)*(1/2)*height*rel[0][0] - (1/2)*width);
//console.log('rely',rel[1][2]  +(1/2)*width*rel[1][0]- (-1)*(1/2)*height*rel[1][1] - (1/2)*height);
/*
document.getElementById("app").innerHTML = `
<svg  id="base" width="800" height="600" viewBox="0 0 800 600" style="border: 1px solid blue;">
    <path id="notmoved" fill="#f00" stroke="none" d="M122.769 48.4914C127.038 46.1179 129.983 43.3724 131.274 40.2168C136.614 27.1685 133.472 17.3604 129.014 10.8007C126.779 7.51154 124.208 5.03372 122.195 3.37789C121.188 2.5505 120.323 1.92985 119.711 1.51715C119.405 1.31084 119.163 1.15662 118.998 1.05461C118.916 1.00362 118.853 0.965689 118.811 0.940845L118.765 0.913392L118.754 0.907033L118.751 0.905698C118.751 0.905724 118.751 0.90559 119 0.471618C119.248 0.0376466 119.248 0.0378243 119.249 0.038054L119.254 0.0411385L119.269 0.0495891C119.281 0.0568762 119.299 0.0674701 119.322 0.0813667C119.369 0.109157 119.437 0.150168 119.525 0.204386C119.7 0.312811 119.953 0.474096 120.27 0.688134C120.905 1.11613 121.796 1.75552 122.83 2.60549C124.896 4.30438 127.539 6.85059 129.841 10.2387C134.459 17.0334 137.685 27.1926 132.2 40.5955C130.785 44.0526 127.615 46.9416 123.255 49.3654C118.888 51.7931 113.27 53.7861 106.867 55.4237C94.0584 58.6993 78.0188 60.5744 62.3425 61.6212C46.6613 62.6682 31.3214 62.8878 19.9035 62.8457C14.194 62.8246 9.46418 62.7381 6.16121 62.6569C4.50971 62.6163 3.21489 62.577 2.33267 62.5478C2.28051 62.5461 2.22979 62.5444 2.18052 62.5428L4.41804 64.9692C4.60524 65.1722 4.59243 65.4886 4.38943 65.6758C4.18642 65.863 3.87009 65.8501 3.68289 65.6471L0.632312 62.339C0.445115 62.136 0.457923 61.8196 0.660927 61.6324L3.96908 58.5819C4.17208 58.3947 4.48842 58.4075 4.67561 58.6105C4.86281 58.8135 4.85 59.1298 4.647 59.317L2.23204 61.5439C2.27547 61.5454 2.32004 61.5469 2.36571 61.5484C3.24531 61.5775 4.5373 61.6167 6.1858 61.6572C9.48284 61.7383 14.2057 61.8247 19.9072 61.8457C31.3111 61.8877 46.6259 61.6684 62.2759 60.6234C77.9307 59.5781 93.899 57.7079 106.619 54.4549C112.98 52.8281 118.506 50.861 122.769 48.4914Z" opacity="0.5" />
</svg>
`;

//M 0.8948798422325034 -0.22947776546632515 L -0.9113460462900568 -0.9848086215142885 L -0.9049932910080667 -0.9999999999999999 L 0.9113460332248416 -0.24044095542902388 V 1.0000000241203968 H 0.8948798422325034 V -0.22947776546632515 Z
// Retrieve the "d" attribute of the SVG path you wish to transform.
var svgRoot = document.getElementById("base");
var path = document.getElementById("notmoved");
var oldPathDStr = path.getAttribute("d");

// Calculate the transformation required.
var obj = getTranslationAndScaling(svgRoot, path);
var pathTranslX = obj.pathTranslX;
var pathTranslY = obj.pathTranslY;
var scale = obj.scale;

// The path could be transformed at this point with a simple
// "transform" attribute as shown here.

// $path.attr("transform", `translate(${pathTranslX}, ${pathTranslY}), scale(${scale})`);

// However, as described in your question you didn't want this.
// Therefore, the code following this line mutates the actual svg path.

// Calculate the path "d" attributes parameters.
var newPathDStr = getTransformedPathDStr(
  oldPathDStr,
  pathTranslX,
  pathTranslY,
  scale
);

// Apply the new "d" attribute to the path, transforming it.

document.write(
  "<p>Altered 'd' attribute of path:</p><p>" + newPathDStr + "</p>"
);

// This is the end of the main code. Below are the functions called.

// Calculate the transformation, i.e. the translation and scaling, required
// to get the path to fill the svg area. Note that this assumes uniform
// scaling, a path that has no other transforms applied to it, and no
// differences between the svg viewport and viewBox dimensions.
function getTranslationAndScaling(svg, path) {
  var svgWdth = 2;
  var svgHght = 2;

  var origPathBoundingBox = path.getBBox();

  var origPathHght = origPathBoundingBox.height;
  var origPathWdth = origPathBoundingBox.width;

  var origPathY = origPathBoundingBox.y;
  var origPathX = origPathBoundingBox.x;

  console.log(origPathWdth, origPathHght, origPathWdth, origPathX, origPathY);
  // how much bigger is the svg root element
  // relative to the path in each dimension?
  var scaleBasedOnWdth = svgWdth / origPathWdth;
  var scaleBasedOnHght = svgHght / origPathHght;

  // of the scaling factors determined in each dimension,
  // use the smaller one; otherwise portions of the path
  // will lie outside the viewport (correct term?)
  var scale = Math.min(scaleBasedOnWdth, scaleBasedOnHght);
  alert(
    `height: ${1 / scaleBasedOnHght} width: ${1 / scaleBasedOnWdth}, ${
      origPathWdth * origPathHght
    }`
  );
  // calculate the bounding box parameters
  // after the path has been scaled relative to the origin
  // but before any subsequent translations have been applied

  var scaledPathX = origPathX * scale;
  var scaledPathY = origPathY * scale;
  var scaledPathWdth = origPathWdth * scale;
  var scaledPathHght = origPathHght * scale;

  // calculate the centre points of the scaled but untranslated path
  // as well as of the svg root element

  var scaledPathCentreX = scaledPathX + scaledPathWdth / 2;
  var scaledPathCentreY = scaledPathY + scaledPathHght / 2;
  var svgRootCentreX = 0; // -svgWdth / 2;
  var svgRootCentreY = 0; //-svgHght / 2;

  // calculate translation required to centre the path
  // on the svg root element
  var pathTranslX = svgRootCentreX - scaledPathCentreX;
  var pathTranslY = svgRootCentreY - scaledPathCentreY;
  console.log(
    "scaled path x",
    scaledPathX,
    scaledPathWdth,
    "scaled path y",
    scaledPathY,
    scaledPathHght,
    "factor from scale",
    (origPathHght - origPathWdth) / 2,
    "xfactor from g"
  );
  return { pathTranslX, pathTranslY, scale };
}

function getTransformedPathDStr(oldPathDStr, pathTranslX, pathTranslY, scale) {
  // constants to help keep track of the types of SVG commands in the path
  var BOTH_X_AND_Y = 1;
  var JUST_X = 2;
  var JUST_Y = 3;
  var NONE = 4;
  var ELLIPTICAL_ARC = 5;
  var ABSOLUTE = 6;
  var RELATIVE = 7;

  // two parallel arrays, with each element being one component of the
  // "d" attribute of the SVG path, with one component being either
  // an instruction (e.g. "M" for moveto, etc.) or numerical value
  // for either an x or y coordinate
  var oldPathDArr = getArrayOfPathDComponents(oldPathDStr);
  var newPathDArr = [];

  var commandParams, absOrRel, oldPathDComp, newPathDComp;

  // element index
  var idx = 0;

  while (idx < oldPathDArr.length) {
    var oldPathDComp = oldPathDArr[idx];
    if (/^[A-Za-z]$/.test(oldPathDComp)) {
      // component is a single letter, i.e. an svg path command
      newPathDArr[idx] = oldPathDArr[idx];
      switch (oldPathDComp.toUpperCase()) {
        case "A": // elliptical arc command...the most complicated one
          commandParams = ELLIPTICAL_ARC;
          break;
        case "H": // horizontal line; requires only an x-coordinate
          commandParams = JUST_X;
          break;
        case "V": // vertical line; requires only a y-coordinate
          commandParams = JUST_Y;
          break;
        case "Z": // close the path
          commandParams = NONE;
          break;
        default:
          // all other commands; all of them require both x and y coordinates
          commandParams = BOTH_X_AND_Y;
      }
      absOrRel =
        oldPathDComp === oldPathDComp.toUpperCase() ? ABSOLUTE : RELATIVE;
      // lowercase commands are relative, uppercase are absolute
      idx += 1;
    } else {
      // if the component is not a letter, then it is a numeric value
      var translX, translY;
      if (absOrRel === ABSOLUTE) {
        // the translation is required for absolute commands...
        translX = pathTranslX;
        translY = pathTranslY;
      } else if (absOrRel === RELATIVE) {
        // ...but not relative ones
        translX = 0;
        translY = 0;
      }
      switch (commandParams) {
        // figure out which of the numeric values following an svg command
        // are required, and then transform the numeric value(s) from the
        // original path d-attribute and place it in the same location in the
        // array that will eventually become the d-attribute for the new path
        case BOTH_X_AND_Y:
          newPathDArr[idx] = Number(oldPathDArr[idx]) * scale + translX;
          newPathDArr[idx + 1] = Number(oldPathDArr[idx + 1]) * scale + translY;
          idx += 2;
          break;
        case JUST_X:
          newPathDArr[idx] = Number(oldPathDArr[idx]) * scale + translX;
          idx += 1;
          break;
        case JUST_Y:
          newPathDArr[idx] = Number(oldPathDArr[idx]) * scale + translY;
          idx += 1;
          break;
        case ELLIPTICAL_ARC:
          // the elliptical arc has x and y values in the first and second as well as
          // the 6th and 7th positions following the command; the intervening values
          // are not affected by the transformation and so can simply be copied
          newPathDArr[idx] = Number(oldPathDArr[idx]) * scale + translX;
          newPathDArr[idx + 1] = Number(oldPathDArr[idx + 1]) * scale + translY;
          newPathDArr[idx + 2] = Number(oldPathDArr[idx + 2]);
          newPathDArr[idx + 3] = Number(oldPathDArr[idx + 3]);
          newPathDArr[idx + 4] = Number(oldPathDArr[idx + 4]);
          newPathDArr[idx + 5] = Number(oldPathDArr[idx + 5]) * scale + translX;
          newPathDArr[idx + 6] = Number(oldPathDArr[idx + 6]) * scale + translY;
          idx += 7;
          break;
        case NONE:
          throw new Error(
            "numeric value should not follow the SVG Z/z command"
          );
          break;
      }
    }
  }
  return newPathDArr.join(" ");
}

function getArrayOfPathDComponents(str) {
  // assuming the string from the d-attribute of the path has all components
  // separated by a single space, then create an array of components by
  // simply splitting the string at those spaces
  str = standardizePathDStrFormat(str);
  return str.split(" ");
}

function standardizePathDStrFormat(str) {
  // The SVG standard is flexible with respect to how path d-strings are
  // formatted but this makes parsing them more difficult. This function ensures
  // that all SVG path d-string components (i.e. both commands and values) are
  // separated by a single space.
  return str
    .replace(/,/g, " ") // replace each comma with a space
    .replace(/-/g, " -") // precede each minus sign with a space
    .replace(/([A-Za-z])/g, " $1 ") // sandwich each   letter between 2 spaces
    .replace(/  /g, " ") // collapse repeated spaces to a single space
    .replace(/ ([Ee]) /g, "$1") // remove flanking spaces around exponent symbols
    .replace(/^ /g, "") // trim any leading space
    .replace(/ $/g, ""); // trim any tailing space
}
*/


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("./src/code.ts");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92ZWdhLWZpLy4vc3JjL2NvZGUudHMiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly92ZWdhLWZpL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxVQUFVLHFCQUFxQjtBQUMvQixVQUFVLGlCQUFpQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFdBQVc7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxXQUFXO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxTQUFTO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsU0FBUztBQUNuRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRDs7QUFFaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0EsMkNBQTJDO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBDQUEwQztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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ImZpbGUiOiJjb2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy9pbXBvcnQge2NyZWF0ZU5vcm1hbGl6ZWRQYXRofSBmcm9tIFwiLi9oZWxwZXJGdW5jdGlvbnNcIjtcbi8vaW1wb3J0IHtTVkdwYXRoLCBTVkdzZWdzfSBmcm9tICcuL1NWR1BhdGhzLmpzJztcbi8vIFRoaXMgcGx1Z2luIHdpbGwgb3BlbiBhIHdpbmRvdyB0byBwcm9tcHQgdGhlIHVzZXIgdG8gZW50ZXIgYSBudW1iZXIsIGFuZFxuLy8gaXQgd2lsbCB0aGVuIGNyZWF0ZSB0aGF0IG1hbnkgcmVjdGFuZ2xlcyBvbiB0aGUgc2NyZWVuLlxuLy8gVGhpcyBmaWxlIGhvbGRzIHRoZSBtYWluIGNvZGUgZm9yIHRoZSBwbHVnaW5zLiBJdCBoYXMgYWNjZXNzIHRvIHRoZSAqZG9jdW1lbnQqLlxuLy8gWW91IGNhbiBhY2Nlc3MgYnJvd3NlciBBUElzIGluIHRoZSA8c2NyaXB0PiB0YWcgaW5zaWRlIFwidWkuaHRtbFwiIHdoaWNoIGhhcyBhXG4vLyBmdWxsIGJyb3dzZXIgZW52aXJvbm1lbnQgKHNlZSBkb2N1bWVudGF0aW9uKS5cbi8vIFRoaXMgc2hvd3MgdGhlIEhUTUwgcGFnZSBpbiBcInVpLmh0bWx2aWV3c0RhdGFcIi5cbmZpZ21hLnNob3dVSShfX2h0bWxfXyk7XG5jb25zdCBQQURESU5HX1dJRFRIX1JFR0VYID0gLyg/PD10cmFuc2xhdGVcXCgpXFxkKy87XG5jb25zdCBQQURESU5HX0hFSUdIVF9SRUdFWCA9IC8oPzw9dHJhbnNsYXRlXFwoXFxkKywpXFxkKy87XG5jb25zdCBTVkdfV0lEVEhfUkVHRVggPSAvKD88PXdpZHRoPVwiKVxcZCsvO1xuY29uc3QgU1ZHX0hFSUdIVF9SRUdFWCA9IC8oPzw9aGVpZ2h0PVwiKVxcZCsvO1xuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIHNlYXJjaCB0aHJvdWdoIGFsbCB0b3AgbGV2ZWwgbm9kZXMgb2YgZWFjaCBwYWdlIGluIGEgZmlnbWEgZG9jdW1lbnRcbiAqIHJldHVybnMgYSBsaXN0IG9mIG1hdGNoaW5nIGZpZ21hIG5vZGVzXG4gKiBAcGFyYW0gY3VycmVudFBhZ2VcbiAqIEBwYXJhbSBzZWFyY2hGdW5jdGlvbiBwcmVkaWNhdGUgcnVuIG9uIGVhY2ggY2hpbGQgbm9kZSBvZiB0aGUgcGFnZVxuICovXG5mdW5jdGlvbiBzZWFyY2hUb3BMZXZlbChyb290LCBzZWFyY2hQcmVkaWNhdGUpIHtcbiAgICBjb25zdCBzZWFyY2hSZXN1bHRzID0gW107XG4gICAgY29uc3Qgbm9kZUl0ZXJhdG9yID0gd2Fsa1RyZWVUb0RlcHRoKHJvb3QsIDAsIDMpO1xuICAgIGxldCBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgd2hpbGUgKCFub2RlU3RlcC5kb25lKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2RlU3RlcC52YWx1ZTtcbiAgICAgICAgaWYgKHNlYXJjaFByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICAgICAgc2VhcmNoUmVzdWx0cy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICB9XG4gICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBjaGlsZCBub2RlcyBvZiBjdXJyZW50IHBhZ2VcbiAgICByZXR1cm4gc2VhcmNoUmVzdWx0cztcbn1cbmZ1bmN0aW9uKiB3YWxrVHJlZVRvRGVwdGgobm9kZSwgY3VycmVudERlcHRoID0gMSwgbWF4RGVwdGggPSAyKSB7XG4gICAgeWllbGQgbm9kZTtcbiAgICBjb25zdCB7IGNoaWxkcmVuIH0gPSBub2RlO1xuICAgIGlmIChjaGlsZHJlbiAmJiBjdXJyZW50RGVwdGggPD0gbWF4RGVwdGgpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgeWllbGQqIHdhbGtUcmVlVG9EZXB0aChjaGlsZCwgY3VycmVudERlcHRoICsgMSwgbWF4RGVwdGgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gY2xvbmUodmFsKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlID09PSBcIm51bWJlclwiIHx8IHR5cGUgPT09IFwic3RyaW5nXCIgfHwgdHlwZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwubWFwKCh4KSA9PiBjbG9uZSh4KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgbyA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsKSB7XG4gICAgICAgICAgICAgICAgb1trZXldID0gY2xvbmUodmFsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgXCJ1bmtub3duXCI7XG59XG5mdW5jdGlvbiogd2Fsa1RyZWUobm9kZSkge1xuICAgIHlpZWxkIG5vZGU7XG4gICAgY29uc3QgeyBjaGlsZHJlbiB9ID0gbm9kZTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgeWllbGQqIHdhbGtUcmVlKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIENhbGxzIHRvIFwicGFyZW50LnBvc3RNZXNzYWdlXCIgZnJvbSB3aXRoaW4gdGhlIEhUTUwgcGFnZSB3aWxsIHRyaWdnZXIgdGhpc1xuLy8gY2FsbGJhY2suIFRoZSBjYWxsYmFjayB3aWxsIGJlIHBhc3NlZCB0aGUgXCJwbHVnaW5NZXNzYWdlXCIgcHJvcGVydHkgb2YgdGhlXG4vLyBwb3N0ZWQgbWVzc2FnZS5cbmZpZ21hLnVpLm9ubWVzc2FnZSA9IChtc2cpID0+IHtcbiAgICAvLyBPbmUgd2F5IG9mIGRpc3Rpbmd1aXNoaW5nIGJldHdlZW4gZGlmZmVyZW50IHR5cGVzIG9mIG1lc3NhZ2VzIHNlbnQgZnJvbVxuICAgIC8vIHlvdXIgSFRNTCBwYWdlIGlzIHRvIHVzZSBhbiBvYmplY3Qgd2l0aCBhIFwidHlwZVwiIHByb3BlcnR5IGxpa2UgdGhpcy5cbiAgICBmaWdtYS5yb290LmNoaWxkcmVuO1xuICAgIGlmIChtc2cudHlwZSA9PT0gXCJjcmVhdGVcIikge1xuICAgICAgICAvLyBUT0RPOiBjYXN0IGFzIGEgY3JlYXRlIG1zZyB0eXBlXG4gICAgICAgIGNvbnN0IG5vZGVzID0gW107XG4gICAgICAgIGNvbnN0IHN2Z1N0cmluZyA9IG1zZy5zdmdUb1JlbmRlcjtcbiAgICAgICAgY29uc3QgaWQgPSBtc2cudmlld0lkO1xuICAgICAgICBjb25zdCB2aWV3TmFtZSA9IG1zZy5uYW1lO1xuICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgICAgICBjb25zdCB2aXN1YWxpemF0aW9uID0gZmlnbWEuY3JlYXRlTm9kZUZyb21Tdmcoc3ZnU3RyaW5nKTtcbiAgICAgICAgdmlzdWFsaXphdGlvbi5uYW1lID0gYFZpc3VhbGl6YXRpb24gTGF5ZXIgLSAke3ZpZXdOYW1lfWA7XG4gICAgICAgIHZpc3VhbGl6YXRpb24ubG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgLy8gcGxhY2UgYW5ub3RhdGlvbnMgbGF5ZXIgb24gdG9wIGFuZCBtYWtlIHRyYW5zcGFyZW50XG4gICAgICAgIGNvbnN0IG5ld0Fubm90YXRpb25zTGF5ZXIgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBjb25zdCBwYWRkaW5nV2lkdGhNYXRjaGVzID0gc3ZnU3RyaW5nLm1hdGNoKFBBRERJTkdfV0lEVEhfUkVHRVgpO1xuICAgICAgICBjb25zdCBwYWRkaW5nSGVpZ2h0TWF0Y2hlcyA9IHN2Z1N0cmluZy5tYXRjaChQQURESU5HX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmIChwYWRkaW5nV2lkdGhNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aFN0cmluZyA9IHBhZGRpbmdXaWR0aE1hdGNoZXNbMF07XG4gICAgICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLnNldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ1dpZHRoXCIsIHdpZHRoU3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFkZGluZ0hlaWdodE1hdGNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodFN0cmluZyA9IHBhZGRpbmdIZWlnaHRNYXRjaGVzWzBdO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWxscyA9IGNsb25lKG5ld0Fubm90YXRpb25zTGF5ZXIuZmlsbHMpO1xuICAgICAgICBmaWxsc1swXS5vcGFjaXR5ID0gMDtcbiAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5maWxscyA9IGZpbGxzO1xuICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLmNsaXBzQ29udGVudCA9IGZhbHNlO1xuICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLm5hbWUgPSBgQW5ub3RhdGlvbnMgTGF5ZXIgLSAke3ZpZXdOYW1lfWA7XG4gICAgICAgIC8vIGdyYWIgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAvLyBzZXQgYW5ub3RhdGlvbnMgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICBjb25zdCB3aWR0aE1hdGNoZXMgPSBzdmdTdHJpbmcubWF0Y2goU1ZHX1dJRFRIX1JFR0VYKTtcbiAgICAgICAgY29uc3QgaGVpZ2h0TWF0Y2hlcyA9IHN2Z1N0cmluZy5tYXRjaChTVkdfSEVJR0hUX1JFR0VYKTtcbiAgICAgICAgaWYgKHdpZHRoTWF0Y2hlcyAmJiBoZWlnaHRNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IE51bWJlcih3aWR0aE1hdGNoZXNbMF0pO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gTnVtYmVyKGhlaWdodE1hdGNoZXNbMF0pO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5yZXNpemUod2lkdGggPiAwID8gd2lkdGggOiAxMDAsIGhlaWdodCA+IDAgPyBoZWlnaHQgOiAxMDApO1xuICAgICAgICB9XG4gICAgICAgIC8vXG4gICAgICAgIGNvbnN0IGdyb3VwID0gZmlnbWEuZ3JvdXAoW25ld0Fubm90YXRpb25zTGF5ZXIsIHZpc3VhbGl6YXRpb25dLCBmaWdtYS5jdXJyZW50UGFnZSk7XG4gICAgICAgIGdyb3VwLm5hbWUgPSB2aWV3TmFtZTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpZXdOYW1lXCIsIHZpZXdOYW1lKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpZXdJZFwiLCBtc2cudmlld0lkKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInR5cGVcIiwgXCJ2ZWdhVmlld1wiKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcImFubm90YXRpb25TcGVjXCIsIGB7XCJtYXJrc1wiOltdfWApO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwiYW5ub3RhdGlvbk5vZGVJZFwiLCBuZXdBbm5vdGF0aW9uc0xheWVyLmlkKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpc3VhbGl6YXRpb25TcGVjXCIsIG1zZy52ZWdhU3BlYyk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aXN1YWxpemF0aW9uTm9kZUlkXCIsIHZpc3VhbGl6YXRpb24uaWQpO1xuICAgICAgICBpZiAocGFkZGluZ1dpZHRoTWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGhTdHJpbmcgPSBwYWRkaW5nV2lkdGhNYXRjaGVzWzBdO1xuICAgICAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIiwgd2lkdGhTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkaW5nSGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0U3RyaW5nID0gcGFkZGluZ0hlaWdodE1hdGNoZXNbMF07XG4gICAgICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB2aWV3SWQ6IG1zZy52aWV3SWQsXG4gICAgICAgICAgICB2aWV3Tm9kZUlkOiBncm91cC5pZCxcbiAgICAgICAgICAgIHZpc3VhbGl6YXRpb25Ob2RlSWQ6IHZpc3VhbGl6YXRpb24uaWQsXG4gICAgICAgICAgICBhbm5vdGF0aW9uTm9kZUlkOiBuZXdBbm5vdGF0aW9uc0xheWVyLmlkLFxuICAgICAgICAgICAgdHlwZTogXCJmaW5pc2hlZENyZWF0ZVwiLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAobXNnLnR5cGUgPT09IFwidXBkYXRlXCIpIHtcbiAgICAgICAgY29uc3QgeyB2aXN1YWxpemF0aW9uTm9kZUlkLCBhbm5vdGF0aW9uTm9kZUlkLCB2aWV3Tm9kZUlkLCB2aWV3SWQsIHZpZXdOYW1lLCB2ZWdhU3BlYywgc3ZnVG9SZW5kZXIgfSA9IG1zZztcbiAgICAgICAgLy8gZGVsZXRlIG9sZCB2aXNcbiAgICAgICAgZmlnbWEuZ2V0Tm9kZUJ5SWQodmlzdWFsaXphdGlvbk5vZGVJZCkucmVtb3ZlKCk7XG4gICAgICAgIGNvbnN0IHZpc3VhbGl6YXRpb24gPSBmaWdtYS5jcmVhdGVOb2RlRnJvbVN2ZyhzdmdUb1JlbmRlcik7XG4gICAgICAgIHZpc3VhbGl6YXRpb24ubmFtZSA9IGBWaXN1YWxpemF0aW9uIExheWVyIC0gJHt2aWV3TmFtZX1gO1xuICAgICAgICB2aXN1YWxpemF0aW9uLmxvY2tlZCA9IHRydWU7XG4gICAgICAgIC8vIHBsYWNlIGFubm90YXRpb25zIGxheWVyIG9uIHRvcCBhbmQgbWFrZSB0cmFuc3BhcmVudFxuICAgICAgICBsZXQgYW5ub3RhdGlvbkxheWVyID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoYW5ub3RhdGlvbk5vZGVJZCk7XG4gICAgICAgIGlmICghYW5ub3RhdGlvbkxheWVyKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uTGF5ZXIgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhZGRpbmdXaWR0aE1hdGNoZXMgPSBzdmdUb1JlbmRlci5tYXRjaChQQURESU5HX1dJRFRIX1JFR0VYKTtcbiAgICAgICAgY29uc3QgcGFkZGluZ0hlaWdodE1hdGNoZXMgPSBzdmdUb1JlbmRlci5tYXRjaChQQURESU5HX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmIChwYWRkaW5nV2lkdGhNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aFN0cmluZyA9IHBhZGRpbmdXaWR0aE1hdGNoZXNbMF07XG4gICAgICAgICAgICBhbm5vdGF0aW9uTGF5ZXIuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIiwgd2lkdGhTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkaW5nSGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0U3RyaW5nID0gcGFkZGluZ0hlaWdodE1hdGNoZXNbMF07XG4gICAgICAgICAgICBhbm5vdGF0aW9uTGF5ZXIuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nSGVpZ2h0XCIsIGhlaWdodFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgYW5ub3RhdGlvbkxheWVyLm5hbWUgPSBgQW5ub3RhdGlvbnMgTGF5ZXIgLSAke3ZpZXdOYW1lfWA7XG4gICAgICAgIC8vIGdyYWIgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAvLyBzZXQgYW5ub3RhdGlvbnMgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICBjb25zdCB3aWR0aE1hdGNoZXMgPSBzdmdUb1JlbmRlci5tYXRjaChTVkdfV0lEVEhfUkVHRVgpO1xuICAgICAgICBjb25zdCBoZWlnaHRNYXRjaGVzID0gc3ZnVG9SZW5kZXIubWF0Y2goU1ZHX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmICh3aWR0aE1hdGNoZXMgJiYgaGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBOdW1iZXIod2lkdGhNYXRjaGVzWzBdKTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IE51bWJlcihoZWlnaHRNYXRjaGVzWzBdKTtcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgYW5ub3RhdGlvbkxheWVyLnJlc2l6ZSh3aWR0aCA+IDAgPyB3aWR0aCA6IDEwMCwgaGVpZ2h0ID4gMCA/IGhlaWdodCA6IDEwMCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGdyb3VwID0gZmlnbWEuZ2V0Tm9kZUJ5SWQodmlld05vZGVJZCk7XG4gICAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgICAgIGdyb3VwID0gZmlnbWEuZ3JvdXAoW2Fubm90YXRpb25MYXllciwgdmlzdWFsaXphdGlvbl0sIGZpZ21hLmN1cnJlbnRQYWdlKTtcbiAgICAgICAgfVxuICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQodmlzdWFsaXphdGlvbik7XG4gICAgICAgIGdyb3VwLm5hbWUgPSB2aWV3TmFtZTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpZXdOYW1lXCIsIHZpZXdOYW1lKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpZXdJZFwiLCB2aWV3SWQpO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwidHlwZVwiLCBcInZlZ2FWaWV3XCIpO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwiYW5ub3RhdGlvblNwZWNcIiwgYHtcIm1hcmtzXCI6W119YCk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aXN1YWxpemF0aW9uU3BlY1wiLCB2ZWdhU3BlYyk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aXN1YWxpemF0aW9uTm9kZUlkXCIsIHZpc3VhbGl6YXRpb24uaWQpO1xuICAgICAgICBpZiAocGFkZGluZ1dpZHRoTWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGhTdHJpbmcgPSBwYWRkaW5nV2lkdGhNYXRjaGVzWzBdO1xuICAgICAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIiwgd2lkdGhTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkaW5nSGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0U3RyaW5nID0gcGFkZGluZ0hlaWdodE1hdGNoZXNbMF07XG4gICAgICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB2aWV3SWQ6IHZpZXdJZCxcbiAgICAgICAgICAgIHZpZXdOb2RlSWQ6IGdyb3VwLmlkLFxuICAgICAgICAgICAgdmlzdWFsaXphdGlvbk5vZGVJZDogdmlzdWFsaXphdGlvbi5pZCxcbiAgICAgICAgICAgIGFubm90YXRpb25Ob2RlSWQ6IGFubm90YXRpb25MYXllci5pZCxcbiAgICAgICAgICAgIHR5cGU6IFwiZmluaXNoZWRDcmVhdGVcIixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG1zZy50eXBlID09PSBcImZldGNoXCIpIHtcbiAgICAgICAgLy9jb25zdCBzZWxlY3RlZE5vZGVJZCA9IG1zZy52aWV3Tm9kZUlkO1xuICAgICAgICBjb25zb2xlLmxvZyhcImZldGNoaW5nIG5vZGUgaWRcIiwgbXNnLnZpZXdOb2RlSWQpO1xuICAgICAgICBjb25zdCBhbm5vdGF0aW9uc0lkID0gbXNnLmFubm90YXRpb25Ob2RlSWQ7XG4gICAgICAgIGNvbnN0IHZpZXdOb2RlSWQgPSBtc2cudmlld05vZGVJZDtcbiAgICAgICAgY29uc3Qgdmlld0lkID0gbXNnLnZpZXdJZDtcbiAgICAgICAgLy8gdXNlcyBhIGZldGNoIGJ5IGlkXG4gICAgICAgIGNvbnN0IGFubm90YXRpb25zTGF5ZXIgPSBmaWdtYS5nZXROb2RlQnlJZChhbm5vdGF0aW9uc0lkKTtcbiAgICAgICAgLy8gZmluZCBjdXJyZW50IHNlbGVjdGlvblxuICAgICAgICAvL0B0cy1pZ25vcmUgICAgLy9cbiAgICAgICAgLy8gZ3JhYiBhbm5ub3RhdGlvbnMgbGF5ZXIsXG4gICAgICAgIC8vIGdyYWIgcGx1Z2luIGRhdGEgZm9yIHRoZSB3aWR0aC9oZWlnaHQgcGFkZGluZ1xuICAgICAgICAvL2NvbnN0IG5ld1NlbGVjdGlvbiA9IFtmaWdtYS5mbGF0dGVuKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbildO1xuICAgICAgICBjb25zb2xlLmxvZyhhbm5vdGF0aW9uc0xheWVyKTtcbiAgICAgICAgY29uc3Qgbm9kZUl0ZXJhdG9yID0gd2Fsa1RyZWUoYW5ub3RhdGlvbnNMYXllcik7XG4gICAgICAgIGxldCBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIGNvbnN0IHZlY3Rvcml6ZWROb2RlUGF5bG9hZCA9IFtdO1xuICAgICAgICB3aGlsZSAoIW5vZGVTdGVwLmRvbmUpIHtcbiAgICAgICAgICAgIC8vIHNraXAgbm9kZSB0eXBlc1xuICAgICAgICAgICAgaWYgKG5vZGVTdGVwLnZhbHVlLnR5cGUgPT09IFwiRlJBTUVcIiB8fCBub2RlU3RlcC52YWx1ZS50eXBlID09PSBcIkdST1VQXCIpIHtcbiAgICAgICAgICAgICAgICBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZVN0ZXAudmFsdWUuY2xvbmUoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibm9kZSB2YWx1ZVwiLCBub2RlKTtcbiAgICAgICAgICAgIC8vIGlmIG5vZGVUeXBlIGlzIGdyb3VwXG4gICAgICAgICAgICBjb25zdCB2ZWN0b3JpemVkU2NlbmVOb2RlID0gdmVjdG9yaXplKG5vZGUpO1xuICAgICAgICAgICAgY29uc3QgdmVjdG9yaXplZE5vZGVzID0gdmVjdG9yaXplZFNjZW5lTm9kZS5tYXAoKHZlY3Rvcml6ZWROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbm9kZUlkOiB2ZWN0b3JpemVkTm9kZS5pZCwgdmVjdG9yUGF0aHM6IHZlY3Rvcml6ZWROb2RlLnZlY3RvclBhdGhzIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZlY3Rvcml6ZWROb2RlUGF5bG9hZC5wdXNoKHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JpemVkTm9kZXM6IHZlY3Rvcml6ZWROb2RlcyxcbiAgICAgICAgICAgICAgICBvdXRsaW5lZFN0cm9rZTogdmVjdG9yaXplZE5vZGVzLmxlbmd0aCA+IDEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgfVxuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBub2RlQ29sbGVjdGlvbjogdmVjdG9yaXplZE5vZGVQYXlsb2FkLFxuICAgICAgICAgICAgdmlld05vZGVJZDogdmlld05vZGVJZCxcbiAgICAgICAgICAgIHZpZXdJZDogdmlld0lkLFxuICAgICAgICAgICAgdHlwZTogXCJtb2RpZnlQYXRoXCIsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChtc2cudHlwZSA9PT0gXCJzZW5kU2NhbGVkXCIpIHtcbiAgICAgICAgY29uc3QgeyBzdmdOb2RlQ29sbGVjdGlvbiwgdmlld0lkLCB2aWV3Tm9kZUlkIH0gPSBtc2c7XG4gICAgICAgIGNvbnN0IHZpZXdOb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQodmlld05vZGVJZCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaW4gc2VuZCBzY2FsZWRcIiwgdmlld0lkLCB2aWV3Tm9kZSwgbXNnKTtcbiAgICAgICAgaWYgKHZpZXdOb2RlKSB7XG4gICAgICAgICAgICBjb25zdCB2aXN1YWxpemF0aW9uUGFkZGluZ1dpZHRoID0gTnVtYmVyKHZpZXdOb2RlLmdldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ1dpZHRoXCIpKTtcbiAgICAgICAgICAgIGNvbnN0IHZpc3VhbGl6YXRpb25QYWRkaW5nSGVpZ2h0ID0gTnVtYmVyKHZpZXdOb2RlLmdldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ0hlaWdodFwiKSk7XG4gICAgICAgICAgICBjb25zdCBtYXJrQ29sbGVjdGlvbiA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIHN2Z05vZGVDb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFya3MgPSBub2RlLm1hcCgoc3ZnTm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHN2Z1N0cmluZywgbm9kZUlkIH0gPSBzdmdOb2RlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ZWN0b3JpemVkTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGxpbmVzIGFuZCB2ZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZlY3Rvcml6ZWROb2RlLnR5cGUgIT09IFwiVkVDVE9SXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQsIHRYLCB0WSwgc2NhbGUgfSA9IGNhbGN1bGF0ZVBsYWNlbWVudCh2ZWN0b3JpemVkTm9kZSwgdmlzdWFsaXphdGlvblBhZGRpbmdXaWR0aCwgdmlzdWFsaXphdGlvblBhZGRpbmdIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1Zpc2libGUgPSBjYWxjdWxhdGVJc1Zpc2libGUodmVjdG9yaXplZE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHJva2VTcGVjcyA9IGNhbGN1bGF0ZVN0cm9rZVNwZWNzKHZlY3Rvcml6ZWROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsbFNwZWNzID0gY2FsY3VsYXRlRmlsbFNwZWNzKHZlY3Rvcml6ZWROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWlzY1NwZWNzID0gY2FsY3VsYXRlTWlzY1NwZWNzKHZlY3Rvcml6ZWROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHlTcGVjcyA9IFtdLmNvbmNhdChzdHJva2VTcGVjcywgZmlsbFNwZWNzLCBtaXNjU3BlY3MpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVkU3BlYyA9IGB7XG4gICAgICAgICAgXCJ0eXBlXCI6IFwic3ltYm9sXCIsXG4gICAgICAgICAgXCJpbnRlcmFjdGl2ZVwiOiBmYWxzZSxcbiAgICAgICAgICBcImVuY29kZVwiOiB7XG4gICAgICAgICAgICBcImVudGVyXCI6IHtcbiAgICAgICAgICAgICAgXCJzaGFwZVwiOiB7XCJ2YWx1ZVwiOiBcIiR7c3ZnU3RyaW5nfVwifSxcbiAgICAgICAgICAgICAgXCJzaXplXCI6e1widmFsdWVcIjoke3NjYWxlfX0sXG4gICAgICAgICAgICAgICR7cHJvcGVydHlTcGVjcy5qb2luKFwiLFwiKX1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgICAgIFwid2lkdGhcIjp7XCJ2YWx1ZVwiOiR7d2lkdGh9fSxcbiAgICAgICAgICAgICAgXCJoZWlnaHRcIjp7XCJ2YWx1ZVwiOiR7aGVpZ2h0fX0sXG4gICAgICAgICAgICAgIFwieFwiOiB7XCJ2YWx1ZVwiOiAke3RYfX0sXG4gICAgICAgICAgICAgIFwieVwiOiB7XCJ2YWx1ZVwiOiAke3RZfX1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICB9YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkU3BlYyA9IEpTT04ucGFyc2UodHJhbnNsYXRlZFNwZWMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VkU3BlY1tcImVuY29kZVwiXVtcImVudGVyXCJdW1wib3BhY2l0eVwiXSA9IHsgdmFsdWU6IDAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2ZWN0b3JpemVkTm9kZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlZFNwZWM7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbWFya0NvbGxlY3Rpb24ucHVzaChtYXJrcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmbGF0dGVuZWRDb2xsZWN0aW9uID0gbWFya0NvbGxlY3Rpb24ucmVkdWNlKChhY2MsIHZhbCkgPT4gYWNjLmNvbmNhdCh2YWwpLCBbXSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZHl3b290dG8gbWFyayBjb2xsZWN0aW9uJywgZmxhdHRlbmVkQ29sbGVjdGlvbik7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvblNwZWM6IHsgbWFya3M6IGZsYXR0ZW5lZENvbGxlY3Rpb24gfSxcbiAgICAgICAgICAgICAgICB2aWV3SWQ6IHZpZXdJZCxcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZpbmlzaGVkTWFya3NcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG1zZy50eXBlID09PSBcInN0YXJ0VXBcIikge1xuICAgICAgICAvLyBzY2FuIHRocm91Z2ggZG9jdW1lbnQgdG8gZmluZCBhbGwgbm9kZXMgd2l0aCBwbHVnaW4gZGF0YSB0eXBlIG1hdGNoaW5nIHZlZ2Egdmlld1xuICAgICAgICBjb25zdCBjdXJyZW50Vmlld3MgPSBzZWFyY2hUb3BMZXZlbChmaWdtYS5yb290LCAobm9kZSkgPT4gbm9kZS5nZXRQbHVnaW5EYXRhKFwidHlwZVwiKSA9PT0gXCJ2ZWdhVmlld1wiKTtcbiAgICAgICAgY29uc3Qgdmlld3NEYXRhID0gW107XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiBjdXJyZW50Vmlld3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHZpZXdEYXRhID0gZXh0cmFjdFZlZ2FWaWV3RGF0YSh2aWV3KTtcbiAgICAgICAgICAgIHZpZXdzRGF0YS5wdXNoKHZpZXdEYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHZpZXdzRGF0YTogdmlld3NEYXRhLCB0eXBlOiBcInN0YXJ0VXBWaWV3c1wiIH0pO1xuICAgIH1cbiAgICAvLyBNYWtlIHN1cmUgdG8gY2xvc2UgdGhlIHBsdWdpbiB3aGVuIHlvdSdyZSBkb25lLiBPdGhlcndpc2UgdGhlIHBsdWdpbiB3aWxsXG4gICAgLy8ga2VlcCBydW5uaW5nLCB3aGljaCBzaG93cyB0aGUgY2FuY2VsIGJ1dHRvbiBhdCB0aGUgYm90dG9tIG9mIHRoZSBzY3JlZW4uXG4gICAgLy9maWdtYS5jbG9zZVBsdWdpbigpO1xufTtcbmZ1bmN0aW9uIGV4dHJhY3RWZWdhVmlld0RhdGEobm9kZSkge1xuICAgIGNvbnN0IHByb3BlcnRpZXNUb0V4dHJhY3QgPSBbXG4gICAgICAgIFwidmlld0lkXCIsXG4gICAgICAgIC8vIFwidmlld05vZGVJZFwiLCBjb21tZW50aW5nIG91dCBiZWNhdXNlIGl0IGlzIG5vdCBhIHBsdWdpbiBwcm9wZXJ0eVxuICAgICAgICAvL1widmlld05hbWVcIixcbiAgICAgICAgXCJ2aXN1YWxpemF0aW9uU3BlY1wiLFxuICAgICAgICBcImFubm90YXRpb25TcGVjXCIsXG4gICAgICAgIFwidmVnYVBhZGRpbmdXaWR0aFwiLFxuICAgICAgICBcInZlZ2FQYWRkaW5nSGVpZ2h0XCIsXG4gICAgICAgIFwiYW5ub3RhdGlvbk5vZGVJZFwiLFxuICAgICAgICBcInZpc3VhbGl6YXRpb25Ob2RlSWRcIixcbiAgICBdO1xuICAgIGNvbnN0IGV4dHJhY3RlZERhdGEgPSB7IHZpZXdOYW1lOiBub2RlLm5hbWUsIHZpZXdOb2RlSWQ6IG5vZGUuaWQgfTtcbiAgICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIHByb3BlcnRpZXNUb0V4dHJhY3QpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IG5vZGUuZ2V0UGx1Z2luRGF0YShwcm9wZXJ0eSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwicHJvcGVydHlcIiwgcHJvcGVydHksIFwiZGF0YVwiLCBkYXRhKTtcbiAgICAgICAgZXh0cmFjdGVkRGF0YVtwcm9wZXJ0eV0gPSBkYXRhO1xuICAgIH1cbiAgICByZXR1cm4gZXh0cmFjdGVkRGF0YTtcbn1cbmZ1bmN0aW9uIGlzTm90Tm9uZShwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eSAhPT0gXCJOT05FXCI7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVNaXNjU3BlY3Mobm9kZSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBbXTtcbiAgICBpZiAobm9kZS5vcGFjaXR5KSB7XG4gICAgICAgIC8vQHRzLWlnbm9yZSB3cm9uZyB0eXBpbmdzID9cbiAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcIm9wYWNpdHlcIjoge1widmFsdWVcIjogJHtub2RlLm9wYWNpdHl9fWApO1xuICAgIH1cbiAgICBpZiAobm9kZS5ibGVuZE1vZGUgIT09IFwiTk9STUFMXCIgJiYgQkxFTkRfTU9ERV9NQVBQSU5HU1tub2RlLmJsZW5kTW9kZV0pIHtcbiAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcImJsZW5kXCI6IHtcInZhbHVlXCI6IFwiJHtCTEVORF9NT0RFX01BUFBJTkdTW25vZGUuYmxlbmRNb2RlXX1cIn1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59XG5mdW5jdGlvbiBpbkFueShwYWludEFyciwgcHJlZGljYXRlKSB7XG4gICAgbGV0IGZsYWcgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHBhaW50QXJyKSB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUodmFsdWUpKSB7XG4gICAgICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmxhZztcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZUlzVmlzaWJsZShub2RlKSB7XG4gICAgbGV0IGlzVmlzaWJsZSA9IGZhbHNlO1xuICAgIC8vQHRzLWlnbm9yZVxuICAgIGlmIChpbkFueShub2RlLmZpbGxzLCAocGFpbnQpID0+IHBhaW50LnZpc2libGUgJiYgcGFpbnQub3BhY2l0eSA+IDApKSB7XG4gICAgICAgIGlzVmlzaWJsZSA9IHRydWU7XG4gICAgICAgIC8vQHRzLWlnbm9yZVxuICAgIH1cbiAgICBlbHNlIGlmIChpbkFueShub2RlLnN0cm9rZXMsIChwYWludCkgPT4gcGFpbnQudmlzaWJsZSAmJiBwYWludC5vcGFjaXR5ID4gMCkpIHtcbiAgICAgICAgaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzVmlzaWJsZTtcbn1cbmNvbnN0IEJMRU5EX01PREVfTUFQUElOR1MgPSB7XG4gICAgREFSS0VOOiBcImRhcmtlblwiLFxuICAgIE1VTFRJUExZOiBcIm11bHRpcGx5XCIsXG4gICAgQ09MT1JfQlVSTjogXCJjb2xvci1idXJuXCIsXG4gICAgTElHSFRFTjogXCJsaWdodGVuXCIsXG4gICAgU0NSRUVOOiBcInNjcmVlblwiLFxuICAgIENPTE9SX0RPREdFOiBcImNvbG9yLWRvZGdlXCIsXG4gICAgT1ZFUkxBWTogXCJvdmVybGF5XCIsXG4gICAgU09GVF9MSUdIVDogXCJzb2Z0LWxpZ2h0XCIsXG4gICAgSEFSRF9MSUdIVDogXCJoYXJkLWxpZ2h0XCIsXG4gICAgRElGRkVSRU5DRTogXCJkaWZmZXJlbmNlXCIsXG4gICAgRVhDTFVTSU9OOiBcImV4Y2x1c2lvblwiLFxuICAgIEhVRTogXCJodWVcIixcbiAgICBTQVRVUkFUSU9OOiBcInNhdHVyYXRpb25cIixcbiAgICBDT0xPUjogXCJjb2xvclwiLFxuICAgIExVTUlOT1NJVFk6IFwibHVtaW5vc2l0eVwiLFxufTtcbmZ1bmN0aW9uIGNhbGN1bGF0ZUZpbGxTcGVjcyhub2RlKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtdO1xuICAgIGNvbnNvbGUubG9nKFwiaW4gZmlsbHMgc3BlY1wiLCBub2RlLmZpbGxzLCBub2RlLm9wYWNpdHksIG5vZGUudmlzaWJsZSk7XG4gICAgaWYgKG5vZGUuZmlsbHMgJiYgbm9kZS5maWxsc1swXSAmJiBub2RlLmZpbGxzWzBdLnZpc2libGUpIHtcbiAgICAgICAgLy9AdHMtaWdub3JlIHdyb25nIHR5cGluZ3MgP1xuICAgICAgICBjb25zdCBjb2xvciA9IG5vZGUuZmlsbHNbMF0uY29sb3I7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY29sb3JzXCIsIGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIsIHJnYlBlcmNlbnRUb0hleChjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKSk7XG4gICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJmaWxsXCI6IHtcInZhbHVlXCI6IFwiJHtyZ2JQZXJjZW50VG9IZXgoY29sb3IuciwgY29sb3IuZywgY29sb3IuYil9XCJ9YCk7XG4gICAgICAgIGlmIChub2RlLmZpbGxzWzBdLm9wYWNpdHkpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJmaWxsT3BhY2l0eVwiOiB7XCJ2YWx1ZVwiOiAke25vZGUuZmlsbHNbMF0ub3BhY2l0eX19YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVTdHJva2VTcGVjcyhub2RlKSB7XG4gICAgY29uc29sZS5sb2coXCJpbiBjYWxjIHNwZWNcIiwgbm9kZSk7XG4gICAgY29uc3QgbmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhub2RlKTtcbiAgICBjb25zb2xlLmxvZyhcImluIGNhbGMgc3BlYyBuYW1lc1wiLCBuYW1lcyk7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtdO1xuICAgIGlmIChub2RlLnN0cm9rZXMgJiYgbm9kZS5zdHJva2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy9AdHMtaWdub3JlIHdyb25nIHR5cGluZ3MgP1xuICAgICAgICBjb25zdCBjb2xvciA9IG5vZGUuc3Ryb2tlc1swXS5jb2xvcjtcbiAgICAgICAgY29uc29sZS5sb2coXCJjb2xvcnNcIiwgY29sb3IuciwgY29sb3IuZywgY29sb3IuYiwgcmdiUGVyY2VudFRvSGV4KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpKTtcbiAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZVwiOiB7XCJ2YWx1ZVwiOiBcIiR7cmdiUGVyY2VudFRvSGV4KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpfVwifWApO1xuICAgICAgICBpZiAobm9kZS5zdHJva2VzWzBdLm9wYWNpdHkpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VPcGFjaXR5XCI6IHtcInZhbHVlXCI6ICR7bm9kZS5zdHJva2VzWzBdLm9wYWNpdHl9fWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnN0cm9rZUNhcCA9PT0gXCJST1VORFwiIHx8IG5vZGUuc3Ryb2tlQ2FwID09PSBcIlNRVUFSRVwiKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwic3Ryb2tlQ2FwXCI6IHtcInZhbHVlXCI6IFwicm91bmRcIn1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zdHJva2VXZWlnaHQpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VXaWR0aFwiOiB7XCJ2YWx1ZVwiOiAke25vZGUuc3Ryb2tlV2VpZ2h0fX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5kYXNoUGF0dGVybiAmJiBub2RlLmRhc2hQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VEYXNoXCI6IHtcInZhbHVlXCI6ICR7bm9kZS5kYXNoUGF0dGVybn19YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc3Ryb2tlTWl0ZXJMaW1pdCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZU1pdGVyTGltaXRcIjoge1widmFsdWVcIjogJHtub2RlLnN0cm9rZU1pdGVyTGltaXR9fWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJldHVybiBhbGwgc3Ryb2tlIHByb3BlcnRpZXMgYXMgc3RyaW5nXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59XG5mdW5jdGlvbiBjb21wb25lbnRUb0hleChjKSB7XG4gICAgdmFyIGhleCA9IGMudG9TdHJpbmcoMTYpO1xuICAgIHJldHVybiBoZXgubGVuZ3RoID09IDEgPyBcIjBcIiArIGhleCA6IGhleDtcbn1cbmZ1bmN0aW9uIHJnYlBlcmNlbnRUb0hleChyLCBnLCBiKSB7XG4gICAgcmV0dXJuIChcIiNcIiArXG4gICAgICAgIGNvbXBvbmVudFRvSGV4KE1hdGgucm91bmQociAqIDI1NSkpICtcbiAgICAgICAgY29tcG9uZW50VG9IZXgoTWF0aC5yb3VuZCgyNTUgKiBnKSkgK1xuICAgICAgICBjb21wb25lbnRUb0hleChNYXRoLnJvdW5kKDI1NSAqIGIpKSk7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVQbGFjZW1lbnQobm9kZSwgcGFkZGluZ1gsIHBhZGRpbmdZKSB7XG4gICAgY29uc3Qgd2lkdGggPSBub2RlLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgIGNvbnN0IHggPSBub2RlLng7XG4gICAgY29uc3QgeSA9IG5vZGUueTtcbiAgICBjb25zdCBtYXhEaW1lbnNpb24gPSBNYXRoLm1heCh3aWR0aCwgaGVpZ2h0KTtcbiAgICBjb25zdCB0WCA9ICgxIC8gMikgKiB3aWR0aCArIHggLSBwYWRkaW5nWDsgLy8rIChtYXhEaW1lbnNpb24taGVpZ2h0KS8yOyAvLyB0b3RhbCB0cmFuc2xhdGVcbiAgICBjb25zdCB0WSA9ICgxIC8gMikgKiBoZWlnaHQgKyB5IC0gcGFkZGluZ1k7IC8vKyAobWF4RGltZW5zaW9uLWhlaWdodCkvMjsgLy8gdG90YWwgdHJhbnNsYXRlXG4gICAgY29uc3Qgc2NhbGUgPSBtYXhEaW1lbnNpb24gKiBtYXhEaW1lbnNpb247XG4gICAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodCwgdFgsIHRZLCBzY2FsZSB9O1xufVxuZnVuY3Rpb24gc2hvdWxkTm9kZUJlT3V0bGluZVN0cm9rZXMobm9kZSkge1xuICAgIGNvbnNvbGUubG9nKFwiaW4gb3V0bGluZVwiLCBub2RlKTtcbiAgICAvLyBpZiB0aGUgaXRlbSBoYXMgYW4gYXJyb3cgZW5kLCBvdXRsaW5lIHN0cm9rZSBiZWNhdXNlIGFycm93IHN0cm9rZSBjYXAgY2Fubm90IGJlIGFwcGxpZWQgOihcbiAgICBpZiAobm9kZS50eXBlID09PSBcIlZFQ1RPUlwiICYmXG4gICAgICAgIFwic3Ryb2tlQ2FwXCIgaW4gbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzW25vZGUudmVjdG9yTmV0d29yay52ZXJ0aWNlcy5sZW5ndGggLSAxXSAmJlxuICAgICAgICBub2RlLnZlY3Rvck5ldHdvcmsudmVydGljZXNbbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzLmxlbmd0aCAtIDFdLnN0cm9rZUNhcCAhPT0gXCJOT05FXCIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKFwic3Ryb2tlQWxpZ25cIiBpbiBub2RlICYmIG5vZGUuc3Ryb2tlQWxpZ24gIT09IFwiQ0VOVEVSXCIpIHtcbiAgICAgICAgLy9ub2RlLnN0cm9rZUFsaWduID0gXCJDRU5URVJcIjtcbiAgICAgICAgLy8gYXMgdmVnYSBkb2Vzbid0IHN1cHBvcnQgaW5zaWRlIG9yIGNlbnRlciwgb3V0bGluZSBzdHJva2VcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHZlY3Rvcml6ZShub2RlKSB7XG4gICAgY29uc3Qgbm9kZXNUb1JldHVybiA9IFtdO1xuICAgIC8vIGlmIG5vZGUgaXMgdGV4dCwgY29tYmluZSBhbGwgdmVjdG9yIHBhdGhzXG4gICAgbGV0IHZlY3Rvck5vZGUgPSBmaWdtYS5mbGF0dGVuKFtub2RlXSk7XG4gICAgLy8gbGluZXMgYW5kIHZlY3RvciBwYXRocyB3aXRoIHN0cm9rZXNcbiAgICBjb25zdCBvdXRsaW5lZE5vZGUgPSB2ZWN0b3JOb2RlLm91dGxpbmVTdHJva2UoKTtcbiAgICAvLyBpZiBubyBmaWxscywgb3V0bGluZSBzdHJva2VcbiAgICBub2Rlc1RvUmV0dXJuLnB1c2godmVjdG9yTm9kZSk7XG4gICAgaWYgKG91dGxpbmVkTm9kZSAmJiBzaG91bGROb2RlQmVPdXRsaW5lU3Ryb2tlcyh2ZWN0b3JOb2RlKSkge1xuICAgICAgICBub2Rlc1RvUmV0dXJuLnB1c2gob3V0bGluZWROb2RlKTtcbiAgICAgICAgLy8gaGlkZSB0aGUgc3Ryb2tlcyFcbiAgICAgICAgdmVjdG9yTm9kZS5zdHJva2VzID0gW107XG4gICAgfVxuICAgIHJldHVybiBub2Rlc1RvUmV0dXJuO1xufVxuZnVuY3Rpb24gZGVnMlJhZGlhbihkZWcpIHtcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xufVxuZnVuY3Rpb24gbXVsdGlwbHlNYXRyaWNlcyhtYXRyaXhBLCBtYXRyaXhCKSB7XG4gICAgbGV0IGFOdW1Sb3dzID0gbWF0cml4QS5sZW5ndGg7XG4gICAgbGV0IGFOdW1Db2xzID0gbWF0cml4QVswXS5sZW5ndGg7XG4gICAgbGV0IGJOdW1Sb3dzID0gbWF0cml4Qi5sZW5ndGg7XG4gICAgbGV0IGJOdW1Db2xzID0gbWF0cml4QlswXS5sZW5ndGg7XG4gICAgbGV0IG5ld01hdHJpeCA9IG5ldyBBcnJheShhTnVtUm93cyk7XG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCBhTnVtUm93czsgKytyKSB7XG4gICAgICAgIG5ld01hdHJpeFtyXSA9IG5ldyBBcnJheShiTnVtQ29scyk7XG4gICAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgYk51bUNvbHM7ICsrYykge1xuICAgICAgICAgICAgbmV3TWF0cml4W3JdW2NdID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYU51bUNvbHM7ICsraSkge1xuICAgICAgICAgICAgICAgIG5ld01hdHJpeFtyXVtjXSArPSBtYXRyaXhBW3JdW2ldICogbWF0cml4QltpXVtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3TWF0cml4O1xufVxuZnVuY3Rpb24gbXVsdGlwbHkoYSwgYikge1xuICAgIHJldHVybiBbXG4gICAgICAgIFtcbiAgICAgICAgICAgIGFbMF1bMF0gKiBiWzBdWzBdICsgYVswXVsxXSAqIGJbMV1bMF0sXG4gICAgICAgICAgICBhWzBdWzBdICogYlswXVsxXSArIGFbMF1bMV0gKiBiWzFdWzFdLFxuICAgICAgICAgICAgYVswXVswXSAqIGJbMF1bMl0gKyBhWzBdWzFdICogYlsxXVsyXSArIGFbMF1bMl0sXG4gICAgICAgIF0sXG4gICAgICAgIFtcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzBdICsgYVsxXVsxXSAqIGJbMV1bMF0sXG4gICAgICAgICAgICBhWzFdWzBdICogYlswXVsxXSArIGFbMV1bMV0gKiBiWzFdWzFdICsgMCxcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzJdICsgYVsxXVsxXSAqIGJbMV1bMl0gKyBhWzFdWzJdLFxuICAgICAgICBdLFxuICAgIF07XG59XG4vLyBDcmVhdGVzIGEgXCJtb3ZlXCIgdHJhbnNmb3JtLlxuZnVuY3Rpb24gbW92ZSh4LCB5KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgWzEsIDAsIHhdLFxuICAgICAgICBbMCwgMSwgeV0sXG4gICAgXTtcbn1cbi8vIENyZWF0ZXMgYSBcInJvdGF0ZVwiIHRyYW5zZm9ybS5cbmZ1bmN0aW9uIHJvdGF0ZSh0aGV0YSkge1xuICAgIHJldHVybiBbXG4gICAgICAgIFtNYXRoLmNvcyh0aGV0YSksIE1hdGguc2luKHRoZXRhKSwgMF0sXG4gICAgICAgIFstTWF0aC5zaW4odGhldGEpLCBNYXRoLmNvcyh0aGV0YSksIDBdLFxuICAgIF07XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVYWUZyb21Ob2RlKG5vZGUpIHtcbiAgICBsZXQgbG9jYXRpb25SZWxhdGl2ZVRvUGFyZW50WCA9IG5vZGUueDtcbiAgICBsZXQgbG9jYXRpb25SZWxhdGl2ZVRvUGFyZW50WSA9IG5vZGUueTtcbiAgICBsZXQgeCA9IG5vZGUud2lkdGggLyAyO1xuICAgIGxldCB5ID0gbm9kZS53aWR0aCAvIDI7XG4gICAgbGV0IHJvdGF0aW9uRGVnID0gLW5vZGUucm90YXRpb247XG4gICAgbGV0IHJvdGF0aW9uUmFkID0gKE1hdGguUEkgKiByb3RhdGlvbkRlZykgLyAxODA7XG4gICAgbGV0IHhUcmFuc2Zvcm0gPSB4IC0geCAqIE1hdGguY29zKHJvdGF0aW9uUmFkKSArIHkgKiBNYXRoLnNpbihyb3RhdGlvblJhZCk7XG4gICAgbGV0IHlUcmFuc2Zvcm0gPSB5IC0geCAqIE1hdGguc2luKHJvdGF0aW9uUmFkKSArIHkgKiBNYXRoLmNvcyhyb3RhdGlvblJhZCk7XG4gICAgbGV0IHJvdGF0aW9uVHJhbnNmb3JtID0gW1xuICAgICAgICBbTWF0aC5jb3Mocm90YXRpb25SYWQpLCAtTWF0aC5zaW4ocm90YXRpb25SYWQpLCB4VHJhbnNmb3JtXSxcbiAgICAgICAgW01hdGguc2luKHJvdGF0aW9uUmFkKSwgTWF0aC5jb3Mocm90YXRpb25SYWQpLCB5VHJhbnNmb3JtXSxcbiAgICBdO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBub2RlLnJlbGF0aXZlVHJhbnNmb3JtID0gcm90YXRpb25UcmFuc2Zvcm07XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIG5vZGUueCArPSBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRYO1xuICAgIG5vZGUueSArPSBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRZO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUueSksIEpTT04uc3RyaW5naWZ5KG5vZGUueCkpO1xufVxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IGNhbGN1bGF0ZXMgdGhlIGNvcnJlY3QgWFkgcG9zaXRpb24gaWdub3Jpbmcgcm90YXRpb25cbiAqIEBwYXJhbSBub2RlXG4gKi9cbmZ1bmN0aW9uIG5ld0NhbGN1bGF0ZVJlbGF0aXZlKG9yaWdpbmFsTm9kZSkge1xuICAgIGNvbnN0IG5vZGUgPSBvcmlnaW5hbE5vZGUuY2xvbmUoKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy9jb25zdCB4ID0gb3JpZ2luYWxOb2RlLng7XG4gICAgLy9jb25zdCB5ID0gb3JpZ2luYWxOb2RlLnk7XG4gICAgLy9ub2RlLnggPSAwO1xuICAgIC8vbm9kZS55ID0gMDtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLmFic29sdXRlVHJhbnNmb3JtKSk7XG4gICAgLy9ub2RlLnJvdGF0aW9uID0gMDtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbGV0IHRyYW5zZm9ybSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIC8vIG1vdmUgdG8gMFxuICAgIGxldCB4ID0gdHJhbnNmb3JtWzBdWzJdO1xuICAgIGxldCB5ID0gdHJhbnNmb3JtWzFdWzJdO1xuICAgIHRyYW5zZm9ybVswXVsyXSA9IDA7XG4gICAgdHJhbnNmb3JtWzFdWzJdID0gMDtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gMzYwXCIsIEpTT04uc3RyaW5naWZ5KHRyYW5zZm9ybSkpO1xuICAgIHRyYW5zZm9ybSA9IG11bHRpcGx5KHJvdGF0ZSgyICogTWF0aC5QSSAtIChub2RlLnJvdGF0aW9uIC0gTWF0aC5QSSkgLyAxODApLCB0cmFuc2Zvcm0pO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSBhZnRlciByb3RcIiwgSlNPTi5zdHJpbmdpZnkodHJhbnNmb3JtKSk7XG4gICAgdHJhbnNmb3JtID0gbXVsdGlwbHkobW92ZSh4LCB5KSwgdHJhbnNmb3JtKTtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gYWZ0ZXIgbW92ZVwiLCBKU09OLnN0cmluZ2lmeSh0cmFuc2Zvcm0pKTtcbiAgICBjb25zdCBkaWZYID0gbm9kZS54O1xuICAgIGNvbnN0IGRpZlkgPSBub2RlLnk7XG4gICAgY29uc29sZS5sb2coXCJjYWxjZWRcIiwgZGlmWCwgZGlmWSwgeCArIGRpZlgsIHkgKyBkaWZZKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgY29uc29sZS5sb2cobXVsdGlwbHkocm90YXRlKC1ub2RlLnJvdGF0aW9uKSwgdHJhbnNmb3JtKSk7XG4gICAgY29uc29sZS5sb2coXCJmcm9tIDM2MFwiLCBtdWx0aXBseShyb3RhdGUoLShub2RlLnJvdGF0aW9uIC0gTWF0aC5QSSkgLyAxODApLCBub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy8gcm90YXRlIGJhY2tcbiAgICBjb25zdCBhbmdsZUluUmFkaWFucyA9IGRlZzJSYWRpYW4oLW5vZGUucm90YXRpb24pO1xuICAgIGNvbnNvbGUubG9nKG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pO1xuICAgIGNvbnN0IG5ldHJhbnNmb3JtID0gbXVsdGlwbHkocm90YXRlKGFuZ2xlSW5SYWRpYW5zKSwgbm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSk7XG4gICAgY29uc29sZS5sb2cobmV0cmFuc2Zvcm0pO1xuICAgIC8qXG4gICAgY29uc29sZS5sb2cobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSlcbiAgICBsZXQgcm90ZXIgPSBub2RlLnJvdGF0aW9uO1xuICAgIG5vZGUucm90YXRpb24gPSAwO1xuICBcbiAgICBjb25zb2xlLmxvZygnb2xkIHgnLEpTT04uc3RyaW5naWZ5KG5vZGUueCksSlNPTi5zdHJpbmdpZnkobm9kZS55KSxKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbm9kZS5yb3RhdGlvbiA9IHJvdGVyO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCduZXcgeCcseCx5LEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKVxuICBcbiAgXG4gIFxuICAgIGNvbnN0IHdpZHRoID0gbm9kZS53aWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSBub2RlLmhlaWdodDtcbiAgICBjb25zb2xlLmxvZyh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjb25zdCByb3QgPSAobm9kZS5yb3RhdGlvbiAqIE1hdGguUEkpIC8gMTgwOyAvLyBpbiByYWRpYW5zXG4gIFxuICAgIC8vIG5vdGUsIHRvIGNhbGN1bGF0ZSBkaXN0YW5jZSBmcm9tIHJvdGF0aW9uLCB5b3UgbXVzdCBmbGlwIHRoZSBzaWduICAoMS8yKUggYmVjYXVzZSBpbiBjYXJ0ZXNpYW4gY29vcmRpbmF0ZXMgeSBERUNSRUFTRVMgYXMgeW91XG4gICAgY29uc3QgcmVhbFggPSB4ICsgKDEgLyAyKSAqIHdpZHRoICogTWF0aC5jb3Mocm90KSAvKi0gLTEgKiAoMSAvIDIpICogaGVpZ2h0ICogTWF0aC5zaW4ocm90KSAgLSAoMSAvIDIpICogd2lkdGg7XG4gICAgICBjb25zb2xlLmxvZyh5LCgxIC8gMikgKiB3aWR0aCAqIE1hdGguc2luKHJvdCksIC0xICogKDEgLyAyKSAqIGhlaWdodCAqIE1hdGguY29zKHJvdCksICgxIC8gMikgKiBoZWlnaHQpXG4gIFxuICAgIGNvbnN0IHJlYWxZID1cbiAgICAgIHkgKyAoMSAvIDIpICogd2lkdGggKiBNYXRoLnNpbihyb3QpIC8qKyAtMSAqICgxIC8gMikgKiBoZWlnaHQgKiBNYXRoLmNvcyhyb3QpICsoMSAvIDIpICogaGVpZ2h0O1xuICAgIHJldHVybiBbcmVhbFgsIHJlYWxZXTsqL1xuICAgIGNvbnN0IHRvdGFsTGVuZ3RoT2ZIeXBvID0gTWF0aC5zcXJ0KG5vZGUud2lkdGggKiBub2RlLndpZHRoICsgbm9kZS5oZWlnaHQgKiBub2RlLmhlaWdodCk7XG59XG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uLCBpLmUuIHRoZSB0cmFuc2xhdGlvbiBhbmQgc2NhbGluZywgcmVxdWlyZWRcbi8vIHRvIGdldCB0aGUgcGF0aCB0byBmaWxsIHRoZSBzdmcgYXJlYS4gTm90ZSB0aGF0IHRoaXMgYXNzdW1lcyB1bmlmb3JtXG4vLyBzY2FsaW5nLCBhIHBhdGggdGhhdCBoYXMgbm8gb3RoZXIgdHJhbnNmb3JtcyBhcHBsaWVkIHRvIGl0LCBhbmQgbm9cbi8vIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIHN2ZyB2aWV3cG9ydCBhbmQgdmlld0JveCBkaW1lbnNpb25zLlxuZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB2YXIgc3ZnV2R0aCA9IDI7XG4gICAgdmFyIHN2Z0hnaHQgPSAyO1xuICAgIHZhciBvcmlnUGF0aEhnaHQgPSBoZWlnaHQ7XG4gICAgdmFyIG9yaWdQYXRoV2R0aCA9IHdpZHRoO1xuICAgIHZhciBvcmlnUGF0aFkgPSB5O1xuICAgIHZhciBvcmlnUGF0aFggPSB4O1xuICAgIC8vIGhvdyBtdWNoIGJpZ2dlciBpcyB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBwYXRoIGluIGVhY2ggZGltZW5zaW9uP1xuICAgIHZhciBzY2FsZUJhc2VkT25XZHRoID0gc3ZnV2R0aCAvIG9yaWdQYXRoV2R0aDtcbiAgICB2YXIgc2NhbGVCYXNlZE9uSGdodCA9IHN2Z0hnaHQgLyBvcmlnUGF0aEhnaHQ7XG4gICAgLy8gb2YgdGhlIHNjYWxpbmcgZmFjdG9ycyBkZXRlcm1pbmVkIGluIGVhY2ggZGltZW5zaW9uLFxuICAgIC8vIHVzZSB0aGUgc21hbGxlciBvbmU7IG90aGVyd2lzZSBwb3J0aW9ucyBvZiB0aGUgcGF0aFxuICAgIC8vIHdpbGwgbGllIG91dHNpZGUgdGhlIHZpZXdwb3J0IChjb3JyZWN0IHRlcm0/KVxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKHNjYWxlQmFzZWRPbldkdGgsIHNjYWxlQmFzZWRPbkhnaHQpO1xuICAgIC8vIGNhbGN1bGF0ZSB0aGUgYm91bmRpbmcgYm94IHBhcmFtZXRlcnNcbiAgICAvLyBhZnRlciB0aGUgcGF0aCBoYXMgYmVlbiBzY2FsZWQgcmVsYXRpdmUgdG8gdGhlIG9yaWdpblxuICAgIC8vIGJ1dCBiZWZvcmUgYW55IHN1YnNlcXVlbnQgdHJhbnNsYXRpb25zIGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgdmFyIHNjYWxlZFBhdGhYID0gb3JpZ1BhdGhYICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhZID0gb3JpZ1BhdGhZICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhXZHRoID0gb3JpZ1BhdGhXZHRoICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhIZ2h0ID0gb3JpZ1BhdGhIZ2h0ICogc2NhbGU7XG4gICAgLy8gY2FsY3VsYXRlIHRoZSBjZW50cmUgcG9pbnRzIG9mIHRoZSBzY2FsZWQgYnV0IHVudHJhbnNsYXRlZCBwYXRoXG4gICAgLy8gYXMgd2VsbCBhcyBvZiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIHZhciBzY2FsZWRQYXRoQ2VudHJlWCA9IHNjYWxlZFBhdGhYICsgc2NhbGVkUGF0aFdkdGggLyAyO1xuICAgIHZhciBzY2FsZWRQYXRoQ2VudHJlWSA9IHNjYWxlZFBhdGhZICsgc2NhbGVkUGF0aEhnaHQgLyAyO1xuICAgIHZhciBzdmdSb290Q2VudHJlWCA9IDA7IC8vIC1zdmdXZHRoIC8gMjtcbiAgICB2YXIgc3ZnUm9vdENlbnRyZVkgPSAwOyAvLy1zdmdIZ2h0IC8gMjtcbiAgICAvLyBjYWxjdWxhdGUgdHJhbnNsYXRpb24gcmVxdWlyZWQgdG8gY2VudHJlIHRoZSBwYXRoXG4gICAgLy8gb24gdGhlIHN2ZyByb290IGVsZW1lbnRcbiAgICB2YXIgcGF0aFRyYW5zbFggPSBzdmdSb290Q2VudHJlWCAtIHNjYWxlZFBhdGhDZW50cmVYO1xuICAgIHZhciBwYXRoVHJhbnNsWSA9IHN2Z1Jvb3RDZW50cmVZIC0gc2NhbGVkUGF0aENlbnRyZVk7XG4gICAgY29uc29sZS5sb2coXCJzY2FsZWQgcGF0aCB4XCIsIHNjYWxlZFBhdGhYLCBzY2FsZWRQYXRoV2R0aCwgXCJzY2FsZWQgcGF0aCB5XCIsIHNjYWxlZFBhdGhZLCBzY2FsZWRQYXRoSGdodCwgXCJmYWN0b3IgZnJvbSBzY2FsZVwiLCAob3JpZ1BhdGhIZ2h0IC0gb3JpZ1BhdGhXZHRoKSAvIDIsIFwieGZhY3RvciBmcm9tIGdcIik7XG4gICAgLy9cbiAgICBjb25zb2xlLmxvZyhwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKTtcbiAgICByZXR1cm4geyBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlIH07XG59XG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1lZFBhdGhEU3RyKG9sZFBhdGhEU3RyLCBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKSB7XG4gICAgLy8gY29uc3RhbnRzIHRvIGhlbHAga2VlcCB0cmFjayBvZiB0aGUgdHlwZXMgb2YgU1ZHIGNvbW1hbmRzIGluIHRoZSBwYXRoXG4gICAgdmFyIEJPVEhfWF9BTkRfWSA9IDE7XG4gICAgdmFyIEpVU1RfWCA9IDI7XG4gICAgdmFyIEpVU1RfWSA9IDM7XG4gICAgdmFyIE5PTkUgPSA0O1xuICAgIHZhciBFTExJUFRJQ0FMX0FSQyA9IDU7XG4gICAgdmFyIEFCU09MVVRFID0gNjtcbiAgICB2YXIgUkVMQVRJVkUgPSA3O1xuICAgIC8vIHR3byBwYXJhbGxlbCBhcnJheXMsIHdpdGggZWFjaCBlbGVtZW50IGJlaW5nIG9uZSBjb21wb25lbnQgb2YgdGhlXG4gICAgLy8gXCJkXCIgYXR0cmlidXRlIG9mIHRoZSBTVkcgcGF0aCwgd2l0aCBvbmUgY29tcG9uZW50IGJlaW5nIGVpdGhlclxuICAgIC8vIGFuIGluc3RydWN0aW9uIChlLmcuIFwiTVwiIGZvciBtb3ZldG8sIGV0Yy4pIG9yIG51bWVyaWNhbCB2YWx1ZVxuICAgIC8vIGZvciBlaXRoZXIgYW4geCBvciB5IGNvb3JkaW5hdGVcbiAgICB2YXIgb2xkUGF0aERBcnIgPSBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKG9sZFBhdGhEU3RyKTtcbiAgICB2YXIgbmV3UGF0aERBcnIgPSBbXTtcbiAgICBjb25zb2xlLmxvZyhvbGRQYXRoREFycik7XG4gICAgdmFyIGNvbW1hbmRQYXJhbXMsIGFic09yUmVsLCBvbGRQYXRoRENvbXAsIG5ld1BhdGhEQ29tcDtcbiAgICAvLyBlbGVtZW50IGluZGV4XG4gICAgdmFyIGlkeCA9IDA7XG4gICAgd2hpbGUgKGlkeCA8IG9sZFBhdGhEQXJyLmxlbmd0aCkge1xuICAgICAgICB2YXIgb2xkUGF0aERDb21wID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICAgICAgaWYgKC9eW0EtWmEtel0kLy50ZXN0KG9sZFBhdGhEQ29tcCkpIHtcbiAgICAgICAgICAgIC8vIGNvbXBvbmVudCBpcyBhIHNpbmdsZSBsZXR0ZXIsIGkuZS4gYW4gc3ZnIHBhdGggY29tbWFuZFxuICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvbGRQYXRoRENvbXApO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmV3UGF0aERBcnJbaWR4XSk7XG4gICAgICAgICAgICBzd2l0Y2ggKG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFcIjogLy8gZWxsaXB0aWNhbCBhcmMgY29tbWFuZC4uLnRoZSBtb3N0IGNvbXBsaWNhdGVkIG9uZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gRUxMSVBUSUNBTF9BUkM7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6IC8vIGhvcml6b250YWwgbGluZTsgcmVxdWlyZXMgb25seSBhbiB4LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlZcIjogLy8gdmVydGljYWwgbGluZTsgcmVxdWlyZXMgb25seSBhIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9ZO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiWlwiOiAvLyBjbG9zZSB0aGUgcGF0aFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gTk9ORTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsIG90aGVyIGNvbW1hbmRzOyBhbGwgb2YgdGhlbSByZXF1aXJlIGJvdGggeCBhbmQgeSBjb29yZGluYXRlc1xuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gQk9USF9YX0FORF9ZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWJzT3JSZWwgPSBvbGRQYXRoRENvbXAgPT09IG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpID8gQUJTT0xVVEUgOiBSRUxBVElWRTtcbiAgICAgICAgICAgIC8vIGxvd2VyY2FzZSBjb21tYW5kcyBhcmUgcmVsYXRpdmUsIHVwcGVyY2FzZSBhcmUgYWJzb2x1dGVcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhlIGNvbXBvbmVudCBpcyBub3QgYSBsZXR0ZXIsIHRoZW4gaXQgaXMgYSBudW1lcmljIHZhbHVlXG4gICAgICAgICAgICB2YXIgdHJhbnNsWCwgdHJhbnNsWTtcbiAgICAgICAgICAgIGlmIChhYnNPclJlbCA9PT0gQUJTT0xVVEUpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgdHJhbnNsYXRpb24gaXMgcmVxdWlyZWQgZm9yIGFic29sdXRlIGNvbW1hbmRzLi4uXG4gICAgICAgICAgICAgICAgdHJhbnNsWCA9IHBhdGhUcmFuc2xYO1xuICAgICAgICAgICAgICAgIHRyYW5zbFkgPSBwYXRoVHJhbnNsWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFic09yUmVsID09PSBSRUxBVElWRSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLmJ1dCBub3QgcmVsYXRpdmUgb25lc1xuICAgICAgICAgICAgICAgIHRyYW5zbFggPSAwO1xuICAgICAgICAgICAgICAgIHRyYW5zbFkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChjb21tYW5kUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgLy8gZmlndXJlIG91dCB3aGljaCBvZiB0aGUgbnVtZXJpYyB2YWx1ZXMgZm9sbG93aW5nIGFuIHN2ZyBjb21tYW5kXG4gICAgICAgICAgICAgICAgLy8gYXJlIHJlcXVpcmVkLCBhbmQgdGhlbiB0cmFuc2Zvcm0gdGhlIG51bWVyaWMgdmFsdWUocykgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBvcmlnaW5hbCBwYXRoIGQtYXR0cmlidXRlIGFuZCBwbGFjZSBpdCBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGVcbiAgICAgICAgICAgICAgICAvLyBhcnJheSB0aGF0IHdpbGwgZXZlbnR1YWxseSBiZWNvbWUgdGhlIGQtYXR0cmlidXRlIGZvciB0aGUgbmV3IHBhdGhcbiAgICAgICAgICAgICAgICBjYXNlIEJPVEhfWF9BTkRfWTpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBKVVNUX1g6XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEpVU1RfWTpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgRUxMSVBUSUNBTF9BUkM6XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBlbGxpcHRpY2FsIGFyYyBoYXMgeCBhbmQgeSB2YWx1ZXMgaW4gdGhlIGZpcnN0IGFuZCBzZWNvbmQgYXMgd2VsbCBhc1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgNnRoIGFuZCA3dGggcG9zaXRpb25zIGZvbGxvd2luZyB0aGUgY29tbWFuZDsgdGhlIGludGVydmVuaW5nIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAvLyBhcmUgbm90IGFmZmVjdGVkIGJ5IHRoZSB0cmFuc2Zvcm1hdGlvbiBhbmQgc28gY2FuIHNpbXBseSBiZSBjb3BpZWRcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAyXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAyXSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDNdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDNdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNF0pO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA1XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA1XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDZdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDZdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgTk9ORTpcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibnVtZXJpYyB2YWx1ZSBzaG91bGQgbm90IGZvbGxvdyB0aGUgU1ZHIFoveiBjb21tYW5kXCIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhuZXdQYXRoREFycik7XG4gICAgcmV0dXJuIG5ld1BhdGhEQXJyLmpvaW4oXCIgXCIpO1xufVxuZnVuY3Rpb24gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhzdHIpIHtcbiAgICAvLyBhc3N1bWluZyB0aGUgc3RyaW5nIGZyb20gdGhlIGQtYXR0cmlidXRlIG9mIHRoZSBwYXRoIGhhcyBhbGwgY29tcG9uZW50c1xuICAgIC8vIHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzcGFjZSwgdGhlbiBjcmVhdGUgYW4gYXJyYXkgb2YgY29tcG9uZW50cyBieVxuICAgIC8vIHNpbXBseSBzcGxpdHRpbmcgdGhlIHN0cmluZyBhdCB0aG9zZSBzcGFjZXNcbiAgICBzdHIgPSBzdGFuZGFyZGl6ZVBhdGhEU3RyRm9ybWF0KHN0cik7XG4gICAgcmV0dXJuIHN0ci5zcGxpdChcIiBcIik7XG59XG5mdW5jdGlvbiBzdGFuZGFyZGl6ZVBhdGhEU3RyRm9ybWF0KHN0cikge1xuICAgIC8vIFRoZSBTVkcgc3RhbmRhcmQgaXMgZmxleGlibGUgd2l0aCByZXNwZWN0IHRvIGhvdyBwYXRoIGQtc3RyaW5ncyBhcmVcbiAgICAvLyBmb3JtYXR0ZWQgYnV0IHRoaXMgbWFrZXMgcGFyc2luZyB0aGVtIG1vcmUgZGlmZmljdWx0LiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXNcbiAgICAvLyB0aGF0IGFsbCBTVkcgcGF0aCBkLXN0cmluZyBjb21wb25lbnRzIChpLmUuIGJvdGggY29tbWFuZHMgYW5kIHZhbHVlcykgYXJlXG4gICAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLlxuICAgIHJldHVybiBzdHJcbiAgICAgICAgLnJlcGxhY2UoLywvZywgXCIgXCIpIC8vIHJlcGxhY2UgZWFjaCBjb21tYSB3aXRoIGEgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLy0vZywgXCIgLVwiKSAvLyBwcmVjZWRlIGVhY2ggbWludXMgc2lnbiB3aXRoIGEgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLyhbQS1aYS16XSkvZywgXCIgJDEgXCIpIC8vIHNhbmR3aWNoIGVhY2ggICBsZXR0ZXIgYmV0d2VlbiAyIHNwYWNlc1xuICAgICAgICAucmVwbGFjZSgvICAvZywgXCIgXCIpIC8vIGNvbGxhcHNlIHJlcGVhdGVkIHNwYWNlcyB0byBhIHNpbmdsZSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvIChbRWVdKSAvZywgXCIkMVwiKSAvLyByZW1vdmUgZmxhbmtpbmcgc3BhY2VzIGFyb3VuZCBleHBvbmVudCBzeW1ib2xzXG4gICAgICAgIC5yZXBsYWNlKC9eIC9nLCBcIlwiKSAvLyB0cmltIGFueSBsZWFkaW5nIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8gJC9nLCBcIlwiKTsgLy8gdHJpbSBhbnkgdGFpbGluZyBzcGFjZVxufVxuZmlnbWEudWkucmVzaXplKDc1MCwgNjUwKTtcbmV4cG9ydCB7fTtcbi8vIFVzaW5nIHJlbGF0aXZlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCAoZ2l2ZXMgc2tld2VkIHggdmFsdWUgZm9yIG5vbi1yb3RhdGVkKVxuLy9jb25zb2xlLmxvZygncmVseCcscmVsWzBdWzJdICsgKDEvMikqd2lkdGgqcmVsWzBdWzBdIC0oLTEpKigxLzIpKmhlaWdodCpyZWxbMF1bMF0gLSAoMS8yKSp3aWR0aCk7XG4vL2NvbnNvbGUubG9nKCdyZWx5JyxyZWxbMV1bMl0gICsoMS8yKSp3aWR0aCpyZWxbMV1bMF0tICgtMSkqKDEvMikqaGVpZ2h0KnJlbFsxXVsxXSAtICgxLzIpKmhlaWdodCk7XG4vKlxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHBcIikuaW5uZXJIVE1MID0gYFxuPHN2ZyAgaWQ9XCJiYXNlXCIgd2lkdGg9XCI4MDBcIiBoZWlnaHQ9XCI2MDBcIiB2aWV3Qm94PVwiMCAwIDgwMCA2MDBcIiBzdHlsZT1cImJvcmRlcjogMXB4IHNvbGlkIGJsdWU7XCI+XG4gICAgPHBhdGggaWQ9XCJub3Rtb3ZlZFwiIGZpbGw9XCIjZjAwXCIgc3Ryb2tlPVwibm9uZVwiIGQ9XCJNMTIyLjc2OSA0OC40OTE0QzEyNy4wMzggNDYuMTE3OSAxMjkuOTgzIDQzLjM3MjQgMTMxLjI3NCA0MC4yMTY4QzEzNi42MTQgMjcuMTY4NSAxMzMuNDcyIDE3LjM2MDQgMTI5LjAxNCAxMC44MDA3QzEyNi43NzkgNy41MTE1NCAxMjQuMjA4IDUuMDMzNzIgMTIyLjE5NSAzLjM3Nzg5QzEyMS4xODggMi41NTA1IDEyMC4zMjMgMS45Mjk4NSAxMTkuNzExIDEuNTE3MTVDMTE5LjQwNSAxLjMxMDg0IDExOS4xNjMgMS4xNTY2MiAxMTguOTk4IDEuMDU0NjFDMTE4LjkxNiAxLjAwMzYyIDExOC44NTMgMC45NjU2ODkgMTE4LjgxMSAwLjk0MDg0NUwxMTguNzY1IDAuOTEzMzkyTDExOC43NTQgMC45MDcwMzNMMTE4Ljc1MSAwLjkwNTY5OEMxMTguNzUxIDAuOTA1NzI0IDExOC43NTEgMC45MDU1OSAxMTkgMC40NzE2MThDMTE5LjI0OCAwLjAzNzY0NjYgMTE5LjI0OCAwLjAzNzgyNDMgMTE5LjI0OSAwLjAzODA1NEwxMTkuMjU0IDAuMDQxMTM4NUwxMTkuMjY5IDAuMDQ5NTg5MUMxMTkuMjgxIDAuMDU2ODc2MiAxMTkuMjk5IDAuMDY3NDcwMSAxMTkuMzIyIDAuMDgxMzY2N0MxMTkuMzY5IDAuMTA5MTU3IDExOS40MzcgMC4xNTAxNjggMTE5LjUyNSAwLjIwNDM4NkMxMTkuNyAwLjMxMjgxMSAxMTkuOTUzIDAuNDc0MDk2IDEyMC4yNyAwLjY4ODEzNEMxMjAuOTA1IDEuMTE2MTMgMTIxLjc5NiAxLjc1NTUyIDEyMi44MyAyLjYwNTQ5QzEyNC44OTYgNC4zMDQzOCAxMjcuNTM5IDYuODUwNTkgMTI5Ljg0MSAxMC4yMzg3QzEzNC40NTkgMTcuMDMzNCAxMzcuNjg1IDI3LjE5MjYgMTMyLjIgNDAuNTk1NUMxMzAuNzg1IDQ0LjA1MjYgMTI3LjYxNSA0Ni45NDE2IDEyMy4yNTUgNDkuMzY1NEMxMTguODg4IDUxLjc5MzEgMTEzLjI3IDUzLjc4NjEgMTA2Ljg2NyA1NS40MjM3Qzk0LjA1ODQgNTguNjk5MyA3OC4wMTg4IDYwLjU3NDQgNjIuMzQyNSA2MS42MjEyQzQ2LjY2MTMgNjIuNjY4MiAzMS4zMjE0IDYyLjg4NzggMTkuOTAzNSA2Mi44NDU3QzE0LjE5NCA2Mi44MjQ2IDkuNDY0MTggNjIuNzM4MSA2LjE2MTIxIDYyLjY1NjlDNC41MDk3MSA2Mi42MTYzIDMuMjE0ODkgNjIuNTc3IDIuMzMyNjcgNjIuNTQ3OEMyLjI4MDUxIDYyLjU0NjEgMi4yMjk3OSA2Mi41NDQ0IDIuMTgwNTIgNjIuNTQyOEw0LjQxODA0IDY0Ljk2OTJDNC42MDUyNCA2NS4xNzIyIDQuNTkyNDMgNjUuNDg4NiA0LjM4OTQzIDY1LjY3NThDNC4xODY0MiA2NS44NjMgMy44NzAwOSA2NS44NTAxIDMuNjgyODkgNjUuNjQ3MUwwLjYzMjMxMiA2Mi4zMzlDMC40NDUxMTUgNjIuMTM2IDAuNDU3OTIzIDYxLjgxOTYgMC42NjA5MjcgNjEuNjMyNEwzLjk2OTA4IDU4LjU4MTlDNC4xNzIwOCA1OC4zOTQ3IDQuNDg4NDIgNTguNDA3NSA0LjY3NTYxIDU4LjYxMDVDNC44NjI4MSA1OC44MTM1IDQuODUgNTkuMTI5OCA0LjY0NyA1OS4zMTdMMi4yMzIwNCA2MS41NDM5QzIuMjc1NDcgNjEuNTQ1NCAyLjMyMDA0IDYxLjU0NjkgMi4zNjU3MSA2MS41NDg0QzMuMjQ1MzEgNjEuNTc3NSA0LjUzNzMgNjEuNjE2NyA2LjE4NTggNjEuNjU3MkM5LjQ4Mjg0IDYxLjczODMgMTQuMjA1NyA2MS44MjQ3IDE5LjkwNzIgNjEuODQ1N0MzMS4zMTExIDYxLjg4NzcgNDYuNjI1OSA2MS42Njg0IDYyLjI3NTkgNjAuNjIzNEM3Ny45MzA3IDU5LjU3ODEgOTMuODk5IDU3LjcwNzkgMTA2LjYxOSA1NC40NTQ5QzExMi45OCA1Mi44MjgxIDExOC41MDYgNTAuODYxIDEyMi43NjkgNDguNDkxNFpcIiBvcGFjaXR5PVwiMC41XCIgLz5cbjwvc3ZnPlxuYDtcblxuLy9NIDAuODk0ODc5ODQyMjMyNTAzNCAtMC4yMjk0Nzc3NjU0NjYzMjUxNSBMIC0wLjkxMTM0NjA0NjI5MDA1NjggLTAuOTg0ODA4NjIxNTE0Mjg4NSBMIC0wLjkwNDk5MzI5MTAwODA2NjcgLTAuOTk5OTk5OTk5OTk5OTk5OSBMIDAuOTExMzQ2MDMzMjI0ODQxNiAtMC4yNDA0NDA5NTU0MjkwMjM4OCBWIDEuMDAwMDAwMDI0MTIwMzk2OCBIIDAuODk0ODc5ODQyMjMyNTAzNCBWIC0wLjIyOTQ3Nzc2NTQ2NjMyNTE1IFpcbi8vIFJldHJpZXZlIHRoZSBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoIHlvdSB3aXNoIHRvIHRyYW5zZm9ybS5cbnZhciBzdmdSb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYXNlXCIpO1xudmFyIHBhdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vdG1vdmVkXCIpO1xudmFyIG9sZFBhdGhEU3RyID0gcGF0aC5nZXRBdHRyaWJ1dGUoXCJkXCIpO1xuXG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uIHJlcXVpcmVkLlxudmFyIG9iaiA9IGdldFRyYW5zbGF0aW9uQW5kU2NhbGluZyhzdmdSb290LCBwYXRoKTtcbnZhciBwYXRoVHJhbnNsWCA9IG9iai5wYXRoVHJhbnNsWDtcbnZhciBwYXRoVHJhbnNsWSA9IG9iai5wYXRoVHJhbnNsWTtcbnZhciBzY2FsZSA9IG9iai5zY2FsZTtcblxuLy8gVGhlIHBhdGggY291bGQgYmUgdHJhbnNmb3JtZWQgYXQgdGhpcyBwb2ludCB3aXRoIGEgc2ltcGxlXG4vLyBcInRyYW5zZm9ybVwiIGF0dHJpYnV0ZSBhcyBzaG93biBoZXJlLlxuXG4vLyAkcGF0aC5hdHRyKFwidHJhbnNmb3JtXCIsIGB0cmFuc2xhdGUoJHtwYXRoVHJhbnNsWH0sICR7cGF0aFRyYW5zbFl9KSwgc2NhbGUoJHtzY2FsZX0pYCk7XG5cbi8vIEhvd2V2ZXIsIGFzIGRlc2NyaWJlZCBpbiB5b3VyIHF1ZXN0aW9uIHlvdSBkaWRuJ3Qgd2FudCB0aGlzLlxuLy8gVGhlcmVmb3JlLCB0aGUgY29kZSBmb2xsb3dpbmcgdGhpcyBsaW5lIG11dGF0ZXMgdGhlIGFjdHVhbCBzdmcgcGF0aC5cblxuLy8gQ2FsY3VsYXRlIHRoZSBwYXRoIFwiZFwiIGF0dHJpYnV0ZXMgcGFyYW1ldGVycy5cbnZhciBuZXdQYXRoRFN0ciA9IGdldFRyYW5zZm9ybWVkUGF0aERTdHIoXG4gIG9sZFBhdGhEU3RyLFxuICBwYXRoVHJhbnNsWCxcbiAgcGF0aFRyYW5zbFksXG4gIHNjYWxlXG4pO1xuXG4vLyBBcHBseSB0aGUgbmV3IFwiZFwiIGF0dHJpYnV0ZSB0byB0aGUgcGF0aCwgdHJhbnNmb3JtaW5nIGl0LlxuXG5kb2N1bWVudC53cml0ZShcbiAgXCI8cD5BbHRlcmVkICdkJyBhdHRyaWJ1dGUgb2YgcGF0aDo8L3A+PHA+XCIgKyBuZXdQYXRoRFN0ciArIFwiPC9wPlwiXG4pO1xuXG4vLyBUaGlzIGlzIHRoZSBlbmQgb2YgdGhlIG1haW4gY29kZS4gQmVsb3cgYXJlIHRoZSBmdW5jdGlvbnMgY2FsbGVkLlxuXG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uLCBpLmUuIHRoZSB0cmFuc2xhdGlvbiBhbmQgc2NhbGluZywgcmVxdWlyZWRcbi8vIHRvIGdldCB0aGUgcGF0aCB0byBmaWxsIHRoZSBzdmcgYXJlYS4gTm90ZSB0aGF0IHRoaXMgYXNzdW1lcyB1bmlmb3JtXG4vLyBzY2FsaW5nLCBhIHBhdGggdGhhdCBoYXMgbm8gb3RoZXIgdHJhbnNmb3JtcyBhcHBsaWVkIHRvIGl0LCBhbmQgbm9cbi8vIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIHN2ZyB2aWV3cG9ydCBhbmQgdmlld0JveCBkaW1lbnNpb25zLlxuZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHN2ZywgcGF0aCkge1xuICB2YXIgc3ZnV2R0aCA9IDI7XG4gIHZhciBzdmdIZ2h0ID0gMjtcblxuICB2YXIgb3JpZ1BhdGhCb3VuZGluZ0JveCA9IHBhdGguZ2V0QkJveCgpO1xuXG4gIHZhciBvcmlnUGF0aEhnaHQgPSBvcmlnUGF0aEJvdW5kaW5nQm94LmhlaWdodDtcbiAgdmFyIG9yaWdQYXRoV2R0aCA9IG9yaWdQYXRoQm91bmRpbmdCb3gud2lkdGg7XG5cbiAgdmFyIG9yaWdQYXRoWSA9IG9yaWdQYXRoQm91bmRpbmdCb3gueTtcbiAgdmFyIG9yaWdQYXRoWCA9IG9yaWdQYXRoQm91bmRpbmdCb3gueDtcblxuICBjb25zb2xlLmxvZyhvcmlnUGF0aFdkdGgsIG9yaWdQYXRoSGdodCwgb3JpZ1BhdGhXZHRoLCBvcmlnUGF0aFgsIG9yaWdQYXRoWSk7XG4gIC8vIGhvdyBtdWNoIGJpZ2dlciBpcyB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAvLyByZWxhdGl2ZSB0byB0aGUgcGF0aCBpbiBlYWNoIGRpbWVuc2lvbj9cbiAgdmFyIHNjYWxlQmFzZWRPbldkdGggPSBzdmdXZHRoIC8gb3JpZ1BhdGhXZHRoO1xuICB2YXIgc2NhbGVCYXNlZE9uSGdodCA9IHN2Z0hnaHQgLyBvcmlnUGF0aEhnaHQ7XG5cbiAgLy8gb2YgdGhlIHNjYWxpbmcgZmFjdG9ycyBkZXRlcm1pbmVkIGluIGVhY2ggZGltZW5zaW9uLFxuICAvLyB1c2UgdGhlIHNtYWxsZXIgb25lOyBvdGhlcndpc2UgcG9ydGlvbnMgb2YgdGhlIHBhdGhcbiAgLy8gd2lsbCBsaWUgb3V0c2lkZSB0aGUgdmlld3BvcnQgKGNvcnJlY3QgdGVybT8pXG4gIHZhciBzY2FsZSA9IE1hdGgubWluKHNjYWxlQmFzZWRPbldkdGgsIHNjYWxlQmFzZWRPbkhnaHQpO1xuICBhbGVydChcbiAgICBgaGVpZ2h0OiAkezEgLyBzY2FsZUJhc2VkT25IZ2h0fSB3aWR0aDogJHsxIC8gc2NhbGVCYXNlZE9uV2R0aH0sICR7XG4gICAgICBvcmlnUGF0aFdkdGggKiBvcmlnUGF0aEhnaHRcbiAgICB9YFxuICApO1xuICAvLyBjYWxjdWxhdGUgdGhlIGJvdW5kaW5nIGJveCBwYXJhbWV0ZXJzXG4gIC8vIGFmdGVyIHRoZSBwYXRoIGhhcyBiZWVuIHNjYWxlZCByZWxhdGl2ZSB0byB0aGUgb3JpZ2luXG4gIC8vIGJ1dCBiZWZvcmUgYW55IHN1YnNlcXVlbnQgdHJhbnNsYXRpb25zIGhhdmUgYmVlbiBhcHBsaWVkXG5cbiAgdmFyIHNjYWxlZFBhdGhYID0gb3JpZ1BhdGhYICogc2NhbGU7XG4gIHZhciBzY2FsZWRQYXRoWSA9IG9yaWdQYXRoWSAqIHNjYWxlO1xuICB2YXIgc2NhbGVkUGF0aFdkdGggPSBvcmlnUGF0aFdkdGggKiBzY2FsZTtcbiAgdmFyIHNjYWxlZFBhdGhIZ2h0ID0gb3JpZ1BhdGhIZ2h0ICogc2NhbGU7XG5cbiAgLy8gY2FsY3VsYXRlIHRoZSBjZW50cmUgcG9pbnRzIG9mIHRoZSBzY2FsZWQgYnV0IHVudHJhbnNsYXRlZCBwYXRoXG4gIC8vIGFzIHdlbGwgYXMgb2YgdGhlIHN2ZyByb290IGVsZW1lbnRcblxuICB2YXIgc2NhbGVkUGF0aENlbnRyZVggPSBzY2FsZWRQYXRoWCArIHNjYWxlZFBhdGhXZHRoIC8gMjtcbiAgdmFyIHNjYWxlZFBhdGhDZW50cmVZID0gc2NhbGVkUGF0aFkgKyBzY2FsZWRQYXRoSGdodCAvIDI7XG4gIHZhciBzdmdSb290Q2VudHJlWCA9IDA7IC8vIC1zdmdXZHRoIC8gMjtcbiAgdmFyIHN2Z1Jvb3RDZW50cmVZID0gMDsgLy8tc3ZnSGdodCAvIDI7XG5cbiAgLy8gY2FsY3VsYXRlIHRyYW5zbGF0aW9uIHJlcXVpcmVkIHRvIGNlbnRyZSB0aGUgcGF0aFxuICAvLyBvbiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICB2YXIgcGF0aFRyYW5zbFggPSBzdmdSb290Q2VudHJlWCAtIHNjYWxlZFBhdGhDZW50cmVYO1xuICB2YXIgcGF0aFRyYW5zbFkgPSBzdmdSb290Q2VudHJlWSAtIHNjYWxlZFBhdGhDZW50cmVZO1xuICBjb25zb2xlLmxvZyhcbiAgICBcInNjYWxlZCBwYXRoIHhcIixcbiAgICBzY2FsZWRQYXRoWCxcbiAgICBzY2FsZWRQYXRoV2R0aCxcbiAgICBcInNjYWxlZCBwYXRoIHlcIixcbiAgICBzY2FsZWRQYXRoWSxcbiAgICBzY2FsZWRQYXRoSGdodCxcbiAgICBcImZhY3RvciBmcm9tIHNjYWxlXCIsXG4gICAgKG9yaWdQYXRoSGdodCAtIG9yaWdQYXRoV2R0aCkgLyAyLFxuICAgIFwieGZhY3RvciBmcm9tIGdcIlxuICApO1xuICByZXR1cm4geyBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlIH07XG59XG5cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybWVkUGF0aERTdHIob2xkUGF0aERTdHIsIHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpIHtcbiAgLy8gY29uc3RhbnRzIHRvIGhlbHAga2VlcCB0cmFjayBvZiB0aGUgdHlwZXMgb2YgU1ZHIGNvbW1hbmRzIGluIHRoZSBwYXRoXG4gIHZhciBCT1RIX1hfQU5EX1kgPSAxO1xuICB2YXIgSlVTVF9YID0gMjtcbiAgdmFyIEpVU1RfWSA9IDM7XG4gIHZhciBOT05FID0gNDtcbiAgdmFyIEVMTElQVElDQUxfQVJDID0gNTtcbiAgdmFyIEFCU09MVVRFID0gNjtcbiAgdmFyIFJFTEFUSVZFID0gNztcblxuICAvLyB0d28gcGFyYWxsZWwgYXJyYXlzLCB3aXRoIGVhY2ggZWxlbWVudCBiZWluZyBvbmUgY29tcG9uZW50IG9mIHRoZVxuICAvLyBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoLCB3aXRoIG9uZSBjb21wb25lbnQgYmVpbmcgZWl0aGVyXG4gIC8vIGFuIGluc3RydWN0aW9uIChlLmcuIFwiTVwiIGZvciBtb3ZldG8sIGV0Yy4pIG9yIG51bWVyaWNhbCB2YWx1ZVxuICAvLyBmb3IgZWl0aGVyIGFuIHggb3IgeSBjb29yZGluYXRlXG4gIHZhciBvbGRQYXRoREFyciA9IGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMob2xkUGF0aERTdHIpO1xuICB2YXIgbmV3UGF0aERBcnIgPSBbXTtcblxuICB2YXIgY29tbWFuZFBhcmFtcywgYWJzT3JSZWwsIG9sZFBhdGhEQ29tcCwgbmV3UGF0aERDb21wO1xuXG4gIC8vIGVsZW1lbnQgaW5kZXhcbiAgdmFyIGlkeCA9IDA7XG5cbiAgd2hpbGUgKGlkeCA8IG9sZFBhdGhEQXJyLmxlbmd0aCkge1xuICAgIHZhciBvbGRQYXRoRENvbXAgPSBvbGRQYXRoREFycltpZHhdO1xuICAgIGlmICgvXltBLVphLXpdJC8udGVzdChvbGRQYXRoRENvbXApKSB7XG4gICAgICAvLyBjb21wb25lbnQgaXMgYSBzaW5nbGUgbGV0dGVyLCBpLmUuIGFuIHN2ZyBwYXRoIGNvbW1hbmRcbiAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBvbGRQYXRoREFycltpZHhdO1xuICAgICAgc3dpdGNoIChvbGRQYXRoRENvbXAudG9VcHBlckNhc2UoKSkge1xuICAgICAgICBjYXNlIFwiQVwiOiAvLyBlbGxpcHRpY2FsIGFyYyBjb21tYW5kLi4udGhlIG1vc3QgY29tcGxpY2F0ZWQgb25lXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEVMTElQVElDQUxfQVJDO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiSFwiOiAvLyBob3Jpem9udGFsIGxpbmU7IHJlcXVpcmVzIG9ubHkgYW4geC1jb29yZGluYXRlXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlZcIjogLy8gdmVydGljYWwgbGluZTsgcmVxdWlyZXMgb25seSBhIHktY29vcmRpbmF0ZVxuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBKVVNUX1k7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJaXCI6IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IE5PTkU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gYWxsIG90aGVyIGNvbW1hbmRzOyBhbGwgb2YgdGhlbSByZXF1aXJlIGJvdGggeCBhbmQgeSBjb29yZGluYXRlc1xuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBCT1RIX1hfQU5EX1k7XG4gICAgICB9XG4gICAgICBhYnNPclJlbCA9XG4gICAgICAgIG9sZFBhdGhEQ29tcCA9PT0gb2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkgPyBBQlNPTFVURSA6IFJFTEFUSVZFO1xuICAgICAgLy8gbG93ZXJjYXNlIGNvbW1hbmRzIGFyZSByZWxhdGl2ZSwgdXBwZXJjYXNlIGFyZSBhYnNvbHV0ZVxuICAgICAgaWR4ICs9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlmIHRoZSBjb21wb25lbnQgaXMgbm90IGEgbGV0dGVyLCB0aGVuIGl0IGlzIGEgbnVtZXJpYyB2YWx1ZVxuICAgICAgdmFyIHRyYW5zbFgsIHRyYW5zbFk7XG4gICAgICBpZiAoYWJzT3JSZWwgPT09IEFCU09MVVRFKSB7XG4gICAgICAgIC8vIHRoZSB0cmFuc2xhdGlvbiBpcyByZXF1aXJlZCBmb3IgYWJzb2x1dGUgY29tbWFuZHMuLi5cbiAgICAgICAgdHJhbnNsWCA9IHBhdGhUcmFuc2xYO1xuICAgICAgICB0cmFuc2xZID0gcGF0aFRyYW5zbFk7XG4gICAgICB9IGVsc2UgaWYgKGFic09yUmVsID09PSBSRUxBVElWRSkge1xuICAgICAgICAvLyAuLi5idXQgbm90IHJlbGF0aXZlIG9uZXNcbiAgICAgICAgdHJhbnNsWCA9IDA7XG4gICAgICAgIHRyYW5zbFkgPSAwO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChjb21tYW5kUGFyYW1zKSB7XG4gICAgICAgIC8vIGZpZ3VyZSBvdXQgd2hpY2ggb2YgdGhlIG51bWVyaWMgdmFsdWVzIGZvbGxvd2luZyBhbiBzdmcgY29tbWFuZFxuICAgICAgICAvLyBhcmUgcmVxdWlyZWQsIGFuZCB0aGVuIHRyYW5zZm9ybSB0aGUgbnVtZXJpYyB2YWx1ZShzKSBmcm9tIHRoZVxuICAgICAgICAvLyBvcmlnaW5hbCBwYXRoIGQtYXR0cmlidXRlIGFuZCBwbGFjZSBpdCBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGVcbiAgICAgICAgLy8gYXJyYXkgdGhhdCB3aWxsIGV2ZW50dWFsbHkgYmVjb21lIHRoZSBkLWF0dHJpYnV0ZSBmb3IgdGhlIG5ldyBwYXRoXG4gICAgICAgIGNhc2UgQk9USF9YX0FORF9ZOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSAyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEpVU1RfWDpcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEpVU1RfWTpcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVMTElQVElDQUxfQVJDOlxuICAgICAgICAgIC8vIHRoZSBlbGxpcHRpY2FsIGFyYyBoYXMgeCBhbmQgeSB2YWx1ZXMgaW4gdGhlIGZpcnN0IGFuZCBzZWNvbmQgYXMgd2VsbCBhc1xuICAgICAgICAgIC8vIHRoZSA2dGggYW5kIDd0aCBwb3NpdGlvbnMgZm9sbG93aW5nIHRoZSBjb21tYW5kOyB0aGUgaW50ZXJ2ZW5pbmcgdmFsdWVzXG4gICAgICAgICAgLy8gYXJlIG5vdCBhZmZlY3RlZCBieSB0aGUgdHJhbnNmb3JtYXRpb24gYW5kIHNvIGNhbiBzaW1wbHkgYmUgY29waWVkXG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMl0pO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDNdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDNdKTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA0XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA0XSk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNV0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDZdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDZdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICBpZHggKz0gNztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOT05FOlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwibnVtZXJpYyB2YWx1ZSBzaG91bGQgbm90IGZvbGxvdyB0aGUgU1ZHIFoveiBjb21tYW5kXCJcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmV3UGF0aERBcnIuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMoc3RyKSB7XG4gIC8vIGFzc3VtaW5nIHRoZSBzdHJpbmcgZnJvbSB0aGUgZC1hdHRyaWJ1dGUgb2YgdGhlIHBhdGggaGFzIGFsbCBjb21wb25lbnRzXG4gIC8vIHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzcGFjZSwgdGhlbiBjcmVhdGUgYW4gYXJyYXkgb2YgY29tcG9uZW50cyBieVxuICAvLyBzaW1wbHkgc3BsaXR0aW5nIHRoZSBzdHJpbmcgYXQgdGhvc2Ugc3BhY2VzXG4gIHN0ciA9IHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKTtcbiAgcmV0dXJuIHN0ci5zcGxpdChcIiBcIik7XG59XG5cbmZ1bmN0aW9uIHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKSB7XG4gIC8vIFRoZSBTVkcgc3RhbmRhcmQgaXMgZmxleGlibGUgd2l0aCByZXNwZWN0IHRvIGhvdyBwYXRoIGQtc3RyaW5ncyBhcmVcbiAgLy8gZm9ybWF0dGVkIGJ1dCB0aGlzIG1ha2VzIHBhcnNpbmcgdGhlbSBtb3JlIGRpZmZpY3VsdC4gVGhpcyBmdW5jdGlvbiBlbnN1cmVzXG4gIC8vIHRoYXQgYWxsIFNWRyBwYXRoIGQtc3RyaW5nIGNvbXBvbmVudHMgKGkuZS4gYm90aCBjb21tYW5kcyBhbmQgdmFsdWVzKSBhcmVcbiAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLlxuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoLywvZywgXCIgXCIpIC8vIHJlcGxhY2UgZWFjaCBjb21tYSB3aXRoIGEgc3BhY2VcbiAgICAucmVwbGFjZSgvLS9nLCBcIiAtXCIpIC8vIHByZWNlZGUgZWFjaCBtaW51cyBzaWduIHdpdGggYSBzcGFjZVxuICAgIC5yZXBsYWNlKC8oW0EtWmEtel0pL2csIFwiICQxIFwiKSAvLyBzYW5kd2ljaCBlYWNoICAgbGV0dGVyIGJldHdlZW4gMiBzcGFjZXNcbiAgICAucmVwbGFjZSgvICAvZywgXCIgXCIpIC8vIGNvbGxhcHNlIHJlcGVhdGVkIHNwYWNlcyB0byBhIHNpbmdsZSBzcGFjZVxuICAgIC5yZXBsYWNlKC8gKFtFZV0pIC9nLCBcIiQxXCIpIC8vIHJlbW92ZSBmbGFua2luZyBzcGFjZXMgYXJvdW5kIGV4cG9uZW50IHN5bWJvbHNcbiAgICAucmVwbGFjZSgvXiAvZywgXCJcIikgLy8gdHJpbSBhbnkgbGVhZGluZyBzcGFjZVxuICAgIC5yZXBsYWNlKC8gJC9nLCBcIlwiKTsgLy8gdHJpbSBhbnkgdGFpbGluZyBzcGFjZVxufVxuKi9cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdGlmKF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0pIHtcblx0XHRyZXR1cm4gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGVcbl9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9jb2RlLnRzXCIpO1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgdXNlZCAnZXhwb3J0cycgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxuIl0sInNvdXJjZVJvb3QiOiIifQ==