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
        group.setPluginData("annotationSpec", "{}");
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
    else if (msg.type === "fetch") {
        // uses a fetch by id
        // find current selection
        //@ts-ignore    //
        // grab annnotations layer,
        // grab plugin data for the width/height padding
        //const newSelection = [figma.flatten(figma.currentPage.selection)];
        const newSelection = figma.currentPage.selection;
        const marksToAdd = [];
        for (const sceneNode of newSelection) {
            const nodeIterator = walkTree(sceneNode);
            let nodeStep = nodeIterator.next();
            while (!nodeStep.done) {
                // skip node types
                if (nodeStep.value.type === "FRAME" || nodeStep.value.type === "GROUP") {
                    nodeStep = nodeIterator.next();
                    continue;
                }
                const node = nodeStep.value.clone();
                console.log("node value", node);
                // if nodeType is group
                const vectorizedNodes = vectorize(node);
                vectorizedNodes.map((vectorizedNode) => {
                    figma.ui.postMessage({
                        data: vectorizedNode.vectorPaths,
                        viewNodeId: nodeStep.value.nodeId,
                        nodeId: vectorizedNode.id,
                        type: "modifyPath",
                        outlinedStroke: vectorizedNodes.length > 1,
                    });
                });
                nodeStep = nodeIterator.next();
            }
        }
    }
    else if (msg.type === "sendScaled") {
        console.log("in scaledSend!", msg.object);
        const viewNode = figma.getNodeById(msg.viewNodeId);
        if (viewNode) {
            const visaulizationPaddingWidth = Number(viewNode.getPluginData("vegaPaddingWidth"));
            const visaulizationPaddingHeight = Number(viewNode.getPluginData("vegaPaddingHeight"));
            const vectorizedNode = figma.getNodeById(msg.nodeId);
            // lines and vector
            if (vectorizedNode.type !== "VECTOR") {
                return;
            }
            const { width, height, tX, tY, scale } = calculatePlacement(vectorizedNode, visaulizationPaddingWidth, visaulizationPaddingHeight);
            const strokeSpecs = calculateStrokeSpecs(vectorizedNode);
            const fillSpecs = calculateFillSpecs(vectorizedNode);
            const miscSpecs = calculateMiscSpecs(vectorizedNode);
            const propertySpecs = [].concat(strokeSpecs, fillSpecs, miscSpecs);
            const translatedSpecs = `{
        "type": "symbol",
        "interactive": false,
        "encode": {
          "enter": {
            "shape": {"value": "${msg.object}"},
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
            vectorizedNode.remove();
            figma.ui.postMessage({ specString: translatedSpecs, type: "finishedMarks" });
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
        "viewName",
        "visualizationSpec",
        "annotationSpec",
        "vegaPaddingWidth",
        "vegaPaddingHeight",
        "annotationNodeId",
        "visualizationNodeId"
    ];
    const extractedData = { nodeId: node.id };
    for (const property of propertiesToExtract) {
        const data = node.getPluginData(property);
        console.log('property', property, 'data', data);
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
    return attributes;
}
function calculateFillSpecs(node) {
    const attributes = [];
    if (node.fills) {
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
    if (outlinedNode && shouldNodeBeOutlineStrokes(vectorNode)) {
        nodesToReturn.push(outlinedNode);
        console.log("outlined", outlinedNode);
        console.log("outline path", outlinedNode.vectorPaths[0].data, outlinedNode.vectorPaths[0].windingRule);
        // hide the strokes!
        vectorNode.strokes = [];
    }
    console.log("after", vectorNode.vectorPaths);
    console.log(vectorNode);
    nodesToReturn.push(vectorNode);
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
figma.ui.resize(600, 500);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92ZWdhLWZpLy4vc3JjL2NvZGUudHMiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly92ZWdhLWZpL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxVQUFVLHFCQUFxQjtBQUMvQixVQUFVLGlCQUFpQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFdBQVc7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxXQUFXO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxTQUFTO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsU0FBUztBQUNuRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBaUQ7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwrQkFBK0I7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCLFlBQVksV0FBVyxFQUFFO0FBQy9DLG9CQUFvQixVQUFVLE9BQU87QUFDckMsY0FBYztBQUNkLFdBQVc7QUFDWDtBQUNBLHFCQUFxQixVQUFVLE9BQU87QUFDdEMsc0JBQXNCLFVBQVUsUUFBUTtBQUN4QyxrQkFBa0IsV0FBVyxJQUFJO0FBQ2pDLGtCQUFrQixXQUFXO0FBQzdCO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSxrQ0FBa0MscURBQXFEO0FBQ3ZGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLDZDQUE2QztBQUMzRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLFdBQVcsY0FBYztBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsWUFBWSwyQ0FBMkMsRUFBRTtBQUMzRjtBQUNBLDZDQUE2QyxXQUFXLHVCQUF1QjtBQUMvRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQyxZQUFZLDJDQUEyQyxFQUFFO0FBQzdGO0FBQ0EsK0NBQStDLFdBQVcseUJBQXlCO0FBQ25GO0FBQ0E7QUFDQSwyQ0FBMkMsaUJBQWlCO0FBQzVEO0FBQ0E7QUFDQSw2Q0FBNkMsV0FBVyxtQkFBbUI7QUFDM0U7QUFDQTtBQUNBLDRDQUE0QyxXQUFXLGtCQUFrQjtBQUN6RTtBQUNBO0FBQ0Esa0RBQWtELFdBQVcsdUJBQXVCO0FBQ3BGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4Qyw2QkFBNkI7QUFDM0UsK0NBQStDLDZCQUE2QjtBQUM1RTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLGNBQWM7QUFDakM7QUFDQSx1QkFBdUIsY0FBYztBQUNyQztBQUNBLDJCQUEyQixjQUFjO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0Q7O0FBRWhEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMEJBQTBCO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQiwyQkFBMkI7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkM7QUFDN0M7QUFDQTtBQUNBLDJDQUEyQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEM7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUVBQXVFO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZGQUE2RjtBQUM3RjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsd0NBQXdDLFlBQVksSUFBSSxZQUFZLFdBQVcsTUFBTTs7QUFFckY7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EsZUFBZSxxQkFBcUIsVUFBVSxxQkFBcUI7QUFDbkU7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCLHlCQUF5Qjs7QUFFekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQ7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTs7Ozs7OztVQ3gzQkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDckJBO1dBQ0E7V0FDQTtXQUNBLHNEQUFzRCxrQkFBa0I7V0FDeEU7V0FDQSwrQ0FBK0MsY0FBYztXQUM3RCxFOzs7O1VDTkE7VUFDQTtVQUNBO1VBQ0EiLCJmaWxlIjoiY29kZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vaW1wb3J0IHtjcmVhdGVOb3JtYWxpemVkUGF0aH0gZnJvbSBcIi4vaGVscGVyRnVuY3Rpb25zXCI7XG4vL2ltcG9ydCB7U1ZHcGF0aCwgU1ZHc2Vnc30gZnJvbSAnLi9TVkdQYXRocy5qcyc7XG4vLyBUaGlzIHBsdWdpbiB3aWxsIG9wZW4gYSB3aW5kb3cgdG8gcHJvbXB0IHRoZSB1c2VyIHRvIGVudGVyIGEgbnVtYmVyLCBhbmRcbi8vIGl0IHdpbGwgdGhlbiBjcmVhdGUgdGhhdCBtYW55IHJlY3RhbmdsZXMgb24gdGhlIHNjcmVlbi5cbi8vIFRoaXMgZmlsZSBob2xkcyB0aGUgbWFpbiBjb2RlIGZvciB0aGUgcGx1Z2lucy4gSXQgaGFzIGFjY2VzcyB0byB0aGUgKmRvY3VtZW50Ki5cbi8vIFlvdSBjYW4gYWNjZXNzIGJyb3dzZXIgQVBJcyBpbiB0aGUgPHNjcmlwdD4gdGFnIGluc2lkZSBcInVpLmh0bWxcIiB3aGljaCBoYXMgYVxuLy8gZnVsbCBicm93c2VyIGVudmlyb25tZW50IChzZWUgZG9jdW1lbnRhdGlvbikuXG4vLyBUaGlzIHNob3dzIHRoZSBIVE1MIHBhZ2UgaW4gXCJ1aS5odG1sdmlld3NEYXRhXCIuXG5maWdtYS5zaG93VUkoX19odG1sX18pO1xuY29uc3QgUEFERElOR19XSURUSF9SRUdFWCA9IC8oPzw9dHJhbnNsYXRlXFwoKVxcZCsvO1xuY29uc3QgUEFERElOR19IRUlHSFRfUkVHRVggPSAvKD88PXRyYW5zbGF0ZVxcKFxcZCssKVxcZCsvO1xuY29uc3QgU1ZHX1dJRFRIX1JFR0VYID0gLyg/PD13aWR0aD1cIilcXGQrLztcbmNvbnN0IFNWR19IRUlHSFRfUkVHRVggPSAvKD88PWhlaWdodD1cIilcXGQrLztcbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0byBzZWFyY2ggdGhyb3VnaCBhbGwgdG9wIGxldmVsIG5vZGVzIG9mIGVhY2ggcGFnZSBpbiBhIGZpZ21hIGRvY3VtZW50XG4gKiByZXR1cm5zIGEgbGlzdCBvZiBtYXRjaGluZyBmaWdtYSBub2Rlc1xuICogQHBhcmFtIGN1cnJlbnRQYWdlXG4gKiBAcGFyYW0gc2VhcmNoRnVuY3Rpb24gcHJlZGljYXRlIHJ1biBvbiBlYWNoIGNoaWxkIG5vZGUgb2YgdGhlIHBhZ2VcbiAqL1xuZnVuY3Rpb24gc2VhcmNoVG9wTGV2ZWwocm9vdCwgc2VhcmNoUHJlZGljYXRlKSB7XG4gICAgY29uc3Qgc2VhcmNoUmVzdWx0cyA9IFtdO1xuICAgIGNvbnN0IG5vZGVJdGVyYXRvciA9IHdhbGtUcmVlVG9EZXB0aChyb290LCAwLCAzKTtcbiAgICBsZXQgbm9kZVN0ZXAgPSBub2RlSXRlcmF0b3IubmV4dCgpO1xuICAgIHdoaWxlICghbm9kZVN0ZXAuZG9uZSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZVN0ZXAudmFsdWU7XG4gICAgICAgIGlmIChzZWFyY2hQcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgICAgIHNlYXJjaFJlc3VsdHMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgfVxuICAgIC8vIGl0ZXJhdGUgdGhyb3VnaCBhbGwgY2hpbGQgbm9kZXMgb2YgY3VycmVudCBwYWdlXG4gICAgcmV0dXJuIHNlYXJjaFJlc3VsdHM7XG59XG5mdW5jdGlvbiogd2Fsa1RyZWVUb0RlcHRoKG5vZGUsIGN1cnJlbnREZXB0aCA9IDEsIG1heERlcHRoID0gMikge1xuICAgIHlpZWxkIG5vZGU7XG4gICAgY29uc3QgeyBjaGlsZHJlbiB9ID0gbm9kZTtcbiAgICBpZiAoY2hpbGRyZW4gJiYgY3VycmVudERlcHRoIDw9IG1heERlcHRoKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHlpZWxkKiB3YWxrVHJlZVRvRGVwdGgoY2hpbGQsIGN1cnJlbnREZXB0aCArIDEsIG1heERlcHRoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGNsb25lKHZhbCkge1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsO1xuICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZSA9PT0gXCJudW1iZXJcIiB8fCB0eXBlID09PSBcInN0cmluZ1wiIHx8IHR5cGUgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsLm1hcCgoeCkgPT4gY2xvbmUoeCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh2YWwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IG8gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHZhbCkge1xuICAgICAgICAgICAgICAgIG9ba2V5XSA9IGNsb25lKHZhbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRocm93IFwidW5rbm93blwiO1xufVxuZnVuY3Rpb24qIHdhbGtUcmVlKG5vZGUpIHtcbiAgICB5aWVsZCBub2RlO1xuICAgIGNvbnN0IHsgY2hpbGRyZW4gfSA9IG5vZGU7XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHlpZWxkKiB3YWxrVHJlZShjaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyBDYWxscyB0byBcInBhcmVudC5wb3N0TWVzc2FnZVwiIGZyb20gd2l0aGluIHRoZSBIVE1MIHBhZ2Ugd2lsbCB0cmlnZ2VyIHRoaXNcbi8vIGNhbGxiYWNrLiBUaGUgY2FsbGJhY2sgd2lsbCBiZSBwYXNzZWQgdGhlIFwicGx1Z2luTWVzc2FnZVwiIHByb3BlcnR5IG9mIHRoZVxuLy8gcG9zdGVkIG1lc3NhZ2UuXG5maWdtYS51aS5vbm1lc3NhZ2UgPSAobXNnKSA9PiB7XG4gICAgLy8gT25lIHdheSBvZiBkaXN0aW5ndWlzaGluZyBiZXR3ZWVuIGRpZmZlcmVudCB0eXBlcyBvZiBtZXNzYWdlcyBzZW50IGZyb21cbiAgICAvLyB5b3VyIEhUTUwgcGFnZSBpcyB0byB1c2UgYW4gb2JqZWN0IHdpdGggYSBcInR5cGVcIiBwcm9wZXJ0eSBsaWtlIHRoaXMuXG4gICAgZmlnbWEucm9vdC5jaGlsZHJlbjtcbiAgICBpZiAobXNnLnR5cGUgPT09IFwiY3JlYXRlXCIpIHtcbiAgICAgICAgLy8gVE9ETzogY2FzdCBhcyBhIGNyZWF0ZSBtc2cgdHlwZVxuICAgICAgICBjb25zdCBub2RlcyA9IFtdO1xuICAgICAgICBjb25zdCBzdmdTdHJpbmcgPSBtc2cuc3ZnVG9SZW5kZXI7XG4gICAgICAgIGNvbnN0IGlkID0gbXNnLnZpZXdJZDtcbiAgICAgICAgY29uc3Qgdmlld05hbWUgPSBtc2cubmFtZTtcbiAgICAgICAgY29uc29sZS5sb2cobXNnKTtcbiAgICAgICAgY29uc3QgdmlzdWFsaXphdGlvbiA9IGZpZ21hLmNyZWF0ZU5vZGVGcm9tU3ZnKHN2Z1N0cmluZyk7XG4gICAgICAgIHZpc3VhbGl6YXRpb24ubmFtZSA9IGBWaXN1YWxpemF0aW9uIExheWVyIC0gJHt2aWV3TmFtZX1gO1xuICAgICAgICB2aXN1YWxpemF0aW9uLmxvY2tlZCA9IHRydWU7XG4gICAgICAgIC8vIHBsYWNlIGFubm90YXRpb25zIGxheWVyIG9uIHRvcCBhbmQgbWFrZSB0cmFuc3BhcmVudFxuICAgICAgICBjb25zdCBuZXdBbm5vdGF0aW9uc0xheWVyID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgY29uc3QgcGFkZGluZ1dpZHRoTWF0Y2hlcyA9IHN2Z1N0cmluZy5tYXRjaChQQURESU5HX1dJRFRIX1JFR0VYKTtcbiAgICAgICAgY29uc3QgcGFkZGluZ0hlaWdodE1hdGNoZXMgPSBzdmdTdHJpbmcubWF0Y2goUEFERElOR19IRUlHSFRfUkVHRVgpO1xuICAgICAgICBpZiAocGFkZGluZ1dpZHRoTWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGhTdHJpbmcgPSBwYWRkaW5nV2lkdGhNYXRjaGVzWzBdO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdXaWR0aFwiLCB3aWR0aFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhZGRpbmdIZWlnaHRNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHRTdHJpbmcgPSBwYWRkaW5nSGVpZ2h0TWF0Y2hlc1swXTtcbiAgICAgICAgICAgIG5ld0Fubm90YXRpb25zTGF5ZXIuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nSGVpZ2h0XCIsIGhlaWdodFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsbHMgPSBjbG9uZShuZXdBbm5vdGF0aW9uc0xheWVyLmZpbGxzKTtcbiAgICAgICAgZmlsbHNbMF0ub3BhY2l0eSA9IDA7XG4gICAgICAgIG5ld0Fubm90YXRpb25zTGF5ZXIuZmlsbHMgPSBmaWxscztcbiAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5jbGlwc0NvbnRlbnQgPSBmYWxzZTtcbiAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5uYW1lID0gYEFubm90YXRpb25zIExheWVyIC0gJHt2aWV3TmFtZX1gO1xuICAgICAgICAvLyBncmFiIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgLy8gc2V0IGFubm90YXRpb25zIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgY29uc3Qgd2lkdGhNYXRjaGVzID0gc3ZnU3RyaW5nLm1hdGNoKFNWR19XSURUSF9SRUdFWCk7XG4gICAgICAgIGNvbnN0IGhlaWdodE1hdGNoZXMgPSBzdmdTdHJpbmcubWF0Y2goU1ZHX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmICh3aWR0aE1hdGNoZXMgJiYgaGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBOdW1iZXIod2lkdGhNYXRjaGVzWzBdKTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IE51bWJlcihoZWlnaHRNYXRjaGVzWzBdKTtcbiAgICAgICAgICAgIG5ld0Fubm90YXRpb25zTGF5ZXIucmVzaXplKHdpZHRoID4gMCA/IHdpZHRoIDogMTAwLCBoZWlnaHQgPiAwID8gaGVpZ2h0IDogMTAwKTtcbiAgICAgICAgfVxuICAgICAgICAvL1xuICAgICAgICBjb25zdCBncm91cCA9IGZpZ21hLmdyb3VwKFtuZXdBbm5vdGF0aW9uc0xheWVyLCB2aXN1YWxpemF0aW9uXSwgZmlnbWEuY3VycmVudFBhZ2UpO1xuICAgICAgICBncm91cC5uYW1lID0gdmlld05hbWU7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aWV3TmFtZVwiLCB2aWV3TmFtZSk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aWV3SWRcIiwgbXNnLnZpZXdJZCk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ0eXBlXCIsIFwidmVnYVZpZXdcIik7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJhbm5vdGF0aW9uU3BlY1wiLCBcInt9XCIpO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwiYW5ub3RhdGlvbk5vZGVJZFwiLCBuZXdBbm5vdGF0aW9uc0xheWVyLmlkKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZpc3VhbGl6YXRpb25TcGVjXCIsIG1zZy52ZWdhU3BlYyk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2aXN1YWxpemF0aW9uTm9kZUlkXCIsIHZpc3VhbGl6YXRpb24uaWQpO1xuICAgICAgICBpZiAocGFkZGluZ1dpZHRoTWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGhTdHJpbmcgPSBwYWRkaW5nV2lkdGhNYXRjaGVzWzBdO1xuICAgICAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIiwgd2lkdGhTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkaW5nSGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0U3RyaW5nID0gcGFkZGluZ0hlaWdodE1hdGNoZXNbMF07XG4gICAgICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB2aWV3SWQ6IG1zZy52aWV3SWQsXG4gICAgICAgICAgICB2aWV3Tm9kZUlkOiBncm91cC5pZCxcbiAgICAgICAgICAgIHZpc3VhbGl6YXRpb25Ob2RlSWQ6IHZpc3VhbGl6YXRpb24uaWQsXG4gICAgICAgICAgICBhbm5vdGF0aW9uTm9kZUlkOiBuZXdBbm5vdGF0aW9uc0xheWVyLmlkLFxuICAgICAgICAgICAgdHlwZTogXCJmaW5pc2hlZENyZWF0ZVwiLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAobXNnLnR5cGUgPT09IFwiZmV0Y2hcIikge1xuICAgICAgICAvLyB1c2VzIGEgZmV0Y2ggYnkgaWRcbiAgICAgICAgLy8gZmluZCBjdXJyZW50IHNlbGVjdGlvblxuICAgICAgICAvL0B0cy1pZ25vcmUgICAgLy9cbiAgICAgICAgLy8gZ3JhYiBhbm5ub3RhdGlvbnMgbGF5ZXIsXG4gICAgICAgIC8vIGdyYWIgcGx1Z2luIGRhdGEgZm9yIHRoZSB3aWR0aC9oZWlnaHQgcGFkZGluZ1xuICAgICAgICAvL2NvbnN0IG5ld1NlbGVjdGlvbiA9IFtmaWdtYS5mbGF0dGVuKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbildO1xuICAgICAgICBjb25zdCBuZXdTZWxlY3Rpb24gPSBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb247XG4gICAgICAgIGNvbnN0IG1hcmtzVG9BZGQgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBzY2VuZU5vZGUgb2YgbmV3U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSXRlcmF0b3IgPSB3YWxrVHJlZShzY2VuZU5vZGUpO1xuICAgICAgICAgICAgbGV0IG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgIHdoaWxlICghbm9kZVN0ZXAuZG9uZSkge1xuICAgICAgICAgICAgICAgIC8vIHNraXAgbm9kZSB0eXBlc1xuICAgICAgICAgICAgICAgIGlmIChub2RlU3RlcC52YWx1ZS50eXBlID09PSBcIkZSQU1FXCIgfHwgbm9kZVN0ZXAudmFsdWUudHlwZSA9PT0gXCJHUk9VUFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2RlU3RlcC52YWx1ZS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibm9kZSB2YWx1ZVwiLCBub2RlKTtcbiAgICAgICAgICAgICAgICAvLyBpZiBub2RlVHlwZSBpcyBncm91cFxuICAgICAgICAgICAgICAgIGNvbnN0IHZlY3Rvcml6ZWROb2RlcyA9IHZlY3Rvcml6ZShub2RlKTtcbiAgICAgICAgICAgICAgICB2ZWN0b3JpemVkTm9kZXMubWFwKCh2ZWN0b3JpemVkTm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB2ZWN0b3JpemVkTm9kZS52ZWN0b3JQYXRocyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdOb2RlSWQ6IG5vZGVTdGVwLnZhbHVlLm5vZGVJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJZDogdmVjdG9yaXplZE5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm1vZGlmeVBhdGhcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmVkU3Ryb2tlOiB2ZWN0b3JpemVkTm9kZXMubGVuZ3RoID4gMSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbm9kZVN0ZXAgPSBub2RlSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG1zZy50eXBlID09PSBcInNlbmRTY2FsZWRcIikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImluIHNjYWxlZFNlbmQhXCIsIG1zZy5vYmplY3QpO1xuICAgICAgICBjb25zdCB2aWV3Tm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKG1zZy52aWV3Tm9kZUlkKTtcbiAgICAgICAgaWYgKHZpZXdOb2RlKSB7XG4gICAgICAgICAgICBjb25zdCB2aXNhdWxpemF0aW9uUGFkZGluZ1dpZHRoID0gTnVtYmVyKHZpZXdOb2RlLmdldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ1dpZHRoXCIpKTtcbiAgICAgICAgICAgIGNvbnN0IHZpc2F1bGl6YXRpb25QYWRkaW5nSGVpZ2h0ID0gTnVtYmVyKHZpZXdOb2RlLmdldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ0hlaWdodFwiKSk7XG4gICAgICAgICAgICBjb25zdCB2ZWN0b3JpemVkTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKG1zZy5ub2RlSWQpO1xuICAgICAgICAgICAgLy8gbGluZXMgYW5kIHZlY3RvclxuICAgICAgICAgICAgaWYgKHZlY3Rvcml6ZWROb2RlLnR5cGUgIT09IFwiVkVDVE9SXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQsIHRYLCB0WSwgc2NhbGUgfSA9IGNhbGN1bGF0ZVBsYWNlbWVudCh2ZWN0b3JpemVkTm9kZSwgdmlzYXVsaXphdGlvblBhZGRpbmdXaWR0aCwgdmlzYXVsaXphdGlvblBhZGRpbmdIZWlnaHQpO1xuICAgICAgICAgICAgY29uc3Qgc3Ryb2tlU3BlY3MgPSBjYWxjdWxhdGVTdHJva2VTcGVjcyh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgICAgICBjb25zdCBmaWxsU3BlY3MgPSBjYWxjdWxhdGVGaWxsU3BlY3ModmVjdG9yaXplZE5vZGUpO1xuICAgICAgICAgICAgY29uc3QgbWlzY1NwZWNzID0gY2FsY3VsYXRlTWlzY1NwZWNzKHZlY3Rvcml6ZWROb2RlKTtcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5U3BlY3MgPSBbXS5jb25jYXQoc3Ryb2tlU3BlY3MsIGZpbGxTcGVjcywgbWlzY1NwZWNzKTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZWRTcGVjcyA9IGB7XG4gICAgICAgIFwidHlwZVwiOiBcInN5bWJvbFwiLFxuICAgICAgICBcImludGVyYWN0aXZlXCI6IGZhbHNlLFxuICAgICAgICBcImVuY29kZVwiOiB7XG4gICAgICAgICAgXCJlbnRlclwiOiB7XG4gICAgICAgICAgICBcInNoYXBlXCI6IHtcInZhbHVlXCI6IFwiJHttc2cub2JqZWN0fVwifSxcbiAgICAgICAgICAgIFwic2l6ZVwiOntcInZhbHVlXCI6JHtzY2FsZX19LFxuICAgICAgICAgICAgJHtwcm9wZXJ0eVNwZWNzLmpvaW4oXCIsXCIpfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgXCJ3aWR0aFwiOntcInZhbHVlXCI6JHt3aWR0aH19LFxuICAgICAgICAgICAgXCJoZWlnaHRcIjp7XCJ2YWx1ZVwiOiR7aGVpZ2h0fX0sXG4gICAgICAgICAgICBcInhcIjoge1widmFsdWVcIjogJHt0WH19LFxuICAgICAgICAgICAgXCJ5XCI6IHtcInZhbHVlXCI6ICR7dFl9fVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgIH1gO1xuICAgICAgICAgICAgdmVjdG9yaXplZE5vZGUucmVtb3ZlKCk7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHNwZWNTdHJpbmc6IHRyYW5zbGF0ZWRTcGVjcywgdHlwZTogXCJmaW5pc2hlZE1hcmtzXCIgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAobXNnLnR5cGUgPT09IFwic3RhcnRVcFwiKSB7XG4gICAgICAgIC8vIHNjYW4gdGhyb3VnaCBkb2N1bWVudCB0byBmaW5kIGFsbCBub2RlcyB3aXRoIHBsdWdpbiBkYXRhIHR5cGUgbWF0Y2hpbmcgdmVnYSB2aWV3XG4gICAgICAgIGNvbnN0IGN1cnJlbnRWaWV3cyA9IHNlYXJjaFRvcExldmVsKGZpZ21hLnJvb3QsIChub2RlKSA9PiBub2RlLmdldFBsdWdpbkRhdGEoXCJ0eXBlXCIpID09PSBcInZlZ2FWaWV3XCIpO1xuICAgICAgICBjb25zdCB2aWV3c0RhdGEgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCB2aWV3IG9mIGN1cnJlbnRWaWV3cykge1xuICAgICAgICAgICAgY29uc3Qgdmlld0RhdGEgPSBleHRyYWN0VmVnYVZpZXdEYXRhKHZpZXcpO1xuICAgICAgICAgICAgdmlld3NEYXRhLnB1c2godmlld0RhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdmlld3NEYXRhOiB2aWV3c0RhdGEsIHR5cGU6IFwic3RhcnRVcFZpZXdzXCIgfSk7XG4gICAgfVxuICAgIC8vIE1ha2Ugc3VyZSB0byBjbG9zZSB0aGUgcGx1Z2luIHdoZW4geW91J3JlIGRvbmUuIE90aGVyd2lzZSB0aGUgcGx1Z2luIHdpbGxcbiAgICAvLyBrZWVwIHJ1bm5pbmcsIHdoaWNoIHNob3dzIHRoZSBjYW5jZWwgYnV0dG9uIGF0IHRoZSBib3R0b20gb2YgdGhlIHNjcmVlbi5cbiAgICAvL2ZpZ21hLmNsb3NlUGx1Z2luKCk7XG59O1xuZnVuY3Rpb24gZXh0cmFjdFZlZ2FWaWV3RGF0YShub2RlKSB7XG4gICAgY29uc3QgcHJvcGVydGllc1RvRXh0cmFjdCA9IFtcbiAgICAgICAgXCJ2aWV3SWRcIixcbiAgICAgICAgXCJ2aWV3TmFtZVwiLFxuICAgICAgICBcInZpc3VhbGl6YXRpb25TcGVjXCIsXG4gICAgICAgIFwiYW5ub3RhdGlvblNwZWNcIixcbiAgICAgICAgXCJ2ZWdhUGFkZGluZ1dpZHRoXCIsXG4gICAgICAgIFwidmVnYVBhZGRpbmdIZWlnaHRcIixcbiAgICAgICAgXCJhbm5vdGF0aW9uTm9kZUlkXCIsXG4gICAgICAgIFwidmlzdWFsaXphdGlvbk5vZGVJZFwiXG4gICAgXTtcbiAgICBjb25zdCBleHRyYWN0ZWREYXRhID0geyBub2RlSWQ6IG5vZGUuaWQgfTtcbiAgICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIHByb3BlcnRpZXNUb0V4dHJhY3QpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IG5vZGUuZ2V0UGx1Z2luRGF0YShwcm9wZXJ0eSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdwcm9wZXJ0eScsIHByb3BlcnR5LCAnZGF0YScsIGRhdGEpO1xuICAgICAgICBleHRyYWN0ZWREYXRhW3Byb3BlcnR5XSA9IGRhdGE7XG4gICAgfVxuICAgIHJldHVybiBleHRyYWN0ZWREYXRhO1xufVxuZnVuY3Rpb24gaXNOb3ROb25lKHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIHByb3BlcnR5ICE9PSBcIk5PTkVcIjtcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZU1pc2NTcGVjcyhub2RlKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtdO1xuICAgIGlmIChub2RlLm9wYWNpdHkpIHtcbiAgICAgICAgLy9AdHMtaWdub3JlIHdyb25nIHR5cGluZ3MgP1xuICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwib3BhY2l0eVwiOiB7XCJ2YWx1ZVwiOiAke25vZGUub3BhY2l0eX19YCk7XG4gICAgfVxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlRmlsbFNwZWNzKG5vZGUpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gW107XG4gICAgaWYgKG5vZGUuZmlsbHMpIHtcbiAgICAgICAgLy9AdHMtaWdub3JlIHdyb25nIHR5cGluZ3MgP1xuICAgICAgICBjb25zdCBjb2xvciA9IG5vZGUuZmlsbHNbMF0uY29sb3I7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY29sb3JzXCIsIGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIsIHJnYlBlcmNlbnRUb0hleChjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKSk7XG4gICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJmaWxsXCI6IHtcInZhbHVlXCI6IFwiJHtyZ2JQZXJjZW50VG9IZXgoY29sb3IuciwgY29sb3IuZywgY29sb3IuYil9XCJ9YCk7XG4gICAgICAgIGlmIChub2RlLmZpbGxzWzBdLm9wYWNpdHkpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJmaWxsT3BhY2l0eVwiOiB7XCJ2YWx1ZVwiOiAke25vZGUuZmlsbHNbMF0ub3BhY2l0eX19YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVTdHJva2VTcGVjcyhub2RlKSB7XG4gICAgY29uc29sZS5sb2coXCJpbiBjYWxjIHNwZWNcIiwgbm9kZSk7XG4gICAgY29uc3QgbmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhub2RlKTtcbiAgICBjb25zb2xlLmxvZyhcImluIGNhbGMgc3BlYyBuYW1lc1wiLCBuYW1lcyk7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtdO1xuICAgIGlmIChub2RlLnN0cm9rZXMgJiYgbm9kZS5zdHJva2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy9AdHMtaWdub3JlIHdyb25nIHR5cGluZ3MgP1xuICAgICAgICBjb25zdCBjb2xvciA9IG5vZGUuc3Ryb2tlc1swXS5jb2xvcjtcbiAgICAgICAgY29uc29sZS5sb2coXCJjb2xvcnNcIiwgY29sb3IuciwgY29sb3IuZywgY29sb3IuYiwgcmdiUGVyY2VudFRvSGV4KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpKTtcbiAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZVwiOiB7XCJ2YWx1ZVwiOiBcIiR7cmdiUGVyY2VudFRvSGV4KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpfVwifWApO1xuICAgICAgICBpZiAobm9kZS5zdHJva2VzWzBdLm9wYWNpdHkpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VPcGFjaXR5XCI6IHtcInZhbHVlXCI6ICR7bm9kZS5zdHJva2VzWzBdLm9wYWNpdHl9fWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnN0cm9rZUNhcCA9PT0gXCJST1VORFwiIHx8IG5vZGUuc3Ryb2tlQ2FwID09PSBcIlNRVUFSRVwiKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwic3Ryb2tlQ2FwXCI6IHtcInZhbHVlXCI6IFwicm91bmRcIn1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zdHJva2VXZWlnaHQpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VXaWR0aFwiOiB7XCJ2YWx1ZVwiOiAke25vZGUuc3Ryb2tlV2VpZ2h0fX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5kYXNoUGF0dGVybiAmJiBub2RlLmRhc2hQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VEYXNoXCI6IHtcInZhbHVlXCI6ICR7bm9kZS5kYXNoUGF0dGVybn19YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc3Ryb2tlTWl0ZXJMaW1pdCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZU1pdGVyTGltaXRcIjoge1widmFsdWVcIjogJHtub2RlLnN0cm9rZU1pdGVyTGltaXR9fWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJldHVybiBhbGwgc3Ryb2tlIHByb3BlcnRpZXMgYXMgc3RyaW5nXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59XG5mdW5jdGlvbiBjb21wb25lbnRUb0hleChjKSB7XG4gICAgdmFyIGhleCA9IGMudG9TdHJpbmcoMTYpO1xuICAgIHJldHVybiBoZXgubGVuZ3RoID09IDEgPyBcIjBcIiArIGhleCA6IGhleDtcbn1cbmZ1bmN0aW9uIHJnYlBlcmNlbnRUb0hleChyLCBnLCBiKSB7XG4gICAgcmV0dXJuIChcIiNcIiArXG4gICAgICAgIGNvbXBvbmVudFRvSGV4KE1hdGgucm91bmQociAqIDI1NSkpICtcbiAgICAgICAgY29tcG9uZW50VG9IZXgoTWF0aC5yb3VuZCgyNTUgKiBnKSkgK1xuICAgICAgICBjb21wb25lbnRUb0hleChNYXRoLnJvdW5kKDI1NSAqIGIpKSk7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVQbGFjZW1lbnQobm9kZSwgcGFkZGluZ1gsIHBhZGRpbmdZKSB7XG4gICAgY29uc3Qgd2lkdGggPSBub2RlLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgIGNvbnN0IHggPSBub2RlLng7XG4gICAgY29uc3QgeSA9IG5vZGUueTtcbiAgICBjb25zdCBtYXhEaW1lbnNpb24gPSBNYXRoLm1heCh3aWR0aCwgaGVpZ2h0KTtcbiAgICBjb25zdCB0WCA9ICgxIC8gMikgKiB3aWR0aCArIHggLSBwYWRkaW5nWDsgLy8rIChtYXhEaW1lbnNpb24taGVpZ2h0KS8yOyAvLyB0b3RhbCB0cmFuc2xhdGVcbiAgICBjb25zdCB0WSA9ICgxIC8gMikgKiBoZWlnaHQgKyB5IC0gcGFkZGluZ1k7IC8vKyAobWF4RGltZW5zaW9uLWhlaWdodCkvMjsgLy8gdG90YWwgdHJhbnNsYXRlXG4gICAgY29uc3Qgc2NhbGUgPSBtYXhEaW1lbnNpb24gKiBtYXhEaW1lbnNpb247XG4gICAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodCwgdFgsIHRZLCBzY2FsZSB9O1xufVxuZnVuY3Rpb24gc2hvdWxkTm9kZUJlT3V0bGluZVN0cm9rZXMobm9kZSkge1xuICAgIGNvbnNvbGUubG9nKFwiaW4gb3V0bGluZVwiLCBub2RlKTtcbiAgICAvLyBpZiB0aGUgaXRlbSBoYXMgYW4gYXJyb3cgZW5kLCBvdXRsaW5lIHN0cm9rZSBiZWNhdXNlIGFycm93IHN0cm9rZSBjYXAgY2Fubm90IGJlIGFwcGxpZWQgOihcbiAgICBpZiAobm9kZS50eXBlID09PSBcIlZFQ1RPUlwiICYmXG4gICAgICAgIFwic3Ryb2tlQ2FwXCIgaW4gbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzW25vZGUudmVjdG9yTmV0d29yay52ZXJ0aWNlcy5sZW5ndGggLSAxXSAmJlxuICAgICAgICBub2RlLnZlY3Rvck5ldHdvcmsudmVydGljZXNbbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzLmxlbmd0aCAtIDFdLnN0cm9rZUNhcCAhPT0gXCJOT05FXCIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKFwic3Ryb2tlQWxpZ25cIiBpbiBub2RlICYmIG5vZGUuc3Ryb2tlQWxpZ24gIT09IFwiQ0VOVEVSXCIpIHtcbiAgICAgICAgLy9ub2RlLnN0cm9rZUFsaWduID0gXCJDRU5URVJcIjtcbiAgICAgICAgLy8gYXMgdmVnYSBkb2Vzbid0IHN1cHBvcnQgaW5zaWRlIG9yIGNlbnRlciwgb3V0bGluZSBzdHJva2VcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHZlY3Rvcml6ZShub2RlKSB7XG4gICAgY29uc3Qgbm9kZXNUb1JldHVybiA9IFtdO1xuICAgIC8vIGlmIG5vZGUgaXMgdGV4dCwgY29tYmluZSBhbGwgdmVjdG9yIHBhdGhzXG4gICAgbGV0IHZlY3Rvck5vZGUgPSBmaWdtYS5mbGF0dGVuKFtub2RlXSk7XG4gICAgLy8gbGluZXMgYW5kIHZlY3RvciBwYXRocyB3aXRoIHN0cm9rZXNcbiAgICBjb25zdCBvdXRsaW5lZE5vZGUgPSB2ZWN0b3JOb2RlLm91dGxpbmVTdHJva2UoKTtcbiAgICAvLyBpZiBubyBmaWxscywgb3V0bGluZSBzdHJva2VcbiAgICBpZiAob3V0bGluZWROb2RlICYmIHNob3VsZE5vZGVCZU91dGxpbmVTdHJva2VzKHZlY3Rvck5vZGUpKSB7XG4gICAgICAgIG5vZGVzVG9SZXR1cm4ucHVzaChvdXRsaW5lZE5vZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIm91dGxpbmVkXCIsIG91dGxpbmVkTm9kZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwib3V0bGluZSBwYXRoXCIsIG91dGxpbmVkTm9kZS52ZWN0b3JQYXRoc1swXS5kYXRhLCBvdXRsaW5lZE5vZGUudmVjdG9yUGF0aHNbMF0ud2luZGluZ1J1bGUpO1xuICAgICAgICAvLyBoaWRlIHRoZSBzdHJva2VzIVxuICAgICAgICB2ZWN0b3JOb2RlLnN0cm9rZXMgPSBbXTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJhZnRlclwiLCB2ZWN0b3JOb2RlLnZlY3RvclBhdGhzKTtcbiAgICBjb25zb2xlLmxvZyh2ZWN0b3JOb2RlKTtcbiAgICBub2Rlc1RvUmV0dXJuLnB1c2godmVjdG9yTm9kZSk7XG4gICAgcmV0dXJuIG5vZGVzVG9SZXR1cm47XG59XG5mdW5jdGlvbiBkZWcyUmFkaWFuKGRlZykge1xuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XG59XG5mdW5jdGlvbiBtdWx0aXBseU1hdHJpY2VzKG1hdHJpeEEsIG1hdHJpeEIpIHtcbiAgICBsZXQgYU51bVJvd3MgPSBtYXRyaXhBLmxlbmd0aDtcbiAgICBsZXQgYU51bUNvbHMgPSBtYXRyaXhBWzBdLmxlbmd0aDtcbiAgICBsZXQgYk51bVJvd3MgPSBtYXRyaXhCLmxlbmd0aDtcbiAgICBsZXQgYk51bUNvbHMgPSBtYXRyaXhCWzBdLmxlbmd0aDtcbiAgICBsZXQgbmV3TWF0cml4ID0gbmV3IEFycmF5KGFOdW1Sb3dzKTtcbiAgICBmb3IgKGxldCByID0gMDsgciA8IGFOdW1Sb3dzOyArK3IpIHtcbiAgICAgICAgbmV3TWF0cml4W3JdID0gbmV3IEFycmF5KGJOdW1Db2xzKTtcbiAgICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCBiTnVtQ29sczsgKytjKSB7XG4gICAgICAgICAgICBuZXdNYXRyaXhbcl1bY10gPSAwO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhTnVtQ29sczsgKytpKSB7XG4gICAgICAgICAgICAgICAgbmV3TWF0cml4W3JdW2NdICs9IG1hdHJpeEFbcl1baV0gKiBtYXRyaXhCW2ldW2NdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXdNYXRyaXg7XG59XG5mdW5jdGlvbiBtdWx0aXBseShhLCBiKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgW1xuICAgICAgICAgICAgYVswXVswXSAqIGJbMF1bMF0gKyBhWzBdWzFdICogYlsxXVswXSxcbiAgICAgICAgICAgIGFbMF1bMF0gKiBiWzBdWzFdICsgYVswXVsxXSAqIGJbMV1bMV0sXG4gICAgICAgICAgICBhWzBdWzBdICogYlswXVsyXSArIGFbMF1bMV0gKiBiWzFdWzJdICsgYVswXVsyXSxcbiAgICAgICAgXSxcbiAgICAgICAgW1xuICAgICAgICAgICAgYVsxXVswXSAqIGJbMF1bMF0gKyBhWzFdWzFdICogYlsxXVswXSxcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzFdICsgYVsxXVsxXSAqIGJbMV1bMV0gKyAwLFxuICAgICAgICAgICAgYVsxXVswXSAqIGJbMF1bMl0gKyBhWzFdWzFdICogYlsxXVsyXSArIGFbMV1bMl0sXG4gICAgICAgIF0sXG4gICAgXTtcbn1cbi8vIENyZWF0ZXMgYSBcIm1vdmVcIiB0cmFuc2Zvcm0uXG5mdW5jdGlvbiBtb3ZlKHgsIHkpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICBbMSwgMCwgeF0sXG4gICAgICAgIFswLCAxLCB5XSxcbiAgICBdO1xufVxuLy8gQ3JlYXRlcyBhIFwicm90YXRlXCIgdHJhbnNmb3JtLlxuZnVuY3Rpb24gcm90YXRlKHRoZXRhKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgW01hdGguY29zKHRoZXRhKSwgTWF0aC5zaW4odGhldGEpLCAwXSxcbiAgICAgICAgWy1NYXRoLnNpbih0aGV0YSksIE1hdGguY29zKHRoZXRhKSwgMF0sXG4gICAgXTtcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZVhZRnJvbU5vZGUobm9kZSkge1xuICAgIGxldCBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRYID0gbm9kZS54O1xuICAgIGxldCBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRZID0gbm9kZS55O1xuICAgIGxldCB4ID0gbm9kZS53aWR0aCAvIDI7XG4gICAgbGV0IHkgPSBub2RlLndpZHRoIC8gMjtcbiAgICBsZXQgcm90YXRpb25EZWcgPSAtbm9kZS5yb3RhdGlvbjtcbiAgICBsZXQgcm90YXRpb25SYWQgPSAoTWF0aC5QSSAqIHJvdGF0aW9uRGVnKSAvIDE4MDtcbiAgICBsZXQgeFRyYW5zZm9ybSA9IHggLSB4ICogTWF0aC5jb3Mocm90YXRpb25SYWQpICsgeSAqIE1hdGguc2luKHJvdGF0aW9uUmFkKTtcbiAgICBsZXQgeVRyYW5zZm9ybSA9IHkgLSB4ICogTWF0aC5zaW4ocm90YXRpb25SYWQpICsgeSAqIE1hdGguY29zKHJvdGF0aW9uUmFkKTtcbiAgICBsZXQgcm90YXRpb25UcmFuc2Zvcm0gPSBbXG4gICAgICAgIFtNYXRoLmNvcyhyb3RhdGlvblJhZCksIC1NYXRoLnNpbihyb3RhdGlvblJhZCksIHhUcmFuc2Zvcm1dLFxuICAgICAgICBbTWF0aC5zaW4ocm90YXRpb25SYWQpLCBNYXRoLmNvcyhyb3RhdGlvblJhZCksIHlUcmFuc2Zvcm1dLFxuICAgIF07XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0gPSByb3RhdGlvblRyYW5zZm9ybTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbm9kZS54ICs9IGxvY2F0aW9uUmVsYXRpdmVUb1BhcmVudFg7XG4gICAgbm9kZS55ICs9IGxvY2F0aW9uUmVsYXRpdmVUb1BhcmVudFk7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS55KSwgSlNPTi5zdHJpbmdpZnkobm9kZS54KSk7XG59XG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgY2FsY3VsYXRlcyB0aGUgY29ycmVjdCBYWSBwb3NpdGlvbiBpZ25vcmluZyByb3RhdGlvblxuICogQHBhcmFtIG5vZGVcbiAqL1xuZnVuY3Rpb24gbmV3Q2FsY3VsYXRlUmVsYXRpdmUob3JpZ2luYWxOb2RlKSB7XG4gICAgY29uc3Qgbm9kZSA9IG9yaWdpbmFsTm9kZS5jbG9uZSgpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICAvL2NvbnN0IHggPSBvcmlnaW5hbE5vZGUueDtcbiAgICAvL2NvbnN0IHkgPSBvcmlnaW5hbE5vZGUueTtcbiAgICAvL25vZGUueCA9IDA7XG4gICAgLy9ub2RlLnkgPSAwO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUuYWJzb2x1dGVUcmFuc2Zvcm0pKTtcbiAgICAvL25vZGUucm90YXRpb24gPSAwO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBsZXQgdHJhbnNmb3JtID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy8gbW92ZSB0byAwXG4gICAgbGV0IHggPSB0cmFuc2Zvcm1bMF1bMl07XG4gICAgbGV0IHkgPSB0cmFuc2Zvcm1bMV1bMl07XG4gICAgdHJhbnNmb3JtWzBdWzJdID0gMDtcbiAgICB0cmFuc2Zvcm1bMV1bMl0gPSAwO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSAzNjBcIiwgSlNPTi5zdHJpbmdpZnkodHJhbnNmb3JtKSk7XG4gICAgdHJhbnNmb3JtID0gbXVsdGlwbHkocm90YXRlKDIgKiBNYXRoLlBJIC0gKG5vZGUucm90YXRpb24gLSBNYXRoLlBJKSAvIDE4MCksIHRyYW5zZm9ybSk7XG4gICAgY29uc29sZS5sb2coXCJmcm9tIGFmdGVyIHJvdFwiLCBKU09OLnN0cmluZ2lmeSh0cmFuc2Zvcm0pKTtcbiAgICB0cmFuc2Zvcm0gPSBtdWx0aXBseShtb3ZlKHgsIHkpLCB0cmFuc2Zvcm0pO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSBhZnRlciBtb3ZlXCIsIEpTT04uc3RyaW5naWZ5KHRyYW5zZm9ybSkpO1xuICAgIGNvbnN0IGRpZlggPSBub2RlLng7XG4gICAgY29uc3QgZGlmWSA9IG5vZGUueTtcbiAgICBjb25zb2xlLmxvZyhcImNhbGNlZFwiLCBkaWZYLCBkaWZZLCB4ICsgZGlmWCwgeSArIGRpZlkpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBjb25zb2xlLmxvZyhtdWx0aXBseShyb3RhdGUoLW5vZGUucm90YXRpb24pLCB0cmFuc2Zvcm0pKTtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gMzYwXCIsIG11bHRpcGx5KHJvdGF0ZSgtKG5vZGUucm90YXRpb24gLSBNYXRoLlBJKSAvIDE4MCksIG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICAvLyByb3RhdGUgYmFja1xuICAgIGNvbnN0IGFuZ2xlSW5SYWRpYW5zID0gZGVnMlJhZGlhbigtbm9kZS5yb3RhdGlvbik7XG4gICAgY29uc29sZS5sb2cobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSk7XG4gICAgY29uc3QgbmV0cmFuc2Zvcm0gPSBtdWx0aXBseShyb3RhdGUoYW5nbGVJblJhZGlhbnMpLCBub2RlLnJlbGF0aXZlVHJhbnNmb3JtKTtcbiAgICBjb25zb2xlLmxvZyhuZXRyYW5zZm9ybSk7XG4gICAgLypcbiAgICBjb25zb2xlLmxvZyhub2RlLnJlbGF0aXZlVHJhbnNmb3JtKVxuICAgIGxldCByb3RlciA9IG5vZGUucm90YXRpb247XG4gICAgbm9kZS5yb3RhdGlvbiA9IDA7XG4gIFxuICAgIGNvbnNvbGUubG9nKCdvbGQgeCcsSlNPTi5zdHJpbmdpZnkobm9kZS54KSxKU09OLnN0cmluZ2lmeShub2RlLnkpLEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBub2RlLnJvdGF0aW9uID0gcm90ZXI7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ25ldyB4Jyx4LHksSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpXG4gIFxuICBcbiAgXG4gICAgY29uc3Qgd2lkdGggPSBub2RlLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgIGNvbnNvbGUubG9nKHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgIGNvbnN0IHJvdCA9IChub2RlLnJvdGF0aW9uICogTWF0aC5QSSkgLyAxODA7IC8vIGluIHJhZGlhbnNcbiAgXG4gICAgLy8gbm90ZSwgdG8gY2FsY3VsYXRlIGRpc3RhbmNlIGZyb20gcm90YXRpb24sIHlvdSBtdXN0IGZsaXAgdGhlIHNpZ24gICgxLzIpSCBiZWNhdXNlIGluIGNhcnRlc2lhbiBjb29yZGluYXRlcyB5IERFQ1JFQVNFUyBhcyB5b3VcbiAgICBjb25zdCByZWFsWCA9IHggKyAoMSAvIDIpICogd2lkdGggKiBNYXRoLmNvcyhyb3QpIC8qLSAtMSAqICgxIC8gMikgKiBoZWlnaHQgKiBNYXRoLnNpbihyb3QpICAtICgxIC8gMikgKiB3aWR0aDtcbiAgICAgIGNvbnNvbGUubG9nKHksKDEgLyAyKSAqIHdpZHRoICogTWF0aC5zaW4ocm90KSwgLTEgKiAoMSAvIDIpICogaGVpZ2h0ICogTWF0aC5jb3Mocm90KSwgKDEgLyAyKSAqIGhlaWdodClcbiAgXG4gICAgY29uc3QgcmVhbFkgPVxuICAgICAgeSArICgxIC8gMikgKiB3aWR0aCAqIE1hdGguc2luKHJvdCkgLyorIC0xICogKDEgLyAyKSAqIGhlaWdodCAqIE1hdGguY29zKHJvdCkgKygxIC8gMikgKiBoZWlnaHQ7XG4gICAgcmV0dXJuIFtyZWFsWCwgcmVhbFldOyovXG4gICAgY29uc3QgdG90YWxMZW5ndGhPZkh5cG8gPSBNYXRoLnNxcnQobm9kZS53aWR0aCAqIG5vZGUud2lkdGggKyBub2RlLmhlaWdodCAqIG5vZGUuaGVpZ2h0KTtcbn1cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24sIGkuZS4gdGhlIHRyYW5zbGF0aW9uIGFuZCBzY2FsaW5nLCByZXF1aXJlZFxuLy8gdG8gZ2V0IHRoZSBwYXRoIHRvIGZpbGwgdGhlIHN2ZyBhcmVhLiBOb3RlIHRoYXQgdGhpcyBhc3N1bWVzIHVuaWZvcm1cbi8vIHNjYWxpbmcsIGEgcGF0aCB0aGF0IGhhcyBubyBvdGhlciB0cmFuc2Zvcm1zIGFwcGxpZWQgdG8gaXQsIGFuZCBub1xuLy8gZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgc3ZnIHZpZXdwb3J0IGFuZCB2aWV3Qm94IGRpbWVuc2lvbnMuXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBzdmdXZHRoID0gMjtcbiAgICB2YXIgc3ZnSGdodCA9IDI7XG4gICAgdmFyIG9yaWdQYXRoSGdodCA9IGhlaWdodDtcbiAgICB2YXIgb3JpZ1BhdGhXZHRoID0gd2lkdGg7XG4gICAgdmFyIG9yaWdQYXRoWSA9IHk7XG4gICAgdmFyIG9yaWdQYXRoWCA9IHg7XG4gICAgLy8gaG93IG11Y2ggYmlnZ2VyIGlzIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gICAgLy8gcmVsYXRpdmUgdG8gdGhlIHBhdGggaW4gZWFjaCBkaW1lbnNpb24/XG4gICAgdmFyIHNjYWxlQmFzZWRPbldkdGggPSBzdmdXZHRoIC8gb3JpZ1BhdGhXZHRoO1xuICAgIHZhciBzY2FsZUJhc2VkT25IZ2h0ID0gc3ZnSGdodCAvIG9yaWdQYXRoSGdodDtcbiAgICAvLyBvZiB0aGUgc2NhbGluZyBmYWN0b3JzIGRldGVybWluZWQgaW4gZWFjaCBkaW1lbnNpb24sXG4gICAgLy8gdXNlIHRoZSBzbWFsbGVyIG9uZTsgb3RoZXJ3aXNlIHBvcnRpb25zIG9mIHRoZSBwYXRoXG4gICAgLy8gd2lsbCBsaWUgb3V0c2lkZSB0aGUgdmlld3BvcnQgKGNvcnJlY3QgdGVybT8pXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oc2NhbGVCYXNlZE9uV2R0aCwgc2NhbGVCYXNlZE9uSGdodCk7XG4gICAgLy8gY2FsY3VsYXRlIHRoZSBib3VuZGluZyBib3ggcGFyYW1ldGVyc1xuICAgIC8vIGFmdGVyIHRoZSBwYXRoIGhhcyBiZWVuIHNjYWxlZCByZWxhdGl2ZSB0byB0aGUgb3JpZ2luXG4gICAgLy8gYnV0IGJlZm9yZSBhbnkgc3Vic2VxdWVudCB0cmFuc2xhdGlvbnMgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICB2YXIgc2NhbGVkUGF0aFggPSBvcmlnUGF0aFggKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aFkgPSBvcmlnUGF0aFkgKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aFdkdGggPSBvcmlnUGF0aFdkdGggKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aEhnaHQgPSBvcmlnUGF0aEhnaHQgKiBzY2FsZTtcbiAgICAvLyBjYWxjdWxhdGUgdGhlIGNlbnRyZSBwb2ludHMgb2YgdGhlIHNjYWxlZCBidXQgdW50cmFuc2xhdGVkIHBhdGhcbiAgICAvLyBhcyB3ZWxsIGFzIG9mIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gICAgdmFyIHNjYWxlZFBhdGhDZW50cmVYID0gc2NhbGVkUGF0aFggKyBzY2FsZWRQYXRoV2R0aCAvIDI7XG4gICAgdmFyIHNjYWxlZFBhdGhDZW50cmVZID0gc2NhbGVkUGF0aFkgKyBzY2FsZWRQYXRoSGdodCAvIDI7XG4gICAgdmFyIHN2Z1Jvb3RDZW50cmVYID0gMDsgLy8gLXN2Z1dkdGggLyAyO1xuICAgIHZhciBzdmdSb290Q2VudHJlWSA9IDA7IC8vLXN2Z0hnaHQgLyAyO1xuICAgIC8vIGNhbGN1bGF0ZSB0cmFuc2xhdGlvbiByZXF1aXJlZCB0byBjZW50cmUgdGhlIHBhdGhcbiAgICAvLyBvbiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIHZhciBwYXRoVHJhbnNsWCA9IHN2Z1Jvb3RDZW50cmVYIC0gc2NhbGVkUGF0aENlbnRyZVg7XG4gICAgdmFyIHBhdGhUcmFuc2xZID0gc3ZnUm9vdENlbnRyZVkgLSBzY2FsZWRQYXRoQ2VudHJlWTtcbiAgICBjb25zb2xlLmxvZyhcInNjYWxlZCBwYXRoIHhcIiwgc2NhbGVkUGF0aFgsIHNjYWxlZFBhdGhXZHRoLCBcInNjYWxlZCBwYXRoIHlcIiwgc2NhbGVkUGF0aFksIHNjYWxlZFBhdGhIZ2h0LCBcImZhY3RvciBmcm9tIHNjYWxlXCIsIChvcmlnUGF0aEhnaHQgLSBvcmlnUGF0aFdkdGgpIC8gMiwgXCJ4ZmFjdG9yIGZyb20gZ1wiKTtcbiAgICAvL1xuICAgIGNvbnNvbGUubG9nKHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpO1xuICAgIHJldHVybiB7IHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUgfTtcbn1cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybWVkUGF0aERTdHIob2xkUGF0aERTdHIsIHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpIHtcbiAgICAvLyBjb25zdGFudHMgdG8gaGVscCBrZWVwIHRyYWNrIG9mIHRoZSB0eXBlcyBvZiBTVkcgY29tbWFuZHMgaW4gdGhlIHBhdGhcbiAgICB2YXIgQk9USF9YX0FORF9ZID0gMTtcbiAgICB2YXIgSlVTVF9YID0gMjtcbiAgICB2YXIgSlVTVF9ZID0gMztcbiAgICB2YXIgTk9ORSA9IDQ7XG4gICAgdmFyIEVMTElQVElDQUxfQVJDID0gNTtcbiAgICB2YXIgQUJTT0xVVEUgPSA2O1xuICAgIHZhciBSRUxBVElWRSA9IDc7XG4gICAgLy8gdHdvIHBhcmFsbGVsIGFycmF5cywgd2l0aCBlYWNoIGVsZW1lbnQgYmVpbmcgb25lIGNvbXBvbmVudCBvZiB0aGVcbiAgICAvLyBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoLCB3aXRoIG9uZSBjb21wb25lbnQgYmVpbmcgZWl0aGVyXG4gICAgLy8gYW4gaW5zdHJ1Y3Rpb24gKGUuZy4gXCJNXCIgZm9yIG1vdmV0bywgZXRjLikgb3IgbnVtZXJpY2FsIHZhbHVlXG4gICAgLy8gZm9yIGVpdGhlciBhbiB4IG9yIHkgY29vcmRpbmF0ZVxuICAgIHZhciBvbGRQYXRoREFyciA9IGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMob2xkUGF0aERTdHIpO1xuICAgIHZhciBuZXdQYXRoREFyciA9IFtdO1xuICAgIGNvbnNvbGUubG9nKG9sZFBhdGhEQXJyKTtcbiAgICB2YXIgY29tbWFuZFBhcmFtcywgYWJzT3JSZWwsIG9sZFBhdGhEQ29tcCwgbmV3UGF0aERDb21wO1xuICAgIC8vIGVsZW1lbnQgaW5kZXhcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB3aGlsZSAoaWR4IDwgb2xkUGF0aERBcnIubGVuZ3RoKSB7XG4gICAgICAgIHZhciBvbGRQYXRoRENvbXAgPSBvbGRQYXRoREFycltpZHhdO1xuICAgICAgICBpZiAoL15bQS1aYS16XSQvLnRlc3Qob2xkUGF0aERDb21wKSkge1xuICAgICAgICAgICAgLy8gY29tcG9uZW50IGlzIGEgc2luZ2xlIGxldHRlciwgaS5lLiBhbiBzdmcgcGF0aCBjb21tYW5kXG4gICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9sZFBhdGhEQ29tcCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXdQYXRoREFycltpZHhdKTtcbiAgICAgICAgICAgIHN3aXRjaCAob2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVwiOiAvLyBlbGxpcHRpY2FsIGFyYyBjb21tYW5kLi4udGhlIG1vc3QgY29tcGxpY2F0ZWQgb25lXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBFTExJUFRJQ0FMX0FSQztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkhcIjogLy8gaG9yaXpvbnRhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGFuIHgtY29vcmRpbmF0ZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9YO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOiAvLyB2ZXJ0aWNhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGEgeS1jb29yZGluYXRlXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBKVVNUX1k7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJaXCI6IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBOT05FO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgb3RoZXIgY29tbWFuZHM7IGFsbCBvZiB0aGVtIHJlcXVpcmUgYm90aCB4IGFuZCB5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBCT1RIX1hfQU5EX1k7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhYnNPclJlbCA9IG9sZFBhdGhEQ29tcCA9PT0gb2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkgPyBBQlNPTFVURSA6IFJFTEFUSVZFO1xuICAgICAgICAgICAgLy8gbG93ZXJjYXNlIGNvbW1hbmRzIGFyZSByZWxhdGl2ZSwgdXBwZXJjYXNlIGFyZSBhYnNvbHV0ZVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgY29tcG9uZW50IGlzIG5vdCBhIGxldHRlciwgdGhlbiBpdCBpcyBhIG51bWVyaWMgdmFsdWVcbiAgICAgICAgICAgIHZhciB0cmFuc2xYLCB0cmFuc2xZO1xuICAgICAgICAgICAgaWYgKGFic09yUmVsID09PSBBQlNPTFVURSkge1xuICAgICAgICAgICAgICAgIC8vIHRoZSB0cmFuc2xhdGlvbiBpcyByZXF1aXJlZCBmb3IgYWJzb2x1dGUgY29tbWFuZHMuLi5cbiAgICAgICAgICAgICAgICB0cmFuc2xYID0gcGF0aFRyYW5zbFg7XG4gICAgICAgICAgICAgICAgdHJhbnNsWSA9IHBhdGhUcmFuc2xZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYWJzT3JSZWwgPT09IFJFTEFUSVZFKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uYnV0IG5vdCByZWxhdGl2ZSBvbmVzXG4gICAgICAgICAgICAgICAgdHJhbnNsWCA9IDA7XG4gICAgICAgICAgICAgICAgdHJhbnNsWSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGNvbW1hbmRQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAvLyBmaWd1cmUgb3V0IHdoaWNoIG9mIHRoZSBudW1lcmljIHZhbHVlcyBmb2xsb3dpbmcgYW4gc3ZnIGNvbW1hbmRcbiAgICAgICAgICAgICAgICAvLyBhcmUgcmVxdWlyZWQsIGFuZCB0aGVuIHRyYW5zZm9ybSB0aGUgbnVtZXJpYyB2YWx1ZShzKSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIHBhdGggZC1hdHRyaWJ1dGUgYW5kIHBsYWNlIGl0IGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZVxuICAgICAgICAgICAgICAgIC8vIGFycmF5IHRoYXQgd2lsbCBldmVudHVhbGx5IGJlY29tZSB0aGUgZC1hdHRyaWJ1dGUgZm9yIHRoZSBuZXcgcGF0aFxuICAgICAgICAgICAgICAgIGNhc2UgQk9USF9YX0FORF9ZOlxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgICAgICAgICAgIGlkeCArPSAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEpVU1RfWDpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgSlVTVF9ZOlxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBFTExJUFRJQ0FMX0FSQzpcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGVsbGlwdGljYWwgYXJjIGhhcyB4IGFuZCB5IHZhbHVlcyBpbiB0aGUgZmlyc3QgYW5kIHNlY29uZCBhcyB3ZWxsIGFzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSA2dGggYW5kIDd0aCBwb3NpdGlvbnMgZm9sbG93aW5nIHRoZSBjb21tYW5kOyB0aGUgaW50ZXJ2ZW5pbmcgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIC8vIGFyZSBub3QgYWZmZWN0ZWQgYnkgdGhlIHRyYW5zZm9ybWF0aW9uIGFuZCBzbyBjYW4gc2ltcGx5IGJlIGNvcGllZFxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDJdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDJdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgM10gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgM10pO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA0XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA0XSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDVdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDVdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNl0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gNztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBOT05FOlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJudW1lcmljIHZhbHVlIHNob3VsZCBub3QgZm9sbG93IHRoZSBTVkcgWi96IGNvbW1hbmRcIik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKG5ld1BhdGhEQXJyKTtcbiAgICByZXR1cm4gbmV3UGF0aERBcnIuam9pbihcIiBcIik7XG59XG5mdW5jdGlvbiBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKHN0cikge1xuICAgIC8vIGFzc3VtaW5nIHRoZSBzdHJpbmcgZnJvbSB0aGUgZC1hdHRyaWJ1dGUgb2YgdGhlIHBhdGggaGFzIGFsbCBjb21wb25lbnRzXG4gICAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLCB0aGVuIGNyZWF0ZSBhbiBhcnJheSBvZiBjb21wb25lbnRzIGJ5XG4gICAgLy8gc2ltcGx5IHNwbGl0dGluZyB0aGUgc3RyaW5nIGF0IHRob3NlIHNwYWNlc1xuICAgIHN0ciA9IHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKTtcbiAgICByZXR1cm4gc3RyLnNwbGl0KFwiIFwiKTtcbn1cbmZ1bmN0aW9uIHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKSB7XG4gICAgLy8gVGhlIFNWRyBzdGFuZGFyZCBpcyBmbGV4aWJsZSB3aXRoIHJlc3BlY3QgdG8gaG93IHBhdGggZC1zdHJpbmdzIGFyZVxuICAgIC8vIGZvcm1hdHRlZCBidXQgdGhpcyBtYWtlcyBwYXJzaW5nIHRoZW0gbW9yZSBkaWZmaWN1bHQuIFRoaXMgZnVuY3Rpb24gZW5zdXJlc1xuICAgIC8vIHRoYXQgYWxsIFNWRyBwYXRoIGQtc3RyaW5nIGNvbXBvbmVudHMgKGkuZS4gYm90aCBjb21tYW5kcyBhbmQgdmFsdWVzKSBhcmVcbiAgICAvLyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UuXG4gICAgcmV0dXJuIHN0clxuICAgICAgICAucmVwbGFjZSgvLC9nLCBcIiBcIikgLy8gcmVwbGFjZSBlYWNoIGNvbW1hIHdpdGggYSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvLS9nLCBcIiAtXCIpIC8vIHByZWNlZGUgZWFjaCBtaW51cyBzaWduIHdpdGggYSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvKFtBLVphLXpdKS9nLCBcIiAkMSBcIikgLy8gc2FuZHdpY2ggZWFjaCAgIGxldHRlciBiZXR3ZWVuIDIgc3BhY2VzXG4gICAgICAgIC5yZXBsYWNlKC8gIC9nLCBcIiBcIikgLy8gY29sbGFwc2UgcmVwZWF0ZWQgc3BhY2VzIHRvIGEgc2luZ2xlIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8gKFtFZV0pIC9nLCBcIiQxXCIpIC8vIHJlbW92ZSBmbGFua2luZyBzcGFjZXMgYXJvdW5kIGV4cG9uZW50IHN5bWJvbHNcbiAgICAgICAgLnJlcGxhY2UoL14gL2csIFwiXCIpIC8vIHRyaW0gYW55IGxlYWRpbmcgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLyAkL2csIFwiXCIpOyAvLyB0cmltIGFueSB0YWlsaW5nIHNwYWNlXG59XG5maWdtYS51aS5yZXNpemUoNjAwLCA1MDApO1xuZXhwb3J0IHt9O1xuLy8gVXNpbmcgcmVsYXRpdmUgdHJhbnNmb3JtYXRpb24gbWF0cml4IChnaXZlcyBza2V3ZWQgeCB2YWx1ZSBmb3Igbm9uLXJvdGF0ZWQpXG4vL2NvbnNvbGUubG9nKCdyZWx4JyxyZWxbMF1bMl0gKyAoMS8yKSp3aWR0aCpyZWxbMF1bMF0gLSgtMSkqKDEvMikqaGVpZ2h0KnJlbFswXVswXSAtICgxLzIpKndpZHRoKTtcbi8vY29uc29sZS5sb2coJ3JlbHknLHJlbFsxXVsyXSAgKygxLzIpKndpZHRoKnJlbFsxXVswXS0gKC0xKSooMS8yKSpoZWlnaHQqcmVsWzFdWzFdIC0gKDEvMikqaGVpZ2h0KTtcbi8qXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcFwiKS5pbm5lckhUTUwgPSBgXG48c3ZnICBpZD1cImJhc2VcIiB3aWR0aD1cIjgwMFwiIGhlaWdodD1cIjYwMFwiIHZpZXdCb3g9XCIwIDAgODAwIDYwMFwiIHN0eWxlPVwiYm9yZGVyOiAxcHggc29saWQgYmx1ZTtcIj5cbiAgICA8cGF0aCBpZD1cIm5vdG1vdmVkXCIgZmlsbD1cIiNmMDBcIiBzdHJva2U9XCJub25lXCIgZD1cIk0xMjIuNzY5IDQ4LjQ5MTRDMTI3LjAzOCA0Ni4xMTc5IDEyOS45ODMgNDMuMzcyNCAxMzEuMjc0IDQwLjIxNjhDMTM2LjYxNCAyNy4xNjg1IDEzMy40NzIgMTcuMzYwNCAxMjkuMDE0IDEwLjgwMDdDMTI2Ljc3OSA3LjUxMTU0IDEyNC4yMDggNS4wMzM3MiAxMjIuMTk1IDMuMzc3ODlDMTIxLjE4OCAyLjU1MDUgMTIwLjMyMyAxLjkyOTg1IDExOS43MTEgMS41MTcxNUMxMTkuNDA1IDEuMzEwODQgMTE5LjE2MyAxLjE1NjYyIDExOC45OTggMS4wNTQ2MUMxMTguOTE2IDEuMDAzNjIgMTE4Ljg1MyAwLjk2NTY4OSAxMTguODExIDAuOTQwODQ1TDExOC43NjUgMC45MTMzOTJMMTE4Ljc1NCAwLjkwNzAzM0wxMTguNzUxIDAuOTA1Njk4QzExOC43NTEgMC45MDU3MjQgMTE4Ljc1MSAwLjkwNTU5IDExOSAwLjQ3MTYxOEMxMTkuMjQ4IDAuMDM3NjQ2NiAxMTkuMjQ4IDAuMDM3ODI0MyAxMTkuMjQ5IDAuMDM4MDU0TDExOS4yNTQgMC4wNDExMzg1TDExOS4yNjkgMC4wNDk1ODkxQzExOS4yODEgMC4wNTY4NzYyIDExOS4yOTkgMC4wNjc0NzAxIDExOS4zMjIgMC4wODEzNjY3QzExOS4zNjkgMC4xMDkxNTcgMTE5LjQzNyAwLjE1MDE2OCAxMTkuNTI1IDAuMjA0Mzg2QzExOS43IDAuMzEyODExIDExOS45NTMgMC40NzQwOTYgMTIwLjI3IDAuNjg4MTM0QzEyMC45MDUgMS4xMTYxMyAxMjEuNzk2IDEuNzU1NTIgMTIyLjgzIDIuNjA1NDlDMTI0Ljg5NiA0LjMwNDM4IDEyNy41MzkgNi44NTA1OSAxMjkuODQxIDEwLjIzODdDMTM0LjQ1OSAxNy4wMzM0IDEzNy42ODUgMjcuMTkyNiAxMzIuMiA0MC41OTU1QzEzMC43ODUgNDQuMDUyNiAxMjcuNjE1IDQ2Ljk0MTYgMTIzLjI1NSA0OS4zNjU0QzExOC44ODggNTEuNzkzMSAxMTMuMjcgNTMuNzg2MSAxMDYuODY3IDU1LjQyMzdDOTQuMDU4NCA1OC42OTkzIDc4LjAxODggNjAuNTc0NCA2Mi4zNDI1IDYxLjYyMTJDNDYuNjYxMyA2Mi42NjgyIDMxLjMyMTQgNjIuODg3OCAxOS45MDM1IDYyLjg0NTdDMTQuMTk0IDYyLjgyNDYgOS40NjQxOCA2Mi43MzgxIDYuMTYxMjEgNjIuNjU2OUM0LjUwOTcxIDYyLjYxNjMgMy4yMTQ4OSA2Mi41NzcgMi4zMzI2NyA2Mi41NDc4QzIuMjgwNTEgNjIuNTQ2MSAyLjIyOTc5IDYyLjU0NDQgMi4xODA1MiA2Mi41NDI4TDQuNDE4MDQgNjQuOTY5MkM0LjYwNTI0IDY1LjE3MjIgNC41OTI0MyA2NS40ODg2IDQuMzg5NDMgNjUuNjc1OEM0LjE4NjQyIDY1Ljg2MyAzLjg3MDA5IDY1Ljg1MDEgMy42ODI4OSA2NS42NDcxTDAuNjMyMzEyIDYyLjMzOUMwLjQ0NTExNSA2Mi4xMzYgMC40NTc5MjMgNjEuODE5NiAwLjY2MDkyNyA2MS42MzI0TDMuOTY5MDggNTguNTgxOUM0LjE3MjA4IDU4LjM5NDcgNC40ODg0MiA1OC40MDc1IDQuNjc1NjEgNTguNjEwNUM0Ljg2MjgxIDU4LjgxMzUgNC44NSA1OS4xMjk4IDQuNjQ3IDU5LjMxN0wyLjIzMjA0IDYxLjU0MzlDMi4yNzU0NyA2MS41NDU0IDIuMzIwMDQgNjEuNTQ2OSAyLjM2NTcxIDYxLjU0ODRDMy4yNDUzMSA2MS41Nzc1IDQuNTM3MyA2MS42MTY3IDYuMTg1OCA2MS42NTcyQzkuNDgyODQgNjEuNzM4MyAxNC4yMDU3IDYxLjgyNDcgMTkuOTA3MiA2MS44NDU3QzMxLjMxMTEgNjEuODg3NyA0Ni42MjU5IDYxLjY2ODQgNjIuMjc1OSA2MC42MjM0Qzc3LjkzMDcgNTkuNTc4MSA5My44OTkgNTcuNzA3OSAxMDYuNjE5IDU0LjQ1NDlDMTEyLjk4IDUyLjgyODEgMTE4LjUwNiA1MC44NjEgMTIyLjc2OSA0OC40OTE0WlwiIG9wYWNpdHk9XCIwLjVcIiAvPlxuPC9zdmc+XG5gO1xuXG4vL00gMC44OTQ4Nzk4NDIyMzI1MDM0IC0wLjIyOTQ3Nzc2NTQ2NjMyNTE1IEwgLTAuOTExMzQ2MDQ2MjkwMDU2OCAtMC45ODQ4MDg2MjE1MTQyODg1IEwgLTAuOTA0OTkzMjkxMDA4MDY2NyAtMC45OTk5OTk5OTk5OTk5OTk5IEwgMC45MTEzNDYwMzMyMjQ4NDE2IC0wLjI0MDQ0MDk1NTQyOTAyMzg4IFYgMS4wMDAwMDAwMjQxMjAzOTY4IEggMC44OTQ4Nzk4NDIyMzI1MDM0IFYgLTAuMjI5NDc3NzY1NDY2MzI1MTUgWlxuLy8gUmV0cmlldmUgdGhlIFwiZFwiIGF0dHJpYnV0ZSBvZiB0aGUgU1ZHIHBhdGggeW91IHdpc2ggdG8gdHJhbnNmb3JtLlxudmFyIHN2Z1Jvb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhc2VcIik7XG52YXIgcGF0aCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm90bW92ZWRcIik7XG52YXIgb2xkUGF0aERTdHIgPSBwYXRoLmdldEF0dHJpYnV0ZShcImRcIik7XG5cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24gcmVxdWlyZWQuXG52YXIgb2JqID0gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHN2Z1Jvb3QsIHBhdGgpO1xudmFyIHBhdGhUcmFuc2xYID0gb2JqLnBhdGhUcmFuc2xYO1xudmFyIHBhdGhUcmFuc2xZID0gb2JqLnBhdGhUcmFuc2xZO1xudmFyIHNjYWxlID0gb2JqLnNjYWxlO1xuXG4vLyBUaGUgcGF0aCBjb3VsZCBiZSB0cmFuc2Zvcm1lZCBhdCB0aGlzIHBvaW50IHdpdGggYSBzaW1wbGVcbi8vIFwidHJhbnNmb3JtXCIgYXR0cmlidXRlIGFzIHNob3duIGhlcmUuXG5cbi8vICRwYXRoLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgYHRyYW5zbGF0ZSgke3BhdGhUcmFuc2xYfSwgJHtwYXRoVHJhbnNsWX0pLCBzY2FsZSgke3NjYWxlfSlgKTtcblxuLy8gSG93ZXZlciwgYXMgZGVzY3JpYmVkIGluIHlvdXIgcXVlc3Rpb24geW91IGRpZG4ndCB3YW50IHRoaXMuXG4vLyBUaGVyZWZvcmUsIHRoZSBjb2RlIGZvbGxvd2luZyB0aGlzIGxpbmUgbXV0YXRlcyB0aGUgYWN0dWFsIHN2ZyBwYXRoLlxuXG4vLyBDYWxjdWxhdGUgdGhlIHBhdGggXCJkXCIgYXR0cmlidXRlcyBwYXJhbWV0ZXJzLlxudmFyIG5ld1BhdGhEU3RyID0gZ2V0VHJhbnNmb3JtZWRQYXRoRFN0cihcbiAgb2xkUGF0aERTdHIsXG4gIHBhdGhUcmFuc2xYLFxuICBwYXRoVHJhbnNsWSxcbiAgc2NhbGVcbik7XG5cbi8vIEFwcGx5IHRoZSBuZXcgXCJkXCIgYXR0cmlidXRlIHRvIHRoZSBwYXRoLCB0cmFuc2Zvcm1pbmcgaXQuXG5cbmRvY3VtZW50LndyaXRlKFxuICBcIjxwPkFsdGVyZWQgJ2QnIGF0dHJpYnV0ZSBvZiBwYXRoOjwvcD48cD5cIiArIG5ld1BhdGhEU3RyICsgXCI8L3A+XCJcbik7XG5cbi8vIFRoaXMgaXMgdGhlIGVuZCBvZiB0aGUgbWFpbiBjb2RlLiBCZWxvdyBhcmUgdGhlIGZ1bmN0aW9ucyBjYWxsZWQuXG5cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24sIGkuZS4gdGhlIHRyYW5zbGF0aW9uIGFuZCBzY2FsaW5nLCByZXF1aXJlZFxuLy8gdG8gZ2V0IHRoZSBwYXRoIHRvIGZpbGwgdGhlIHN2ZyBhcmVhLiBOb3RlIHRoYXQgdGhpcyBhc3N1bWVzIHVuaWZvcm1cbi8vIHNjYWxpbmcsIGEgcGF0aCB0aGF0IGhhcyBubyBvdGhlciB0cmFuc2Zvcm1zIGFwcGxpZWQgdG8gaXQsIGFuZCBub1xuLy8gZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgc3ZnIHZpZXdwb3J0IGFuZCB2aWV3Qm94IGRpbWVuc2lvbnMuXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoc3ZnLCBwYXRoKSB7XG4gIHZhciBzdmdXZHRoID0gMjtcbiAgdmFyIHN2Z0hnaHQgPSAyO1xuXG4gIHZhciBvcmlnUGF0aEJvdW5kaW5nQm94ID0gcGF0aC5nZXRCQm94KCk7XG5cbiAgdmFyIG9yaWdQYXRoSGdodCA9IG9yaWdQYXRoQm91bmRpbmdCb3guaGVpZ2h0O1xuICB2YXIgb3JpZ1BhdGhXZHRoID0gb3JpZ1BhdGhCb3VuZGluZ0JveC53aWR0aDtcblxuICB2YXIgb3JpZ1BhdGhZID0gb3JpZ1BhdGhCb3VuZGluZ0JveC55O1xuICB2YXIgb3JpZ1BhdGhYID0gb3JpZ1BhdGhCb3VuZGluZ0JveC54O1xuXG4gIGNvbnNvbGUubG9nKG9yaWdQYXRoV2R0aCwgb3JpZ1BhdGhIZ2h0LCBvcmlnUGF0aFdkdGgsIG9yaWdQYXRoWCwgb3JpZ1BhdGhZKTtcbiAgLy8gaG93IG11Y2ggYmlnZ2VyIGlzIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gIC8vIHJlbGF0aXZlIHRvIHRoZSBwYXRoIGluIGVhY2ggZGltZW5zaW9uP1xuICB2YXIgc2NhbGVCYXNlZE9uV2R0aCA9IHN2Z1dkdGggLyBvcmlnUGF0aFdkdGg7XG4gIHZhciBzY2FsZUJhc2VkT25IZ2h0ID0gc3ZnSGdodCAvIG9yaWdQYXRoSGdodDtcblxuICAvLyBvZiB0aGUgc2NhbGluZyBmYWN0b3JzIGRldGVybWluZWQgaW4gZWFjaCBkaW1lbnNpb24sXG4gIC8vIHVzZSB0aGUgc21hbGxlciBvbmU7IG90aGVyd2lzZSBwb3J0aW9ucyBvZiB0aGUgcGF0aFxuICAvLyB3aWxsIGxpZSBvdXRzaWRlIHRoZSB2aWV3cG9ydCAoY29ycmVjdCB0ZXJtPylcbiAgdmFyIHNjYWxlID0gTWF0aC5taW4oc2NhbGVCYXNlZE9uV2R0aCwgc2NhbGVCYXNlZE9uSGdodCk7XG4gIGFsZXJ0KFxuICAgIGBoZWlnaHQ6ICR7MSAvIHNjYWxlQmFzZWRPbkhnaHR9IHdpZHRoOiAkezEgLyBzY2FsZUJhc2VkT25XZHRofSwgJHtcbiAgICAgIG9yaWdQYXRoV2R0aCAqIG9yaWdQYXRoSGdodFxuICAgIH1gXG4gICk7XG4gIC8vIGNhbGN1bGF0ZSB0aGUgYm91bmRpbmcgYm94IHBhcmFtZXRlcnNcbiAgLy8gYWZ0ZXIgdGhlIHBhdGggaGFzIGJlZW4gc2NhbGVkIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW5cbiAgLy8gYnV0IGJlZm9yZSBhbnkgc3Vic2VxdWVudCB0cmFuc2xhdGlvbnMgaGF2ZSBiZWVuIGFwcGxpZWRcblxuICB2YXIgc2NhbGVkUGF0aFggPSBvcmlnUGF0aFggKiBzY2FsZTtcbiAgdmFyIHNjYWxlZFBhdGhZID0gb3JpZ1BhdGhZICogc2NhbGU7XG4gIHZhciBzY2FsZWRQYXRoV2R0aCA9IG9yaWdQYXRoV2R0aCAqIHNjYWxlO1xuICB2YXIgc2NhbGVkUGF0aEhnaHQgPSBvcmlnUGF0aEhnaHQgKiBzY2FsZTtcblxuICAvLyBjYWxjdWxhdGUgdGhlIGNlbnRyZSBwb2ludHMgb2YgdGhlIHNjYWxlZCBidXQgdW50cmFuc2xhdGVkIHBhdGhcbiAgLy8gYXMgd2VsbCBhcyBvZiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuXG4gIHZhciBzY2FsZWRQYXRoQ2VudHJlWCA9IHNjYWxlZFBhdGhYICsgc2NhbGVkUGF0aFdkdGggLyAyO1xuICB2YXIgc2NhbGVkUGF0aENlbnRyZVkgPSBzY2FsZWRQYXRoWSArIHNjYWxlZFBhdGhIZ2h0IC8gMjtcbiAgdmFyIHN2Z1Jvb3RDZW50cmVYID0gMDsgLy8gLXN2Z1dkdGggLyAyO1xuICB2YXIgc3ZnUm9vdENlbnRyZVkgPSAwOyAvLy1zdmdIZ2h0IC8gMjtcblxuICAvLyBjYWxjdWxhdGUgdHJhbnNsYXRpb24gcmVxdWlyZWQgdG8gY2VudHJlIHRoZSBwYXRoXG4gIC8vIG9uIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gIHZhciBwYXRoVHJhbnNsWCA9IHN2Z1Jvb3RDZW50cmVYIC0gc2NhbGVkUGF0aENlbnRyZVg7XG4gIHZhciBwYXRoVHJhbnNsWSA9IHN2Z1Jvb3RDZW50cmVZIC0gc2NhbGVkUGF0aENlbnRyZVk7XG4gIGNvbnNvbGUubG9nKFxuICAgIFwic2NhbGVkIHBhdGggeFwiLFxuICAgIHNjYWxlZFBhdGhYLFxuICAgIHNjYWxlZFBhdGhXZHRoLFxuICAgIFwic2NhbGVkIHBhdGggeVwiLFxuICAgIHNjYWxlZFBhdGhZLFxuICAgIHNjYWxlZFBhdGhIZ2h0LFxuICAgIFwiZmFjdG9yIGZyb20gc2NhbGVcIixcbiAgICAob3JpZ1BhdGhIZ2h0IC0gb3JpZ1BhdGhXZHRoKSAvIDIsXG4gICAgXCJ4ZmFjdG9yIGZyb20gZ1wiXG4gICk7XG4gIHJldHVybiB7IHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUgfTtcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtZWRQYXRoRFN0cihvbGRQYXRoRFN0ciwgcGF0aFRyYW5zbFgsIHBhdGhUcmFuc2xZLCBzY2FsZSkge1xuICAvLyBjb25zdGFudHMgdG8gaGVscCBrZWVwIHRyYWNrIG9mIHRoZSB0eXBlcyBvZiBTVkcgY29tbWFuZHMgaW4gdGhlIHBhdGhcbiAgdmFyIEJPVEhfWF9BTkRfWSA9IDE7XG4gIHZhciBKVVNUX1ggPSAyO1xuICB2YXIgSlVTVF9ZID0gMztcbiAgdmFyIE5PTkUgPSA0O1xuICB2YXIgRUxMSVBUSUNBTF9BUkMgPSA1O1xuICB2YXIgQUJTT0xVVEUgPSA2O1xuICB2YXIgUkVMQVRJVkUgPSA3O1xuXG4gIC8vIHR3byBwYXJhbGxlbCBhcnJheXMsIHdpdGggZWFjaCBlbGVtZW50IGJlaW5nIG9uZSBjb21wb25lbnQgb2YgdGhlXG4gIC8vIFwiZFwiIGF0dHJpYnV0ZSBvZiB0aGUgU1ZHIHBhdGgsIHdpdGggb25lIGNvbXBvbmVudCBiZWluZyBlaXRoZXJcbiAgLy8gYW4gaW5zdHJ1Y3Rpb24gKGUuZy4gXCJNXCIgZm9yIG1vdmV0bywgZXRjLikgb3IgbnVtZXJpY2FsIHZhbHVlXG4gIC8vIGZvciBlaXRoZXIgYW4geCBvciB5IGNvb3JkaW5hdGVcbiAgdmFyIG9sZFBhdGhEQXJyID0gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhvbGRQYXRoRFN0cik7XG4gIHZhciBuZXdQYXRoREFyciA9IFtdO1xuXG4gIHZhciBjb21tYW5kUGFyYW1zLCBhYnNPclJlbCwgb2xkUGF0aERDb21wLCBuZXdQYXRoRENvbXA7XG5cbiAgLy8gZWxlbWVudCBpbmRleFxuICB2YXIgaWR4ID0gMDtcblxuICB3aGlsZSAoaWR4IDwgb2xkUGF0aERBcnIubGVuZ3RoKSB7XG4gICAgdmFyIG9sZFBhdGhEQ29tcCA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgaWYgKC9eW0EtWmEtel0kLy50ZXN0KG9sZFBhdGhEQ29tcCkpIHtcbiAgICAgIC8vIGNvbXBvbmVudCBpcyBhIHNpbmdsZSBsZXR0ZXIsIGkuZS4gYW4gc3ZnIHBhdGggY29tbWFuZFxuICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgICBzd2l0Y2ggKG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgXCJBXCI6IC8vIGVsbGlwdGljYWwgYXJjIGNvbW1hbmQuLi50aGUgbW9zdCBjb21wbGljYXRlZCBvbmVcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gRUxMSVBUSUNBTF9BUkM7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJIXCI6IC8vIGhvcml6b250YWwgbGluZTsgcmVxdWlyZXMgb25seSBhbiB4LWNvb3JkaW5hdGVcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9YO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiVlwiOiAvLyB2ZXJ0aWNhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGEgeS1jb29yZGluYXRlXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlpcIjogLy8gY2xvc2UgdGhlIHBhdGhcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gTk9ORTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBhbGwgb3RoZXIgY29tbWFuZHM7IGFsbCBvZiB0aGVtIHJlcXVpcmUgYm90aCB4IGFuZCB5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEJPVEhfWF9BTkRfWTtcbiAgICAgIH1cbiAgICAgIGFic09yUmVsID1cbiAgICAgICAgb2xkUGF0aERDb21wID09PSBvbGRQYXRoRENvbXAudG9VcHBlckNhc2UoKSA/IEFCU09MVVRFIDogUkVMQVRJVkU7XG4gICAgICAvLyBsb3dlcmNhc2UgY29tbWFuZHMgYXJlIHJlbGF0aXZlLCB1cHBlcmNhc2UgYXJlIGFic29sdXRlXG4gICAgICBpZHggKz0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdGhlIGNvbXBvbmVudCBpcyBub3QgYSBsZXR0ZXIsIHRoZW4gaXQgaXMgYSBudW1lcmljIHZhbHVlXG4gICAgICB2YXIgdHJhbnNsWCwgdHJhbnNsWTtcbiAgICAgIGlmIChhYnNPclJlbCA9PT0gQUJTT0xVVEUpIHtcbiAgICAgICAgLy8gdGhlIHRyYW5zbGF0aW9uIGlzIHJlcXVpcmVkIGZvciBhYnNvbHV0ZSBjb21tYW5kcy4uLlxuICAgICAgICB0cmFuc2xYID0gcGF0aFRyYW5zbFg7XG4gICAgICAgIHRyYW5zbFkgPSBwYXRoVHJhbnNsWTtcbiAgICAgIH0gZWxzZSBpZiAoYWJzT3JSZWwgPT09IFJFTEFUSVZFKSB7XG4gICAgICAgIC8vIC4uLmJ1dCBub3QgcmVsYXRpdmUgb25lc1xuICAgICAgICB0cmFuc2xYID0gMDtcbiAgICAgICAgdHJhbnNsWSA9IDA7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGNvbW1hbmRQYXJhbXMpIHtcbiAgICAgICAgLy8gZmlndXJlIG91dCB3aGljaCBvZiB0aGUgbnVtZXJpYyB2YWx1ZXMgZm9sbG93aW5nIGFuIHN2ZyBjb21tYW5kXG4gICAgICAgIC8vIGFyZSByZXF1aXJlZCwgYW5kIHRoZW4gdHJhbnNmb3JtIHRoZSBudW1lcmljIHZhbHVlKHMpIGZyb20gdGhlXG4gICAgICAgIC8vIG9yaWdpbmFsIHBhdGggZC1hdHRyaWJ1dGUgYW5kIHBsYWNlIGl0IGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZVxuICAgICAgICAvLyBhcnJheSB0aGF0IHdpbGwgZXZlbnR1YWxseSBiZWNvbWUgdGhlIGQtYXR0cmlidXRlIGZvciB0aGUgbmV3IHBhdGhcbiAgICAgICAgY2FzZSBCT1RIX1hfQU5EX1k6XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgaWR4ICs9IDI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSlVTVF9YOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSlVTVF9ZOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRUxMSVBUSUNBTF9BUkM6XG4gICAgICAgICAgLy8gdGhlIGVsbGlwdGljYWwgYXJjIGhhcyB4IGFuZCB5IHZhbHVlcyBpbiB0aGUgZmlyc3QgYW5kIHNlY29uZCBhcyB3ZWxsIGFzXG4gICAgICAgICAgLy8gdGhlIDZ0aCBhbmQgN3RoIHBvc2l0aW9ucyBmb2xsb3dpbmcgdGhlIGNvbW1hbmQ7IHRoZSBpbnRlcnZlbmluZyB2YWx1ZXNcbiAgICAgICAgICAvLyBhcmUgbm90IGFmZmVjdGVkIGJ5IHRoZSB0cmFuc2Zvcm1hdGlvbiBhbmQgc28gY2FuIHNpbXBseSBiZSBjb3BpZWRcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDFdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDFdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAyXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAyXSk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgM10gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgM10pO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDRdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDRdKTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA1XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA1XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNl0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSA3O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5PTkU6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgXCJudW1lcmljIHZhbHVlIHNob3VsZCBub3QgZm9sbG93IHRoZSBTVkcgWi96IGNvbW1hbmRcIlxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdQYXRoREFyci5qb2luKFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhzdHIpIHtcbiAgLy8gYXNzdW1pbmcgdGhlIHN0cmluZyBmcm9tIHRoZSBkLWF0dHJpYnV0ZSBvZiB0aGUgcGF0aCBoYXMgYWxsIGNvbXBvbmVudHNcbiAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLCB0aGVuIGNyZWF0ZSBhbiBhcnJheSBvZiBjb21wb25lbnRzIGJ5XG4gIC8vIHNpbXBseSBzcGxpdHRpbmcgdGhlIHN0cmluZyBhdCB0aG9zZSBzcGFjZXNcbiAgc3RyID0gc3RhbmRhcmRpemVQYXRoRFN0ckZvcm1hdChzdHIpO1xuICByZXR1cm4gc3RyLnNwbGl0KFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gc3RhbmRhcmRpemVQYXRoRFN0ckZvcm1hdChzdHIpIHtcbiAgLy8gVGhlIFNWRyBzdGFuZGFyZCBpcyBmbGV4aWJsZSB3aXRoIHJlc3BlY3QgdG8gaG93IHBhdGggZC1zdHJpbmdzIGFyZVxuICAvLyBmb3JtYXR0ZWQgYnV0IHRoaXMgbWFrZXMgcGFyc2luZyB0aGVtIG1vcmUgZGlmZmljdWx0LiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXNcbiAgLy8gdGhhdCBhbGwgU1ZHIHBhdGggZC1zdHJpbmcgY29tcG9uZW50cyAoaS5lLiBib3RoIGNvbW1hbmRzIGFuZCB2YWx1ZXMpIGFyZVxuICAvLyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UuXG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvLC9nLCBcIiBcIikgLy8gcmVwbGFjZSBlYWNoIGNvbW1hIHdpdGggYSBzcGFjZVxuICAgIC5yZXBsYWNlKC8tL2csIFwiIC1cIikgLy8gcHJlY2VkZSBlYWNoIG1pbnVzIHNpZ24gd2l0aCBhIHNwYWNlXG4gICAgLnJlcGxhY2UoLyhbQS1aYS16XSkvZywgXCIgJDEgXCIpIC8vIHNhbmR3aWNoIGVhY2ggICBsZXR0ZXIgYmV0d2VlbiAyIHNwYWNlc1xuICAgIC5yZXBsYWNlKC8gIC9nLCBcIiBcIikgLy8gY29sbGFwc2UgcmVwZWF0ZWQgc3BhY2VzIHRvIGEgc2luZ2xlIHNwYWNlXG4gICAgLnJlcGxhY2UoLyAoW0VlXSkgL2csIFwiJDFcIikgLy8gcmVtb3ZlIGZsYW5raW5nIHNwYWNlcyBhcm91bmQgZXhwb25lbnQgc3ltYm9sc1xuICAgIC5yZXBsYWNlKC9eIC9nLCBcIlwiKSAvLyB0cmltIGFueSBsZWFkaW5nIHNwYWNlXG4gICAgLnJlcGxhY2UoLyAkL2csIFwiXCIpOyAvLyB0cmltIGFueSB0YWlsaW5nIHNwYWNlXG59XG4qL1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZVxuX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2NvZGUudHNcIik7XG4vLyBUaGlzIGVudHJ5IG1vZHVsZSB1c2VkICdleHBvcnRzJyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG4iXSwic291cmNlUm9vdCI6IiJ9