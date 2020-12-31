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
        const id = msg.id;
        console.log(msg);
        const visualization = figma.createNodeFromSvg(msg.object);
        visualization.name = `Visualization - ${id}`;
        visualization.locked = true;
        // place annotations layer on top and make transparent
        const newAnnotationsLayer = figma.createFrame();
        const paddingWidthMatches = msg.object.match(PADDING_WIDTH_REGEX);
        const paddingHeightMatches = msg.object.match(PADDING_HEIGHT_REGEX);
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
        newAnnotationsLayer.name = `Annotations Layer - ${id}`;
        // grab width and height
        // set annotations width and height
        const widthMatches = msg.object.match(SVG_WIDTH_REGEX);
        const heightMatches = msg.object.match(SVG_HEIGHT_REGEX);
        if (widthMatches && heightMatches) {
            const width = Number(widthMatches[0]);
            const height = Number(heightMatches[0]);
            newAnnotationsLayer.resize(width, height);
        }
        //
        const group = figma.group([newAnnotationsLayer, visualization], figma.currentPage);
        group.name = `Vega View ${msg.id}`;
        group.setPluginData("type", "vegaView");
        group.setPluginData("annotationSpec", "{}");
        group.setPluginData("annotationNodeId", newAnnotationsLayer.id);
        group.setPluginData("annotationSpec", msg.vegaSpec);
        group.setPluginData("annotationNodeId", visualization.id);
        if (paddingWidthMatches) {
            const widthString = paddingWidthMatches[0];
            group.setPluginData("vegaPaddingWidth", widthString);
        }
        if (paddingHeightMatches) {
            const heightString = paddingHeightMatches[0];
            group.setPluginData("vegaPaddingHeight", heightString);
        }
        figma.ui.postMessage({
            viewNodeId: group.id,
            visualizationNodeId: visualization.id,
            annotationsNodeId: newAnnotationsLayer.id,
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
        "visualizationSpec",
        "annotationSpec",
        "vegaPaddingWidth",
        "vegaPaddingHeight",
        "annotationsNodeId",
        "visualizationNodeId",
    ];
    const extractedData = { nodeId: node.id };
    for (const property of propertiesToExtract) {
        const data = node.getPluginData(property);
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
figma.ui.resize(600, 350);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92ZWdhLWZpLy4vc3JjL2NvZGUudHMiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly92ZWdhLWZpL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxVQUFVLHFCQUFxQjtBQUMvQixVQUFVLGlCQUFpQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFdBQVc7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxXQUFXO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELEdBQUc7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxHQUFHO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsT0FBTztBQUN6QztBQUNBLGlEQUFpRDtBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwrQkFBK0I7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCLFlBQVksV0FBVyxFQUFFO0FBQy9DLG9CQUFvQixVQUFVLE9BQU87QUFDckMsY0FBYztBQUNkLFdBQVc7QUFDWDtBQUNBLHFCQUFxQixVQUFVLE9BQU87QUFDdEMsc0JBQXNCLFVBQVUsUUFBUTtBQUN4QyxrQkFBa0IsV0FBVyxJQUFJO0FBQ2pDLGtCQUFrQixXQUFXO0FBQzdCO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSxrQ0FBa0MscURBQXFEO0FBQ3ZGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLDZDQUE2QztBQUMzRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkI7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsV0FBVyxjQUFjO0FBQzlEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQyxZQUFZLDJDQUEyQyxFQUFFO0FBQzNGO0FBQ0EsNkNBQTZDLFdBQVcsdUJBQXVCO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DLFlBQVksMkNBQTJDLEVBQUU7QUFDN0Y7QUFDQSwrQ0FBK0MsV0FBVyx5QkFBeUI7QUFDbkY7QUFDQTtBQUNBLDJDQUEyQyxpQkFBaUI7QUFDNUQ7QUFDQTtBQUNBLDZDQUE2QyxXQUFXLG1CQUFtQjtBQUMzRTtBQUNBO0FBQ0EsNENBQTRDLFdBQVcsa0JBQWtCO0FBQ3pFO0FBQ0E7QUFDQSxrREFBa0QsV0FBVyx1QkFBdUI7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLDZCQUE2QjtBQUMzRSwrQ0FBK0MsNkJBQTZCO0FBQzVFO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsY0FBYztBQUNqQztBQUNBLHVCQUF1QixjQUFjO0FBQ3JDO0FBQ0EsMkJBQTJCLGNBQWM7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRDs7QUFFaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0EsMkNBQTJDO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBDQUEwQztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUU7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ1U7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkZBQTZGO0FBQzdGO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSx3Q0FBd0MsWUFBWSxJQUFJLFlBQVksV0FBVyxNQUFNOztBQUVyRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQSxlQUFlLHFCQUFxQixVQUFVLHFCQUFxQjtBQUNuRTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIseUJBQXlCOztBQUV6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0EsbUNBQW1DO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZEQUE2RDtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBOzs7Ozs7O1VDajNCQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0NyQkE7V0FDQTtXQUNBO1dBQ0Esc0RBQXNELGtCQUFrQjtXQUN4RTtXQUNBLCtDQUErQyxjQUFjO1dBQzdELEU7Ozs7VUNOQTtVQUNBO1VBQ0E7VUFDQSIsImZpbGUiOiJjb2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy9pbXBvcnQge2NyZWF0ZU5vcm1hbGl6ZWRQYXRofSBmcm9tIFwiLi9oZWxwZXJGdW5jdGlvbnNcIjtcbi8vaW1wb3J0IHtTVkdwYXRoLCBTVkdzZWdzfSBmcm9tICcuL1NWR1BhdGhzLmpzJztcbi8vIFRoaXMgcGx1Z2luIHdpbGwgb3BlbiBhIHdpbmRvdyB0byBwcm9tcHQgdGhlIHVzZXIgdG8gZW50ZXIgYSBudW1iZXIsIGFuZFxuLy8gaXQgd2lsbCB0aGVuIGNyZWF0ZSB0aGF0IG1hbnkgcmVjdGFuZ2xlcyBvbiB0aGUgc2NyZWVuLlxuLy8gVGhpcyBmaWxlIGhvbGRzIHRoZSBtYWluIGNvZGUgZm9yIHRoZSBwbHVnaW5zLiBJdCBoYXMgYWNjZXNzIHRvIHRoZSAqZG9jdW1lbnQqLlxuLy8gWW91IGNhbiBhY2Nlc3MgYnJvd3NlciBBUElzIGluIHRoZSA8c2NyaXB0PiB0YWcgaW5zaWRlIFwidWkuaHRtbFwiIHdoaWNoIGhhcyBhXG4vLyBmdWxsIGJyb3dzZXIgZW52aXJvbm1lbnQgKHNlZSBkb2N1bWVudGF0aW9uKS5cbi8vIFRoaXMgc2hvd3MgdGhlIEhUTUwgcGFnZSBpbiBcInVpLmh0bWx2aWV3c0RhdGFcIi5cbmZpZ21hLnNob3dVSShfX2h0bWxfXyk7XG5jb25zdCBQQURESU5HX1dJRFRIX1JFR0VYID0gLyg/PD10cmFuc2xhdGVcXCgpXFxkKy87XG5jb25zdCBQQURESU5HX0hFSUdIVF9SRUdFWCA9IC8oPzw9dHJhbnNsYXRlXFwoXFxkKywpXFxkKy87XG5jb25zdCBTVkdfV0lEVEhfUkVHRVggPSAvKD88PXdpZHRoPVwiKVxcZCsvO1xuY29uc3QgU1ZHX0hFSUdIVF9SRUdFWCA9IC8oPzw9aGVpZ2h0PVwiKVxcZCsvO1xuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIHNlYXJjaCB0aHJvdWdoIGFsbCB0b3AgbGV2ZWwgbm9kZXMgb2YgZWFjaCBwYWdlIGluIGEgZmlnbWEgZG9jdW1lbnRcbiAqIHJldHVybnMgYSBsaXN0IG9mIG1hdGNoaW5nIGZpZ21hIG5vZGVzXG4gKiBAcGFyYW0gY3VycmVudFBhZ2VcbiAqIEBwYXJhbSBzZWFyY2hGdW5jdGlvbiBwcmVkaWNhdGUgcnVuIG9uIGVhY2ggY2hpbGQgbm9kZSBvZiB0aGUgcGFnZVxuICovXG5mdW5jdGlvbiBzZWFyY2hUb3BMZXZlbChyb290LCBzZWFyY2hQcmVkaWNhdGUpIHtcbiAgICBjb25zdCBzZWFyY2hSZXN1bHRzID0gW107XG4gICAgY29uc3Qgbm9kZUl0ZXJhdG9yID0gd2Fsa1RyZWVUb0RlcHRoKHJvb3QsIDAsIDMpO1xuICAgIGxldCBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgd2hpbGUgKCFub2RlU3RlcC5kb25lKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2RlU3RlcC52YWx1ZTtcbiAgICAgICAgaWYgKHNlYXJjaFByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICAgICAgc2VhcmNoUmVzdWx0cy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICB9XG4gICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBjaGlsZCBub2RlcyBvZiBjdXJyZW50IHBhZ2VcbiAgICByZXR1cm4gc2VhcmNoUmVzdWx0cztcbn1cbmZ1bmN0aW9uKiB3YWxrVHJlZVRvRGVwdGgobm9kZSwgY3VycmVudERlcHRoID0gMSwgbWF4RGVwdGggPSAyKSB7XG4gICAgeWllbGQgbm9kZTtcbiAgICBjb25zdCB7IGNoaWxkcmVuIH0gPSBub2RlO1xuICAgIGlmIChjaGlsZHJlbiAmJiBjdXJyZW50RGVwdGggPD0gbWF4RGVwdGgpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgeWllbGQqIHdhbGtUcmVlVG9EZXB0aChjaGlsZCwgY3VycmVudERlcHRoICsgMSwgbWF4RGVwdGgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gY2xvbmUodmFsKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlID09PSBcIm51bWJlclwiIHx8IHR5cGUgPT09IFwic3RyaW5nXCIgfHwgdHlwZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwubWFwKCh4KSA9PiBjbG9uZSh4KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgbyA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsKSB7XG4gICAgICAgICAgICAgICAgb1trZXldID0gY2xvbmUodmFsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgXCJ1bmtub3duXCI7XG59XG5mdW5jdGlvbiogd2Fsa1RyZWUobm9kZSkge1xuICAgIHlpZWxkIG5vZGU7XG4gICAgY29uc3QgeyBjaGlsZHJlbiB9ID0gbm9kZTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgeWllbGQqIHdhbGtUcmVlKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIENhbGxzIHRvIFwicGFyZW50LnBvc3RNZXNzYWdlXCIgZnJvbSB3aXRoaW4gdGhlIEhUTUwgcGFnZSB3aWxsIHRyaWdnZXIgdGhpc1xuLy8gY2FsbGJhY2suIFRoZSBjYWxsYmFjayB3aWxsIGJlIHBhc3NlZCB0aGUgXCJwbHVnaW5NZXNzYWdlXCIgcHJvcGVydHkgb2YgdGhlXG4vLyBwb3N0ZWQgbWVzc2FnZS5cbmZpZ21hLnVpLm9ubWVzc2FnZSA9IChtc2cpID0+IHtcbiAgICAvLyBPbmUgd2F5IG9mIGRpc3Rpbmd1aXNoaW5nIGJldHdlZW4gZGlmZmVyZW50IHR5cGVzIG9mIG1lc3NhZ2VzIHNlbnQgZnJvbVxuICAgIC8vIHlvdXIgSFRNTCBwYWdlIGlzIHRvIHVzZSBhbiBvYmplY3Qgd2l0aCBhIFwidHlwZVwiIHByb3BlcnR5IGxpa2UgdGhpcy5cbiAgICBmaWdtYS5yb290LmNoaWxkcmVuO1xuICAgIGlmIChtc2cudHlwZSA9PT0gXCJjcmVhdGVcIikge1xuICAgICAgICAvLyBUT0RPOiBjYXN0IGFzIGEgY3JlYXRlIG1zZyB0eXBlXG4gICAgICAgIGNvbnN0IG5vZGVzID0gW107XG4gICAgICAgIGNvbnN0IGlkID0gbXNnLmlkO1xuICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgICAgICBjb25zdCB2aXN1YWxpemF0aW9uID0gZmlnbWEuY3JlYXRlTm9kZUZyb21TdmcobXNnLm9iamVjdCk7XG4gICAgICAgIHZpc3VhbGl6YXRpb24ubmFtZSA9IGBWaXN1YWxpemF0aW9uIC0gJHtpZH1gO1xuICAgICAgICB2aXN1YWxpemF0aW9uLmxvY2tlZCA9IHRydWU7XG4gICAgICAgIC8vIHBsYWNlIGFubm90YXRpb25zIGxheWVyIG9uIHRvcCBhbmQgbWFrZSB0cmFuc3BhcmVudFxuICAgICAgICBjb25zdCBuZXdBbm5vdGF0aW9uc0xheWVyID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgY29uc3QgcGFkZGluZ1dpZHRoTWF0Y2hlcyA9IG1zZy5vYmplY3QubWF0Y2goUEFERElOR19XSURUSF9SRUdFWCk7XG4gICAgICAgIGNvbnN0IHBhZGRpbmdIZWlnaHRNYXRjaGVzID0gbXNnLm9iamVjdC5tYXRjaChQQURESU5HX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmIChwYWRkaW5nV2lkdGhNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aFN0cmluZyA9IHBhZGRpbmdXaWR0aE1hdGNoZXNbMF07XG4gICAgICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLnNldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ1dpZHRoXCIsIHdpZHRoU3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFkZGluZ0hlaWdodE1hdGNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodFN0cmluZyA9IHBhZGRpbmdIZWlnaHRNYXRjaGVzWzBdO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWxscyA9IGNsb25lKG5ld0Fubm90YXRpb25zTGF5ZXIuZmlsbHMpO1xuICAgICAgICBmaWxsc1swXS5vcGFjaXR5ID0gMDtcbiAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5maWxscyA9IGZpbGxzO1xuICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLmNsaXBzQ29udGVudCA9IGZhbHNlO1xuICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLm5hbWUgPSBgQW5ub3RhdGlvbnMgTGF5ZXIgLSAke2lkfWA7XG4gICAgICAgIC8vIGdyYWIgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAvLyBzZXQgYW5ub3RhdGlvbnMgd2lkdGggYW5kIGhlaWdodFxuICAgICAgICBjb25zdCB3aWR0aE1hdGNoZXMgPSBtc2cub2JqZWN0Lm1hdGNoKFNWR19XSURUSF9SRUdFWCk7XG4gICAgICAgIGNvbnN0IGhlaWdodE1hdGNoZXMgPSBtc2cub2JqZWN0Lm1hdGNoKFNWR19IRUlHSFRfUkVHRVgpO1xuICAgICAgICBpZiAod2lkdGhNYXRjaGVzICYmIGhlaWdodE1hdGNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gTnVtYmVyKHdpZHRoTWF0Y2hlc1swXSk7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBOdW1iZXIoaGVpZ2h0TWF0Y2hlc1swXSk7XG4gICAgICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgICAvL1xuICAgICAgICBjb25zdCBncm91cCA9IGZpZ21hLmdyb3VwKFtuZXdBbm5vdGF0aW9uc0xheWVyLCB2aXN1YWxpemF0aW9uXSwgZmlnbWEuY3VycmVudFBhZ2UpO1xuICAgICAgICBncm91cC5uYW1lID0gYFZlZ2EgVmlldyAke21zZy5pZH1gO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwidHlwZVwiLCBcInZlZ2FWaWV3XCIpO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwiYW5ub3RhdGlvblNwZWNcIiwgXCJ7fVwiKTtcbiAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcImFubm90YXRpb25Ob2RlSWRcIiwgbmV3QW5ub3RhdGlvbnNMYXllci5pZCk7XG4gICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJhbm5vdGF0aW9uU3BlY1wiLCBtc2cudmVnYVNwZWMpO1xuICAgICAgICBncm91cC5zZXRQbHVnaW5EYXRhKFwiYW5ub3RhdGlvbk5vZGVJZFwiLCB2aXN1YWxpemF0aW9uLmlkKTtcbiAgICAgICAgaWYgKHBhZGRpbmdXaWR0aE1hdGNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoU3RyaW5nID0gcGFkZGluZ1dpZHRoTWF0Y2hlc1swXTtcbiAgICAgICAgICAgIGdyb3VwLnNldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ1dpZHRoXCIsIHdpZHRoU3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFkZGluZ0hlaWdodE1hdGNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodFN0cmluZyA9IHBhZGRpbmdIZWlnaHRNYXRjaGVzWzBdO1xuICAgICAgICAgICAgZ3JvdXAuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nSGVpZ2h0XCIsIGhlaWdodFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdmlld05vZGVJZDogZ3JvdXAuaWQsXG4gICAgICAgICAgICB2aXN1YWxpemF0aW9uTm9kZUlkOiB2aXN1YWxpemF0aW9uLmlkLFxuICAgICAgICAgICAgYW5ub3RhdGlvbnNOb2RlSWQ6IG5ld0Fubm90YXRpb25zTGF5ZXIuaWQsXG4gICAgICAgICAgICB0eXBlOiBcImZpbmlzaGVkQ3JlYXRlXCIsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChtc2cudHlwZSA9PT0gXCJmZXRjaFwiKSB7XG4gICAgICAgIC8vIHVzZXMgYSBmZXRjaCBieSBpZFxuICAgICAgICAvLyBmaW5kIGN1cnJlbnQgc2VsZWN0aW9uXG4gICAgICAgIC8vQHRzLWlnbm9yZSAgICAvL1xuICAgICAgICAvLyBncmFiIGFubm5vdGF0aW9ucyBsYXllcixcbiAgICAgICAgLy8gZ3JhYiBwbHVnaW4gZGF0YSBmb3IgdGhlIHdpZHRoL2hlaWdodCBwYWRkaW5nXG4gICAgICAgIC8vY29uc3QgbmV3U2VsZWN0aW9uID0gW2ZpZ21hLmZsYXR0ZW4oZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uKV07XG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdGlvbiA9IGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbjtcbiAgICAgICAgY29uc3QgbWFya3NUb0FkZCA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHNjZW5lTm9kZSBvZiBuZXdTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJdGVyYXRvciA9IHdhbGtUcmVlKHNjZW5lTm9kZSk7XG4gICAgICAgICAgICBsZXQgbm9kZVN0ZXAgPSBub2RlSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgd2hpbGUgKCFub2RlU3RlcC5kb25lKSB7XG4gICAgICAgICAgICAgICAgLy8gc2tpcCBub2RlIHR5cGVzXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVTdGVwLnZhbHVlLnR5cGUgPT09IFwiRlJBTUVcIiB8fCBub2RlU3RlcC52YWx1ZS50eXBlID09PSBcIkdST1VQXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVN0ZXAgPSBub2RlSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVTdGVwLnZhbHVlLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJub2RlIHZhbHVlXCIsIG5vZGUpO1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vZGVUeXBlIGlzIGdyb3VwXG4gICAgICAgICAgICAgICAgY29uc3QgdmVjdG9yaXplZE5vZGVzID0gdmVjdG9yaXplKG5vZGUpO1xuICAgICAgICAgICAgICAgIHZlY3Rvcml6ZWROb2Rlcy5tYXAoKHZlY3Rvcml6ZWROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHZlY3Rvcml6ZWROb2RlLnZlY3RvclBhdGhzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlld05vZGVJZDogbm9kZVN0ZXAudmFsdWUubm9kZUlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUlkOiB2ZWN0b3JpemVkTm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwibW9kaWZ5UGF0aFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0bGluZWRTdHJva2U6IHZlY3Rvcml6ZWROb2Rlcy5sZW5ndGggPiAxLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAobXNnLnR5cGUgPT09IFwic2VuZFNjYWxlZFwiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaW4gc2NhbGVkU2VuZCFcIiwgbXNnLm9iamVjdCk7XG4gICAgICAgIGNvbnN0IHZpZXdOb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQobXNnLnZpZXdOb2RlSWQpO1xuICAgICAgICBpZiAodmlld05vZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHZpc2F1bGl6YXRpb25QYWRkaW5nV2lkdGggPSBOdW1iZXIodmlld05vZGUuZ2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIikpO1xuICAgICAgICAgICAgY29uc3QgdmlzYXVsaXphdGlvblBhZGRpbmdIZWlnaHQgPSBOdW1iZXIodmlld05vZGUuZ2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nSGVpZ2h0XCIpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlY3Rvcml6ZWROb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQobXNnLm5vZGVJZCk7XG4gICAgICAgICAgICAvLyBsaW5lcyBhbmQgdmVjdG9yXG4gICAgICAgICAgICBpZiAodmVjdG9yaXplZE5vZGUudHlwZSAhPT0gXCJWRUNUT1JcIikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCwgdFgsIHRZLCBzY2FsZSB9ID0gY2FsY3VsYXRlUGxhY2VtZW50KHZlY3Rvcml6ZWROb2RlLCB2aXNhdWxpemF0aW9uUGFkZGluZ1dpZHRoLCB2aXNhdWxpemF0aW9uUGFkZGluZ0hlaWdodCk7XG4gICAgICAgICAgICBjb25zdCBzdHJva2VTcGVjcyA9IGNhbGN1bGF0ZVN0cm9rZVNwZWNzKHZlY3Rvcml6ZWROb2RlKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbGxTcGVjcyA9IGNhbGN1bGF0ZUZpbGxTcGVjcyh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgICAgICBjb25zdCBtaXNjU3BlY3MgPSBjYWxjdWxhdGVNaXNjU3BlY3ModmVjdG9yaXplZE5vZGUpO1xuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlTcGVjcyA9IFtdLmNvbmNhdChzdHJva2VTcGVjcywgZmlsbFNwZWNzLCBtaXNjU3BlY3MpO1xuICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRlZFNwZWNzID0gYHtcbiAgICAgICAgXCJ0eXBlXCI6IFwic3ltYm9sXCIsXG4gICAgICAgIFwiaW50ZXJhY3RpdmVcIjogZmFsc2UsXG4gICAgICAgIFwiZW5jb2RlXCI6IHtcbiAgICAgICAgICBcImVudGVyXCI6IHtcbiAgICAgICAgICAgIFwic2hhcGVcIjoge1widmFsdWVcIjogXCIke21zZy5vYmplY3R9XCJ9LFxuICAgICAgICAgICAgXCJzaXplXCI6e1widmFsdWVcIjoke3NjYWxlfX0sXG4gICAgICAgICAgICAke3Byb3BlcnR5U3BlY3Muam9pbihcIixcIil9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgICBcIndpZHRoXCI6e1widmFsdWVcIjoke3dpZHRofX0sXG4gICAgICAgICAgICBcImhlaWdodFwiOntcInZhbHVlXCI6JHtoZWlnaHR9fSxcbiAgICAgICAgICAgIFwieFwiOiB7XCJ2YWx1ZVwiOiAke3RYfX0sXG4gICAgICAgICAgICBcInlcIjoge1widmFsdWVcIjogJHt0WX19XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgfWA7XG4gICAgICAgICAgICB2ZWN0b3JpemVkTm9kZS5yZW1vdmUoKTtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgc3BlY1N0cmluZzogdHJhbnNsYXRlZFNwZWNzLCB0eXBlOiBcImZpbmlzaGVkTWFya3NcIiB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChtc2cudHlwZSA9PT0gXCJzdGFydFVwXCIpIHtcbiAgICAgICAgLy8gc2NhbiB0aHJvdWdoIGRvY3VtZW50IHRvIGZpbmQgYWxsIG5vZGVzIHdpdGggcGx1Z2luIGRhdGEgdHlwZSBtYXRjaGluZyB2ZWdhIHZpZXdcbiAgICAgICAgY29uc3QgY3VycmVudFZpZXdzID0gc2VhcmNoVG9wTGV2ZWwoZmlnbWEucm9vdCwgKG5vZGUpID0+IG5vZGUuZ2V0UGx1Z2luRGF0YShcInR5cGVcIikgPT09IFwidmVnYVZpZXdcIik7XG4gICAgICAgIGNvbnN0IHZpZXdzRGF0YSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IHZpZXcgb2YgY3VycmVudFZpZXdzKSB7XG4gICAgICAgICAgICBjb25zdCB2aWV3RGF0YSA9IGV4dHJhY3RWZWdhVmlld0RhdGEodmlldyk7XG4gICAgICAgICAgICB2aWV3c0RhdGEucHVzaCh2aWV3RGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB2aWV3c0RhdGE6IHZpZXdzRGF0YSwgdHlwZTogXCJzdGFydFVwVmlld3NcIiB9KTtcbiAgICB9XG4gICAgLy8gTWFrZSBzdXJlIHRvIGNsb3NlIHRoZSBwbHVnaW4gd2hlbiB5b3UncmUgZG9uZS4gT3RoZXJ3aXNlIHRoZSBwbHVnaW4gd2lsbFxuICAgIC8vIGtlZXAgcnVubmluZywgd2hpY2ggc2hvd3MgdGhlIGNhbmNlbCBidXR0b24gYXQgdGhlIGJvdHRvbSBvZiB0aGUgc2NyZWVuLlxuICAgIC8vZmlnbWEuY2xvc2VQbHVnaW4oKTtcbn07XG5mdW5jdGlvbiBleHRyYWN0VmVnYVZpZXdEYXRhKG5vZGUpIHtcbiAgICBjb25zdCBwcm9wZXJ0aWVzVG9FeHRyYWN0ID0gW1xuICAgICAgICBcInZpZXdJZFwiLFxuICAgICAgICBcInZpc3VhbGl6YXRpb25TcGVjXCIsXG4gICAgICAgIFwiYW5ub3RhdGlvblNwZWNcIixcbiAgICAgICAgXCJ2ZWdhUGFkZGluZ1dpZHRoXCIsXG4gICAgICAgIFwidmVnYVBhZGRpbmdIZWlnaHRcIixcbiAgICAgICAgXCJhbm5vdGF0aW9uc05vZGVJZFwiLFxuICAgICAgICBcInZpc3VhbGl6YXRpb25Ob2RlSWRcIixcbiAgICBdO1xuICAgIGNvbnN0IGV4dHJhY3RlZERhdGEgPSB7IG5vZGVJZDogbm9kZS5pZCB9O1xuICAgIGZvciAoY29uc3QgcHJvcGVydHkgb2YgcHJvcGVydGllc1RvRXh0cmFjdCkge1xuICAgICAgICBjb25zdCBkYXRhID0gbm9kZS5nZXRQbHVnaW5EYXRhKHByb3BlcnR5KTtcbiAgICAgICAgZXh0cmFjdGVkRGF0YVtwcm9wZXJ0eV0gPSBkYXRhO1xuICAgIH1cbiAgICByZXR1cm4gZXh0cmFjdGVkRGF0YTtcbn1cbmZ1bmN0aW9uIGlzTm90Tm9uZShwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eSAhPT0gXCJOT05FXCI7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVNaXNjU3BlY3Mobm9kZSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBbXTtcbiAgICBpZiAobm9kZS5vcGFjaXR5KSB7XG4gICAgICAgIC8vQHRzLWlnbm9yZSB3cm9uZyB0eXBpbmdzID9cbiAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcIm9wYWNpdHlcIjoge1widmFsdWVcIjogJHtub2RlLm9wYWNpdHl9fWApO1xuICAgIH1cbiAgICByZXR1cm4gYXR0cmlidXRlcztcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZUZpbGxTcGVjcyhub2RlKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtdO1xuICAgIGlmIChub2RlLmZpbGxzKSB7XG4gICAgICAgIC8vQHRzLWlnbm9yZSB3cm9uZyB0eXBpbmdzID9cbiAgICAgICAgY29uc3QgY29sb3IgPSBub2RlLmZpbGxzWzBdLmNvbG9yO1xuICAgICAgICBjb25zb2xlLmxvZyhcImNvbG9yc1wiLCBjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iLCByZ2JQZXJjZW50VG9IZXgoY29sb3IuciwgY29sb3IuZywgY29sb3IuYikpO1xuICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwiZmlsbFwiOiB7XCJ2YWx1ZVwiOiBcIiR7cmdiUGVyY2VudFRvSGV4KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpfVwifWApO1xuICAgICAgICBpZiAobm9kZS5maWxsc1swXS5vcGFjaXR5KSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwiZmlsbE9wYWNpdHlcIjoge1widmFsdWVcIjogJHtub2RlLmZpbGxzWzBdLm9wYWNpdHl9fWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlU3Ryb2tlU3BlY3Mobm9kZSkge1xuICAgIGNvbnNvbGUubG9nKFwiaW4gY2FsYyBzcGVjXCIsIG5vZGUpO1xuICAgIGNvbnN0IG5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobm9kZSk7XG4gICAgY29uc29sZS5sb2coXCJpbiBjYWxjIHNwZWMgbmFtZXNcIiwgbmFtZXMpO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBbXTtcbiAgICBpZiAobm9kZS5zdHJva2VzICYmIG5vZGUuc3Ryb2tlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vQHRzLWlnbm9yZSB3cm9uZyB0eXBpbmdzID9cbiAgICAgICAgY29uc3QgY29sb3IgPSBub2RlLnN0cm9rZXNbMF0uY29sb3I7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY29sb3JzXCIsIGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIsIHJnYlBlcmNlbnRUb0hleChjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKSk7XG4gICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VcIjoge1widmFsdWVcIjogXCIke3JnYlBlcmNlbnRUb0hleChjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKX1cIn1gKTtcbiAgICAgICAgaWYgKG5vZGUuc3Ryb2tlc1swXS5vcGFjaXR5KSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwic3Ryb2tlT3BhY2l0eVwiOiB7XCJ2YWx1ZVwiOiAke25vZGUuc3Ryb2tlc1swXS5vcGFjaXR5fX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zdHJva2VDYXAgPT09IFwiUk9VTkRcIiB8fCBub2RlLnN0cm9rZUNhcCA9PT0gXCJTUVVBUkVcIikge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZUNhcFwiOiB7XCJ2YWx1ZVwiOiBcInJvdW5kXCJ9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc3Ryb2tlV2VpZ2h0KSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwic3Ryb2tlV2lkdGhcIjoge1widmFsdWVcIjogJHtub2RlLnN0cm9rZVdlaWdodH19YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuZGFzaFBhdHRlcm4gJiYgbm9kZS5kYXNoUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwic3Ryb2tlRGFzaFwiOiB7XCJ2YWx1ZVwiOiAke25vZGUuZGFzaFBhdHRlcm59fWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnN0cm9rZU1pdGVyTGltaXQpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VNaXRlckxpbWl0XCI6IHtcInZhbHVlXCI6ICR7bm9kZS5zdHJva2VNaXRlckxpbWl0fX1gKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyByZXR1cm4gYWxsIHN0cm9rZSBwcm9wZXJ0aWVzIGFzIHN0cmluZ1xuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xufVxuZnVuY3Rpb24gY29tcG9uZW50VG9IZXgoYykge1xuICAgIHZhciBoZXggPSBjLnRvU3RyaW5nKDE2KTtcbiAgICByZXR1cm4gaGV4Lmxlbmd0aCA9PSAxID8gXCIwXCIgKyBoZXggOiBoZXg7XG59XG5mdW5jdGlvbiByZ2JQZXJjZW50VG9IZXgociwgZywgYikge1xuICAgIHJldHVybiAoXCIjXCIgK1xuICAgICAgICBjb21wb25lbnRUb0hleChNYXRoLnJvdW5kKHIgKiAyNTUpKSArXG4gICAgICAgIGNvbXBvbmVudFRvSGV4KE1hdGgucm91bmQoMjU1ICogZykpICtcbiAgICAgICAgY29tcG9uZW50VG9IZXgoTWF0aC5yb3VuZCgyNTUgKiBiKSkpO1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlUGxhY2VtZW50KG5vZGUsIHBhZGRpbmdYLCBwYWRkaW5nWSkge1xuICAgIGNvbnN0IHdpZHRoID0gbm9kZS53aWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSBub2RlLmhlaWdodDtcbiAgICBjb25zdCB4ID0gbm9kZS54O1xuICAgIGNvbnN0IHkgPSBub2RlLnk7XG4gICAgY29uc3QgbWF4RGltZW5zaW9uID0gTWF0aC5tYXgod2lkdGgsIGhlaWdodCk7XG4gICAgY29uc3QgdFggPSAoMSAvIDIpICogd2lkdGggKyB4IC0gcGFkZGluZ1g7IC8vKyAobWF4RGltZW5zaW9uLWhlaWdodCkvMjsgLy8gdG90YWwgdHJhbnNsYXRlXG4gICAgY29uc3QgdFkgPSAoMSAvIDIpICogaGVpZ2h0ICsgeSAtIHBhZGRpbmdZOyAvLysgKG1heERpbWVuc2lvbi1oZWlnaHQpLzI7IC8vIHRvdGFsIHRyYW5zbGF0ZVxuICAgIGNvbnN0IHNjYWxlID0gbWF4RGltZW5zaW9uICogbWF4RGltZW5zaW9uO1xuICAgIHJldHVybiB7IHdpZHRoLCBoZWlnaHQsIHRYLCB0WSwgc2NhbGUgfTtcbn1cbmZ1bmN0aW9uIHNob3VsZE5vZGVCZU91dGxpbmVTdHJva2VzKG5vZGUpIHtcbiAgICBjb25zb2xlLmxvZyhcImluIG91dGxpbmVcIiwgbm9kZSk7XG4gICAgLy8gaWYgdGhlIGl0ZW0gaGFzIGFuIGFycm93IGVuZCwgb3V0bGluZSBzdHJva2UgYmVjYXVzZSBhcnJvdyBzdHJva2UgY2FwIGNhbm5vdCBiZSBhcHBsaWVkIDooXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gXCJWRUNUT1JcIiAmJlxuICAgICAgICBcInN0cm9rZUNhcFwiIGluIG5vZGUudmVjdG9yTmV0d29yay52ZXJ0aWNlc1tub2RlLnZlY3Rvck5ldHdvcmsudmVydGljZXMubGVuZ3RoIC0gMV0gJiZcbiAgICAgICAgbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzW25vZGUudmVjdG9yTmV0d29yay52ZXJ0aWNlcy5sZW5ndGggLSAxXS5zdHJva2VDYXAgIT09IFwiTk9ORVwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChcInN0cm9rZUFsaWduXCIgaW4gbm9kZSAmJiBub2RlLnN0cm9rZUFsaWduICE9PSBcIkNFTlRFUlwiKSB7XG4gICAgICAgIC8vbm9kZS5zdHJva2VBbGlnbiA9IFwiQ0VOVEVSXCI7XG4gICAgICAgIC8vIGFzIHZlZ2EgZG9lc24ndCBzdXBwb3J0IGluc2lkZSBvciBjZW50ZXIsIG91dGxpbmUgc3Ryb2tlXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiB2ZWN0b3JpemUobm9kZSkge1xuICAgIGNvbnN0IG5vZGVzVG9SZXR1cm4gPSBbXTtcbiAgICAvLyBpZiBub2RlIGlzIHRleHQsIGNvbWJpbmUgYWxsIHZlY3RvciBwYXRoc1xuICAgIGxldCB2ZWN0b3JOb2RlID0gZmlnbWEuZmxhdHRlbihbbm9kZV0pO1xuICAgIC8vIGxpbmVzIGFuZCB2ZWN0b3IgcGF0aHMgd2l0aCBzdHJva2VzXG4gICAgY29uc3Qgb3V0bGluZWROb2RlID0gdmVjdG9yTm9kZS5vdXRsaW5lU3Ryb2tlKCk7XG4gICAgLy8gaWYgbm8gZmlsbHMsIG91dGxpbmUgc3Ryb2tlXG4gICAgaWYgKG91dGxpbmVkTm9kZSAmJiBzaG91bGROb2RlQmVPdXRsaW5lU3Ryb2tlcyh2ZWN0b3JOb2RlKSkge1xuICAgICAgICBub2Rlc1RvUmV0dXJuLnB1c2gob3V0bGluZWROb2RlKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJvdXRsaW5lZFwiLCBvdXRsaW5lZE5vZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIm91dGxpbmUgcGF0aFwiLCBvdXRsaW5lZE5vZGUudmVjdG9yUGF0aHNbMF0uZGF0YSwgb3V0bGluZWROb2RlLnZlY3RvclBhdGhzWzBdLndpbmRpbmdSdWxlKTtcbiAgICAgICAgLy8gaGlkZSB0aGUgc3Ryb2tlcyFcbiAgICAgICAgdmVjdG9yTm9kZS5zdHJva2VzID0gW107XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwiYWZ0ZXJcIiwgdmVjdG9yTm9kZS52ZWN0b3JQYXRocyk7XG4gICAgY29uc29sZS5sb2codmVjdG9yTm9kZSk7XG4gICAgbm9kZXNUb1JldHVybi5wdXNoKHZlY3Rvck5vZGUpO1xuICAgIHJldHVybiBub2Rlc1RvUmV0dXJuO1xufVxuZnVuY3Rpb24gZGVnMlJhZGlhbihkZWcpIHtcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xufVxuZnVuY3Rpb24gbXVsdGlwbHlNYXRyaWNlcyhtYXRyaXhBLCBtYXRyaXhCKSB7XG4gICAgbGV0IGFOdW1Sb3dzID0gbWF0cml4QS5sZW5ndGg7XG4gICAgbGV0IGFOdW1Db2xzID0gbWF0cml4QVswXS5sZW5ndGg7XG4gICAgbGV0IGJOdW1Sb3dzID0gbWF0cml4Qi5sZW5ndGg7XG4gICAgbGV0IGJOdW1Db2xzID0gbWF0cml4QlswXS5sZW5ndGg7XG4gICAgbGV0IG5ld01hdHJpeCA9IG5ldyBBcnJheShhTnVtUm93cyk7XG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCBhTnVtUm93czsgKytyKSB7XG4gICAgICAgIG5ld01hdHJpeFtyXSA9IG5ldyBBcnJheShiTnVtQ29scyk7XG4gICAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgYk51bUNvbHM7ICsrYykge1xuICAgICAgICAgICAgbmV3TWF0cml4W3JdW2NdID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYU51bUNvbHM7ICsraSkge1xuICAgICAgICAgICAgICAgIG5ld01hdHJpeFtyXVtjXSArPSBtYXRyaXhBW3JdW2ldICogbWF0cml4QltpXVtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3TWF0cml4O1xufVxuZnVuY3Rpb24gbXVsdGlwbHkoYSwgYikge1xuICAgIHJldHVybiBbXG4gICAgICAgIFtcbiAgICAgICAgICAgIGFbMF1bMF0gKiBiWzBdWzBdICsgYVswXVsxXSAqIGJbMV1bMF0sXG4gICAgICAgICAgICBhWzBdWzBdICogYlswXVsxXSArIGFbMF1bMV0gKiBiWzFdWzFdLFxuICAgICAgICAgICAgYVswXVswXSAqIGJbMF1bMl0gKyBhWzBdWzFdICogYlsxXVsyXSArIGFbMF1bMl0sXG4gICAgICAgIF0sXG4gICAgICAgIFtcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzBdICsgYVsxXVsxXSAqIGJbMV1bMF0sXG4gICAgICAgICAgICBhWzFdWzBdICogYlswXVsxXSArIGFbMV1bMV0gKiBiWzFdWzFdICsgMCxcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzJdICsgYVsxXVsxXSAqIGJbMV1bMl0gKyBhWzFdWzJdLFxuICAgICAgICBdLFxuICAgIF07XG59XG4vLyBDcmVhdGVzIGEgXCJtb3ZlXCIgdHJhbnNmb3JtLlxuZnVuY3Rpb24gbW92ZSh4LCB5KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgWzEsIDAsIHhdLFxuICAgICAgICBbMCwgMSwgeV0sXG4gICAgXTtcbn1cbi8vIENyZWF0ZXMgYSBcInJvdGF0ZVwiIHRyYW5zZm9ybS5cbmZ1bmN0aW9uIHJvdGF0ZSh0aGV0YSkge1xuICAgIHJldHVybiBbXG4gICAgICAgIFtNYXRoLmNvcyh0aGV0YSksIE1hdGguc2luKHRoZXRhKSwgMF0sXG4gICAgICAgIFstTWF0aC5zaW4odGhldGEpLCBNYXRoLmNvcyh0aGV0YSksIDBdLFxuICAgIF07XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVYWUZyb21Ob2RlKG5vZGUpIHtcbiAgICBsZXQgbG9jYXRpb25SZWxhdGl2ZVRvUGFyZW50WCA9IG5vZGUueDtcbiAgICBsZXQgbG9jYXRpb25SZWxhdGl2ZVRvUGFyZW50WSA9IG5vZGUueTtcbiAgICBsZXQgeCA9IG5vZGUud2lkdGggLyAyO1xuICAgIGxldCB5ID0gbm9kZS53aWR0aCAvIDI7XG4gICAgbGV0IHJvdGF0aW9uRGVnID0gLW5vZGUucm90YXRpb247XG4gICAgbGV0IHJvdGF0aW9uUmFkID0gKE1hdGguUEkgKiByb3RhdGlvbkRlZykgLyAxODA7XG4gICAgbGV0IHhUcmFuc2Zvcm0gPSB4IC0geCAqIE1hdGguY29zKHJvdGF0aW9uUmFkKSArIHkgKiBNYXRoLnNpbihyb3RhdGlvblJhZCk7XG4gICAgbGV0IHlUcmFuc2Zvcm0gPSB5IC0geCAqIE1hdGguc2luKHJvdGF0aW9uUmFkKSArIHkgKiBNYXRoLmNvcyhyb3RhdGlvblJhZCk7XG4gICAgbGV0IHJvdGF0aW9uVHJhbnNmb3JtID0gW1xuICAgICAgICBbTWF0aC5jb3Mocm90YXRpb25SYWQpLCAtTWF0aC5zaW4ocm90YXRpb25SYWQpLCB4VHJhbnNmb3JtXSxcbiAgICAgICAgW01hdGguc2luKHJvdGF0aW9uUmFkKSwgTWF0aC5jb3Mocm90YXRpb25SYWQpLCB5VHJhbnNmb3JtXSxcbiAgICBdO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBub2RlLnJlbGF0aXZlVHJhbnNmb3JtID0gcm90YXRpb25UcmFuc2Zvcm07XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIG5vZGUueCArPSBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRYO1xuICAgIG5vZGUueSArPSBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRZO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUueSksIEpTT04uc3RyaW5naWZ5KG5vZGUueCkpO1xufVxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IGNhbGN1bGF0ZXMgdGhlIGNvcnJlY3QgWFkgcG9zaXRpb24gaWdub3Jpbmcgcm90YXRpb25cbiAqIEBwYXJhbSBub2RlXG4gKi9cbmZ1bmN0aW9uIG5ld0NhbGN1bGF0ZVJlbGF0aXZlKG9yaWdpbmFsTm9kZSkge1xuICAgIGNvbnN0IG5vZGUgPSBvcmlnaW5hbE5vZGUuY2xvbmUoKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy9jb25zdCB4ID0gb3JpZ2luYWxOb2RlLng7XG4gICAgLy9jb25zdCB5ID0gb3JpZ2luYWxOb2RlLnk7XG4gICAgLy9ub2RlLnggPSAwO1xuICAgIC8vbm9kZS55ID0gMDtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLmFic29sdXRlVHJhbnNmb3JtKSk7XG4gICAgLy9ub2RlLnJvdGF0aW9uID0gMDtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbGV0IHRyYW5zZm9ybSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIC8vIG1vdmUgdG8gMFxuICAgIGxldCB4ID0gdHJhbnNmb3JtWzBdWzJdO1xuICAgIGxldCB5ID0gdHJhbnNmb3JtWzFdWzJdO1xuICAgIHRyYW5zZm9ybVswXVsyXSA9IDA7XG4gICAgdHJhbnNmb3JtWzFdWzJdID0gMDtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gMzYwXCIsIEpTT04uc3RyaW5naWZ5KHRyYW5zZm9ybSkpO1xuICAgIHRyYW5zZm9ybSA9IG11bHRpcGx5KHJvdGF0ZSgyICogTWF0aC5QSSAtIChub2RlLnJvdGF0aW9uIC0gTWF0aC5QSSkgLyAxODApLCB0cmFuc2Zvcm0pO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSBhZnRlciByb3RcIiwgSlNPTi5zdHJpbmdpZnkodHJhbnNmb3JtKSk7XG4gICAgdHJhbnNmb3JtID0gbXVsdGlwbHkobW92ZSh4LCB5KSwgdHJhbnNmb3JtKTtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gYWZ0ZXIgbW92ZVwiLCBKU09OLnN0cmluZ2lmeSh0cmFuc2Zvcm0pKTtcbiAgICBjb25zdCBkaWZYID0gbm9kZS54O1xuICAgIGNvbnN0IGRpZlkgPSBub2RlLnk7XG4gICAgY29uc29sZS5sb2coXCJjYWxjZWRcIiwgZGlmWCwgZGlmWSwgeCArIGRpZlgsIHkgKyBkaWZZKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgY29uc29sZS5sb2cobXVsdGlwbHkocm90YXRlKC1ub2RlLnJvdGF0aW9uKSwgdHJhbnNmb3JtKSk7XG4gICAgY29uc29sZS5sb2coXCJmcm9tIDM2MFwiLCBtdWx0aXBseShyb3RhdGUoLShub2RlLnJvdGF0aW9uIC0gTWF0aC5QSSkgLyAxODApLCBub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy8gcm90YXRlIGJhY2tcbiAgICBjb25zdCBhbmdsZUluUmFkaWFucyA9IGRlZzJSYWRpYW4oLW5vZGUucm90YXRpb24pO1xuICAgIGNvbnNvbGUubG9nKG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pO1xuICAgIGNvbnN0IG5ldHJhbnNmb3JtID0gbXVsdGlwbHkocm90YXRlKGFuZ2xlSW5SYWRpYW5zKSwgbm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSk7XG4gICAgY29uc29sZS5sb2cobmV0cmFuc2Zvcm0pO1xuICAgIC8qXG4gICAgY29uc29sZS5sb2cobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSlcbiAgICBsZXQgcm90ZXIgPSBub2RlLnJvdGF0aW9uO1xuICAgIG5vZGUucm90YXRpb24gPSAwO1xuICBcbiAgICBjb25zb2xlLmxvZygnb2xkIHgnLEpTT04uc3RyaW5naWZ5KG5vZGUueCksSlNPTi5zdHJpbmdpZnkobm9kZS55KSxKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbm9kZS5yb3RhdGlvbiA9IHJvdGVyO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCduZXcgeCcseCx5LEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKVxuICBcbiAgXG4gIFxuICAgIGNvbnN0IHdpZHRoID0gbm9kZS53aWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSBub2RlLmhlaWdodDtcbiAgICBjb25zb2xlLmxvZyh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjb25zdCByb3QgPSAobm9kZS5yb3RhdGlvbiAqIE1hdGguUEkpIC8gMTgwOyAvLyBpbiByYWRpYW5zXG4gIFxuICAgIC8vIG5vdGUsIHRvIGNhbGN1bGF0ZSBkaXN0YW5jZSBmcm9tIHJvdGF0aW9uLCB5b3UgbXVzdCBmbGlwIHRoZSBzaWduICAoMS8yKUggYmVjYXVzZSBpbiBjYXJ0ZXNpYW4gY29vcmRpbmF0ZXMgeSBERUNSRUFTRVMgYXMgeW91XG4gICAgY29uc3QgcmVhbFggPSB4ICsgKDEgLyAyKSAqIHdpZHRoICogTWF0aC5jb3Mocm90KSAvKi0gLTEgKiAoMSAvIDIpICogaGVpZ2h0ICogTWF0aC5zaW4ocm90KSAgLSAoMSAvIDIpICogd2lkdGg7XG4gICAgICBjb25zb2xlLmxvZyh5LCgxIC8gMikgKiB3aWR0aCAqIE1hdGguc2luKHJvdCksIC0xICogKDEgLyAyKSAqIGhlaWdodCAqIE1hdGguY29zKHJvdCksICgxIC8gMikgKiBoZWlnaHQpXG4gIFxuICAgIGNvbnN0IHJlYWxZID1cbiAgICAgIHkgKyAoMSAvIDIpICogd2lkdGggKiBNYXRoLnNpbihyb3QpIC8qKyAtMSAqICgxIC8gMikgKiBoZWlnaHQgKiBNYXRoLmNvcyhyb3QpICsoMSAvIDIpICogaGVpZ2h0O1xuICAgIHJldHVybiBbcmVhbFgsIHJlYWxZXTsqL1xuICAgIGNvbnN0IHRvdGFsTGVuZ3RoT2ZIeXBvID0gTWF0aC5zcXJ0KG5vZGUud2lkdGggKiBub2RlLndpZHRoICsgbm9kZS5oZWlnaHQgKiBub2RlLmhlaWdodCk7XG59XG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uLCBpLmUuIHRoZSB0cmFuc2xhdGlvbiBhbmQgc2NhbGluZywgcmVxdWlyZWRcbi8vIHRvIGdldCB0aGUgcGF0aCB0byBmaWxsIHRoZSBzdmcgYXJlYS4gTm90ZSB0aGF0IHRoaXMgYXNzdW1lcyB1bmlmb3JtXG4vLyBzY2FsaW5nLCBhIHBhdGggdGhhdCBoYXMgbm8gb3RoZXIgdHJhbnNmb3JtcyBhcHBsaWVkIHRvIGl0LCBhbmQgbm9cbi8vIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIHN2ZyB2aWV3cG9ydCBhbmQgdmlld0JveCBkaW1lbnNpb25zLlxuZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB2YXIgc3ZnV2R0aCA9IDI7XG4gICAgdmFyIHN2Z0hnaHQgPSAyO1xuICAgIHZhciBvcmlnUGF0aEhnaHQgPSBoZWlnaHQ7XG4gICAgdmFyIG9yaWdQYXRoV2R0aCA9IHdpZHRoO1xuICAgIHZhciBvcmlnUGF0aFkgPSB5O1xuICAgIHZhciBvcmlnUGF0aFggPSB4O1xuICAgIC8vIGhvdyBtdWNoIGJpZ2dlciBpcyB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBwYXRoIGluIGVhY2ggZGltZW5zaW9uP1xuICAgIHZhciBzY2FsZUJhc2VkT25XZHRoID0gc3ZnV2R0aCAvIG9yaWdQYXRoV2R0aDtcbiAgICB2YXIgc2NhbGVCYXNlZE9uSGdodCA9IHN2Z0hnaHQgLyBvcmlnUGF0aEhnaHQ7XG4gICAgLy8gb2YgdGhlIHNjYWxpbmcgZmFjdG9ycyBkZXRlcm1pbmVkIGluIGVhY2ggZGltZW5zaW9uLFxuICAgIC8vIHVzZSB0aGUgc21hbGxlciBvbmU7IG90aGVyd2lzZSBwb3J0aW9ucyBvZiB0aGUgcGF0aFxuICAgIC8vIHdpbGwgbGllIG91dHNpZGUgdGhlIHZpZXdwb3J0IChjb3JyZWN0IHRlcm0/KVxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKHNjYWxlQmFzZWRPbldkdGgsIHNjYWxlQmFzZWRPbkhnaHQpO1xuICAgIC8vIGNhbGN1bGF0ZSB0aGUgYm91bmRpbmcgYm94IHBhcmFtZXRlcnNcbiAgICAvLyBhZnRlciB0aGUgcGF0aCBoYXMgYmVlbiBzY2FsZWQgcmVsYXRpdmUgdG8gdGhlIG9yaWdpblxuICAgIC8vIGJ1dCBiZWZvcmUgYW55IHN1YnNlcXVlbnQgdHJhbnNsYXRpb25zIGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgdmFyIHNjYWxlZFBhdGhYID0gb3JpZ1BhdGhYICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhZID0gb3JpZ1BhdGhZICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhXZHRoID0gb3JpZ1BhdGhXZHRoICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhIZ2h0ID0gb3JpZ1BhdGhIZ2h0ICogc2NhbGU7XG4gICAgLy8gY2FsY3VsYXRlIHRoZSBjZW50cmUgcG9pbnRzIG9mIHRoZSBzY2FsZWQgYnV0IHVudHJhbnNsYXRlZCBwYXRoXG4gICAgLy8gYXMgd2VsbCBhcyBvZiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIHZhciBzY2FsZWRQYXRoQ2VudHJlWCA9IHNjYWxlZFBhdGhYICsgc2NhbGVkUGF0aFdkdGggLyAyO1xuICAgIHZhciBzY2FsZWRQYXRoQ2VudHJlWSA9IHNjYWxlZFBhdGhZICsgc2NhbGVkUGF0aEhnaHQgLyAyO1xuICAgIHZhciBzdmdSb290Q2VudHJlWCA9IDA7IC8vIC1zdmdXZHRoIC8gMjtcbiAgICB2YXIgc3ZnUm9vdENlbnRyZVkgPSAwOyAvLy1zdmdIZ2h0IC8gMjtcbiAgICAvLyBjYWxjdWxhdGUgdHJhbnNsYXRpb24gcmVxdWlyZWQgdG8gY2VudHJlIHRoZSBwYXRoXG4gICAgLy8gb24gdGhlIHN2ZyByb290IGVsZW1lbnRcbiAgICB2YXIgcGF0aFRyYW5zbFggPSBzdmdSb290Q2VudHJlWCAtIHNjYWxlZFBhdGhDZW50cmVYO1xuICAgIHZhciBwYXRoVHJhbnNsWSA9IHN2Z1Jvb3RDZW50cmVZIC0gc2NhbGVkUGF0aENlbnRyZVk7XG4gICAgY29uc29sZS5sb2coXCJzY2FsZWQgcGF0aCB4XCIsIHNjYWxlZFBhdGhYLCBzY2FsZWRQYXRoV2R0aCwgXCJzY2FsZWQgcGF0aCB5XCIsIHNjYWxlZFBhdGhZLCBzY2FsZWRQYXRoSGdodCwgXCJmYWN0b3IgZnJvbSBzY2FsZVwiLCAob3JpZ1BhdGhIZ2h0IC0gb3JpZ1BhdGhXZHRoKSAvIDIsIFwieGZhY3RvciBmcm9tIGdcIik7XG4gICAgLy9cbiAgICBjb25zb2xlLmxvZyhwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKTtcbiAgICByZXR1cm4geyBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlIH07XG59XG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1lZFBhdGhEU3RyKG9sZFBhdGhEU3RyLCBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKSB7XG4gICAgLy8gY29uc3RhbnRzIHRvIGhlbHAga2VlcCB0cmFjayBvZiB0aGUgdHlwZXMgb2YgU1ZHIGNvbW1hbmRzIGluIHRoZSBwYXRoXG4gICAgdmFyIEJPVEhfWF9BTkRfWSA9IDE7XG4gICAgdmFyIEpVU1RfWCA9IDI7XG4gICAgdmFyIEpVU1RfWSA9IDM7XG4gICAgdmFyIE5PTkUgPSA0O1xuICAgIHZhciBFTExJUFRJQ0FMX0FSQyA9IDU7XG4gICAgdmFyIEFCU09MVVRFID0gNjtcbiAgICB2YXIgUkVMQVRJVkUgPSA3O1xuICAgIC8vIHR3byBwYXJhbGxlbCBhcnJheXMsIHdpdGggZWFjaCBlbGVtZW50IGJlaW5nIG9uZSBjb21wb25lbnQgb2YgdGhlXG4gICAgLy8gXCJkXCIgYXR0cmlidXRlIG9mIHRoZSBTVkcgcGF0aCwgd2l0aCBvbmUgY29tcG9uZW50IGJlaW5nIGVpdGhlclxuICAgIC8vIGFuIGluc3RydWN0aW9uIChlLmcuIFwiTVwiIGZvciBtb3ZldG8sIGV0Yy4pIG9yIG51bWVyaWNhbCB2YWx1ZVxuICAgIC8vIGZvciBlaXRoZXIgYW4geCBvciB5IGNvb3JkaW5hdGVcbiAgICB2YXIgb2xkUGF0aERBcnIgPSBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKG9sZFBhdGhEU3RyKTtcbiAgICB2YXIgbmV3UGF0aERBcnIgPSBbXTtcbiAgICBjb25zb2xlLmxvZyhvbGRQYXRoREFycik7XG4gICAgdmFyIGNvbW1hbmRQYXJhbXMsIGFic09yUmVsLCBvbGRQYXRoRENvbXAsIG5ld1BhdGhEQ29tcDtcbiAgICAvLyBlbGVtZW50IGluZGV4XG4gICAgdmFyIGlkeCA9IDA7XG4gICAgd2hpbGUgKGlkeCA8IG9sZFBhdGhEQXJyLmxlbmd0aCkge1xuICAgICAgICB2YXIgb2xkUGF0aERDb21wID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICAgICAgaWYgKC9eW0EtWmEtel0kLy50ZXN0KG9sZFBhdGhEQ29tcCkpIHtcbiAgICAgICAgICAgIC8vIGNvbXBvbmVudCBpcyBhIHNpbmdsZSBsZXR0ZXIsIGkuZS4gYW4gc3ZnIHBhdGggY29tbWFuZFxuICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvbGRQYXRoRENvbXApO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmV3UGF0aERBcnJbaWR4XSk7XG4gICAgICAgICAgICBzd2l0Y2ggKG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFcIjogLy8gZWxsaXB0aWNhbCBhcmMgY29tbWFuZC4uLnRoZSBtb3N0IGNvbXBsaWNhdGVkIG9uZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gRUxMSVBUSUNBTF9BUkM7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6IC8vIGhvcml6b250YWwgbGluZTsgcmVxdWlyZXMgb25seSBhbiB4LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlZcIjogLy8gdmVydGljYWwgbGluZTsgcmVxdWlyZXMgb25seSBhIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9ZO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiWlwiOiAvLyBjbG9zZSB0aGUgcGF0aFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gTk9ORTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsIG90aGVyIGNvbW1hbmRzOyBhbGwgb2YgdGhlbSByZXF1aXJlIGJvdGggeCBhbmQgeSBjb29yZGluYXRlc1xuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gQk9USF9YX0FORF9ZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWJzT3JSZWwgPSBvbGRQYXRoRENvbXAgPT09IG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpID8gQUJTT0xVVEUgOiBSRUxBVElWRTtcbiAgICAgICAgICAgIC8vIGxvd2VyY2FzZSBjb21tYW5kcyBhcmUgcmVsYXRpdmUsIHVwcGVyY2FzZSBhcmUgYWJzb2x1dGVcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhlIGNvbXBvbmVudCBpcyBub3QgYSBsZXR0ZXIsIHRoZW4gaXQgaXMgYSBudW1lcmljIHZhbHVlXG4gICAgICAgICAgICB2YXIgdHJhbnNsWCwgdHJhbnNsWTtcbiAgICAgICAgICAgIGlmIChhYnNPclJlbCA9PT0gQUJTT0xVVEUpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgdHJhbnNsYXRpb24gaXMgcmVxdWlyZWQgZm9yIGFic29sdXRlIGNvbW1hbmRzLi4uXG4gICAgICAgICAgICAgICAgdHJhbnNsWCA9IHBhdGhUcmFuc2xYO1xuICAgICAgICAgICAgICAgIHRyYW5zbFkgPSBwYXRoVHJhbnNsWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFic09yUmVsID09PSBSRUxBVElWRSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLmJ1dCBub3QgcmVsYXRpdmUgb25lc1xuICAgICAgICAgICAgICAgIHRyYW5zbFggPSAwO1xuICAgICAgICAgICAgICAgIHRyYW5zbFkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChjb21tYW5kUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgLy8gZmlndXJlIG91dCB3aGljaCBvZiB0aGUgbnVtZXJpYyB2YWx1ZXMgZm9sbG93aW5nIGFuIHN2ZyBjb21tYW5kXG4gICAgICAgICAgICAgICAgLy8gYXJlIHJlcXVpcmVkLCBhbmQgdGhlbiB0cmFuc2Zvcm0gdGhlIG51bWVyaWMgdmFsdWUocykgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBvcmlnaW5hbCBwYXRoIGQtYXR0cmlidXRlIGFuZCBwbGFjZSBpdCBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGVcbiAgICAgICAgICAgICAgICAvLyBhcnJheSB0aGF0IHdpbGwgZXZlbnR1YWxseSBiZWNvbWUgdGhlIGQtYXR0cmlidXRlIGZvciB0aGUgbmV3IHBhdGhcbiAgICAgICAgICAgICAgICBjYXNlIEJPVEhfWF9BTkRfWTpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBKVVNUX1g6XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEpVU1RfWTpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgRUxMSVBUSUNBTF9BUkM6XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBlbGxpcHRpY2FsIGFyYyBoYXMgeCBhbmQgeSB2YWx1ZXMgaW4gdGhlIGZpcnN0IGFuZCBzZWNvbmQgYXMgd2VsbCBhc1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgNnRoIGFuZCA3dGggcG9zaXRpb25zIGZvbGxvd2luZyB0aGUgY29tbWFuZDsgdGhlIGludGVydmVuaW5nIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAvLyBhcmUgbm90IGFmZmVjdGVkIGJ5IHRoZSB0cmFuc2Zvcm1hdGlvbiBhbmQgc28gY2FuIHNpbXBseSBiZSBjb3BpZWRcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAyXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAyXSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDNdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDNdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNF0pO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA1XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA1XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDZdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDZdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgTk9ORTpcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibnVtZXJpYyB2YWx1ZSBzaG91bGQgbm90IGZvbGxvdyB0aGUgU1ZHIFoveiBjb21tYW5kXCIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhuZXdQYXRoREFycik7XG4gICAgcmV0dXJuIG5ld1BhdGhEQXJyLmpvaW4oXCIgXCIpO1xufVxuZnVuY3Rpb24gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhzdHIpIHtcbiAgICAvLyBhc3N1bWluZyB0aGUgc3RyaW5nIGZyb20gdGhlIGQtYXR0cmlidXRlIG9mIHRoZSBwYXRoIGhhcyBhbGwgY29tcG9uZW50c1xuICAgIC8vIHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzcGFjZSwgdGhlbiBjcmVhdGUgYW4gYXJyYXkgb2YgY29tcG9uZW50cyBieVxuICAgIC8vIHNpbXBseSBzcGxpdHRpbmcgdGhlIHN0cmluZyBhdCB0aG9zZSBzcGFjZXNcbiAgICBzdHIgPSBzdGFuZGFyZGl6ZVBhdGhEU3RyRm9ybWF0KHN0cik7XG4gICAgcmV0dXJuIHN0ci5zcGxpdChcIiBcIik7XG59XG5mdW5jdGlvbiBzdGFuZGFyZGl6ZVBhdGhEU3RyRm9ybWF0KHN0cikge1xuICAgIC8vIFRoZSBTVkcgc3RhbmRhcmQgaXMgZmxleGlibGUgd2l0aCByZXNwZWN0IHRvIGhvdyBwYXRoIGQtc3RyaW5ncyBhcmVcbiAgICAvLyBmb3JtYXR0ZWQgYnV0IHRoaXMgbWFrZXMgcGFyc2luZyB0aGVtIG1vcmUgZGlmZmljdWx0LiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXNcbiAgICAvLyB0aGF0IGFsbCBTVkcgcGF0aCBkLXN0cmluZyBjb21wb25lbnRzIChpLmUuIGJvdGggY29tbWFuZHMgYW5kIHZhbHVlcykgYXJlXG4gICAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLlxuICAgIHJldHVybiBzdHJcbiAgICAgICAgLnJlcGxhY2UoLywvZywgXCIgXCIpIC8vIHJlcGxhY2UgZWFjaCBjb21tYSB3aXRoIGEgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLy0vZywgXCIgLVwiKSAvLyBwcmVjZWRlIGVhY2ggbWludXMgc2lnbiB3aXRoIGEgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLyhbQS1aYS16XSkvZywgXCIgJDEgXCIpIC8vIHNhbmR3aWNoIGVhY2ggICBsZXR0ZXIgYmV0d2VlbiAyIHNwYWNlc1xuICAgICAgICAucmVwbGFjZSgvICAvZywgXCIgXCIpIC8vIGNvbGxhcHNlIHJlcGVhdGVkIHNwYWNlcyB0byBhIHNpbmdsZSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvIChbRWVdKSAvZywgXCIkMVwiKSAvLyByZW1vdmUgZmxhbmtpbmcgc3BhY2VzIGFyb3VuZCBleHBvbmVudCBzeW1ib2xzXG4gICAgICAgIC5yZXBsYWNlKC9eIC9nLCBcIlwiKSAvLyB0cmltIGFueSBsZWFkaW5nIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8gJC9nLCBcIlwiKTsgLy8gdHJpbSBhbnkgdGFpbGluZyBzcGFjZVxufVxuZmlnbWEudWkucmVzaXplKDYwMCwgMzUwKTtcbmV4cG9ydCB7fTtcbi8vIFVzaW5nIHJlbGF0aXZlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCAoZ2l2ZXMgc2tld2VkIHggdmFsdWUgZm9yIG5vbi1yb3RhdGVkKVxuLy9jb25zb2xlLmxvZygncmVseCcscmVsWzBdWzJdICsgKDEvMikqd2lkdGgqcmVsWzBdWzBdIC0oLTEpKigxLzIpKmhlaWdodCpyZWxbMF1bMF0gLSAoMS8yKSp3aWR0aCk7XG4vL2NvbnNvbGUubG9nKCdyZWx5JyxyZWxbMV1bMl0gICsoMS8yKSp3aWR0aCpyZWxbMV1bMF0tICgtMSkqKDEvMikqaGVpZ2h0KnJlbFsxXVsxXSAtICgxLzIpKmhlaWdodCk7XG4vKlxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHBcIikuaW5uZXJIVE1MID0gYFxuPHN2ZyAgaWQ9XCJiYXNlXCIgd2lkdGg9XCI4MDBcIiBoZWlnaHQ9XCI2MDBcIiB2aWV3Qm94PVwiMCAwIDgwMCA2MDBcIiBzdHlsZT1cImJvcmRlcjogMXB4IHNvbGlkIGJsdWU7XCI+XG4gICAgPHBhdGggaWQ9XCJub3Rtb3ZlZFwiIGZpbGw9XCIjZjAwXCIgc3Ryb2tlPVwibm9uZVwiIGQ9XCJNMTIyLjc2OSA0OC40OTE0QzEyNy4wMzggNDYuMTE3OSAxMjkuOTgzIDQzLjM3MjQgMTMxLjI3NCA0MC4yMTY4QzEzNi42MTQgMjcuMTY4NSAxMzMuNDcyIDE3LjM2MDQgMTI5LjAxNCAxMC44MDA3QzEyNi43NzkgNy41MTE1NCAxMjQuMjA4IDUuMDMzNzIgMTIyLjE5NSAzLjM3Nzg5QzEyMS4xODggMi41NTA1IDEyMC4zMjMgMS45Mjk4NSAxMTkuNzExIDEuNTE3MTVDMTE5LjQwNSAxLjMxMDg0IDExOS4xNjMgMS4xNTY2MiAxMTguOTk4IDEuMDU0NjFDMTE4LjkxNiAxLjAwMzYyIDExOC44NTMgMC45NjU2ODkgMTE4LjgxMSAwLjk0MDg0NUwxMTguNzY1IDAuOTEzMzkyTDExOC43NTQgMC45MDcwMzNMMTE4Ljc1MSAwLjkwNTY5OEMxMTguNzUxIDAuOTA1NzI0IDExOC43NTEgMC45MDU1OSAxMTkgMC40NzE2MThDMTE5LjI0OCAwLjAzNzY0NjYgMTE5LjI0OCAwLjAzNzgyNDMgMTE5LjI0OSAwLjAzODA1NEwxMTkuMjU0IDAuMDQxMTM4NUwxMTkuMjY5IDAuMDQ5NTg5MUMxMTkuMjgxIDAuMDU2ODc2MiAxMTkuMjk5IDAuMDY3NDcwMSAxMTkuMzIyIDAuMDgxMzY2N0MxMTkuMzY5IDAuMTA5MTU3IDExOS40MzcgMC4xNTAxNjggMTE5LjUyNSAwLjIwNDM4NkMxMTkuNyAwLjMxMjgxMSAxMTkuOTUzIDAuNDc0MDk2IDEyMC4yNyAwLjY4ODEzNEMxMjAuOTA1IDEuMTE2MTMgMTIxLjc5NiAxLjc1NTUyIDEyMi44MyAyLjYwNTQ5QzEyNC44OTYgNC4zMDQzOCAxMjcuNTM5IDYuODUwNTkgMTI5Ljg0MSAxMC4yMzg3QzEzNC40NTkgMTcuMDMzNCAxMzcuNjg1IDI3LjE5MjYgMTMyLjIgNDAuNTk1NUMxMzAuNzg1IDQ0LjA1MjYgMTI3LjYxNSA0Ni45NDE2IDEyMy4yNTUgNDkuMzY1NEMxMTguODg4IDUxLjc5MzEgMTEzLjI3IDUzLjc4NjEgMTA2Ljg2NyA1NS40MjM3Qzk0LjA1ODQgNTguNjk5MyA3OC4wMTg4IDYwLjU3NDQgNjIuMzQyNSA2MS42MjEyQzQ2LjY2MTMgNjIuNjY4MiAzMS4zMjE0IDYyLjg4NzggMTkuOTAzNSA2Mi44NDU3QzE0LjE5NCA2Mi44MjQ2IDkuNDY0MTggNjIuNzM4MSA2LjE2MTIxIDYyLjY1NjlDNC41MDk3MSA2Mi42MTYzIDMuMjE0ODkgNjIuNTc3IDIuMzMyNjcgNjIuNTQ3OEMyLjI4MDUxIDYyLjU0NjEgMi4yMjk3OSA2Mi41NDQ0IDIuMTgwNTIgNjIuNTQyOEw0LjQxODA0IDY0Ljk2OTJDNC42MDUyNCA2NS4xNzIyIDQuNTkyNDMgNjUuNDg4NiA0LjM4OTQzIDY1LjY3NThDNC4xODY0MiA2NS44NjMgMy44NzAwOSA2NS44NTAxIDMuNjgyODkgNjUuNjQ3MUwwLjYzMjMxMiA2Mi4zMzlDMC40NDUxMTUgNjIuMTM2IDAuNDU3OTIzIDYxLjgxOTYgMC42NjA5MjcgNjEuNjMyNEwzLjk2OTA4IDU4LjU4MTlDNC4xNzIwOCA1OC4zOTQ3IDQuNDg4NDIgNTguNDA3NSA0LjY3NTYxIDU4LjYxMDVDNC44NjI4MSA1OC44MTM1IDQuODUgNTkuMTI5OCA0LjY0NyA1OS4zMTdMMi4yMzIwNCA2MS41NDM5QzIuMjc1NDcgNjEuNTQ1NCAyLjMyMDA0IDYxLjU0NjkgMi4zNjU3MSA2MS41NDg0QzMuMjQ1MzEgNjEuNTc3NSA0LjUzNzMgNjEuNjE2NyA2LjE4NTggNjEuNjU3MkM5LjQ4Mjg0IDYxLjczODMgMTQuMjA1NyA2MS44MjQ3IDE5LjkwNzIgNjEuODQ1N0MzMS4zMTExIDYxLjg4NzcgNDYuNjI1OSA2MS42Njg0IDYyLjI3NTkgNjAuNjIzNEM3Ny45MzA3IDU5LjU3ODEgOTMuODk5IDU3LjcwNzkgMTA2LjYxOSA1NC40NTQ5QzExMi45OCA1Mi44MjgxIDExOC41MDYgNTAuODYxIDEyMi43NjkgNDguNDkxNFpcIiBvcGFjaXR5PVwiMC41XCIgLz5cbjwvc3ZnPlxuYDtcblxuLy9NIDAuODk0ODc5ODQyMjMyNTAzNCAtMC4yMjk0Nzc3NjU0NjYzMjUxNSBMIC0wLjkxMTM0NjA0NjI5MDA1NjggLTAuOTg0ODA4NjIxNTE0Mjg4NSBMIC0wLjkwNDk5MzI5MTAwODA2NjcgLTAuOTk5OTk5OTk5OTk5OTk5OSBMIDAuOTExMzQ2MDMzMjI0ODQxNiAtMC4yNDA0NDA5NTU0MjkwMjM4OCBWIDEuMDAwMDAwMDI0MTIwMzk2OCBIIDAuODk0ODc5ODQyMjMyNTAzNCBWIC0wLjIyOTQ3Nzc2NTQ2NjMyNTE1IFpcbi8vIFJldHJpZXZlIHRoZSBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoIHlvdSB3aXNoIHRvIHRyYW5zZm9ybS5cbnZhciBzdmdSb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYXNlXCIpO1xudmFyIHBhdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vdG1vdmVkXCIpO1xudmFyIG9sZFBhdGhEU3RyID0gcGF0aC5nZXRBdHRyaWJ1dGUoXCJkXCIpO1xuXG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uIHJlcXVpcmVkLlxudmFyIG9iaiA9IGdldFRyYW5zbGF0aW9uQW5kU2NhbGluZyhzdmdSb290LCBwYXRoKTtcbnZhciBwYXRoVHJhbnNsWCA9IG9iai5wYXRoVHJhbnNsWDtcbnZhciBwYXRoVHJhbnNsWSA9IG9iai5wYXRoVHJhbnNsWTtcbnZhciBzY2FsZSA9IG9iai5zY2FsZTtcblxuLy8gVGhlIHBhdGggY291bGQgYmUgdHJhbnNmb3JtZWQgYXQgdGhpcyBwb2ludCB3aXRoIGEgc2ltcGxlXG4vLyBcInRyYW5zZm9ybVwiIGF0dHJpYnV0ZSBhcyBzaG93biBoZXJlLlxuXG4vLyAkcGF0aC5hdHRyKFwidHJhbnNmb3JtXCIsIGB0cmFuc2xhdGUoJHtwYXRoVHJhbnNsWH0sICR7cGF0aFRyYW5zbFl9KSwgc2NhbGUoJHtzY2FsZX0pYCk7XG5cbi8vIEhvd2V2ZXIsIGFzIGRlc2NyaWJlZCBpbiB5b3VyIHF1ZXN0aW9uIHlvdSBkaWRuJ3Qgd2FudCB0aGlzLlxuLy8gVGhlcmVmb3JlLCB0aGUgY29kZSBmb2xsb3dpbmcgdGhpcyBsaW5lIG11dGF0ZXMgdGhlIGFjdHVhbCBzdmcgcGF0aC5cblxuLy8gQ2FsY3VsYXRlIHRoZSBwYXRoIFwiZFwiIGF0dHJpYnV0ZXMgcGFyYW1ldGVycy5cbnZhciBuZXdQYXRoRFN0ciA9IGdldFRyYW5zZm9ybWVkUGF0aERTdHIoXG4gIG9sZFBhdGhEU3RyLFxuICBwYXRoVHJhbnNsWCxcbiAgcGF0aFRyYW5zbFksXG4gIHNjYWxlXG4pO1xuXG4vLyBBcHBseSB0aGUgbmV3IFwiZFwiIGF0dHJpYnV0ZSB0byB0aGUgcGF0aCwgdHJhbnNmb3JtaW5nIGl0LlxuXG5kb2N1bWVudC53cml0ZShcbiAgXCI8cD5BbHRlcmVkICdkJyBhdHRyaWJ1dGUgb2YgcGF0aDo8L3A+PHA+XCIgKyBuZXdQYXRoRFN0ciArIFwiPC9wPlwiXG4pO1xuXG4vLyBUaGlzIGlzIHRoZSBlbmQgb2YgdGhlIG1haW4gY29kZS4gQmVsb3cgYXJlIHRoZSBmdW5jdGlvbnMgY2FsbGVkLlxuXG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uLCBpLmUuIHRoZSB0cmFuc2xhdGlvbiBhbmQgc2NhbGluZywgcmVxdWlyZWRcbi8vIHRvIGdldCB0aGUgcGF0aCB0byBmaWxsIHRoZSBzdmcgYXJlYS4gTm90ZSB0aGF0IHRoaXMgYXNzdW1lcyB1bmlmb3JtXG4vLyBzY2FsaW5nLCBhIHBhdGggdGhhdCBoYXMgbm8gb3RoZXIgdHJhbnNmb3JtcyBhcHBsaWVkIHRvIGl0LCBhbmQgbm9cbi8vIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIHN2ZyB2aWV3cG9ydCBhbmQgdmlld0JveCBkaW1lbnNpb25zLlxuZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHN2ZywgcGF0aCkge1xuICB2YXIgc3ZnV2R0aCA9IDI7XG4gIHZhciBzdmdIZ2h0ID0gMjtcblxuICB2YXIgb3JpZ1BhdGhCb3VuZGluZ0JveCA9IHBhdGguZ2V0QkJveCgpO1xuXG4gIHZhciBvcmlnUGF0aEhnaHQgPSBvcmlnUGF0aEJvdW5kaW5nQm94LmhlaWdodDtcbiAgdmFyIG9yaWdQYXRoV2R0aCA9IG9yaWdQYXRoQm91bmRpbmdCb3gud2lkdGg7XG5cbiAgdmFyIG9yaWdQYXRoWSA9IG9yaWdQYXRoQm91bmRpbmdCb3gueTtcbiAgdmFyIG9yaWdQYXRoWCA9IG9yaWdQYXRoQm91bmRpbmdCb3gueDtcblxuICBjb25zb2xlLmxvZyhvcmlnUGF0aFdkdGgsIG9yaWdQYXRoSGdodCwgb3JpZ1BhdGhXZHRoLCBvcmlnUGF0aFgsIG9yaWdQYXRoWSk7XG4gIC8vIGhvdyBtdWNoIGJpZ2dlciBpcyB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAvLyByZWxhdGl2ZSB0byB0aGUgcGF0aCBpbiBlYWNoIGRpbWVuc2lvbj9cbiAgdmFyIHNjYWxlQmFzZWRPbldkdGggPSBzdmdXZHRoIC8gb3JpZ1BhdGhXZHRoO1xuICB2YXIgc2NhbGVCYXNlZE9uSGdodCA9IHN2Z0hnaHQgLyBvcmlnUGF0aEhnaHQ7XG5cbiAgLy8gb2YgdGhlIHNjYWxpbmcgZmFjdG9ycyBkZXRlcm1pbmVkIGluIGVhY2ggZGltZW5zaW9uLFxuICAvLyB1c2UgdGhlIHNtYWxsZXIgb25lOyBvdGhlcndpc2UgcG9ydGlvbnMgb2YgdGhlIHBhdGhcbiAgLy8gd2lsbCBsaWUgb3V0c2lkZSB0aGUgdmlld3BvcnQgKGNvcnJlY3QgdGVybT8pXG4gIHZhciBzY2FsZSA9IE1hdGgubWluKHNjYWxlQmFzZWRPbldkdGgsIHNjYWxlQmFzZWRPbkhnaHQpO1xuICBhbGVydChcbiAgICBgaGVpZ2h0OiAkezEgLyBzY2FsZUJhc2VkT25IZ2h0fSB3aWR0aDogJHsxIC8gc2NhbGVCYXNlZE9uV2R0aH0sICR7XG4gICAgICBvcmlnUGF0aFdkdGggKiBvcmlnUGF0aEhnaHRcbiAgICB9YFxuICApO1xuICAvLyBjYWxjdWxhdGUgdGhlIGJvdW5kaW5nIGJveCBwYXJhbWV0ZXJzXG4gIC8vIGFmdGVyIHRoZSBwYXRoIGhhcyBiZWVuIHNjYWxlZCByZWxhdGl2ZSB0byB0aGUgb3JpZ2luXG4gIC8vIGJ1dCBiZWZvcmUgYW55IHN1YnNlcXVlbnQgdHJhbnNsYXRpb25zIGhhdmUgYmVlbiBhcHBsaWVkXG5cbiAgdmFyIHNjYWxlZFBhdGhYID0gb3JpZ1BhdGhYICogc2NhbGU7XG4gIHZhciBzY2FsZWRQYXRoWSA9IG9yaWdQYXRoWSAqIHNjYWxlO1xuICB2YXIgc2NhbGVkUGF0aFdkdGggPSBvcmlnUGF0aFdkdGggKiBzY2FsZTtcbiAgdmFyIHNjYWxlZFBhdGhIZ2h0ID0gb3JpZ1BhdGhIZ2h0ICogc2NhbGU7XG5cbiAgLy8gY2FsY3VsYXRlIHRoZSBjZW50cmUgcG9pbnRzIG9mIHRoZSBzY2FsZWQgYnV0IHVudHJhbnNsYXRlZCBwYXRoXG4gIC8vIGFzIHdlbGwgYXMgb2YgdGhlIHN2ZyByb290IGVsZW1lbnRcblxuICB2YXIgc2NhbGVkUGF0aENlbnRyZVggPSBzY2FsZWRQYXRoWCArIHNjYWxlZFBhdGhXZHRoIC8gMjtcbiAgdmFyIHNjYWxlZFBhdGhDZW50cmVZID0gc2NhbGVkUGF0aFkgKyBzY2FsZWRQYXRoSGdodCAvIDI7XG4gIHZhciBzdmdSb290Q2VudHJlWCA9IDA7IC8vIC1zdmdXZHRoIC8gMjtcbiAgdmFyIHN2Z1Jvb3RDZW50cmVZID0gMDsgLy8tc3ZnSGdodCAvIDI7XG5cbiAgLy8gY2FsY3VsYXRlIHRyYW5zbGF0aW9uIHJlcXVpcmVkIHRvIGNlbnRyZSB0aGUgcGF0aFxuICAvLyBvbiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICB2YXIgcGF0aFRyYW5zbFggPSBzdmdSb290Q2VudHJlWCAtIHNjYWxlZFBhdGhDZW50cmVYO1xuICB2YXIgcGF0aFRyYW5zbFkgPSBzdmdSb290Q2VudHJlWSAtIHNjYWxlZFBhdGhDZW50cmVZO1xuICBjb25zb2xlLmxvZyhcbiAgICBcInNjYWxlZCBwYXRoIHhcIixcbiAgICBzY2FsZWRQYXRoWCxcbiAgICBzY2FsZWRQYXRoV2R0aCxcbiAgICBcInNjYWxlZCBwYXRoIHlcIixcbiAgICBzY2FsZWRQYXRoWSxcbiAgICBzY2FsZWRQYXRoSGdodCxcbiAgICBcImZhY3RvciBmcm9tIHNjYWxlXCIsXG4gICAgKG9yaWdQYXRoSGdodCAtIG9yaWdQYXRoV2R0aCkgLyAyLFxuICAgIFwieGZhY3RvciBmcm9tIGdcIlxuICApO1xuICByZXR1cm4geyBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlIH07XG59XG5cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybWVkUGF0aERTdHIob2xkUGF0aERTdHIsIHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpIHtcbiAgLy8gY29uc3RhbnRzIHRvIGhlbHAga2VlcCB0cmFjayBvZiB0aGUgdHlwZXMgb2YgU1ZHIGNvbW1hbmRzIGluIHRoZSBwYXRoXG4gIHZhciBCT1RIX1hfQU5EX1kgPSAxO1xuICB2YXIgSlVTVF9YID0gMjtcbiAgdmFyIEpVU1RfWSA9IDM7XG4gIHZhciBOT05FID0gNDtcbiAgdmFyIEVMTElQVElDQUxfQVJDID0gNTtcbiAgdmFyIEFCU09MVVRFID0gNjtcbiAgdmFyIFJFTEFUSVZFID0gNztcblxuICAvLyB0d28gcGFyYWxsZWwgYXJyYXlzLCB3aXRoIGVhY2ggZWxlbWVudCBiZWluZyBvbmUgY29tcG9uZW50IG9mIHRoZVxuICAvLyBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoLCB3aXRoIG9uZSBjb21wb25lbnQgYmVpbmcgZWl0aGVyXG4gIC8vIGFuIGluc3RydWN0aW9uIChlLmcuIFwiTVwiIGZvciBtb3ZldG8sIGV0Yy4pIG9yIG51bWVyaWNhbCB2YWx1ZVxuICAvLyBmb3IgZWl0aGVyIGFuIHggb3IgeSBjb29yZGluYXRlXG4gIHZhciBvbGRQYXRoREFyciA9IGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMob2xkUGF0aERTdHIpO1xuICB2YXIgbmV3UGF0aERBcnIgPSBbXTtcblxuICB2YXIgY29tbWFuZFBhcmFtcywgYWJzT3JSZWwsIG9sZFBhdGhEQ29tcCwgbmV3UGF0aERDb21wO1xuXG4gIC8vIGVsZW1lbnQgaW5kZXhcbiAgdmFyIGlkeCA9IDA7XG5cbiAgd2hpbGUgKGlkeCA8IG9sZFBhdGhEQXJyLmxlbmd0aCkge1xuICAgIHZhciBvbGRQYXRoRENvbXAgPSBvbGRQYXRoREFycltpZHhdO1xuICAgIGlmICgvXltBLVphLXpdJC8udGVzdChvbGRQYXRoRENvbXApKSB7XG4gICAgICAvLyBjb21wb25lbnQgaXMgYSBzaW5nbGUgbGV0dGVyLCBpLmUuIGFuIHN2ZyBwYXRoIGNvbW1hbmRcbiAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBvbGRQYXRoREFycltpZHhdO1xuICAgICAgc3dpdGNoIChvbGRQYXRoRENvbXAudG9VcHBlckNhc2UoKSkge1xuICAgICAgICBjYXNlIFwiQVwiOiAvLyBlbGxpcHRpY2FsIGFyYyBjb21tYW5kLi4udGhlIG1vc3QgY29tcGxpY2F0ZWQgb25lXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEVMTElQVElDQUxfQVJDO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiSFwiOiAvLyBob3Jpem9udGFsIGxpbmU7IHJlcXVpcmVzIG9ubHkgYW4geC1jb29yZGluYXRlXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlZcIjogLy8gdmVydGljYWwgbGluZTsgcmVxdWlyZXMgb25seSBhIHktY29vcmRpbmF0ZVxuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBKVVNUX1k7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJaXCI6IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IE5PTkU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gYWxsIG90aGVyIGNvbW1hbmRzOyBhbGwgb2YgdGhlbSByZXF1aXJlIGJvdGggeCBhbmQgeSBjb29yZGluYXRlc1xuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBCT1RIX1hfQU5EX1k7XG4gICAgICB9XG4gICAgICBhYnNPclJlbCA9XG4gICAgICAgIG9sZFBhdGhEQ29tcCA9PT0gb2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkgPyBBQlNPTFVURSA6IFJFTEFUSVZFO1xuICAgICAgLy8gbG93ZXJjYXNlIGNvbW1hbmRzIGFyZSByZWxhdGl2ZSwgdXBwZXJjYXNlIGFyZSBhYnNvbHV0ZVxuICAgICAgaWR4ICs9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlmIHRoZSBjb21wb25lbnQgaXMgbm90IGEgbGV0dGVyLCB0aGVuIGl0IGlzIGEgbnVtZXJpYyB2YWx1ZVxuICAgICAgdmFyIHRyYW5zbFgsIHRyYW5zbFk7XG4gICAgICBpZiAoYWJzT3JSZWwgPT09IEFCU09MVVRFKSB7XG4gICAgICAgIC8vIHRoZSB0cmFuc2xhdGlvbiBpcyByZXF1aXJlZCBmb3IgYWJzb2x1dGUgY29tbWFuZHMuLi5cbiAgICAgICAgdHJhbnNsWCA9IHBhdGhUcmFuc2xYO1xuICAgICAgICB0cmFuc2xZID0gcGF0aFRyYW5zbFk7XG4gICAgICB9IGVsc2UgaWYgKGFic09yUmVsID09PSBSRUxBVElWRSkge1xuICAgICAgICAvLyAuLi5idXQgbm90IHJlbGF0aXZlIG9uZXNcbiAgICAgICAgdHJhbnNsWCA9IDA7XG4gICAgICAgIHRyYW5zbFkgPSAwO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChjb21tYW5kUGFyYW1zKSB7XG4gICAgICAgIC8vIGZpZ3VyZSBvdXQgd2hpY2ggb2YgdGhlIG51bWVyaWMgdmFsdWVzIGZvbGxvd2luZyBhbiBzdmcgY29tbWFuZFxuICAgICAgICAvLyBhcmUgcmVxdWlyZWQsIGFuZCB0aGVuIHRyYW5zZm9ybSB0aGUgbnVtZXJpYyB2YWx1ZShzKSBmcm9tIHRoZVxuICAgICAgICAvLyBvcmlnaW5hbCBwYXRoIGQtYXR0cmlidXRlIGFuZCBwbGFjZSBpdCBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGVcbiAgICAgICAgLy8gYXJyYXkgdGhhdCB3aWxsIGV2ZW50dWFsbHkgYmVjb21lIHRoZSBkLWF0dHJpYnV0ZSBmb3IgdGhlIG5ldyBwYXRoXG4gICAgICAgIGNhc2UgQk9USF9YX0FORF9ZOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSAyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEpVU1RfWDpcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEpVU1RfWTpcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVMTElQVElDQUxfQVJDOlxuICAgICAgICAgIC8vIHRoZSBlbGxpcHRpY2FsIGFyYyBoYXMgeCBhbmQgeSB2YWx1ZXMgaW4gdGhlIGZpcnN0IGFuZCBzZWNvbmQgYXMgd2VsbCBhc1xuICAgICAgICAgIC8vIHRoZSA2dGggYW5kIDd0aCBwb3NpdGlvbnMgZm9sbG93aW5nIHRoZSBjb21tYW5kOyB0aGUgaW50ZXJ2ZW5pbmcgdmFsdWVzXG4gICAgICAgICAgLy8gYXJlIG5vdCBhZmZlY3RlZCBieSB0aGUgdHJhbnNmb3JtYXRpb24gYW5kIHNvIGNhbiBzaW1wbHkgYmUgY29waWVkXG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMl0pO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDNdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDNdKTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA0XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA0XSk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNV0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDZdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDZdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICBpZHggKz0gNztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOT05FOlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwibnVtZXJpYyB2YWx1ZSBzaG91bGQgbm90IGZvbGxvdyB0aGUgU1ZHIFoveiBjb21tYW5kXCJcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmV3UGF0aERBcnIuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMoc3RyKSB7XG4gIC8vIGFzc3VtaW5nIHRoZSBzdHJpbmcgZnJvbSB0aGUgZC1hdHRyaWJ1dGUgb2YgdGhlIHBhdGggaGFzIGFsbCBjb21wb25lbnRzXG4gIC8vIHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzcGFjZSwgdGhlbiBjcmVhdGUgYW4gYXJyYXkgb2YgY29tcG9uZW50cyBieVxuICAvLyBzaW1wbHkgc3BsaXR0aW5nIHRoZSBzdHJpbmcgYXQgdGhvc2Ugc3BhY2VzXG4gIHN0ciA9IHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKTtcbiAgcmV0dXJuIHN0ci5zcGxpdChcIiBcIik7XG59XG5cbmZ1bmN0aW9uIHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKSB7XG4gIC8vIFRoZSBTVkcgc3RhbmRhcmQgaXMgZmxleGlibGUgd2l0aCByZXNwZWN0IHRvIGhvdyBwYXRoIGQtc3RyaW5ncyBhcmVcbiAgLy8gZm9ybWF0dGVkIGJ1dCB0aGlzIG1ha2VzIHBhcnNpbmcgdGhlbSBtb3JlIGRpZmZpY3VsdC4gVGhpcyBmdW5jdGlvbiBlbnN1cmVzXG4gIC8vIHRoYXQgYWxsIFNWRyBwYXRoIGQtc3RyaW5nIGNvbXBvbmVudHMgKGkuZS4gYm90aCBjb21tYW5kcyBhbmQgdmFsdWVzKSBhcmVcbiAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLlxuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoLywvZywgXCIgXCIpIC8vIHJlcGxhY2UgZWFjaCBjb21tYSB3aXRoIGEgc3BhY2VcbiAgICAucmVwbGFjZSgvLS9nLCBcIiAtXCIpIC8vIHByZWNlZGUgZWFjaCBtaW51cyBzaWduIHdpdGggYSBzcGFjZVxuICAgIC5yZXBsYWNlKC8oW0EtWmEtel0pL2csIFwiICQxIFwiKSAvLyBzYW5kd2ljaCBlYWNoICAgbGV0dGVyIGJldHdlZW4gMiBzcGFjZXNcbiAgICAucmVwbGFjZSgvICAvZywgXCIgXCIpIC8vIGNvbGxhcHNlIHJlcGVhdGVkIHNwYWNlcyB0byBhIHNpbmdsZSBzcGFjZVxuICAgIC5yZXBsYWNlKC8gKFtFZV0pIC9nLCBcIiQxXCIpIC8vIHJlbW92ZSBmbGFua2luZyBzcGFjZXMgYXJvdW5kIGV4cG9uZW50IHN5bWJvbHNcbiAgICAucmVwbGFjZSgvXiAvZywgXCJcIikgLy8gdHJpbSBhbnkgbGVhZGluZyBzcGFjZVxuICAgIC5yZXBsYWNlKC8gJC9nLCBcIlwiKTsgLy8gdHJpbSBhbnkgdGFpbGluZyBzcGFjZVxufVxuKi9cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdGlmKF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0pIHtcblx0XHRyZXR1cm4gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGVcbl9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9jb2RlLnRzXCIpO1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgdXNlZCAnZXhwb3J0cycgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxuIl0sInNvdXJjZVJvb3QiOiIifQ==