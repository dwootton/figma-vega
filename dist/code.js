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
    else if (msg.type === "fetchSVG") {
        // Current level: Get all svg export and then convert 
        //const selectedNodeId = msg.viewNodeId;
        console.log("fetching node id", msg.viewNodeId);
        const annotationsId = msg.annotationNodeId;
        const viewNodeId = msg.viewNodeId;
        const viewId = msg.viewId;
        //@ts-ignore
        const viewNode = figma.getNodeById(viewNodeId);
        const vegaPaddingWidth = viewNode.getPluginData("vegaPaddingWidth");
        const vegaPaddingHeight = viewNode.getPluginData("vegaPaddingHeight");
        // uses a fetch by id
        //@ts-ignore
        const annotationsLayer = figma.getNodeById(annotationsId);
        function ab2str(buf) {
            return String.fromCharCode.apply(null, new Uint16Array(buf));
        }
        // BUG: combine all texts into one path object
        // go through for each export get promises
        // for each value, export it as async
        const svgString = annotationsLayer.exportAsync({ format: "SVG" }).then((svgCode) => {
            const svg = ab2str(svgCode);
            console.log('dywootto svg', svg, svgCode);
            figma.ui.postMessage({
                svgString: svg,
                vegaPaddingHeight: vegaPaddingHeight,
                vegaPaddingWidth: vegaPaddingWidth,
                type: "tester",
            });
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
            const vectorizedSceneNodes = vectorize(node);
            const vectorizedNodes = vectorizedSceneNodes.map((vectorizedNode) => {
                return { nodeId: vectorizedNode.id, vectorPaths: vectorizedNode.vectorPaths };
            });
            // determine if any fills need to be inverted
            let shouldFillBeInverted = vectorizedSceneNodes.some(determineShouldFillBeInverted);
            vectorizedNodePayload.push({
                vectorizedNodes: vectorizedNodes,
                shouldFillBeInverted: shouldFillBeInverted,
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
function determineShouldFillBeInverted(node) {
    const shouldBeInverted = "strokeAlign" in node && node.strokeAlign !== "CENTER";
    return shouldBeInverted;
}
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
        if (color && color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            attributes.push(`"fill": {"value": "${rgbPercentToHex(color.r, color.g, color.b)}"}`);
        }
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
        if (color && color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            attributes.push(`"stroke": {"value": "${rgbPercentToHex(color.r, color.g, color.b)}"}`);
        }
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
    //
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92ZWdhLWZpLy4vc3JjL2NvZGUudHMiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly92ZWdhLWZpL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxVQUFVLHFCQUFxQjtBQUMvQixVQUFVLGlCQUFpQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFdBQVc7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxXQUFXO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxTQUFTO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsU0FBUztBQUNuRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsV0FBVztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxlQUFlLDZGQUE2RjtBQUM1RztBQUNBO0FBQ0E7QUFDQSxzREFBc0QsU0FBUztBQUMvRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxTQUFTO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsV0FBVztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3REFBd0QsZ0JBQWdCO0FBQ3hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxlQUFlLHdDQUF3QztBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLG9CQUFvQjtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLCtCQUErQjtBQUMxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixZQUFZLFVBQVUsRUFBRTtBQUNoRCxzQkFBc0IsVUFBVSxPQUFPO0FBQ3ZDLGdCQUFnQjtBQUNoQixhQUFhO0FBQ2I7QUFDQSx1QkFBdUIsVUFBVSxPQUFPO0FBQ3hDLHdCQUF3QixVQUFVLFFBQVE7QUFDMUMsb0JBQW9CLFdBQVcsSUFBSTtBQUNuQyxvQkFBb0IsV0FBVztBQUMvQjtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxvRUFBb0U7QUFDcEU7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMsNkJBQTZCO0FBQzlEO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsNkNBQTZDO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLFdBQVcsY0FBYztBQUM5RDtBQUNBO0FBQ0EsbUNBQW1DLFlBQVksb0NBQW9DLEVBQUU7QUFDckY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLFlBQVksMkNBQTJDLEVBQUU7QUFDL0Y7QUFDQTtBQUNBLDZDQUE2QyxXQUFXLHVCQUF1QjtBQUMvRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QyxZQUFZLDJDQUEyQyxFQUFFO0FBQ2pHO0FBQ0E7QUFDQSwrQ0FBK0MsV0FBVyx5QkFBeUI7QUFDbkY7QUFDQTtBQUNBLDJDQUEyQyxpQkFBaUI7QUFDNUQ7QUFDQTtBQUNBLDZDQUE2QyxXQUFXLG1CQUFtQjtBQUMzRTtBQUNBO0FBQ0EsNENBQTRDLFdBQVcsa0JBQWtCO0FBQ3pFO0FBQ0E7QUFDQSxrREFBa0QsV0FBVyx1QkFBdUI7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLDZCQUE2QjtBQUMzRSwrQ0FBK0MsNkJBQTZCO0FBQzVFO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsY0FBYztBQUNqQztBQUNBLHVCQUF1QixjQUFjO0FBQ3JDO0FBQ0EsMkJBQTJCLGNBQWM7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRDs7QUFFaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0EsMkNBQTJDO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBDQUEwQztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUU7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ1U7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkZBQTZGO0FBQzdGO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSx3Q0FBd0MsWUFBWSxJQUFJLFlBQVksV0FBVyxNQUFNOztBQUVyRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQSxlQUFlLHFCQUFxQixVQUFVLHFCQUFxQjtBQUNuRTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIseUJBQXlCOztBQUV6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0EsbUNBQW1DO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZEQUE2RDtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBOzs7Ozs7O1VDamlDQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0NyQkE7V0FDQTtXQUNBO1dBQ0Esc0RBQXNELGtCQUFrQjtXQUN4RTtXQUNBLCtDQUErQyxjQUFjO1dBQzdELEU7Ozs7VUNOQTtVQUNBO1VBQ0E7VUFDQSIsImZpbGUiOiJjb2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy9pbXBvcnQge2NyZWF0ZU5vcm1hbGl6ZWRQYXRofSBmcm9tIFwiLi9oZWxwZXJGdW5jdGlvbnNcIjtcbi8vaW1wb3J0IHtTVkdwYXRoLCBTVkdzZWdzfSBmcm9tICcuL1NWR1BhdGhzLmpzJztcbi8vIFRoaXMgcGx1Z2luIHdpbGwgb3BlbiBhIHdpbmRvdyB0byBwcm9tcHQgdGhlIHVzZXIgdG8gZW50ZXIgYSBudW1iZXIsIGFuZFxuLy8gaXQgd2lsbCB0aGVuIGNyZWF0ZSB0aGF0IG1hbnkgcmVjdGFuZ2xlcyBvbiB0aGUgc2NyZWVuLlxuLy8gVGhpcyBmaWxlIGhvbGRzIHRoZSBtYWluIGNvZGUgZm9yIHRoZSBwbHVnaW5zLiBJdCBoYXMgYWNjZXNzIHRvIHRoZSAqZG9jdW1lbnQqLlxuLy8gWW91IGNhbiBhY2Nlc3MgYnJvd3NlciBBUElzIGluIHRoZSA8c2NyaXB0PiB0YWcgaW5zaWRlIFwidWkuaHRtbFwiIHdoaWNoIGhhcyBhXG4vLyBmdWxsIGJyb3dzZXIgZW52aXJvbm1lbnQgKHNlZSBkb2N1bWVudGF0aW9uKS5cbi8vIFRoaXMgc2hvd3MgdGhlIEhUTUwgcGFnZSBpbiBcInVpLmh0bWx2aWV3c0RhdGFcIi5cbmZpZ21hLnNob3dVSShfX2h0bWxfXyk7XG5jb25zdCBQQURESU5HX1dJRFRIX1JFR0VYID0gLyg/PD10cmFuc2xhdGVcXCgpXFxkKy87XG5jb25zdCBQQURESU5HX0hFSUdIVF9SRUdFWCA9IC8oPzw9dHJhbnNsYXRlXFwoXFxkKywpXFxkKy87XG5jb25zdCBTVkdfV0lEVEhfUkVHRVggPSAvKD88PXdpZHRoPVwiKVxcZCsvO1xuY29uc3QgU1ZHX0hFSUdIVF9SRUdFWCA9IC8oPzw9aGVpZ2h0PVwiKVxcZCsvO1xuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIHNlYXJjaCB0aHJvdWdoIGFsbCB0b3AgbGV2ZWwgbm9kZXMgb2YgZWFjaCBwYWdlIGluIGEgZmlnbWEgZG9jdW1lbnRcbiAqIHJldHVybnMgYSBsaXN0IG9mIG1hdGNoaW5nIGZpZ21hIG5vZGVzXG4gKiBAcGFyYW0gY3VycmVudFBhZ2VcbiAqIEBwYXJhbSBzZWFyY2hGdW5jdGlvbiBwcmVkaWNhdGUgcnVuIG9uIGVhY2ggY2hpbGQgbm9kZSBvZiB0aGUgcGFnZVxuICovXG5mdW5jdGlvbiBzZWFyY2hUb3BMZXZlbChyb290LCBzZWFyY2hQcmVkaWNhdGUpIHtcbiAgICBjb25zdCBzZWFyY2hSZXN1bHRzID0gW107XG4gICAgY29uc3Qgbm9kZUl0ZXJhdG9yID0gd2Fsa1RyZWVUb0RlcHRoKHJvb3QsIDAsIDMpO1xuICAgIGxldCBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgd2hpbGUgKCFub2RlU3RlcC5kb25lKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2RlU3RlcC52YWx1ZTtcbiAgICAgICAgaWYgKHNlYXJjaFByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICAgICAgc2VhcmNoUmVzdWx0cy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICB9XG4gICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBjaGlsZCBub2RlcyBvZiBjdXJyZW50IHBhZ2VcbiAgICByZXR1cm4gc2VhcmNoUmVzdWx0cztcbn1cbmZ1bmN0aW9uKiB3YWxrVHJlZVRvRGVwdGgobm9kZSwgY3VycmVudERlcHRoID0gMSwgbWF4RGVwdGggPSAyKSB7XG4gICAgeWllbGQgbm9kZTtcbiAgICBjb25zdCB7IGNoaWxkcmVuIH0gPSBub2RlO1xuICAgIGlmIChjaGlsZHJlbiAmJiBjdXJyZW50RGVwdGggPD0gbWF4RGVwdGgpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgeWllbGQqIHdhbGtUcmVlVG9EZXB0aChjaGlsZCwgY3VycmVudERlcHRoICsgMSwgbWF4RGVwdGgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gY2xvbmUodmFsKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlID09PSBcIm51bWJlclwiIHx8IHR5cGUgPT09IFwic3RyaW5nXCIgfHwgdHlwZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwubWFwKCh4KSA9PiBjbG9uZSh4KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgbyA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsKSB7XG4gICAgICAgICAgICAgICAgb1trZXldID0gY2xvbmUodmFsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgXCJ1bmtub3duXCI7XG59XG5mdW5jdGlvbiogd2Fsa1RyZWUobm9kZSkge1xuICAgIHlpZWxkIG5vZGU7XG4gICAgY29uc3QgeyBjaGlsZHJlbiB9ID0gbm9kZTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgeWllbGQqIHdhbGtUcmVlKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIENhbGxzIHRvIFwicGFyZW50LnBvc3RNZXNzYWdlXCIgZnJvbSB3aXRoaW4gdGhlIEhUTUwgcGFnZSB3aWxsIHRyaWdnZXIgdGhpc1xuLy8gY2FsbGJhY2suIFRoZSBjYWxsYmFjayB3aWxsIGJlIHBhc3NlZCB0aGUgXCJwbHVnaW5NZXNzYWdlXCIgcHJvcGVydHkgb2YgdGhlXG4vLyBwb3N0ZWQgbWVzc2FnZS5cbmZpZ21hLnVpLm9ubWVzc2FnZSA9IChtc2cpID0+IHtcbiAgICAvLyBPbmUgd2F5IG9mIGRpc3Rpbmd1aXNoaW5nIGJldHdlZW4gZGlmZmVyZW50IHR5cGVzIG9mIG1lc3NhZ2VzIHNlbnQgZnJvbVxuICAgIC8vIHlvdXIgSFRNTCBwYWdlIGlzIHRvIHVzZSBhbiBvYmplY3Qgd2l0aCBhIFwidHlwZVwiIHByb3BlcnR5IGxpa2UgdGhpcy5cbiAgICBmaWdtYS5yb290LmNoaWxkcmVuO1xuICAgIGlmIChtc2cudHlwZSA9PT0gXCJjcmVhdGVcIikge1xuICAgICAgICAvLyBUT0RPOiBjYXN0IGFzIGEgY3JlYXRlIG1zZyB0eXBlXG4gICAgICAgIGNvbnN0IG5vZGVzID0gW107XG4gICAgICAgIGNvbnN0IHN2Z1N0cmluZyA9IG1zZy5zdmdUb1JlbmRlcjtcbiAgICAgICAgY29uc3QgaWQgPSBtc2cudmlld0lkO1xuICAgICAgICBjb25zdCB2aWV3TmFtZSA9IG1zZy5uYW1lO1xuICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgICAgICBjb25zdCB2aXN1YWxpemF0aW9uID0gZmlnbWEuY3JlYXRlTm9kZUZyb21Tdmcoc3ZnU3RyaW5nKTtcbiAgICAgICAgdmlzdWFsaXphdGlvbi5uYW1lID0gYFZpc3VhbGl6YXRpb24gTGF5ZXIgLSAke3ZpZXdOYW1lfWA7XG4gICAgICAgIHZpc3VhbGl6YXRpb24ubG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgLy8gcGxhY2UgYW5ub3RhdGlvbnMgbGF5ZXIgb24gdG9wIGFuZCBtYWtlIHRyYW5zcGFyZW50XG4gICAgICAgIGNvbnN0IG5ld0Fubm90YXRpb25zTGF5ZXIgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBjb25zdCBwYWRkaW5nV2lkdGhNYXRjaGVzID0gc3ZnU3RyaW5nLm1hdGNoKFBBRERJTkdfV0lEVEhfUkVHRVgpO1xuICAgICAgICBjb25zdCBwYWRkaW5nSGVpZ2h0TWF0Y2hlcyA9IHN2Z1N0cmluZy5tYXRjaChQQURESU5HX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmIChwYWRkaW5nV2lkdGhNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aFN0cmluZyA9IHBhZGRpbmdXaWR0aE1hdGNoZXNbMF07XG4gICAgICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLnNldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ1dpZHRoXCIsIHdpZHRoU3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFkZGluZ0hlaWdodE1hdGNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodFN0cmluZyA9IHBhZGRpbmdIZWlnaHRNYXRjaGVzWzBdO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWxscyA9IGNsb25lKG5ld0Fubm90YXRpb25zTGF5ZXIuZmlsbHMpO1xuICAgICAgICBmaWxsc1swXS5vcGFjaXR5ID0gMDtcbiAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5maWxscyA9IGZpbGxzO1xuICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLmNsaXBzQ29udGVudCA9IGZhbHNlO1xuICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLm5hbWUgPSBgQW5ub3RhdGlvbnMgTGF5ZXIgLSAke3ZpZXdOYW1lfWA7XG4gICAgICAgIC8vIGdyYWIgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAvLyBzZXQgYW5ub3RhdGlvbnMgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICBjb25zdCB3aWR0aE1hdGNoZXMgPSBzdmdTdHJpbmcubWF0Y2goU1ZHX1dJRFRIX1JFR0VYKTtcbiAgICAgICAgY29uc3QgaGVpZ2h0TWF0Y2hlcyA9IHN2Z1N0cmluZy5tYXRjaChTVkdfSEVJR0hUX1JFR0VYKTtcbiAgICAgICAgaWYgKHdpZHRoTWF0Y2hlcyAmJiBoZWlnaHRNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IE51bWJlcih3aWR0aE1hdGNoZXNbMF0pO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gTnVtYmVyKGhlaWdodE1hdGNoZXNbMF0pO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5yZXNpemUod2lkdGggPiAwID8gd2lkdGggOiAxMDAsIGhlaWdodCA+IDAgPyBoZWlnaHQgOiAxMDApO1xuICAgICAgICB9XG4gICAgICAgIC8vXG4gICAgICAgIGNvbnN0IGdyb3VwID0gZmlnbWEuZ3JvdXAoW25ld0Fubm90YXRpb25zTGF5ZXIsIHZpc3VhbGl6YXRpb25dLCBmaWdtYS5jdXJyZW50UGFnZSk7XG4gICAgICAgIGdyb3VwLm5hbWUgPSB2aWV3TmFtZTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpZXdOYW1lXCIsIHZpZXdOYW1lKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpZXdJZFwiLCBtc2cudmlld0lkKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInR5cGVcIiwgXCJ2ZWdhVmlld1wiKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcImFubm90YXRpb25TcGVjXCIsIGB7XCJtYXJrc1wiOltdfWApO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwiYW5ub3RhdGlvbk5vZGVJZFwiLCBuZXdBbm5vdGF0aW9uc0xheWVyLmlkKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpc3VhbGl6YXRpb25TcGVjXCIsIG1zZy52ZWdhU3BlYyk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aXN1YWxpemF0aW9uTm9kZUlkXCIsIHZpc3VhbGl6YXRpb24uaWQpO1xuICAgICAgICBpZiAocGFkZGluZ1dpZHRoTWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGhTdHJpbmcgPSBwYWRkaW5nV2lkdGhNYXRjaGVzWzBdO1xuICAgICAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIiwgd2lkdGhTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkaW5nSGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0U3RyaW5nID0gcGFkZGluZ0hlaWdodE1hdGNoZXNbMF07XG4gICAgICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB2aWV3SWQ6IG1zZy52aWV3SWQsXG4gICAgICAgICAgICB2aWV3Tm9kZUlkOiBncm91cC5pZCxcbiAgICAgICAgICAgIHZpc3VhbGl6YXRpb25Ob2RlSWQ6IHZpc3VhbGl6YXRpb24uaWQsXG4gICAgICAgICAgICBhbm5vdGF0aW9uTm9kZUlkOiBuZXdBbm5vdGF0aW9uc0xheWVyLmlkLFxuICAgICAgICAgICAgdHlwZTogXCJmaW5pc2hlZENyZWF0ZVwiLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAobXNnLnR5cGUgPT09IFwidXBkYXRlXCIpIHtcbiAgICAgICAgY29uc3QgeyB2aXN1YWxpemF0aW9uTm9kZUlkLCBhbm5vdGF0aW9uTm9kZUlkLCB2aWV3Tm9kZUlkLCB2aWV3SWQsIHZpZXdOYW1lLCB2ZWdhU3BlYywgc3ZnVG9SZW5kZXIgfSA9IG1zZztcbiAgICAgICAgLy8gZGVsZXRlIG9sZCB2aXNcbiAgICAgICAgZmlnbWEuZ2V0Tm9kZUJ5SWQodmlzdWFsaXphdGlvbk5vZGVJZCkucmVtb3ZlKCk7XG4gICAgICAgIGNvbnN0IHZpc3VhbGl6YXRpb24gPSBmaWdtYS5jcmVhdGVOb2RlRnJvbVN2ZyhzdmdUb1JlbmRlcik7XG4gICAgICAgIHZpc3VhbGl6YXRpb24ubmFtZSA9IGBWaXN1YWxpemF0aW9uIExheWVyIC0gJHt2aWV3TmFtZX1gO1xuICAgICAgICB2aXN1YWxpemF0aW9uLmxvY2tlZCA9IHRydWU7XG4gICAgICAgIC8vIHBsYWNlIGFubm90YXRpb25zIGxheWVyIG9uIHRvcCBhbmQgbWFrZSB0cmFuc3BhcmVudFxuICAgICAgICBsZXQgYW5ub3RhdGlvbkxheWVyID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoYW5ub3RhdGlvbk5vZGVJZCk7XG4gICAgICAgIGlmICghYW5ub3RhdGlvbkxheWVyKSB7XG4gICAgICAgICAgICBhbm5vdGF0aW9uTGF5ZXIgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhZGRpbmdXaWR0aE1hdGNoZXMgPSBzdmdUb1JlbmRlci5tYXRjaChQQURESU5HX1dJRFRIX1JFR0VYKTtcbiAgICAgICAgY29uc3QgcGFkZGluZ0hlaWdodE1hdGNoZXMgPSBzdmdUb1JlbmRlci5tYXRjaChQQURESU5HX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmIChwYWRkaW5nV2lkdGhNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aFN0cmluZyA9IHBhZGRpbmdXaWR0aE1hdGNoZXNbMF07XG4gICAgICAgICAgICBhbm5vdGF0aW9uTGF5ZXIuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIiwgd2lkdGhTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkaW5nSGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0U3RyaW5nID0gcGFkZGluZ0hlaWdodE1hdGNoZXNbMF07XG4gICAgICAgICAgICBhbm5vdGF0aW9uTGF5ZXIuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nSGVpZ2h0XCIsIGhlaWdodFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgYW5ub3RhdGlvbkxheWVyLm5hbWUgPSBgQW5ub3RhdGlvbnMgTGF5ZXIgLSAke3ZpZXdOYW1lfWA7XG4gICAgICAgIC8vIGdyYWIgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAvLyBzZXQgYW5ub3RhdGlvbnMgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICBjb25zdCB3aWR0aE1hdGNoZXMgPSBzdmdUb1JlbmRlci5tYXRjaChTVkdfV0lEVEhfUkVHRVgpO1xuICAgICAgICBjb25zdCBoZWlnaHRNYXRjaGVzID0gc3ZnVG9SZW5kZXIubWF0Y2goU1ZHX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmICh3aWR0aE1hdGNoZXMgJiYgaGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBOdW1iZXIod2lkdGhNYXRjaGVzWzBdKTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IE51bWJlcihoZWlnaHRNYXRjaGVzWzBdKTtcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgYW5ub3RhdGlvbkxheWVyLnJlc2l6ZSh3aWR0aCA+IDAgPyB3aWR0aCA6IDEwMCwgaGVpZ2h0ID4gMCA/IGhlaWdodCA6IDEwMCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGdyb3VwID0gZmlnbWEuZ2V0Tm9kZUJ5SWQodmlld05vZGVJZCk7XG4gICAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgICAgIGdyb3VwID0gZmlnbWEuZ3JvdXAoW2Fubm90YXRpb25MYXllciwgdmlzdWFsaXphdGlvbl0sIGZpZ21hLmN1cnJlbnRQYWdlKTtcbiAgICAgICAgfVxuICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQodmlzdWFsaXphdGlvbik7XG4gICAgICAgIGdyb3VwLm5hbWUgPSB2aWV3TmFtZTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpZXdOYW1lXCIsIHZpZXdOYW1lKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpZXdJZFwiLCB2aWV3SWQpO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwidHlwZVwiLCBcInZlZ2FWaWV3XCIpO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwiYW5ub3RhdGlvblNwZWNcIiwgYHtcIm1hcmtzXCI6W119YCk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aXN1YWxpemF0aW9uU3BlY1wiLCB2ZWdhU3BlYyk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aXN1YWxpemF0aW9uTm9kZUlkXCIsIHZpc3VhbGl6YXRpb24uaWQpO1xuICAgICAgICBpZiAocGFkZGluZ1dpZHRoTWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGhTdHJpbmcgPSBwYWRkaW5nV2lkdGhNYXRjaGVzWzBdO1xuICAgICAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIiwgd2lkdGhTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkaW5nSGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0U3RyaW5nID0gcGFkZGluZ0hlaWdodE1hdGNoZXNbMF07XG4gICAgICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB2aWV3SWQ6IHZpZXdJZCxcbiAgICAgICAgICAgIHZpZXdOb2RlSWQ6IGdyb3VwLmlkLFxuICAgICAgICAgICAgdmlzdWFsaXphdGlvbk5vZGVJZDogdmlzdWFsaXphdGlvbi5pZCxcbiAgICAgICAgICAgIGFubm90YXRpb25Ob2RlSWQ6IGFubm90YXRpb25MYXllci5pZCxcbiAgICAgICAgICAgIHR5cGU6IFwiZmluaXNoZWRDcmVhdGVcIixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG1zZy50eXBlID09PSBcImZldGNoU1ZHXCIpIHtcbiAgICAgICAgLy8gQ3VycmVudCBsZXZlbDogR2V0IGFsbCBzdmcgZXhwb3J0IGFuZCB0aGVuIGNvbnZlcnQgXG4gICAgICAgIC8vY29uc3Qgc2VsZWN0ZWROb2RlSWQgPSBtc2cudmlld05vZGVJZDtcbiAgICAgICAgY29uc29sZS5sb2coXCJmZXRjaGluZyBub2RlIGlkXCIsIG1zZy52aWV3Tm9kZUlkKTtcbiAgICAgICAgY29uc3QgYW5ub3RhdGlvbnNJZCA9IG1zZy5hbm5vdGF0aW9uTm9kZUlkO1xuICAgICAgICBjb25zdCB2aWV3Tm9kZUlkID0gbXNnLnZpZXdOb2RlSWQ7XG4gICAgICAgIGNvbnN0IHZpZXdJZCA9IG1zZy52aWV3SWQ7XG4gICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB2aWV3Tm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHZpZXdOb2RlSWQpO1xuICAgICAgICBjb25zdCB2ZWdhUGFkZGluZ1dpZHRoID0gdmlld05vZGUuZ2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIik7XG4gICAgICAgIGNvbnN0IHZlZ2FQYWRkaW5nSGVpZ2h0ID0gdmlld05vZGUuZ2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nSGVpZ2h0XCIpO1xuICAgICAgICAvLyB1c2VzIGEgZmV0Y2ggYnkgaWRcbiAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGFubm90YXRpb25zTGF5ZXIgPSBmaWdtYS5nZXROb2RlQnlJZChhbm5vdGF0aW9uc0lkKTtcbiAgICAgICAgZnVuY3Rpb24gYWIyc3RyKGJ1Zikge1xuICAgICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQxNkFycmF5KGJ1ZikpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEJVRzogY29tYmluZSBhbGwgdGV4dHMgaW50byBvbmUgcGF0aCBvYmplY3RcbiAgICAgICAgLy8gZ28gdGhyb3VnaCBmb3IgZWFjaCBleHBvcnQgZ2V0IHByb21pc2VzXG4gICAgICAgIC8vIGZvciBlYWNoIHZhbHVlLCBleHBvcnQgaXQgYXMgYXN5bmNcbiAgICAgICAgY29uc3Qgc3ZnU3RyaW5nID0gYW5ub3RhdGlvbnNMYXllci5leHBvcnRBc3luYyh7IGZvcm1hdDogXCJTVkdcIiB9KS50aGVuKChzdmdDb2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdmcgPSBhYjJzdHIoc3ZnQ29kZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZHl3b290dG8gc3ZnJywgc3ZnLCBzdmdDb2RlKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBzdmdTdHJpbmc6IHN2ZyxcbiAgICAgICAgICAgICAgICB2ZWdhUGFkZGluZ0hlaWdodDogdmVnYVBhZGRpbmdIZWlnaHQsXG4gICAgICAgICAgICAgICAgdmVnYVBhZGRpbmdXaWR0aDogdmVnYVBhZGRpbmdXaWR0aCxcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRlc3RlclwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChtc2cudHlwZSA9PT0gXCJmZXRjaFwiKSB7XG4gICAgICAgIC8vY29uc3Qgc2VsZWN0ZWROb2RlSWQgPSBtc2cudmlld05vZGVJZDtcbiAgICAgICAgY29uc29sZS5sb2coXCJmZXRjaGluZyBub2RlIGlkXCIsIG1zZy52aWV3Tm9kZUlkKTtcbiAgICAgICAgY29uc3QgYW5ub3RhdGlvbnNJZCA9IG1zZy5hbm5vdGF0aW9uTm9kZUlkO1xuICAgICAgICBjb25zdCB2aWV3Tm9kZUlkID0gbXNnLnZpZXdOb2RlSWQ7XG4gICAgICAgIGNvbnN0IHZpZXdJZCA9IG1zZy52aWV3SWQ7XG4gICAgICAgIC8vIHVzZXMgYSBmZXRjaCBieSBpZFxuICAgICAgICBjb25zdCBhbm5vdGF0aW9uc0xheWVyID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoYW5ub3RhdGlvbnNJZCk7XG4gICAgICAgIC8vIGZpbmQgY3VycmVudCBzZWxlY3Rpb25cbiAgICAgICAgLy9AdHMtaWdub3JlICAgIC8vXG4gICAgICAgIC8vIGdyYWIgYW5ubm90YXRpb25zIGxheWVyLFxuICAgICAgICAvLyBncmFiIHBsdWdpbiBkYXRhIGZvciB0aGUgd2lkdGgvaGVpZ2h0IHBhZGRpbmdcbiAgICAgICAgLy9jb25zdCBuZXdTZWxlY3Rpb24gPSBbZmlnbWEuZmxhdHRlbihmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24pXTtcbiAgICAgICAgY29uc29sZS5sb2coYW5ub3RhdGlvbnNMYXllcik7XG4gICAgICAgIGNvbnN0IG5vZGVJdGVyYXRvciA9IHdhbGtUcmVlKGFubm90YXRpb25zTGF5ZXIpO1xuICAgICAgICBsZXQgbm9kZVN0ZXAgPSBub2RlSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICBjb25zdCB2ZWN0b3JpemVkTm9kZVBheWxvYWQgPSBbXTtcbiAgICAgICAgd2hpbGUgKCFub2RlU3RlcC5kb25lKSB7XG4gICAgICAgICAgICAvLyBza2lwIG5vZGUgdHlwZXNcbiAgICAgICAgICAgIGlmIChub2RlU3RlcC52YWx1ZS50eXBlID09PSBcIkZSQU1FXCIgfHwgbm9kZVN0ZXAudmFsdWUudHlwZSA9PT0gXCJHUk9VUFwiKSB7XG4gICAgICAgICAgICAgICAgbm9kZVN0ZXAgPSBub2RlSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVTdGVwLnZhbHVlLmNsb25lKCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm5vZGUgdmFsdWVcIiwgbm9kZSk7XG4gICAgICAgICAgICAvLyBpZiBub2RlVHlwZSBpcyBncm91cFxuICAgICAgICAgICAgY29uc3QgdmVjdG9yaXplZFNjZW5lTm9kZXMgPSB2ZWN0b3JpemUobm9kZSk7XG4gICAgICAgICAgICBjb25zdCB2ZWN0b3JpemVkTm9kZXMgPSB2ZWN0b3JpemVkU2NlbmVOb2Rlcy5tYXAoKHZlY3Rvcml6ZWROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbm9kZUlkOiB2ZWN0b3JpemVkTm9kZS5pZCwgdmVjdG9yUGF0aHM6IHZlY3Rvcml6ZWROb2RlLnZlY3RvclBhdGhzIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGRldGVybWluZSBpZiBhbnkgZmlsbHMgbmVlZCB0byBiZSBpbnZlcnRlZFxuICAgICAgICAgICAgbGV0IHNob3VsZEZpbGxCZUludmVydGVkID0gdmVjdG9yaXplZFNjZW5lTm9kZXMuc29tZShkZXRlcm1pbmVTaG91bGRGaWxsQmVJbnZlcnRlZCk7XG4gICAgICAgICAgICB2ZWN0b3JpemVkTm9kZVBheWxvYWQucHVzaCh7XG4gICAgICAgICAgICAgICAgdmVjdG9yaXplZE5vZGVzOiB2ZWN0b3JpemVkTm9kZXMsXG4gICAgICAgICAgICAgICAgc2hvdWxkRmlsbEJlSW52ZXJ0ZWQ6IHNob3VsZEZpbGxCZUludmVydGVkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgbm9kZUNvbGxlY3Rpb246IHZlY3Rvcml6ZWROb2RlUGF5bG9hZCxcbiAgICAgICAgICAgIHZpZXdOb2RlSWQ6IHZpZXdOb2RlSWQsXG4gICAgICAgICAgICB2aWV3SWQ6IHZpZXdJZCxcbiAgICAgICAgICAgIHR5cGU6IFwibW9kaWZ5UGF0aFwiLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAobXNnLnR5cGUgPT09IFwic2VuZFNjYWxlZFwiKSB7XG4gICAgICAgIGNvbnN0IHsgc3ZnTm9kZUNvbGxlY3Rpb24sIHZpZXdJZCwgdmlld05vZGVJZCB9ID0gbXNnO1xuICAgICAgICBjb25zdCB2aWV3Tm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHZpZXdOb2RlSWQpO1xuICAgICAgICBjb25zb2xlLmxvZyhcImluIHNlbmQgc2NhbGVkXCIsIHZpZXdJZCwgdmlld05vZGUsIG1zZyk7XG4gICAgICAgIGlmICh2aWV3Tm9kZSkge1xuICAgICAgICAgICAgY29uc3QgdmlzdWFsaXphdGlvblBhZGRpbmdXaWR0aCA9IE51bWJlcih2aWV3Tm9kZS5nZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdXaWR0aFwiKSk7XG4gICAgICAgICAgICBjb25zdCB2aXN1YWxpemF0aW9uUGFkZGluZ0hlaWdodCA9IE51bWJlcih2aWV3Tm9kZS5nZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIikpO1xuICAgICAgICAgICAgY29uc3QgbWFya0NvbGxlY3Rpb24gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBzdmdOb2RlQ29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtzID0gbm9kZS5tYXAoKHN2Z05vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBzdmdTdHJpbmcsIG5vZGVJZCB9ID0gc3ZnTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmVjdG9yaXplZE5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChub2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBsaW5lcyBhbmQgdmVjdG9yXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ZWN0b3JpemVkTm9kZS50eXBlICE9PSBcIlZFQ1RPUlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0LCB0WCwgdFksIHNjYWxlIH0gPSBjYWxjdWxhdGVQbGFjZW1lbnQodmVjdG9yaXplZE5vZGUsIHZpc3VhbGl6YXRpb25QYWRkaW5nV2lkdGgsIHZpc3VhbGl6YXRpb25QYWRkaW5nSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gY2FsY3VsYXRlSXNWaXNpYmxlKHZlY3Rvcml6ZWROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3Ryb2tlU3BlY3MgPSBjYWxjdWxhdGVTdHJva2VTcGVjcyh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGxTcGVjcyA9IGNhbGN1bGF0ZUZpbGxTcGVjcyh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1pc2NTcGVjcyA9IGNhbGN1bGF0ZU1pc2NTcGVjcyh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5U3BlY3MgPSBbXS5jb25jYXQoc3Ryb2tlU3BlY3MsIGZpbGxTcGVjcywgbWlzY1NwZWNzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRlZFNwZWMgPSBge1xuICAgICAgICAgIFwidHlwZVwiOiBcInN5bWJvbFwiLFxuICAgICAgICAgIFwiaW50ZXJhY3RpdmVcIjogZmFsc2UsXG4gICAgICAgICAgXCJlbmNvZGVcIjoge1xuICAgICAgICAgICAgXCJlbnRlclwiOiB7XG4gICAgICAgICAgICAgIFwic2hhcGVcIjoge1widmFsdWVcIjogXCIke3N2Z1N0cmluZ31cIn0sXG4gICAgICAgICAgICAgIFwic2l6ZVwiOntcInZhbHVlXCI6JHtzY2FsZX19LFxuICAgICAgICAgICAgICAke3Byb3BlcnR5U3BlY3Muam9pbihcIixcIil9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgICBcIndpZHRoXCI6e1widmFsdWVcIjoke3dpZHRofX0sXG4gICAgICAgICAgICAgIFwiaGVpZ2h0XCI6e1widmFsdWVcIjoke2hlaWdodH19LFxuICAgICAgICAgICAgICBcInhcIjoge1widmFsdWVcIjogJHt0WH19LFxuICAgICAgICAgICAgICBcInlcIjoge1widmFsdWVcIjogJHt0WX19XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZFNwZWMgPSBKU09OLnBhcnNlKHRyYW5zbGF0ZWRTcGVjKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1Zpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZFNwZWNbXCJlbmNvZGVcIl1bXCJlbnRlclwiXVtcIm9wYWNpdHlcIl0gPSB7IHZhbHVlOiAwIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmVjdG9yaXplZE5vZGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZWRTcGVjO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG1hcmtDb2xsZWN0aW9uLnB1c2gobWFya3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZmxhdHRlbmVkQ29sbGVjdGlvbiA9IG1hcmtDb2xsZWN0aW9uLnJlZHVjZSgoYWNjLCB2YWwpID0+IGFjYy5jb25jYXQodmFsKSwgW10pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2R5d29vdHRvIG1hcmsgY29sbGVjdGlvbicsIGZsYXR0ZW5lZENvbGxlY3Rpb24pO1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIGFubm90YXRpb25TcGVjOiB7IG1hcmtzOiBmbGF0dGVuZWRDb2xsZWN0aW9uIH0sXG4gICAgICAgICAgICAgICAgdmlld0lkOiB2aWV3SWQsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJmaW5pc2hlZE1hcmtzXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChtc2cudHlwZSA9PT0gXCJzdGFydFVwXCIpIHtcbiAgICAgICAgLy8gc2NhbiB0aHJvdWdoIGRvY3VtZW50IHRvIGZpbmQgYWxsIG5vZGVzIHdpdGggcGx1Z2luIGRhdGEgdHlwZSBtYXRjaGluZyB2ZWdhIHZpZXdcbiAgICAgICAgY29uc3QgY3VycmVudFZpZXdzID0gc2VhcmNoVG9wTGV2ZWwoZmlnbWEucm9vdCwgKG5vZGUpID0+IG5vZGUuZ2V0UGx1Z2luRGF0YShcInR5cGVcIikgPT09IFwidmVnYVZpZXdcIik7XG4gICAgICAgIGNvbnN0IHZpZXdzRGF0YSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHZpZXcgb2YgY3VycmVudFZpZXdzKSB7XG4gICAgICAgICAgICBjb25zdCB2aWV3RGF0YSA9IGV4dHJhY3RWZWdhVmlld0RhdGEodmlldyk7XG4gICAgICAgICAgICB2aWV3c0RhdGEucHVzaCh2aWV3RGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB2aWV3c0RhdGE6IHZpZXdzRGF0YSwgdHlwZTogXCJzdGFydFVwVmlld3NcIiB9KTtcbiAgICB9XG4gICAgLy8gTWFrZSBzdXJlIHRvIGNsb3NlIHRoZSBwbHVnaW4gd2hlbiB5b3UncmUgZG9uZS4gT3RoZXJ3aXNlIHRoZSBwbHVnaW4gd2lsbFxuICAgIC8vIGtlZXAgcnVubmluZywgd2hpY2ggc2hvd3MgdGhlIGNhbmNlbCBidXR0b24gYXQgdGhlIGJvdHRvbSBvZiB0aGUgc2NyZWVuLlxuICAgIC8vZmlnbWEuY2xvc2VQbHVnaW4oKTtcbn07XG5mdW5jdGlvbiBkZXRlcm1pbmVTaG91bGRGaWxsQmVJbnZlcnRlZChub2RlKSB7XG4gICAgY29uc3Qgc2hvdWxkQmVJbnZlcnRlZCA9IFwic3Ryb2tlQWxpZ25cIiBpbiBub2RlICYmIG5vZGUuc3Ryb2tlQWxpZ24gIT09IFwiQ0VOVEVSXCI7XG4gICAgcmV0dXJuIHNob3VsZEJlSW52ZXJ0ZWQ7XG59XG5mdW5jdGlvbiBleHRyYWN0VmVnYVZpZXdEYXRhKG5vZGUpIHtcbiAgICBjb25zdCBwcm9wZXJ0aWVzVG9FeHRyYWN0ID0gW1xuICAgICAgICBcInZpZXdJZFwiLFxuICAgICAgICAvLyBcInZpZXdOb2RlSWRcIiwgY29tbWVudGluZyBvdXQgYmVjYXVzZSBpdCBpcyBub3QgYSBwbHVnaW4gcHJvcGVydHlcbiAgICAgICAgLy9cInZpZXdOYW1lXCIsXG4gICAgICAgIFwidmlzdWFsaXphdGlvblNwZWNcIixcbiAgICAgICAgXCJhbm5vdGF0aW9uU3BlY1wiLFxuICAgICAgICBcInZlZ2FQYWRkaW5nV2lkdGhcIixcbiAgICAgICAgXCJ2ZWdhUGFkZGluZ0hlaWdodFwiLFxuICAgICAgICBcImFubm90YXRpb25Ob2RlSWRcIixcbiAgICAgICAgXCJ2aXN1YWxpemF0aW9uTm9kZUlkXCIsXG4gICAgXTtcbiAgICBjb25zdCBleHRyYWN0ZWREYXRhID0geyB2aWV3TmFtZTogbm9kZS5uYW1lLCB2aWV3Tm9kZUlkOiBub2RlLmlkIH07XG4gICAgZm9yIChjb25zdCBwcm9wZXJ0eSBvZiBwcm9wZXJ0aWVzVG9FeHRyYWN0KSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBub2RlLmdldFBsdWdpbkRhdGEocHJvcGVydHkpO1xuICAgICAgICBjb25zb2xlLmxvZyhcInByb3BlcnR5XCIsIHByb3BlcnR5LCBcImRhdGFcIiwgZGF0YSk7XG4gICAgICAgIGV4dHJhY3RlZERhdGFbcHJvcGVydHldID0gZGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGV4dHJhY3RlZERhdGE7XG59XG5mdW5jdGlvbiBpc05vdE5vbmUocHJvcGVydHkpIHtcbiAgICByZXR1cm4gcHJvcGVydHkgIT09IFwiTk9ORVwiO1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlTWlzY1NwZWNzKG5vZGUpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gW107XG4gICAgaWYgKG5vZGUub3BhY2l0eSkge1xuICAgICAgICAvL0B0cy1pZ25vcmUgd3JvbmcgdHlwaW5ncyA/XG4gICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJvcGFjaXR5XCI6IHtcInZhbHVlXCI6ICR7bm9kZS5vcGFjaXR5fX1gKTtcbiAgICB9XG4gICAgaWYgKG5vZGUuYmxlbmRNb2RlICE9PSBcIk5PUk1BTFwiICYmIEJMRU5EX01PREVfTUFQUElOR1Nbbm9kZS5ibGVuZE1vZGVdKSB7XG4gICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJibGVuZFwiOiB7XCJ2YWx1ZVwiOiBcIiR7QkxFTkRfTU9ERV9NQVBQSU5HU1tub2RlLmJsZW5kTW9kZV19XCJ9YCk7XG4gICAgfVxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xufVxuZnVuY3Rpb24gaW5BbnkocGFpbnRBcnIsIHByZWRpY2F0ZSkge1xuICAgIGxldCBmbGFnID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiBwYWludEFycikge1xuICAgICAgICBpZiAocHJlZGljYXRlKHZhbHVlKSkge1xuICAgICAgICAgICAgZmxhZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZsYWc7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVJc1Zpc2libGUobm9kZSkge1xuICAgIGxldCBpc1Zpc2libGUgPSBmYWxzZTtcbiAgICAvL0B0cy1pZ25vcmVcbiAgICBpZiAoaW5Bbnkobm9kZS5maWxscywgKHBhaW50KSA9PiBwYWludC52aXNpYmxlICYmIHBhaW50Lm9wYWNpdHkgPiAwKSkge1xuICAgICAgICBpc1Zpc2libGUgPSB0cnVlO1xuICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICB9XG4gICAgZWxzZSBpZiAoaW5Bbnkobm9kZS5zdHJva2VzLCAocGFpbnQpID0+IHBhaW50LnZpc2libGUgJiYgcGFpbnQub3BhY2l0eSA+IDApKSB7XG4gICAgICAgIGlzVmlzaWJsZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBpc1Zpc2libGU7XG59XG5jb25zdCBCTEVORF9NT0RFX01BUFBJTkdTID0ge1xuICAgIERBUktFTjogXCJkYXJrZW5cIixcbiAgICBNVUxUSVBMWTogXCJtdWx0aXBseVwiLFxuICAgIENPTE9SX0JVUk46IFwiY29sb3ItYnVyblwiLFxuICAgIExJR0hURU46IFwibGlnaHRlblwiLFxuICAgIFNDUkVFTjogXCJzY3JlZW5cIixcbiAgICBDT0xPUl9ET0RHRTogXCJjb2xvci1kb2RnZVwiLFxuICAgIE9WRVJMQVk6IFwib3ZlcmxheVwiLFxuICAgIFNPRlRfTElHSFQ6IFwic29mdC1saWdodFwiLFxuICAgIEhBUkRfTElHSFQ6IFwiaGFyZC1saWdodFwiLFxuICAgIERJRkZFUkVOQ0U6IFwiZGlmZmVyZW5jZVwiLFxuICAgIEVYQ0xVU0lPTjogXCJleGNsdXNpb25cIixcbiAgICBIVUU6IFwiaHVlXCIsXG4gICAgU0FUVVJBVElPTjogXCJzYXR1cmF0aW9uXCIsXG4gICAgQ09MT1I6IFwiY29sb3JcIixcbiAgICBMVU1JTk9TSVRZOiBcImx1bWlub3NpdHlcIixcbn07XG5mdW5jdGlvbiBjYWxjdWxhdGVGaWxsU3BlY3Mobm9kZSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBbXTtcbiAgICBjb25zb2xlLmxvZyhcImluIGZpbGxzIHNwZWNcIiwgbm9kZS5maWxscywgbm9kZS5vcGFjaXR5LCBub2RlLnZpc2libGUpO1xuICAgIGlmIChub2RlLmZpbGxzICYmIG5vZGUuZmlsbHNbMF0gJiYgbm9kZS5maWxsc1swXS52aXNpYmxlKSB7XG4gICAgICAgIC8vQHRzLWlnbm9yZSB3cm9uZyB0eXBpbmdzID9cbiAgICAgICAgY29uc3QgY29sb3IgPSBub2RlLmZpbGxzWzBdLmNvbG9yO1xuICAgICAgICBpZiAoY29sb3IgJiYgY29sb3IuciAhPT0gdW5kZWZpbmVkICYmIGNvbG9yLmcgIT09IHVuZGVmaW5lZCAmJiBjb2xvci5iICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJmaWxsXCI6IHtcInZhbHVlXCI6IFwiJHtyZ2JQZXJjZW50VG9IZXgoY29sb3IuciwgY29sb3IuZywgY29sb3IuYil9XCJ9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuZmlsbHNbMF0ub3BhY2l0eSkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcImZpbGxPcGFjaXR5XCI6IHtcInZhbHVlXCI6ICR7bm9kZS5maWxsc1swXS5vcGFjaXR5fX1gKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXR0cmlidXRlcztcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZVN0cm9rZVNwZWNzKG5vZGUpIHtcbiAgICBjb25zb2xlLmxvZyhcImluIGNhbGMgc3BlY1wiLCBub2RlKTtcbiAgICBjb25zdCBuYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG5vZGUpO1xuICAgIGNvbnNvbGUubG9nKFwiaW4gY2FsYyBzcGVjIG5hbWVzXCIsIG5hbWVzKTtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gW107XG4gICAgaWYgKG5vZGUuc3Ryb2tlcyAmJiBub2RlLnN0cm9rZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvL0B0cy1pZ25vcmUgd3JvbmcgdHlwaW5ncyA/XG4gICAgICAgIGNvbnN0IGNvbG9yID0gbm9kZS5zdHJva2VzWzBdLmNvbG9yO1xuICAgICAgICBpZiAoY29sb3IgJiYgY29sb3IuciAhPT0gdW5kZWZpbmVkICYmIGNvbG9yLmcgIT09IHVuZGVmaW5lZCAmJiBjb2xvci5iICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VcIjoge1widmFsdWVcIjogXCIke3JnYlBlcmNlbnRUb0hleChjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKX1cIn1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zdHJva2VzWzBdLm9wYWNpdHkpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VPcGFjaXR5XCI6IHtcInZhbHVlXCI6ICR7bm9kZS5zdHJva2VzWzBdLm9wYWNpdHl9fWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnN0cm9rZUNhcCA9PT0gXCJST1VORFwiIHx8IG5vZGUuc3Ryb2tlQ2FwID09PSBcIlNRVUFSRVwiKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwic3Ryb2tlQ2FwXCI6IHtcInZhbHVlXCI6IFwicm91bmRcIn1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zdHJva2VXZWlnaHQpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VXaWR0aFwiOiB7XCJ2YWx1ZVwiOiAke25vZGUuc3Ryb2tlV2VpZ2h0fX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5kYXNoUGF0dGVybiAmJiBub2RlLmRhc2hQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VEYXNoXCI6IHtcInZhbHVlXCI6ICR7bm9kZS5kYXNoUGF0dGVybn19YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc3Ryb2tlTWl0ZXJMaW1pdCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZU1pdGVyTGltaXRcIjoge1widmFsdWVcIjogJHtub2RlLnN0cm9rZU1pdGVyTGltaXR9fWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJldHVybiBhbGwgc3Ryb2tlIHByb3BlcnRpZXMgYXMgc3RyaW5nXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59XG5mdW5jdGlvbiBjb21wb25lbnRUb0hleChjKSB7XG4gICAgdmFyIGhleCA9IGMudG9TdHJpbmcoMTYpO1xuICAgIHJldHVybiBoZXgubGVuZ3RoID09IDEgPyBcIjBcIiArIGhleCA6IGhleDtcbn1cbmZ1bmN0aW9uIHJnYlBlcmNlbnRUb0hleChyLCBnLCBiKSB7XG4gICAgcmV0dXJuIChcIiNcIiArXG4gICAgICAgIGNvbXBvbmVudFRvSGV4KE1hdGgucm91bmQociAqIDI1NSkpICtcbiAgICAgICAgY29tcG9uZW50VG9IZXgoTWF0aC5yb3VuZCgyNTUgKiBnKSkgK1xuICAgICAgICBjb21wb25lbnRUb0hleChNYXRoLnJvdW5kKDI1NSAqIGIpKSk7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVQbGFjZW1lbnQobm9kZSwgcGFkZGluZ1gsIHBhZGRpbmdZKSB7XG4gICAgY29uc3Qgd2lkdGggPSBub2RlLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgIGNvbnN0IHggPSBub2RlLng7XG4gICAgY29uc3QgeSA9IG5vZGUueTtcbiAgICBjb25zdCBtYXhEaW1lbnNpb24gPSBNYXRoLm1heCh3aWR0aCwgaGVpZ2h0KTtcbiAgICBjb25zdCB0WCA9ICgxIC8gMikgKiB3aWR0aCArIHggLSBwYWRkaW5nWDsgLy8rIChtYXhEaW1lbnNpb24taGVpZ2h0KS8yOyAvLyB0b3RhbCB0cmFuc2xhdGVcbiAgICBjb25zdCB0WSA9ICgxIC8gMikgKiBoZWlnaHQgKyB5IC0gcGFkZGluZ1k7IC8vKyAobWF4RGltZW5zaW9uLWhlaWdodCkvMjsgLy8gdG90YWwgdHJhbnNsYXRlXG4gICAgY29uc3Qgc2NhbGUgPSBtYXhEaW1lbnNpb24gKiBtYXhEaW1lbnNpb247XG4gICAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodCwgdFgsIHRZLCBzY2FsZSB9O1xufVxuZnVuY3Rpb24gc2hvdWxkTm9kZUJlT3V0bGluZVN0cm9rZXMobm9kZSkge1xuICAgIGNvbnNvbGUubG9nKFwiaW4gb3V0bGluZVwiLCBub2RlKTtcbiAgICAvLyBpZiB0aGUgaXRlbSBoYXMgYW4gYXJyb3cgZW5kLCBvdXRsaW5lIHN0cm9rZSBiZWNhdXNlIGFycm93IHN0cm9rZSBjYXAgY2Fubm90IGJlIGFwcGxpZWQgOihcbiAgICBpZiAobm9kZS50eXBlID09PSBcIlZFQ1RPUlwiICYmXG4gICAgICAgIFwic3Ryb2tlQ2FwXCIgaW4gbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzW25vZGUudmVjdG9yTmV0d29yay52ZXJ0aWNlcy5sZW5ndGggLSAxXSAmJlxuICAgICAgICBub2RlLnZlY3Rvck5ldHdvcmsudmVydGljZXNbbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzLmxlbmd0aCAtIDFdLnN0cm9rZUNhcCAhPT0gXCJOT05FXCIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKFwic3Ryb2tlQWxpZ25cIiBpbiBub2RlICYmIG5vZGUuc3Ryb2tlQWxpZ24gIT09IFwiQ0VOVEVSXCIpIHtcbiAgICAgICAgLy9ub2RlLnN0cm9rZUFsaWduID0gXCJDRU5URVJcIjtcbiAgICAgICAgLy8gYXMgdmVnYSBkb2Vzbid0IHN1cHBvcnQgaW5zaWRlIG9yIGNlbnRlciwgb3V0bGluZSBzdHJva2VcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHZlY3Rvcml6ZShub2RlKSB7XG4gICAgLy9cbiAgICBjb25zdCBub2Rlc1RvUmV0dXJuID0gW107XG4gICAgLy8gaWYgbm9kZSBpcyB0ZXh0LCBjb21iaW5lIGFsbCB2ZWN0b3IgcGF0aHNcbiAgICBsZXQgdmVjdG9yTm9kZSA9IGZpZ21hLmZsYXR0ZW4oW25vZGVdKTtcbiAgICAvLyBsaW5lcyBhbmQgdmVjdG9yIHBhdGhzIHdpdGggc3Ryb2tlc1xuICAgIGNvbnN0IG91dGxpbmVkTm9kZSA9IHZlY3Rvck5vZGUub3V0bGluZVN0cm9rZSgpO1xuICAgIC8vIGlmIG5vIGZpbGxzLCBvdXRsaW5lIHN0cm9rZVxuICAgIG5vZGVzVG9SZXR1cm4ucHVzaCh2ZWN0b3JOb2RlKTtcbiAgICBpZiAob3V0bGluZWROb2RlICYmIHNob3VsZE5vZGVCZU91dGxpbmVTdHJva2VzKHZlY3Rvck5vZGUpKSB7XG4gICAgICAgIG5vZGVzVG9SZXR1cm4ucHVzaChvdXRsaW5lZE5vZGUpO1xuICAgICAgICAvLyBoaWRlIHRoZSBzdHJva2VzIVxuICAgICAgICB2ZWN0b3JOb2RlLnN0cm9rZXMgPSBbXTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGVzVG9SZXR1cm47XG59XG5mdW5jdGlvbiBkZWcyUmFkaWFuKGRlZykge1xuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XG59XG5mdW5jdGlvbiBtdWx0aXBseU1hdHJpY2VzKG1hdHJpeEEsIG1hdHJpeEIpIHtcbiAgICBsZXQgYU51bVJvd3MgPSBtYXRyaXhBLmxlbmd0aDtcbiAgICBsZXQgYU51bUNvbHMgPSBtYXRyaXhBWzBdLmxlbmd0aDtcbiAgICBsZXQgYk51bVJvd3MgPSBtYXRyaXhCLmxlbmd0aDtcbiAgICBsZXQgYk51bUNvbHMgPSBtYXRyaXhCWzBdLmxlbmd0aDtcbiAgICBsZXQgbmV3TWF0cml4ID0gbmV3IEFycmF5KGFOdW1Sb3dzKTtcbiAgICBmb3IgKGxldCByID0gMDsgciA8IGFOdW1Sb3dzOyArK3IpIHtcbiAgICAgICAgbmV3TWF0cml4W3JdID0gbmV3IEFycmF5KGJOdW1Db2xzKTtcbiAgICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCBiTnVtQ29sczsgKytjKSB7XG4gICAgICAgICAgICBuZXdNYXRyaXhbcl1bY10gPSAwO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhTnVtQ29sczsgKytpKSB7XG4gICAgICAgICAgICAgICAgbmV3TWF0cml4W3JdW2NdICs9IG1hdHJpeEFbcl1baV0gKiBtYXRyaXhCW2ldW2NdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXdNYXRyaXg7XG59XG5mdW5jdGlvbiBtdWx0aXBseShhLCBiKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgW1xuICAgICAgICAgICAgYVswXVswXSAqIGJbMF1bMF0gKyBhWzBdWzFdICogYlsxXVswXSxcbiAgICAgICAgICAgIGFbMF1bMF0gKiBiWzBdWzFdICsgYVswXVsxXSAqIGJbMV1bMV0sXG4gICAgICAgICAgICBhWzBdWzBdICogYlswXVsyXSArIGFbMF1bMV0gKiBiWzFdWzJdICsgYVswXVsyXSxcbiAgICAgICAgXSxcbiAgICAgICAgW1xuICAgICAgICAgICAgYVsxXVswXSAqIGJbMF1bMF0gKyBhWzFdWzFdICogYlsxXVswXSxcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzFdICsgYVsxXVsxXSAqIGJbMV1bMV0gKyAwLFxuICAgICAgICAgICAgYVsxXVswXSAqIGJbMF1bMl0gKyBhWzFdWzFdICogYlsxXVsyXSArIGFbMV1bMl0sXG4gICAgICAgIF0sXG4gICAgXTtcbn1cbi8vIENyZWF0ZXMgYSBcIm1vdmVcIiB0cmFuc2Zvcm0uXG5mdW5jdGlvbiBtb3ZlKHgsIHkpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICBbMSwgMCwgeF0sXG4gICAgICAgIFswLCAxLCB5XSxcbiAgICBdO1xufVxuLy8gQ3JlYXRlcyBhIFwicm90YXRlXCIgdHJhbnNmb3JtLlxuZnVuY3Rpb24gcm90YXRlKHRoZXRhKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgW01hdGguY29zKHRoZXRhKSwgTWF0aC5zaW4odGhldGEpLCAwXSxcbiAgICAgICAgWy1NYXRoLnNpbih0aGV0YSksIE1hdGguY29zKHRoZXRhKSwgMF0sXG4gICAgXTtcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZVhZRnJvbU5vZGUobm9kZSkge1xuICAgIGxldCBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRYID0gbm9kZS54O1xuICAgIGxldCBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRZID0gbm9kZS55O1xuICAgIGxldCB4ID0gbm9kZS53aWR0aCAvIDI7XG4gICAgbGV0IHkgPSBub2RlLndpZHRoIC8gMjtcbiAgICBsZXQgcm90YXRpb25EZWcgPSAtbm9kZS5yb3RhdGlvbjtcbiAgICBsZXQgcm90YXRpb25SYWQgPSAoTWF0aC5QSSAqIHJvdGF0aW9uRGVnKSAvIDE4MDtcbiAgICBsZXQgeFRyYW5zZm9ybSA9IHggLSB4ICogTWF0aC5jb3Mocm90YXRpb25SYWQpICsgeSAqIE1hdGguc2luKHJvdGF0aW9uUmFkKTtcbiAgICBsZXQgeVRyYW5zZm9ybSA9IHkgLSB4ICogTWF0aC5zaW4ocm90YXRpb25SYWQpICsgeSAqIE1hdGguY29zKHJvdGF0aW9uUmFkKTtcbiAgICBsZXQgcm90YXRpb25UcmFuc2Zvcm0gPSBbXG4gICAgICAgIFtNYXRoLmNvcyhyb3RhdGlvblJhZCksIC1NYXRoLnNpbihyb3RhdGlvblJhZCksIHhUcmFuc2Zvcm1dLFxuICAgICAgICBbTWF0aC5zaW4ocm90YXRpb25SYWQpLCBNYXRoLmNvcyhyb3RhdGlvblJhZCksIHlUcmFuc2Zvcm1dLFxuICAgIF07XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0gPSByb3RhdGlvblRyYW5zZm9ybTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbm9kZS54ICs9IGxvY2F0aW9uUmVsYXRpdmVUb1BhcmVudFg7XG4gICAgbm9kZS55ICs9IGxvY2F0aW9uUmVsYXRpdmVUb1BhcmVudFk7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS55KSwgSlNPTi5zdHJpbmdpZnkobm9kZS54KSk7XG59XG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgY2FsY3VsYXRlcyB0aGUgY29ycmVjdCBYWSBwb3NpdGlvbiBpZ25vcmluZyByb3RhdGlvblxuICogQHBhcmFtIG5vZGVcbiAqL1xuZnVuY3Rpb24gbmV3Q2FsY3VsYXRlUmVsYXRpdmUob3JpZ2luYWxOb2RlKSB7XG4gICAgY29uc3Qgbm9kZSA9IG9yaWdpbmFsTm9kZS5jbG9uZSgpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICAvL2NvbnN0IHggPSBvcmlnaW5hbE5vZGUueDtcbiAgICAvL2NvbnN0IHkgPSBvcmlnaW5hbE5vZGUueTtcbiAgICAvL25vZGUueCA9IDA7XG4gICAgLy9ub2RlLnkgPSAwO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUuYWJzb2x1dGVUcmFuc2Zvcm0pKTtcbiAgICAvL25vZGUucm90YXRpb24gPSAwO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBsZXQgdHJhbnNmb3JtID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy8gbW92ZSB0byAwXG4gICAgbGV0IHggPSB0cmFuc2Zvcm1bMF1bMl07XG4gICAgbGV0IHkgPSB0cmFuc2Zvcm1bMV1bMl07XG4gICAgdHJhbnNmb3JtWzBdWzJdID0gMDtcbiAgICB0cmFuc2Zvcm1bMV1bMl0gPSAwO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSAzNjBcIiwgSlNPTi5zdHJpbmdpZnkodHJhbnNmb3JtKSk7XG4gICAgdHJhbnNmb3JtID0gbXVsdGlwbHkocm90YXRlKDIgKiBNYXRoLlBJIC0gKG5vZGUucm90YXRpb24gLSBNYXRoLlBJKSAvIDE4MCksIHRyYW5zZm9ybSk7XG4gICAgY29uc29sZS5sb2coXCJmcm9tIGFmdGVyIHJvdFwiLCBKU09OLnN0cmluZ2lmeSh0cmFuc2Zvcm0pKTtcbiAgICB0cmFuc2Zvcm0gPSBtdWx0aXBseShtb3ZlKHgsIHkpLCB0cmFuc2Zvcm0pO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSBhZnRlciBtb3ZlXCIsIEpTT04uc3RyaW5naWZ5KHRyYW5zZm9ybSkpO1xuICAgIGNvbnN0IGRpZlggPSBub2RlLng7XG4gICAgY29uc3QgZGlmWSA9IG5vZGUueTtcbiAgICBjb25zb2xlLmxvZyhcImNhbGNlZFwiLCBkaWZYLCBkaWZZLCB4ICsgZGlmWCwgeSArIGRpZlkpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBjb25zb2xlLmxvZyhtdWx0aXBseShyb3RhdGUoLW5vZGUucm90YXRpb24pLCB0cmFuc2Zvcm0pKTtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gMzYwXCIsIG11bHRpcGx5KHJvdGF0ZSgtKG5vZGUucm90YXRpb24gLSBNYXRoLlBJKSAvIDE4MCksIG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICAvLyByb3RhdGUgYmFja1xuICAgIGNvbnN0IGFuZ2xlSW5SYWRpYW5zID0gZGVnMlJhZGlhbigtbm9kZS5yb3RhdGlvbik7XG4gICAgY29uc29sZS5sb2cobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSk7XG4gICAgY29uc3QgbmV0cmFuc2Zvcm0gPSBtdWx0aXBseShyb3RhdGUoYW5nbGVJblJhZGlhbnMpLCBub2RlLnJlbGF0aXZlVHJhbnNmb3JtKTtcbiAgICBjb25zb2xlLmxvZyhuZXRyYW5zZm9ybSk7XG4gICAgLypcbiAgICBjb25zb2xlLmxvZyhub2RlLnJlbGF0aXZlVHJhbnNmb3JtKVxuICAgIGxldCByb3RlciA9IG5vZGUucm90YXRpb247XG4gICAgbm9kZS5yb3RhdGlvbiA9IDA7XG4gIFxuICAgIGNvbnNvbGUubG9nKCdvbGQgeCcsSlNPTi5zdHJpbmdpZnkobm9kZS54KSxKU09OLnN0cmluZ2lmeShub2RlLnkpLEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBub2RlLnJvdGF0aW9uID0gcm90ZXI7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ25ldyB4Jyx4LHksSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpXG4gIFxuICBcbiAgXG4gICAgY29uc3Qgd2lkdGggPSBub2RlLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgIGNvbnNvbGUubG9nKHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgIGNvbnN0IHJvdCA9IChub2RlLnJvdGF0aW9uICogTWF0aC5QSSkgLyAxODA7IC8vIGluIHJhZGlhbnNcbiAgXG4gICAgLy8gbm90ZSwgdG8gY2FsY3VsYXRlIGRpc3RhbmNlIGZyb20gcm90YXRpb24sIHlvdSBtdXN0IGZsaXAgdGhlIHNpZ24gICgxLzIpSCBiZWNhdXNlIGluIGNhcnRlc2lhbiBjb29yZGluYXRlcyB5IERFQ1JFQVNFUyBhcyB5b3VcbiAgICBjb25zdCByZWFsWCA9IHggKyAoMSAvIDIpICogd2lkdGggKiBNYXRoLmNvcyhyb3QpIC8qLSAtMSAqICgxIC8gMikgKiBoZWlnaHQgKiBNYXRoLnNpbihyb3QpICAtICgxIC8gMikgKiB3aWR0aDtcbiAgICAgIGNvbnNvbGUubG9nKHksKDEgLyAyKSAqIHdpZHRoICogTWF0aC5zaW4ocm90KSwgLTEgKiAoMSAvIDIpICogaGVpZ2h0ICogTWF0aC5jb3Mocm90KSwgKDEgLyAyKSAqIGhlaWdodClcbiAgXG4gICAgY29uc3QgcmVhbFkgPVxuICAgICAgeSArICgxIC8gMikgKiB3aWR0aCAqIE1hdGguc2luKHJvdCkgLyorIC0xICogKDEgLyAyKSAqIGhlaWdodCAqIE1hdGguY29zKHJvdCkgKygxIC8gMikgKiBoZWlnaHQ7XG4gICAgcmV0dXJuIFtyZWFsWCwgcmVhbFldOyovXG4gICAgY29uc3QgdG90YWxMZW5ndGhPZkh5cG8gPSBNYXRoLnNxcnQobm9kZS53aWR0aCAqIG5vZGUud2lkdGggKyBub2RlLmhlaWdodCAqIG5vZGUuaGVpZ2h0KTtcbn1cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24sIGkuZS4gdGhlIHRyYW5zbGF0aW9uIGFuZCBzY2FsaW5nLCByZXF1aXJlZFxuLy8gdG8gZ2V0IHRoZSBwYXRoIHRvIGZpbGwgdGhlIHN2ZyBhcmVhLiBOb3RlIHRoYXQgdGhpcyBhc3N1bWVzIHVuaWZvcm1cbi8vIHNjYWxpbmcsIGEgcGF0aCB0aGF0IGhhcyBubyBvdGhlciB0cmFuc2Zvcm1zIGFwcGxpZWQgdG8gaXQsIGFuZCBub1xuLy8gZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgc3ZnIHZpZXdwb3J0IGFuZCB2aWV3Qm94IGRpbWVuc2lvbnMuXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBzdmdXZHRoID0gMjtcbiAgICB2YXIgc3ZnSGdodCA9IDI7XG4gICAgdmFyIG9yaWdQYXRoSGdodCA9IGhlaWdodDtcbiAgICB2YXIgb3JpZ1BhdGhXZHRoID0gd2lkdGg7XG4gICAgdmFyIG9yaWdQYXRoWSA9IHk7XG4gICAgdmFyIG9yaWdQYXRoWCA9IHg7XG4gICAgLy8gaG93IG11Y2ggYmlnZ2VyIGlzIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gICAgLy8gcmVsYXRpdmUgdG8gdGhlIHBhdGggaW4gZWFjaCBkaW1lbnNpb24/XG4gICAgdmFyIHNjYWxlQmFzZWRPbldkdGggPSBzdmdXZHRoIC8gb3JpZ1BhdGhXZHRoO1xuICAgIHZhciBzY2FsZUJhc2VkT25IZ2h0ID0gc3ZnSGdodCAvIG9yaWdQYXRoSGdodDtcbiAgICAvLyBvZiB0aGUgc2NhbGluZyBmYWN0b3JzIGRldGVybWluZWQgaW4gZWFjaCBkaW1lbnNpb24sXG4gICAgLy8gdXNlIHRoZSBzbWFsbGVyIG9uZTsgb3RoZXJ3aXNlIHBvcnRpb25zIG9mIHRoZSBwYXRoXG4gICAgLy8gd2lsbCBsaWUgb3V0c2lkZSB0aGUgdmlld3BvcnQgKGNvcnJlY3QgdGVybT8pXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oc2NhbGVCYXNlZE9uV2R0aCwgc2NhbGVCYXNlZE9uSGdodCk7XG4gICAgLy8gY2FsY3VsYXRlIHRoZSBib3VuZGluZyBib3ggcGFyYW1ldGVyc1xuICAgIC8vIGFmdGVyIHRoZSBwYXRoIGhhcyBiZWVuIHNjYWxlZCByZWxhdGl2ZSB0byB0aGUgb3JpZ2luXG4gICAgLy8gYnV0IGJlZm9yZSBhbnkgc3Vic2VxdWVudCB0cmFuc2xhdGlvbnMgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICB2YXIgc2NhbGVkUGF0aFggPSBvcmlnUGF0aFggKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aFkgPSBvcmlnUGF0aFkgKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aFdkdGggPSBvcmlnUGF0aFdkdGggKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aEhnaHQgPSBvcmlnUGF0aEhnaHQgKiBzY2FsZTtcbiAgICAvLyBjYWxjdWxhdGUgdGhlIGNlbnRyZSBwb2ludHMgb2YgdGhlIHNjYWxlZCBidXQgdW50cmFuc2xhdGVkIHBhdGhcbiAgICAvLyBhcyB3ZWxsIGFzIG9mIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gICAgdmFyIHNjYWxlZFBhdGhDZW50cmVYID0gc2NhbGVkUGF0aFggKyBzY2FsZWRQYXRoV2R0aCAvIDI7XG4gICAgdmFyIHNjYWxlZFBhdGhDZW50cmVZID0gc2NhbGVkUGF0aFkgKyBzY2FsZWRQYXRoSGdodCAvIDI7XG4gICAgdmFyIHN2Z1Jvb3RDZW50cmVYID0gMDsgLy8gLXN2Z1dkdGggLyAyO1xuICAgIHZhciBzdmdSb290Q2VudHJlWSA9IDA7IC8vLXN2Z0hnaHQgLyAyO1xuICAgIC8vIGNhbGN1bGF0ZSB0cmFuc2xhdGlvbiByZXF1aXJlZCB0byBjZW50cmUgdGhlIHBhdGhcbiAgICAvLyBvbiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIHZhciBwYXRoVHJhbnNsWCA9IHN2Z1Jvb3RDZW50cmVYIC0gc2NhbGVkUGF0aENlbnRyZVg7XG4gICAgdmFyIHBhdGhUcmFuc2xZID0gc3ZnUm9vdENlbnRyZVkgLSBzY2FsZWRQYXRoQ2VudHJlWTtcbiAgICBjb25zb2xlLmxvZyhcInNjYWxlZCBwYXRoIHhcIiwgc2NhbGVkUGF0aFgsIHNjYWxlZFBhdGhXZHRoLCBcInNjYWxlZCBwYXRoIHlcIiwgc2NhbGVkUGF0aFksIHNjYWxlZFBhdGhIZ2h0LCBcImZhY3RvciBmcm9tIHNjYWxlXCIsIChvcmlnUGF0aEhnaHQgLSBvcmlnUGF0aFdkdGgpIC8gMiwgXCJ4ZmFjdG9yIGZyb20gZ1wiKTtcbiAgICAvL1xuICAgIGNvbnNvbGUubG9nKHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpO1xuICAgIHJldHVybiB7IHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUgfTtcbn1cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybWVkUGF0aERTdHIob2xkUGF0aERTdHIsIHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpIHtcbiAgICAvLyBjb25zdGFudHMgdG8gaGVscCBrZWVwIHRyYWNrIG9mIHRoZSB0eXBlcyBvZiBTVkcgY29tbWFuZHMgaW4gdGhlIHBhdGhcbiAgICB2YXIgQk9USF9YX0FORF9ZID0gMTtcbiAgICB2YXIgSlVTVF9YID0gMjtcbiAgICB2YXIgSlVTVF9ZID0gMztcbiAgICB2YXIgTk9ORSA9IDQ7XG4gICAgdmFyIEVMTElQVElDQUxfQVJDID0gNTtcbiAgICB2YXIgQUJTT0xVVEUgPSA2O1xuICAgIHZhciBSRUxBVElWRSA9IDc7XG4gICAgLy8gdHdvIHBhcmFsbGVsIGFycmF5cywgd2l0aCBlYWNoIGVsZW1lbnQgYmVpbmcgb25lIGNvbXBvbmVudCBvZiB0aGVcbiAgICAvLyBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoLCB3aXRoIG9uZSBjb21wb25lbnQgYmVpbmcgZWl0aGVyXG4gICAgLy8gYW4gaW5zdHJ1Y3Rpb24gKGUuZy4gXCJNXCIgZm9yIG1vdmV0bywgZXRjLikgb3IgbnVtZXJpY2FsIHZhbHVlXG4gICAgLy8gZm9yIGVpdGhlciBhbiB4IG9yIHkgY29vcmRpbmF0ZVxuICAgIHZhciBvbGRQYXRoREFyciA9IGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMob2xkUGF0aERTdHIpO1xuICAgIHZhciBuZXdQYXRoREFyciA9IFtdO1xuICAgIGNvbnNvbGUubG9nKG9sZFBhdGhEQXJyKTtcbiAgICB2YXIgY29tbWFuZFBhcmFtcywgYWJzT3JSZWwsIG9sZFBhdGhEQ29tcCwgbmV3UGF0aERDb21wO1xuICAgIC8vIGVsZW1lbnQgaW5kZXhcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB3aGlsZSAoaWR4IDwgb2xkUGF0aERBcnIubGVuZ3RoKSB7XG4gICAgICAgIHZhciBvbGRQYXRoRENvbXAgPSBvbGRQYXRoREFycltpZHhdO1xuICAgICAgICBpZiAoL15bQS1aYS16XSQvLnRlc3Qob2xkUGF0aERDb21wKSkge1xuICAgICAgICAgICAgLy8gY29tcG9uZW50IGlzIGEgc2luZ2xlIGxldHRlciwgaS5lLiBhbiBzdmcgcGF0aCBjb21tYW5kXG4gICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9sZFBhdGhEQ29tcCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXdQYXRoREFycltpZHhdKTtcbiAgICAgICAgICAgIHN3aXRjaCAob2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVwiOiAvLyBlbGxpcHRpY2FsIGFyYyBjb21tYW5kLi4udGhlIG1vc3QgY29tcGxpY2F0ZWQgb25lXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBFTExJUFRJQ0FMX0FSQztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkhcIjogLy8gaG9yaXpvbnRhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGFuIHgtY29vcmRpbmF0ZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9YO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOiAvLyB2ZXJ0aWNhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGEgeS1jb29yZGluYXRlXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBKVVNUX1k7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJaXCI6IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBOT05FO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgb3RoZXIgY29tbWFuZHM7IGFsbCBvZiB0aGVtIHJlcXVpcmUgYm90aCB4IGFuZCB5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBCT1RIX1hfQU5EX1k7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhYnNPclJlbCA9IG9sZFBhdGhEQ29tcCA9PT0gb2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkgPyBBQlNPTFVURSA6IFJFTEFUSVZFO1xuICAgICAgICAgICAgLy8gbG93ZXJjYXNlIGNvbW1hbmRzIGFyZSByZWxhdGl2ZSwgdXBwZXJjYXNlIGFyZSBhYnNvbHV0ZVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgY29tcG9uZW50IGlzIG5vdCBhIGxldHRlciwgdGhlbiBpdCBpcyBhIG51bWVyaWMgdmFsdWVcbiAgICAgICAgICAgIHZhciB0cmFuc2xYLCB0cmFuc2xZO1xuICAgICAgICAgICAgaWYgKGFic09yUmVsID09PSBBQlNPTFVURSkge1xuICAgICAgICAgICAgICAgIC8vIHRoZSB0cmFuc2xhdGlvbiBpcyByZXF1aXJlZCBmb3IgYWJzb2x1dGUgY29tbWFuZHMuLi5cbiAgICAgICAgICAgICAgICB0cmFuc2xYID0gcGF0aFRyYW5zbFg7XG4gICAgICAgICAgICAgICAgdHJhbnNsWSA9IHBhdGhUcmFuc2xZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYWJzT3JSZWwgPT09IFJFTEFUSVZFKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uYnV0IG5vdCByZWxhdGl2ZSBvbmVzXG4gICAgICAgICAgICAgICAgdHJhbnNsWCA9IDA7XG4gICAgICAgICAgICAgICAgdHJhbnNsWSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGNvbW1hbmRQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAvLyBmaWd1cmUgb3V0IHdoaWNoIG9mIHRoZSBudW1lcmljIHZhbHVlcyBmb2xsb3dpbmcgYW4gc3ZnIGNvbW1hbmRcbiAgICAgICAgICAgICAgICAvLyBhcmUgcmVxdWlyZWQsIGFuZCB0aGVuIHRyYW5zZm9ybSB0aGUgbnVtZXJpYyB2YWx1ZShzKSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIHBhdGggZC1hdHRyaWJ1dGUgYW5kIHBsYWNlIGl0IGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZVxuICAgICAgICAgICAgICAgIC8vIGFycmF5IHRoYXQgd2lsbCBldmVudHVhbGx5IGJlY29tZSB0aGUgZC1hdHRyaWJ1dGUgZm9yIHRoZSBuZXcgcGF0aFxuICAgICAgICAgICAgICAgIGNhc2UgQk9USF9YX0FORF9ZOlxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgICAgICAgICAgIGlkeCArPSAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEpVU1RfWDpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgSlVTVF9ZOlxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBFTExJUFRJQ0FMX0FSQzpcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGVsbGlwdGljYWwgYXJjIGhhcyB4IGFuZCB5IHZhbHVlcyBpbiB0aGUgZmlyc3QgYW5kIHNlY29uZCBhcyB3ZWxsIGFzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSA2dGggYW5kIDd0aCBwb3NpdGlvbnMgZm9sbG93aW5nIHRoZSBjb21tYW5kOyB0aGUgaW50ZXJ2ZW5pbmcgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIC8vIGFyZSBub3QgYWZmZWN0ZWQgYnkgdGhlIHRyYW5zZm9ybWF0aW9uIGFuZCBzbyBjYW4gc2ltcGx5IGJlIGNvcGllZFxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDJdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDJdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgM10gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgM10pO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA0XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA0XSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDVdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDVdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNl0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gNztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBOT05FOlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJudW1lcmljIHZhbHVlIHNob3VsZCBub3QgZm9sbG93IHRoZSBTVkcgWi96IGNvbW1hbmRcIik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKG5ld1BhdGhEQXJyKTtcbiAgICByZXR1cm4gbmV3UGF0aERBcnIuam9pbihcIiBcIik7XG59XG5mdW5jdGlvbiBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKHN0cikge1xuICAgIC8vIGFzc3VtaW5nIHRoZSBzdHJpbmcgZnJvbSB0aGUgZC1hdHRyaWJ1dGUgb2YgdGhlIHBhdGggaGFzIGFsbCBjb21wb25lbnRzXG4gICAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLCB0aGVuIGNyZWF0ZSBhbiBhcnJheSBvZiBjb21wb25lbnRzIGJ5XG4gICAgLy8gc2ltcGx5IHNwbGl0dGluZyB0aGUgc3RyaW5nIGF0IHRob3NlIHNwYWNlc1xuICAgIHN0ciA9IHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKTtcbiAgICByZXR1cm4gc3RyLnNwbGl0KFwiIFwiKTtcbn1cbmZ1bmN0aW9uIHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKSB7XG4gICAgLy8gVGhlIFNWRyBzdGFuZGFyZCBpcyBmbGV4aWJsZSB3aXRoIHJlc3BlY3QgdG8gaG93IHBhdGggZC1zdHJpbmdzIGFyZVxuICAgIC8vIGZvcm1hdHRlZCBidXQgdGhpcyBtYWtlcyBwYXJzaW5nIHRoZW0gbW9yZSBkaWZmaWN1bHQuIFRoaXMgZnVuY3Rpb24gZW5zdXJlc1xuICAgIC8vIHRoYXQgYWxsIFNWRyBwYXRoIGQtc3RyaW5nIGNvbXBvbmVudHMgKGkuZS4gYm90aCBjb21tYW5kcyBhbmQgdmFsdWVzKSBhcmVcbiAgICAvLyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UuXG4gICAgcmV0dXJuIHN0clxuICAgICAgICAucmVwbGFjZSgvLC9nLCBcIiBcIikgLy8gcmVwbGFjZSBlYWNoIGNvbW1hIHdpdGggYSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvLS9nLCBcIiAtXCIpIC8vIHByZWNlZGUgZWFjaCBtaW51cyBzaWduIHdpdGggYSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvKFtBLVphLXpdKS9nLCBcIiAkMSBcIikgLy8gc2FuZHdpY2ggZWFjaCAgIGxldHRlciBiZXR3ZWVuIDIgc3BhY2VzXG4gICAgICAgIC5yZXBsYWNlKC8gIC9nLCBcIiBcIikgLy8gY29sbGFwc2UgcmVwZWF0ZWQgc3BhY2VzIHRvIGEgc2luZ2xlIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8gKFtFZV0pIC9nLCBcIiQxXCIpIC8vIHJlbW92ZSBmbGFua2luZyBzcGFjZXMgYXJvdW5kIGV4cG9uZW50IHN5bWJvbHNcbiAgICAgICAgLnJlcGxhY2UoL14gL2csIFwiXCIpIC8vIHRyaW0gYW55IGxlYWRpbmcgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLyAkL2csIFwiXCIpOyAvLyB0cmltIGFueSB0YWlsaW5nIHNwYWNlXG59XG5maWdtYS51aS5yZXNpemUoNzUwLCA2NTApO1xuZXhwb3J0IHt9O1xuLy8gVXNpbmcgcmVsYXRpdmUgdHJhbnNmb3JtYXRpb24gbWF0cml4IChnaXZlcyBza2V3ZWQgeCB2YWx1ZSBmb3Igbm9uLXJvdGF0ZWQpXG4vL2NvbnNvbGUubG9nKCdyZWx4JyxyZWxbMF1bMl0gKyAoMS8yKSp3aWR0aCpyZWxbMF1bMF0gLSgtMSkqKDEvMikqaGVpZ2h0KnJlbFswXVswXSAtICgxLzIpKndpZHRoKTtcbi8vY29uc29sZS5sb2coJ3JlbHknLHJlbFsxXVsyXSAgKygxLzIpKndpZHRoKnJlbFsxXVswXS0gKC0xKSooMS8yKSpoZWlnaHQqcmVsWzFdWzFdIC0gKDEvMikqaGVpZ2h0KTtcbi8qXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcFwiKS5pbm5lckhUTUwgPSBgXG48c3ZnICBpZD1cImJhc2VcIiB3aWR0aD1cIjgwMFwiIGhlaWdodD1cIjYwMFwiIHZpZXdCb3g9XCIwIDAgODAwIDYwMFwiIHN0eWxlPVwiYm9yZGVyOiAxcHggc29saWQgYmx1ZTtcIj5cbiAgICA8cGF0aCBpZD1cIm5vdG1vdmVkXCIgZmlsbD1cIiNmMDBcIiBzdHJva2U9XCJub25lXCIgZD1cIk0xMjIuNzY5IDQ4LjQ5MTRDMTI3LjAzOCA0Ni4xMTc5IDEyOS45ODMgNDMuMzcyNCAxMzEuMjc0IDQwLjIxNjhDMTM2LjYxNCAyNy4xNjg1IDEzMy40NzIgMTcuMzYwNCAxMjkuMDE0IDEwLjgwMDdDMTI2Ljc3OSA3LjUxMTU0IDEyNC4yMDggNS4wMzM3MiAxMjIuMTk1IDMuMzc3ODlDMTIxLjE4OCAyLjU1MDUgMTIwLjMyMyAxLjkyOTg1IDExOS43MTEgMS41MTcxNUMxMTkuNDA1IDEuMzEwODQgMTE5LjE2MyAxLjE1NjYyIDExOC45OTggMS4wNTQ2MUMxMTguOTE2IDEuMDAzNjIgMTE4Ljg1MyAwLjk2NTY4OSAxMTguODExIDAuOTQwODQ1TDExOC43NjUgMC45MTMzOTJMMTE4Ljc1NCAwLjkwNzAzM0wxMTguNzUxIDAuOTA1Njk4QzExOC43NTEgMC45MDU3MjQgMTE4Ljc1MSAwLjkwNTU5IDExOSAwLjQ3MTYxOEMxMTkuMjQ4IDAuMDM3NjQ2NiAxMTkuMjQ4IDAuMDM3ODI0MyAxMTkuMjQ5IDAuMDM4MDU0TDExOS4yNTQgMC4wNDExMzg1TDExOS4yNjkgMC4wNDk1ODkxQzExOS4yODEgMC4wNTY4NzYyIDExOS4yOTkgMC4wNjc0NzAxIDExOS4zMjIgMC4wODEzNjY3QzExOS4zNjkgMC4xMDkxNTcgMTE5LjQzNyAwLjE1MDE2OCAxMTkuNTI1IDAuMjA0Mzg2QzExOS43IDAuMzEyODExIDExOS45NTMgMC40NzQwOTYgMTIwLjI3IDAuNjg4MTM0QzEyMC45MDUgMS4xMTYxMyAxMjEuNzk2IDEuNzU1NTIgMTIyLjgzIDIuNjA1NDlDMTI0Ljg5NiA0LjMwNDM4IDEyNy41MzkgNi44NTA1OSAxMjkuODQxIDEwLjIzODdDMTM0LjQ1OSAxNy4wMzM0IDEzNy42ODUgMjcuMTkyNiAxMzIuMiA0MC41OTU1QzEzMC43ODUgNDQuMDUyNiAxMjcuNjE1IDQ2Ljk0MTYgMTIzLjI1NSA0OS4zNjU0QzExOC44ODggNTEuNzkzMSAxMTMuMjcgNTMuNzg2MSAxMDYuODY3IDU1LjQyMzdDOTQuMDU4NCA1OC42OTkzIDc4LjAxODggNjAuNTc0NCA2Mi4zNDI1IDYxLjYyMTJDNDYuNjYxMyA2Mi42NjgyIDMxLjMyMTQgNjIuODg3OCAxOS45MDM1IDYyLjg0NTdDMTQuMTk0IDYyLjgyNDYgOS40NjQxOCA2Mi43MzgxIDYuMTYxMjEgNjIuNjU2OUM0LjUwOTcxIDYyLjYxNjMgMy4yMTQ4OSA2Mi41NzcgMi4zMzI2NyA2Mi41NDc4QzIuMjgwNTEgNjIuNTQ2MSAyLjIyOTc5IDYyLjU0NDQgMi4xODA1MiA2Mi41NDI4TDQuNDE4MDQgNjQuOTY5MkM0LjYwNTI0IDY1LjE3MjIgNC41OTI0MyA2NS40ODg2IDQuMzg5NDMgNjUuNjc1OEM0LjE4NjQyIDY1Ljg2MyAzLjg3MDA5IDY1Ljg1MDEgMy42ODI4OSA2NS42NDcxTDAuNjMyMzEyIDYyLjMzOUMwLjQ0NTExNSA2Mi4xMzYgMC40NTc5MjMgNjEuODE5NiAwLjY2MDkyNyA2MS42MzI0TDMuOTY5MDggNTguNTgxOUM0LjE3MjA4IDU4LjM5NDcgNC40ODg0MiA1OC40MDc1IDQuNjc1NjEgNTguNjEwNUM0Ljg2MjgxIDU4LjgxMzUgNC44NSA1OS4xMjk4IDQuNjQ3IDU5LjMxN0wyLjIzMjA0IDYxLjU0MzlDMi4yNzU0NyA2MS41NDU0IDIuMzIwMDQgNjEuNTQ2OSAyLjM2NTcxIDYxLjU0ODRDMy4yNDUzMSA2MS41Nzc1IDQuNTM3MyA2MS42MTY3IDYuMTg1OCA2MS42NTcyQzkuNDgyODQgNjEuNzM4MyAxNC4yMDU3IDYxLjgyNDcgMTkuOTA3MiA2MS44NDU3QzMxLjMxMTEgNjEuODg3NyA0Ni42MjU5IDYxLjY2ODQgNjIuMjc1OSA2MC42MjM0Qzc3LjkzMDcgNTkuNTc4MSA5My44OTkgNTcuNzA3OSAxMDYuNjE5IDU0LjQ1NDlDMTEyLjk4IDUyLjgyODEgMTE4LjUwNiA1MC44NjEgMTIyLjc2OSA0OC40OTE0WlwiIG9wYWNpdHk9XCIwLjVcIiAvPlxuPC9zdmc+XG5gO1xuXG4vL00gMC44OTQ4Nzk4NDIyMzI1MDM0IC0wLjIyOTQ3Nzc2NTQ2NjMyNTE1IEwgLTAuOTExMzQ2MDQ2MjkwMDU2OCAtMC45ODQ4MDg2MjE1MTQyODg1IEwgLTAuOTA0OTkzMjkxMDA4MDY2NyAtMC45OTk5OTk5OTk5OTk5OTk5IEwgMC45MTEzNDYwMzMyMjQ4NDE2IC0wLjI0MDQ0MDk1NTQyOTAyMzg4IFYgMS4wMDAwMDAwMjQxMjAzOTY4IEggMC44OTQ4Nzk4NDIyMzI1MDM0IFYgLTAuMjI5NDc3NzY1NDY2MzI1MTUgWlxuLy8gUmV0cmlldmUgdGhlIFwiZFwiIGF0dHJpYnV0ZSBvZiB0aGUgU1ZHIHBhdGggeW91IHdpc2ggdG8gdHJhbnNmb3JtLlxudmFyIHN2Z1Jvb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhc2VcIik7XG52YXIgcGF0aCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm90bW92ZWRcIik7XG52YXIgb2xkUGF0aERTdHIgPSBwYXRoLmdldEF0dHJpYnV0ZShcImRcIik7XG5cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24gcmVxdWlyZWQuXG52YXIgb2JqID0gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHN2Z1Jvb3QsIHBhdGgpO1xudmFyIHBhdGhUcmFuc2xYID0gb2JqLnBhdGhUcmFuc2xYO1xudmFyIHBhdGhUcmFuc2xZID0gb2JqLnBhdGhUcmFuc2xZO1xudmFyIHNjYWxlID0gb2JqLnNjYWxlO1xuXG4vLyBUaGUgcGF0aCBjb3VsZCBiZSB0cmFuc2Zvcm1lZCBhdCB0aGlzIHBvaW50IHdpdGggYSBzaW1wbGVcbi8vIFwidHJhbnNmb3JtXCIgYXR0cmlidXRlIGFzIHNob3duIGhlcmUuXG5cbi8vICRwYXRoLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgYHRyYW5zbGF0ZSgke3BhdGhUcmFuc2xYfSwgJHtwYXRoVHJhbnNsWX0pLCBzY2FsZSgke3NjYWxlfSlgKTtcblxuLy8gSG93ZXZlciwgYXMgZGVzY3JpYmVkIGluIHlvdXIgcXVlc3Rpb24geW91IGRpZG4ndCB3YW50IHRoaXMuXG4vLyBUaGVyZWZvcmUsIHRoZSBjb2RlIGZvbGxvd2luZyB0aGlzIGxpbmUgbXV0YXRlcyB0aGUgYWN0dWFsIHN2ZyBwYXRoLlxuXG4vLyBDYWxjdWxhdGUgdGhlIHBhdGggXCJkXCIgYXR0cmlidXRlcyBwYXJhbWV0ZXJzLlxudmFyIG5ld1BhdGhEU3RyID0gZ2V0VHJhbnNmb3JtZWRQYXRoRFN0cihcbiAgb2xkUGF0aERTdHIsXG4gIHBhdGhUcmFuc2xYLFxuICBwYXRoVHJhbnNsWSxcbiAgc2NhbGVcbik7XG5cbi8vIEFwcGx5IHRoZSBuZXcgXCJkXCIgYXR0cmlidXRlIHRvIHRoZSBwYXRoLCB0cmFuc2Zvcm1pbmcgaXQuXG5cbmRvY3VtZW50LndyaXRlKFxuICBcIjxwPkFsdGVyZWQgJ2QnIGF0dHJpYnV0ZSBvZiBwYXRoOjwvcD48cD5cIiArIG5ld1BhdGhEU3RyICsgXCI8L3A+XCJcbik7XG5cbi8vIFRoaXMgaXMgdGhlIGVuZCBvZiB0aGUgbWFpbiBjb2RlLiBCZWxvdyBhcmUgdGhlIGZ1bmN0aW9ucyBjYWxsZWQuXG5cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24sIGkuZS4gdGhlIHRyYW5zbGF0aW9uIGFuZCBzY2FsaW5nLCByZXF1aXJlZFxuLy8gdG8gZ2V0IHRoZSBwYXRoIHRvIGZpbGwgdGhlIHN2ZyBhcmVhLiBOb3RlIHRoYXQgdGhpcyBhc3N1bWVzIHVuaWZvcm1cbi8vIHNjYWxpbmcsIGEgcGF0aCB0aGF0IGhhcyBubyBvdGhlciB0cmFuc2Zvcm1zIGFwcGxpZWQgdG8gaXQsIGFuZCBub1xuLy8gZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgc3ZnIHZpZXdwb3J0IGFuZCB2aWV3Qm94IGRpbWVuc2lvbnMuXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoc3ZnLCBwYXRoKSB7XG4gIHZhciBzdmdXZHRoID0gMjtcbiAgdmFyIHN2Z0hnaHQgPSAyO1xuXG4gIHZhciBvcmlnUGF0aEJvdW5kaW5nQm94ID0gcGF0aC5nZXRCQm94KCk7XG5cbiAgdmFyIG9yaWdQYXRoSGdodCA9IG9yaWdQYXRoQm91bmRpbmdCb3guaGVpZ2h0O1xuICB2YXIgb3JpZ1BhdGhXZHRoID0gb3JpZ1BhdGhCb3VuZGluZ0JveC53aWR0aDtcblxuICB2YXIgb3JpZ1BhdGhZID0gb3JpZ1BhdGhCb3VuZGluZ0JveC55O1xuICB2YXIgb3JpZ1BhdGhYID0gb3JpZ1BhdGhCb3VuZGluZ0JveC54O1xuXG4gIGNvbnNvbGUubG9nKG9yaWdQYXRoV2R0aCwgb3JpZ1BhdGhIZ2h0LCBvcmlnUGF0aFdkdGgsIG9yaWdQYXRoWCwgb3JpZ1BhdGhZKTtcbiAgLy8gaG93IG11Y2ggYmlnZ2VyIGlzIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gIC8vIHJlbGF0aXZlIHRvIHRoZSBwYXRoIGluIGVhY2ggZGltZW5zaW9uP1xuICB2YXIgc2NhbGVCYXNlZE9uV2R0aCA9IHN2Z1dkdGggLyBvcmlnUGF0aFdkdGg7XG4gIHZhciBzY2FsZUJhc2VkT25IZ2h0ID0gc3ZnSGdodCAvIG9yaWdQYXRoSGdodDtcblxuICAvLyBvZiB0aGUgc2NhbGluZyBmYWN0b3JzIGRldGVybWluZWQgaW4gZWFjaCBkaW1lbnNpb24sXG4gIC8vIHVzZSB0aGUgc21hbGxlciBvbmU7IG90aGVyd2lzZSBwb3J0aW9ucyBvZiB0aGUgcGF0aFxuICAvLyB3aWxsIGxpZSBvdXRzaWRlIHRoZSB2aWV3cG9ydCAoY29ycmVjdCB0ZXJtPylcbiAgdmFyIHNjYWxlID0gTWF0aC5taW4oc2NhbGVCYXNlZE9uV2R0aCwgc2NhbGVCYXNlZE9uSGdodCk7XG4gIGFsZXJ0KFxuICAgIGBoZWlnaHQ6ICR7MSAvIHNjYWxlQmFzZWRPbkhnaHR9IHdpZHRoOiAkezEgLyBzY2FsZUJhc2VkT25XZHRofSwgJHtcbiAgICAgIG9yaWdQYXRoV2R0aCAqIG9yaWdQYXRoSGdodFxuICAgIH1gXG4gICk7XG4gIC8vIGNhbGN1bGF0ZSB0aGUgYm91bmRpbmcgYm94IHBhcmFtZXRlcnNcbiAgLy8gYWZ0ZXIgdGhlIHBhdGggaGFzIGJlZW4gc2NhbGVkIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW5cbiAgLy8gYnV0IGJlZm9yZSBhbnkgc3Vic2VxdWVudCB0cmFuc2xhdGlvbnMgaGF2ZSBiZWVuIGFwcGxpZWRcblxuICB2YXIgc2NhbGVkUGF0aFggPSBvcmlnUGF0aFggKiBzY2FsZTtcbiAgdmFyIHNjYWxlZFBhdGhZID0gb3JpZ1BhdGhZICogc2NhbGU7XG4gIHZhciBzY2FsZWRQYXRoV2R0aCA9IG9yaWdQYXRoV2R0aCAqIHNjYWxlO1xuICB2YXIgc2NhbGVkUGF0aEhnaHQgPSBvcmlnUGF0aEhnaHQgKiBzY2FsZTtcblxuICAvLyBjYWxjdWxhdGUgdGhlIGNlbnRyZSBwb2ludHMgb2YgdGhlIHNjYWxlZCBidXQgdW50cmFuc2xhdGVkIHBhdGhcbiAgLy8gYXMgd2VsbCBhcyBvZiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuXG4gIHZhciBzY2FsZWRQYXRoQ2VudHJlWCA9IHNjYWxlZFBhdGhYICsgc2NhbGVkUGF0aFdkdGggLyAyO1xuICB2YXIgc2NhbGVkUGF0aENlbnRyZVkgPSBzY2FsZWRQYXRoWSArIHNjYWxlZFBhdGhIZ2h0IC8gMjtcbiAgdmFyIHN2Z1Jvb3RDZW50cmVYID0gMDsgLy8gLXN2Z1dkdGggLyAyO1xuICB2YXIgc3ZnUm9vdENlbnRyZVkgPSAwOyAvLy1zdmdIZ2h0IC8gMjtcblxuICAvLyBjYWxjdWxhdGUgdHJhbnNsYXRpb24gcmVxdWlyZWQgdG8gY2VudHJlIHRoZSBwYXRoXG4gIC8vIG9uIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gIHZhciBwYXRoVHJhbnNsWCA9IHN2Z1Jvb3RDZW50cmVYIC0gc2NhbGVkUGF0aENlbnRyZVg7XG4gIHZhciBwYXRoVHJhbnNsWSA9IHN2Z1Jvb3RDZW50cmVZIC0gc2NhbGVkUGF0aENlbnRyZVk7XG4gIGNvbnNvbGUubG9nKFxuICAgIFwic2NhbGVkIHBhdGggeFwiLFxuICAgIHNjYWxlZFBhdGhYLFxuICAgIHNjYWxlZFBhdGhXZHRoLFxuICAgIFwic2NhbGVkIHBhdGggeVwiLFxuICAgIHNjYWxlZFBhdGhZLFxuICAgIHNjYWxlZFBhdGhIZ2h0LFxuICAgIFwiZmFjdG9yIGZyb20gc2NhbGVcIixcbiAgICAob3JpZ1BhdGhIZ2h0IC0gb3JpZ1BhdGhXZHRoKSAvIDIsXG4gICAgXCJ4ZmFjdG9yIGZyb20gZ1wiXG4gICk7XG4gIHJldHVybiB7IHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUgfTtcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtZWRQYXRoRFN0cihvbGRQYXRoRFN0ciwgcGF0aFRyYW5zbFgsIHBhdGhUcmFuc2xZLCBzY2FsZSkge1xuICAvLyBjb25zdGFudHMgdG8gaGVscCBrZWVwIHRyYWNrIG9mIHRoZSB0eXBlcyBvZiBTVkcgY29tbWFuZHMgaW4gdGhlIHBhdGhcbiAgdmFyIEJPVEhfWF9BTkRfWSA9IDE7XG4gIHZhciBKVVNUX1ggPSAyO1xuICB2YXIgSlVTVF9ZID0gMztcbiAgdmFyIE5PTkUgPSA0O1xuICB2YXIgRUxMSVBUSUNBTF9BUkMgPSA1O1xuICB2YXIgQUJTT0xVVEUgPSA2O1xuICB2YXIgUkVMQVRJVkUgPSA3O1xuXG4gIC8vIHR3byBwYXJhbGxlbCBhcnJheXMsIHdpdGggZWFjaCBlbGVtZW50IGJlaW5nIG9uZSBjb21wb25lbnQgb2YgdGhlXG4gIC8vIFwiZFwiIGF0dHJpYnV0ZSBvZiB0aGUgU1ZHIHBhdGgsIHdpdGggb25lIGNvbXBvbmVudCBiZWluZyBlaXRoZXJcbiAgLy8gYW4gaW5zdHJ1Y3Rpb24gKGUuZy4gXCJNXCIgZm9yIG1vdmV0bywgZXRjLikgb3IgbnVtZXJpY2FsIHZhbHVlXG4gIC8vIGZvciBlaXRoZXIgYW4geCBvciB5IGNvb3JkaW5hdGVcbiAgdmFyIG9sZFBhdGhEQXJyID0gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhvbGRQYXRoRFN0cik7XG4gIHZhciBuZXdQYXRoREFyciA9IFtdO1xuXG4gIHZhciBjb21tYW5kUGFyYW1zLCBhYnNPclJlbCwgb2xkUGF0aERDb21wLCBuZXdQYXRoRENvbXA7XG5cbiAgLy8gZWxlbWVudCBpbmRleFxuICB2YXIgaWR4ID0gMDtcblxuICB3aGlsZSAoaWR4IDwgb2xkUGF0aERBcnIubGVuZ3RoKSB7XG4gICAgdmFyIG9sZFBhdGhEQ29tcCA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgaWYgKC9eW0EtWmEtel0kLy50ZXN0KG9sZFBhdGhEQ29tcCkpIHtcbiAgICAgIC8vIGNvbXBvbmVudCBpcyBhIHNpbmdsZSBsZXR0ZXIsIGkuZS4gYW4gc3ZnIHBhdGggY29tbWFuZFxuICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgICBzd2l0Y2ggKG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgXCJBXCI6IC8vIGVsbGlwdGljYWwgYXJjIGNvbW1hbmQuLi50aGUgbW9zdCBjb21wbGljYXRlZCBvbmVcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gRUxMSVBUSUNBTF9BUkM7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJIXCI6IC8vIGhvcml6b250YWwgbGluZTsgcmVxdWlyZXMgb25seSBhbiB4LWNvb3JkaW5hdGVcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9YO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiVlwiOiAvLyB2ZXJ0aWNhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGEgeS1jb29yZGluYXRlXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlpcIjogLy8gY2xvc2UgdGhlIHBhdGhcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gTk9ORTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBhbGwgb3RoZXIgY29tbWFuZHM7IGFsbCBvZiB0aGVtIHJlcXVpcmUgYm90aCB4IGFuZCB5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEJPVEhfWF9BTkRfWTtcbiAgICAgIH1cbiAgICAgIGFic09yUmVsID1cbiAgICAgICAgb2xkUGF0aERDb21wID09PSBvbGRQYXRoRENvbXAudG9VcHBlckNhc2UoKSA/IEFCU09MVVRFIDogUkVMQVRJVkU7XG4gICAgICAvLyBsb3dlcmNhc2UgY29tbWFuZHMgYXJlIHJlbGF0aXZlLCB1cHBlcmNhc2UgYXJlIGFic29sdXRlXG4gICAgICBpZHggKz0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdGhlIGNvbXBvbmVudCBpcyBub3QgYSBsZXR0ZXIsIHRoZW4gaXQgaXMgYSBudW1lcmljIHZhbHVlXG4gICAgICB2YXIgdHJhbnNsWCwgdHJhbnNsWTtcbiAgICAgIGlmIChhYnNPclJlbCA9PT0gQUJTT0xVVEUpIHtcbiAgICAgICAgLy8gdGhlIHRyYW5zbGF0aW9uIGlzIHJlcXVpcmVkIGZvciBhYnNvbHV0ZSBjb21tYW5kcy4uLlxuICAgICAgICB0cmFuc2xYID0gcGF0aFRyYW5zbFg7XG4gICAgICAgIHRyYW5zbFkgPSBwYXRoVHJhbnNsWTtcbiAgICAgIH0gZWxzZSBpZiAoYWJzT3JSZWwgPT09IFJFTEFUSVZFKSB7XG4gICAgICAgIC8vIC4uLmJ1dCBub3QgcmVsYXRpdmUgb25lc1xuICAgICAgICB0cmFuc2xYID0gMDtcbiAgICAgICAgdHJhbnNsWSA9IDA7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGNvbW1hbmRQYXJhbXMpIHtcbiAgICAgICAgLy8gZmlndXJlIG91dCB3aGljaCBvZiB0aGUgbnVtZXJpYyB2YWx1ZXMgZm9sbG93aW5nIGFuIHN2ZyBjb21tYW5kXG4gICAgICAgIC8vIGFyZSByZXF1aXJlZCwgYW5kIHRoZW4gdHJhbnNmb3JtIHRoZSBudW1lcmljIHZhbHVlKHMpIGZyb20gdGhlXG4gICAgICAgIC8vIG9yaWdpbmFsIHBhdGggZC1hdHRyaWJ1dGUgYW5kIHBsYWNlIGl0IGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZVxuICAgICAgICAvLyBhcnJheSB0aGF0IHdpbGwgZXZlbnR1YWxseSBiZWNvbWUgdGhlIGQtYXR0cmlidXRlIGZvciB0aGUgbmV3IHBhdGhcbiAgICAgICAgY2FzZSBCT1RIX1hfQU5EX1k6XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgaWR4ICs9IDI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSlVTVF9YOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSlVTVF9ZOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRUxMSVBUSUNBTF9BUkM6XG4gICAgICAgICAgLy8gdGhlIGVsbGlwdGljYWwgYXJjIGhhcyB4IGFuZCB5IHZhbHVlcyBpbiB0aGUgZmlyc3QgYW5kIHNlY29uZCBhcyB3ZWxsIGFzXG4gICAgICAgICAgLy8gdGhlIDZ0aCBhbmQgN3RoIHBvc2l0aW9ucyBmb2xsb3dpbmcgdGhlIGNvbW1hbmQ7IHRoZSBpbnRlcnZlbmluZyB2YWx1ZXNcbiAgICAgICAgICAvLyBhcmUgbm90IGFmZmVjdGVkIGJ5IHRoZSB0cmFuc2Zvcm1hdGlvbiBhbmQgc28gY2FuIHNpbXBseSBiZSBjb3BpZWRcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDFdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDFdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAyXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAyXSk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgM10gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgM10pO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDRdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDRdKTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA1XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA1XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNl0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSA3O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5PTkU6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgXCJudW1lcmljIHZhbHVlIHNob3VsZCBub3QgZm9sbG93IHRoZSBTVkcgWi96IGNvbW1hbmRcIlxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdQYXRoREFyci5qb2luKFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhzdHIpIHtcbiAgLy8gYXNzdW1pbmcgdGhlIHN0cmluZyBmcm9tIHRoZSBkLWF0dHJpYnV0ZSBvZiB0aGUgcGF0aCBoYXMgYWxsIGNvbXBvbmVudHNcbiAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLCB0aGVuIGNyZWF0ZSBhbiBhcnJheSBvZiBjb21wb25lbnRzIGJ5XG4gIC8vIHNpbXBseSBzcGxpdHRpbmcgdGhlIHN0cmluZyBhdCB0aG9zZSBzcGFjZXNcbiAgc3RyID0gc3RhbmRhcmRpemVQYXRoRFN0ckZvcm1hdChzdHIpO1xuICByZXR1cm4gc3RyLnNwbGl0KFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gc3RhbmRhcmRpemVQYXRoRFN0ckZvcm1hdChzdHIpIHtcbiAgLy8gVGhlIFNWRyBzdGFuZGFyZCBpcyBmbGV4aWJsZSB3aXRoIHJlc3BlY3QgdG8gaG93IHBhdGggZC1zdHJpbmdzIGFyZVxuICAvLyBmb3JtYXR0ZWQgYnV0IHRoaXMgbWFrZXMgcGFyc2luZyB0aGVtIG1vcmUgZGlmZmljdWx0LiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXNcbiAgLy8gdGhhdCBhbGwgU1ZHIHBhdGggZC1zdHJpbmcgY29tcG9uZW50cyAoaS5lLiBib3RoIGNvbW1hbmRzIGFuZCB2YWx1ZXMpIGFyZVxuICAvLyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UuXG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvLC9nLCBcIiBcIikgLy8gcmVwbGFjZSBlYWNoIGNvbW1hIHdpdGggYSBzcGFjZVxuICAgIC5yZXBsYWNlKC8tL2csIFwiIC1cIikgLy8gcHJlY2VkZSBlYWNoIG1pbnVzIHNpZ24gd2l0aCBhIHNwYWNlXG4gICAgLnJlcGxhY2UoLyhbQS1aYS16XSkvZywgXCIgJDEgXCIpIC8vIHNhbmR3aWNoIGVhY2ggICBsZXR0ZXIgYmV0d2VlbiAyIHNwYWNlc1xuICAgIC5yZXBsYWNlKC8gIC9nLCBcIiBcIikgLy8gY29sbGFwc2UgcmVwZWF0ZWQgc3BhY2VzIHRvIGEgc2luZ2xlIHNwYWNlXG4gICAgLnJlcGxhY2UoLyAoW0VlXSkgL2csIFwiJDFcIikgLy8gcmVtb3ZlIGZsYW5raW5nIHNwYWNlcyBhcm91bmQgZXhwb25lbnQgc3ltYm9sc1xuICAgIC5yZXBsYWNlKC9eIC9nLCBcIlwiKSAvLyB0cmltIGFueSBsZWFkaW5nIHNwYWNlXG4gICAgLnJlcGxhY2UoLyAkL2csIFwiXCIpOyAvLyB0cmltIGFueSB0YWlsaW5nIHNwYWNlXG59XG4qL1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZVxuX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2NvZGUudHNcIik7XG4vLyBUaGlzIGVudHJ5IG1vZHVsZSB1c2VkICdleHBvcnRzJyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG4iXSwic291cmNlUm9vdCI6IiJ9