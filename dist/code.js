/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/code.ts":
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _SVGPaths_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SVGPaths.js */ "./src/SVGPaths.js");
//const Paper = require('paper')

//import {createNormalizedPath} from "./helperFunctions";
//import {SVGpath, SVGsegs} from './SVGPaths.js';
// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
// This shows the HTML page in "ui.html".
figma.showUI(__html__);
const PADDING_WIDTH_REGEX = /(?<=translate\()\d+/;
const PADDING_HEIGHT_REGEX = /(?<=translate\(\d+,)\d+/;
const SVG_WIDTH_REGEX = /(?<=width=")\d+/;
const SVG_HEIGHT_REGEX = /(?<=height=")\d+/;
function makeid(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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
    //console.log(SVGpath, SVGsegs,new SVGsegs("M 0.5 -0.5 l 0 1 -1 0 0 -1 z"));
    console.log(_SVGPaths_js__WEBPACK_IMPORTED_MODULE_0__.default);
    if (msg.type === "create") {
        const nodes = [];
        const id = makeid(5);
        console.log(msg);
        const newAnnotationsLayer = figma.createFrame();
        const visualization = figma.createNodeFromSvg(msg.object);
        visualization.name = `Visualization - ${id}`;
        // place annotations layer on top and make transparent
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
        figma.currentPage.appendChild(visualization);
        nodes.push(visualization);
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
    }
    if (msg.type === "fetch") {
        // find current selection
        //@ts-ignore    //
        // grab annnotations layer,
        // grab plugin data for the width/height padding
        //const newSelection = [figma.flatten(figma.currentPage.selection)];
        const newSelection = figma.currentPage.selection.map((node) => node.clone());
        console.log("currentSelection", newSelection);
        const marksToAdd = [];
        for (const sceneNode of newSelection) {
            const nodeIterator = walkTree(sceneNode);
            let nodeStep = nodeIterator.next();
            while (!nodeStep.done) {
                const node = nodeStep.value.clone();
                // skip node types 
                if (node.type === "FRAME" || node.type === "GROUP") {
                    nodeStep = nodeIterator.next();
                    continue;
                }
                console.log("node value", node);
                // if nodeType is group
                const vectorizedNode = vectorize(node);
                console.log('fills', vectorizedNode.fills, vectorizedNode.vectorPaths);
                // might have 2 paths, vectors with 2 path are fine separately. 
                // 2 paths might have different fills. 
                figma.ui.postMessage({ data: vectorizedNode.vectorPaths, nodeId: vectorizedNode.id, type: "modifyPath" });
                //const nodeStyles = extractStyles(vectorizedNode); // change to translate styles into vegaspec
                /*const svgPath = createNormalizedPath(vectorizedNode);
        
                const { width, height, tX, tY, scale } = calculatePlacement(
                  vectorizedNode,
                  visaulizationPaddingWidth,
                  visaulizationPaddingHeight
                );
        
                console.log(
                  vectorizedNode.x,
                  vectorizedNode.y,
                  vectorizedNode.width,
                  vectorizedNode.height,
                  node.vectorPaths
                );
        
                console.log(`{
                  "type": "symbol",
                  "interactive": false,
                  "encode": {
                    "enter": {
                      "shape": {"value": "${svgPath}"},
                      "size":{"value":${scale}},
                      "fill":{"value":"black"}
                    },
                    "update": {
                      "width":{"value":${width}},
                      "height":{"value":${height}},
                      "x": {"value": ${tX}},
                      "y": {"value": ${tY}}
                    }
                  }
                 }`);*/
                //
                /*
                const
                console.log('node typw',node.type);
        
        
        
                // Get scene node type
                // if text
                // text make svg for all elements
        
                // transform to vector
        
                // process path
        
        
                
        
                
        
                const pX = 15; // current Vega padding
                const pY = 5;
        
                // rotation throws it off!
        
                //console.log("x", (1 / 2) * maxDimension, x, pX, 0, rot);
                //console.log("y", (1 / 2) * maxDimension, y, pY, 0);
        
                
        
                //
                const vals = pathStrings.map((path) => {
                  return `{
                  "type": "symbol",
                  "interactive": false,
                  "encode": {
                    "enter": {
                      "angle":{"value":${0}},
                      "shape": {"value": "${path}"},
                      "size":{"value":${vectorScale}},
                      "fill":{"value":"black"}
                    },
                    "update": {
                      "width":{"value":${width}},
                      "height":{"value":${height}},
                      "x": {"value": ${tX}},
                      "y": {"value": ${tY}}
                    }
                  }
                 }`;
                });
        
                console.log(JSON.stringify(vals[0]).replace(/\\n/g, "").replace(/\\/g, ""));*/
                nodeStep = nodeIterator.next();
            }
        }
    }
    if (msg.type === "sendScaled") {
        console.log('in scaledSend!', msg.object);
        const newSelection = figma.currentPage.selection;
        const visaulizationPaddingWidth = Number(newSelection[0].getPluginData("vegaPaddingWidth"));
        const visaulizationPaddingHeight = Number(newSelection[0].getPluginData("vegaPaddingHeight"));
        const vectorizedNode = figma.getNodeById(msg.nodeId);
        // lines and vector
        if (vectorizedNode.type !== 'VECTOR') {
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
          ${propertySpecs.join(',')}
        },
        "update": {
          "width":{"value":${width}},
          "height":{"value":${height}},
          "x": {"value": ${tX}},
          "y": {"value": ${tY}}
        }
      }
     }`;
        figma.ui.postMessage({ specString: translatedSpecs, type: "finishedMarks" });
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    //figma.closePlugin();
};
function isNotNone(property) {
    return property !== 'NONE';
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
        attributes.push(`"fill": {"value": "${rgbToHex(color.r, color.g, color.b)}"}`);
        if (node.fills[0].opacity) {
            attributes.push(`"fillOpacity": {"value": ${node.fills[0].opacity}}`);
        }
    }
    return attributes;
}
function calculateStrokeSpecs(node) {
    console.log('in calc spec', node);
    const names = Object.getOwnPropertyNames(node);
    console.log('in calc spec names', names);
    const attributes = [];
    if (node.strokes && node.strokes.length > 0) {
        //@ts-ignore wrong typings ?
        const color = node.strokes[0].color;
        attributes.push(`"stroke": {"value": "${rgbToHex(color.r, color.g, color.b)}"}`);
        if (node.strokes[0].opacity) {
            attributes.push(`"strokeOpacity": {"value": ${node.strokes[0].opacity}}`);
        }
        if (node.strokeCap === 'ROUND' || node.strokeCap === 'SQUARE') {
            attributes.push(`"strokeCap": {"value": "round"}`);
        }
        if (node.strokeWeight) {
            attributes.push(`"strokeWidth": {"value": ${node.strokeWeight}}`);
        }
        if (node.dashPattern) {
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
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
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
    console.log('in outline', node);
    // if the item has an arrow end, outline stroke because arrow stroke cap cannot be applied :(
    if (node.type === "VECTOR" && "strokeCap" in node.vectorNetwork.vertices[node.vectorNetwork.vertices.length - 1] && node.vectorNetwork.vertices[node.vectorNetwork.vertices.length - 1].strokeCap !== 'NONE') {
        return true;
    }
    else if ("strokeAlign" in node && node.strokeAlign !== "CENTER") {
        // as vega doesn't support inside or center, outline stroke
        return true;
    }
    return false;
}
function vectorize(node) {
    // if node is text, combine all vector paths
    let vectorNode = figma.flatten([node]);
    console.log(node.type);
    // if text, line with stroke
    console.log('before', vectorNode.vectorPaths);
    // lines and vector paths with strokes 
    const outlinedNodes = vectorNode.outlineStroke();
    // if no fills, outline stroke
    console.log(vectorNode.fills, vectorNode.strokes);
    if (outlinedNodes && shouldNodeBeOutlineStrokes(vectorNode)) {
        vectorNode = outlinedNodes;
    }
    console.log('after', vectorNode.vectorPaths);
    console.log(vectorNode);
    return vectorNode;
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


/***/ }),

/***/ "./src/SVGPaths.js":
/*!*************************!*\
  !*** ./src/SVGPaths.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// ==/ClosureCompiler==

// SVGPath
// Fahri Aydos, aydos.com
// 2016-06-18
// https://aydos.com/svgedit

/** @constructor */

class SVGPath {
  constructor() {
    // Path segments
    this.segments = [];
    this.dec = 3;
  }

  importString(str) {
    str = str.replace(/\s/g, " "); // white spaces
    str = str.trim(); // spaces at begin and end
    str = str.replace(/,/g, " "); // commas
    str = str.replace(/([A-Za-z])([A-Za-z])/g, "$1 $2"); // two chars
    str = str.replace(/([A-Za-z])(\d)/g, "$1 $2"); // char + decimal
    str = str.replace(/([A-Za-z])(\.)/g, "$1 ."); // char + dot
    str = str.replace(/([A-Za-z])(-)/g, "$1 -"); // char + negative number
    str = str.replace(/(\d)([A-Za-z])/g, "$1 $2"); // decimal + char
    str = str.replace(/(\d)(-)/g, "$1 -"); // decimal + negative number
    var reg = /((?:-?[\d]*)\.\d+)((?:\.\d+)+)/g; // decimal + dot + decimal + dot + decimal
    while (reg.test(str)) {
      str = str.replace(reg, "$1 $2");
    }
    while (/  /.test(str)) {
      str = str.replace(/  /g, " "); // clear double spaces
    }
    var list = str.split(" ");
    var pret = "";
    var prex = 0;
    var prey = 0;
    var begx = 0;
    var begy = 0;
    var j = 0;
    var i = 0;
    this.segments = [];

    while (i < list.length) {
      var seg = new Segment();
        seg.value = list[i];
      if (list[i].charCodeAt(0) > 64) {
        seg.t = list[i++];
      } else {
        if (pret == "") break;
        seg.t = pret == "M" ? "L" : pret == "m" ? "l" : pret;
      }
      pret = seg.t;

      switch (seg.t) {
        case "Z":
        case "z":
          seg.x = begx;
          seg.y = begy;
          break;
        case "M":
        case "L":
        case "H":
        case "V":
        case "T":
          seg.x = seg.t == "V" ? prex : Number(list[i++]);
          seg.y = seg.t == "H" ? prey : Number(list[i++]);
          begx = seg.t == "M" ? seg.x : begx;
          begy = seg.t == "M" ? seg.y : begy;
          break;
        case "m":
        case "l":
        case "h":
        case "v":
        case "t":
          seg.x = seg.t == "v" ? prex : prex + Number(list[i++]);
          seg.y = seg.t == "h" ? prey : prey + Number(list[i++]);
          begx = seg.t == "m" ? seg.x : begx;
          begy = seg.t == "m" ? seg.y : begy;
          break;
        case "A":
        case "a":
          seg.r1 = Number(list[i++]);
          seg.r2 = Number(list[i++]);
          seg.ar = Number(list[i++]);
          seg.af = Number(list[i++]);
          seg.sf = Number(list[i++]);
          seg.x = seg.t == "A" ? Number(list[i++]) : prex + Number(list[i++]);
          seg.y = seg.t == "A" ? Number(list[i++]) : prey + Number(list[i++]);
          break;
        case "C":
        case "Q":
        case "S":
          seg.x1 = seg.t == "S" ? undefined : Number(list[i++]);
          seg.y1 = seg.t == "S" ? undefined : Number(list[i++]);
          seg.x2 = seg.t == "Q" ? undefined : Number(list[i++]);
          seg.y2 = seg.t == "Q" ? undefined : Number(list[i++]);
          seg.x = Number(list[i++]);
          seg.y = Number(list[i++]);
          break;
        case "c":
        case "q":
        case "s":
          seg.x1 = seg.t == "s" ? undefined : prex + Number(list[i++]);
          seg.y1 = seg.t == "s" ? undefined : prey + Number(list[i++]);
          seg.x2 = seg.t == "q" ? undefined : prex + Number(list[i++]);
          seg.y2 = seg.t == "q" ? undefined : prey + Number(list[i++]);
          seg.x = prex + Number(list[i++]);
          seg.y = prey + Number(list[i++]);
          break;
        default:
          i++;
      }
      seg.px = prex;
      seg.py = prey;
      prex = seg.x;
      prey = seg.y;
      this.segments[j++] = seg;
    }
  }

  export() {
    var str = "";
    var pre = "";
    for (var i = 0; i < this.segments.length; i++) {
      var seg = this.segments[i];//this.formatSegment(this.segments[i]);
      
      console.log(seg);
      switch (seg.t) {
        case "Z":
        case "z":
          str += seg.t;
          break;
        case "M":
        case "m":
          str += seg.t + seg.x + " " + seg.y;
          break;
        case "L":
          str += pre == seg.t || pre == "M" ? " " : "L";
          str += seg.x + " " + seg.y;
          break;
        case "l":
          str += pre == seg.t || pre == "m" ? " " : "l";
          str += seg.x + " " + seg.y;
          break;
        case "H":
        case "h":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x;
          break;
        case "V":
        case "v":
          str += pre == seg.t ? " " : seg.t;
          str += seg.y;
          break;
        case "A":
        case "a":
          str += pre == seg.t ? " " : seg.t;
          str +=
            seg.r1 +
            " " +
            seg.r2 +
            " " +
            seg.ar +
            " " +
            seg.af +
            " " +
            seg.sf +
            " " +
            seg.x +
            " " +
            seg.y;
          break;
        case "C":
        case "c":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x1 + " " + seg.y1 + " " + seg.x2 + " " + seg.y2 + " " + seg.x + " " + seg.y;
          break;
        case "Q":
        case "q":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x1 + " " + seg.y1 + " " + seg.x + " " + seg.y;
          break;
        case "S":
        case "s":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x2 + " " + seg.y2 + " " + seg.x + " " + seg.y;
          break;
        case "T":
        case "t":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x + " " + seg.y;
          break;
      }
      pre = seg.t;
    }
    console.log('inexport',str)
    str = str.replace(/ -/g, "-");
    str = str.replace(/-0\./g, "-.");
    str = str.replace(/ 0\./g, " .");
    return str;
  }

  // export the segments as array
  exportList() {
    var list = [];
    for (var i = 0; i < this.segments.length; i++) {
      list[i] = this.formatSegment(this.segments[i]);
    }
    return list;
  }

  // make some analysis to minify
  analyse(dist) {
    dist = Number(dist);
    if (isNaN(dist)) dist = 0;
    if (dist < 0) dist = 0;

    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].info = "";
    }

    // convert L to H or V
    for (var i = 0; i < this.segments.length; i++) {
      if (this.segments[i].x == this.segments[i].px && this.segments[i].t.toUpperCase() == "L") {
        this.segments[i].t = this.segments[i].t == "L" ? "V" : "v";
      } else if (
        this.segments[i].y == this.segments[i].py &&
        this.segments[i].t.toUpperCase() == "L"
      ) {
        this.segments[i].t = this.segments[i].t == "L" ? "H" : "h";
      }
    }

    var a = -1;
    for (var i = 0; i < this.segments.length - 1; i++) {
      var dx = this.segments[i].x - this.segments[i].px;
      var dy = this.segments[i].y - this.segments[i].py;
      // two consecutive M
      if (this.segments[i].t.toUpperCase() == "M" && this.segments[i + 1].t.toUpperCase() == "M") {
        this.segments[i].info = "X";
        this.segments[i + 1].px = i == 0 ? 0 : this.segments[i - 1].x;
        this.segments[i + 1].py = i == 0 ? 0 : this.segments[i - 1].y;
      }
      // two consecutive Z
      if (this.segments[i].t.toUpperCase() == "Z" && this.segments[i + 1].t.toUpperCase() == "Z") {
        this.segments[i].info = "X";
      }
      // on the same line
      if (
        this.segments[i].t.toUpperCase() == "L" ||
        this.segments[i].t.toUpperCase() == "H" ||
        this.segments[i].t.toUpperCase() == "V"
      ) {
        var b = atan3(dx, dy);
        if (b == a) {
          this.segments[i - 1].info = "X";
        }
        a = b;
      } else {
        a = -1;
      }
    }

    // first segment must be M
    if (this.segments[0].t.toUpperCase() != "M") {
      this.segments[0].t = this.segments[0].t.charCodeAt(0) < 96 ? "M" : "m";
    }

    // last segment cant be M
    if (this.segments[this.segments.length - 1].t.toUpperCase() == "M") {
      this.segments[this.segments.length - 1].info = "X";
    }

    // remove certainly removables
    var i = this.segments.length;
    while (i--) {
      if (this.segments[i].info == "X") this.segments.splice(i, 1);
    }

    if (dist == 0) return;

    // too close segments
    for (var i = 0; i < this.segments.length - 1; i++) {
      if (this.segments[i].t.toUpperCase() == "Z") continue;
      var dx = this.segments[i].x - this.segments[i + 1].x;
      var dy = this.segments[i].y - this.segments[i + 1].y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= dist) {
        this.segments[i].info = "D " + d + " ";
      }
    }
  }
  // make all segments absolute
  absolute() {
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].t = this.segments[i].t.toUpperCase();
    }
  }

  // make all segments relative
  relative() {
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].t = this.segments[i].t.toLowerCase();
    }
  }

  // set the global dec variable, to rounding decimals
  round(d) {
    d = Number(d);
    if (isNaN(d)) d = 0;
    if (d < 0) d = -1;
    dec = Math.floor(d);
  }

  // move path with given dx, dy
  move(dx, dy) {
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].x += dx;
      this.segments[i].y += dy;
      this.segments[i].px += dx;
      this.segments[i].py += dy;
      this.segments[i].x1 = this.segments[i].x1 == undefined ? undefined : this.segments[i].x1 + dx;
      this.segments[i].y1 = this.segments[i].y1 == undefined ? undefined : this.segments[i].y1 + dy;
      this.segments[i].x2 = this.segments[i].x2 == undefined ? undefined : this.segments[i].x2 + dx;
      this.segments[i].y2 = this.segments[i].y2 == undefined ? undefined : this.segments[i].y2 + dy;
    }
    this.segments[0].px = 0;
    this.segments[0].py = 0;
  }

  // flip horizontally with flip(undefined, center)
  // flip vertically, with flip(center, undefined)
  // flip wrt a point (px, py)
  flip(x, y) {
    for (var i = 0; i < this.segments.length; i++) {
      if (x != undefined) {
        this.segments[i].x = x + (x - this.segments[i].x);
        this.segments[i].px = x + (x - this.segments[i].px);
        this.segments[i].x1 =
          this.segments[i].x1 == undefined ? undefined : x + (x - this.segments[i].x1);
        this.segments[i].x2 =
          this.segments[i].x2 == undefined ? undefined : x + (x - this.segments[i].x2);
        this.segments[i].sf =
          this.segments[i].sf == undefined ? undefined : (this.segments[i].sf + 1) % 2;
      }
      if (y != undefined) {
        this.segments[i].y = y + (y - this.segments[i].y);
        this.segments[i].py = y + (y - this.segments[i].py);
        this.segments[i].y1 =
          this.segments[i].y1 == undefined ? undefined : y + (y - this.segments[i].y1);
        this.segments[i].y2 =
          this.segments[i].y2 == undefined ? undefined : y + (y - this.segments[i].y2);
        this.segments[i].sf =
          this.segments[i].sf == undefined ? undefined : (this.segments[i].sf + 1) % 2;
      }
    }
    this.segments[0].px = 0;
    this.segments[0].py = 0;
  }

  calculateBounds(){
    var minx = this.segments[0].x;
    var miny = this.segments[0].y;
    var maxx = this.segments[0].x;
    var maxy = this.segments[0].y;
    for (var i = 1; i < this.segments.length; i++) {
      minx = this.segments[i].x < minx ? this.segments[i].x : minx;
      miny = this.segments[i].y < miny ? this.segments[i].y : miny;
      maxx = this.segments[i].x > maxx ? this.segments[i].x : maxx;
      maxy = this.segments[i].y > maxy ? this.segments[i].y : maxy;
    }
    var width = maxx - minx;
    var height = maxy - miny;
    return [minx,miny,maxx,maxy,width,height]
  }

  // move paths center to the given coordinates
  center(x, y) {
    var minx = this.segments[0].x;
    var miny = this.segments[0].y;
    var maxx = this.segments[0].x;
    var maxy = this.segments[0].y;
    for (var i = 1; i < this.segments.length; i++) {
      minx = this.segments[i].x < minx ? this.segments[i].x : minx;
      miny = this.segments[i].y < miny ? this.segments[i].y : miny;
      maxx = this.segments[i].x > maxx ? this.segments[i].x : maxx;
      maxy = this.segments[i].y > maxy ? this.segments[i].y : maxy;
    }
    var dx = x - minx - (maxx - minx) / 2;
    var dy = y - miny - (maxy - miny) / 2;
    this.move(dx, dy);
  }

  // scale path with a given ratio
  scale(ratio) {
    ratio = Number(ratio);
    if (isNaN(ratio)) return;
    if (ratio <= 0) return;
    for (var i = 0; i < this.segments.length; i++) {
      var seg = this.segments[i];
      seg.x *= ratio;
      seg.y *= ratio;
      seg.px *= ratio;
      seg.py *= ratio;
      seg.x1 = seg.x1 == undefined ? undefined : ratio * seg.x1;
      seg.y1 = seg.y1 == undefined ? undefined : ratio * seg.y1;
      seg.x2 = seg.x2 == undefined ? undefined : ratio * seg.x2;
      seg.y2 = seg.y2 == undefined ? undefined : ratio * seg.y2;
      seg.r1 = seg.r1 == undefined ? undefined : ratio * seg.r1;
      seg.r2 = seg.r2 == undefined ? undefined : ratio * seg.r2;
    }
  }

  // rotate the path with given center and rotation degree
  rotate(x, y, d) {
    d *= Math.PI / 180;
    var sin = Math.sin(d);
    var cos = Math.cos(d);
    for (var i = 0; i < this.segments.length; i++) {
      var rp = rotatePoint(this.segments[i].x, this.segments[i].y, x, y, sin, cos);
      this.segments[i].x = rp[0];
      this.segments[i].y = rp[1];
      var rp = rotatePoint(this.segments[i].px, this.segments[i].py, x, y, sin, cos);
      this.segments[i].px = rp[0];
      this.segments[i].py = rp[1];
      if (this.segments[i].x1 != undefined) {
        var rp = rotatePoint(this.segments[i].x1, this.segments[i].y1, x, y, sin, cos);
        this.segments[i].x1 = rp[0];
        this.segments[i].y1 = rp[1];
      }
      if (this.segments[i].x2 != undefined) {
        var rp = rotatePoint(this.segments[i].x2, this.segments[i].y2, x, y, sin, cos);
        this.segments[i].x2 = rp[0];
        this.segments[i].y2 = rp[1];
      }
      if (this.segments[i].t == "H" || this.segments[i].t == "V") {
        this.segments[i].t = "L";
      }
      if (this.segments[i].t == "h" || this.segments[i].t == "v") {
        this.segments[i].t = "l";
      }
    }
    this.segments[0].px = 0;
    this.segments[0].py = 0;
  }

  formatSegment(s) {
    var seg = new Segment();
    seg.t = s.t;
    seg.x = s.t.charCodeAt(0) < 96 ? this.roundDec(s.x) : this.roundDec(s.x - s.px);
    seg.y = s.t.charCodeAt(0) < 96 ? this.roundDec(s.y) : this.roundDec(s.y - s.py);
    seg.px = this.roundDec(s.px);
    seg.py = this.roundDec(s.py);
    seg.x1 =
      s.x1 == undefined ? undefined : s.t.charCodeAt(0) < 96 ? this.roundDec(s.x1) : this.roundDec(s.x1 - s.px);
    seg.y1 =
      s.y1 == undefined ? undefined : s.t.charCodeAt(0) < 96 ? this.roundDec(s.y1) : this.roundDec(s.y1 - s.py);
    seg.x2 =
      s.x2 == undefined ? undefined : s.t.charCodeAt(0) < 96 ? this.roundDec(s.x2) : this.roundDec(s.x2 - s.px);
    seg.y2 =
      s.y2 == undefined ? undefined : s.t.charCodeAt(0) < 96 ? this.roundDec(s.y2) : this.roundDec(s.y2 - s.py);
    seg.r1 = s.r1 == undefined ? undefined : this.roundDec(s.r1);
    seg.r2 = s.r1 == undefined ? undefined : this.roundDec(s.r2);
    seg.ar = s.ar == undefined ? undefined : this.roundDec(s.ar);
    seg.af = s.af;
    seg.sf = s.sf;
    seg.info = s.info;
    if (s.t == "M") {
      seg.info += "m " + this.roundDec(s.x - s.px) + " " + this.roundDec(s.y - s.py);
    }
    if (s.t == "m") {
      seg.info += "M " + this.roundDec(s.x) + " " + this.roundDec(s.y);
    }
    return seg;
  }
  roundDec(dec,num) {
    if (dec < 0) return num;
    if (num % 1 === 0) {
      return num;
    } else if (dec == 0) {
      return Math.round(num);
    } else {
      var pow = Math.pow(10, dec);
      return Math.round(num * pow) / pow;
    }
  }
}

class Segment {
  constructor() {
    this.t = ""; // relatives are calculate via px and py
    this.x = undefined; // this is good for optimize, analyse, rotate, etc
    this.y = undefined; // bad for round, so round logic updated
    this.px = undefined;
    this.py = undefined;
    this.x1 = undefined;
    this.y1 = undefined;
    this.x2 = undefined;
    this.y2 = undefined;
    this.r1 = undefined;
    this.r2 = undefined;
    this.ar = undefined;
    this.af = undefined;
    this.sf = undefined;
    this.info = "";
    this.value = '';
  }
}

// format the segment for export
// check absolute-relative, and round decimals

function rotatePoint(px, py, ox, oy, sin, cos) {
  var x = cos * (px - ox) - sin * (py - oy) + ox;
  var y = sin * (px - ox) + cos * (py - oy) + oy;
  return [x, y];
}

function atan3(x, y) {
  var result = Math.atan2(y, x);
  if (result < 0) {
    result += 2 * Math.PI;
  }
  return result;
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SVGPath);

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
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92ZWdhLWZpLy4vc3JjL2NvZGUudHMiLCJ3ZWJwYWNrOi8vdmVnYS1maS8uL3NyYy9TVkdQYXRocy5qcyIsIndlYnBhY2s6Ly92ZWdhLWZpL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3ZlZ2EtZmkvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3ZlZ2EtZmkvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly92ZWdhLWZpL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDb0M7QUFDcEMsVUFBVSxxQkFBcUI7QUFDL0IsVUFBVSxpQkFBaUI7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLFlBQVk7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFdBQVc7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IsaURBQU87QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELEdBQUc7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxHQUFHO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0EsMkNBQTJDO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBDQUEwQztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUU7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZGQUE2RjtBQUM3RjtB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QUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQSxtQkFBbUIsOEJBQThCO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQix1QkFBdUI7QUFDdkIsdUJBQXVCO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBLGlFQUFlLE9BQU8sRTs7Ozs7O1VDbGhCdEI7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDckJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSxzRjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSxzREFBc0Qsa0JBQWtCO1dBQ3hFO1dBQ0EsK0NBQStDLGNBQWM7V0FDN0QsRTs7OztVQ05BO1VBQ0E7VUFDQTtVQUNBIiwiZmlsZSI6ImNvZGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvL2NvbnN0IFBhcGVyID0gcmVxdWlyZSgncGFwZXInKVxuaW1wb3J0IFNWR1BhdGggZnJvbSBcIi4vU1ZHUGF0aHMuanNcIjtcbi8vaW1wb3J0IHtjcmVhdGVOb3JtYWxpemVkUGF0aH0gZnJvbSBcIi4vaGVscGVyRnVuY3Rpb25zXCI7XG4vL2ltcG9ydCB7U1ZHcGF0aCwgU1ZHc2Vnc30gZnJvbSAnLi9TVkdQYXRocy5qcyc7XG4vLyBUaGlzIHBsdWdpbiB3aWxsIG9wZW4gYSB3aW5kb3cgdG8gcHJvbXB0IHRoZSB1c2VyIHRvIGVudGVyIGEgbnVtYmVyLCBhbmRcbi8vIGl0IHdpbGwgdGhlbiBjcmVhdGUgdGhhdCBtYW55IHJlY3RhbmdsZXMgb24gdGhlIHNjcmVlbi5cbi8vIFRoaXMgZmlsZSBob2xkcyB0aGUgbWFpbiBjb2RlIGZvciB0aGUgcGx1Z2lucy4gSXQgaGFzIGFjY2VzcyB0byB0aGUgKmRvY3VtZW50Ki5cbi8vIFlvdSBjYW4gYWNjZXNzIGJyb3dzZXIgQVBJcyBpbiB0aGUgPHNjcmlwdD4gdGFnIGluc2lkZSBcInVpLmh0bWxcIiB3aGljaCBoYXMgYVxuLy8gZnVsbCBicm93c2VyIGVudmlyb25tZW50IChzZWUgZG9jdW1lbnRhdGlvbikuXG4vLyBUaGlzIHNob3dzIHRoZSBIVE1MIHBhZ2UgaW4gXCJ1aS5odG1sXCIuXG5maWdtYS5zaG93VUkoX19odG1sX18pO1xuY29uc3QgUEFERElOR19XSURUSF9SRUdFWCA9IC8oPzw9dHJhbnNsYXRlXFwoKVxcZCsvO1xuY29uc3QgUEFERElOR19IRUlHSFRfUkVHRVggPSAvKD88PXRyYW5zbGF0ZVxcKFxcZCssKVxcZCsvO1xuY29uc3QgU1ZHX1dJRFRIX1JFR0VYID0gLyg/PD13aWR0aD1cIilcXGQrLztcbmNvbnN0IFNWR19IRUlHSFRfUkVHRVggPSAvKD88PWhlaWdodD1cIilcXGQrLztcbmZ1bmN0aW9uIG1ha2VpZChsZW5ndGgpIHtcbiAgICB2YXIgcmVzdWx0ID0gXCJcIjtcbiAgICB2YXIgY2hhcmFjdGVycyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlcIjtcbiAgICB2YXIgY2hhcmFjdGVyc0xlbmd0aCA9IGNoYXJhY3RlcnMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVzdWx0ICs9IGNoYXJhY3RlcnMuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJhY3RlcnNMZW5ndGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGNsb25lKHZhbCkge1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsO1xuICAgIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZSA9PT0gXCJudW1iZXJcIiB8fCB0eXBlID09PSBcInN0cmluZ1wiIHx8IHR5cGUgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsLm1hcCgoeCkgPT4gY2xvbmUoeCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh2YWwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IG8gPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHZhbCkge1xuICAgICAgICAgICAgICAgIG9ba2V5XSA9IGNsb25lKHZhbFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRocm93IFwidW5rbm93blwiO1xufVxuZnVuY3Rpb24qIHdhbGtUcmVlKG5vZGUpIHtcbiAgICB5aWVsZCBub2RlO1xuICAgIGNvbnN0IHsgY2hpbGRyZW4gfSA9IG5vZGU7XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHlpZWxkKiB3YWxrVHJlZShjaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyBDYWxscyB0byBcInBhcmVudC5wb3N0TWVzc2FnZVwiIGZyb20gd2l0aGluIHRoZSBIVE1MIHBhZ2Ugd2lsbCB0cmlnZ2VyIHRoaXNcbi8vIGNhbGxiYWNrLiBUaGUgY2FsbGJhY2sgd2lsbCBiZSBwYXNzZWQgdGhlIFwicGx1Z2luTWVzc2FnZVwiIHByb3BlcnR5IG9mIHRoZVxuLy8gcG9zdGVkIG1lc3NhZ2UuXG5maWdtYS51aS5vbm1lc3NhZ2UgPSAobXNnKSA9PiB7XG4gICAgLy8gT25lIHdheSBvZiBkaXN0aW5ndWlzaGluZyBiZXR3ZWVuIGRpZmZlcmVudCB0eXBlcyBvZiBtZXNzYWdlcyBzZW50IGZyb21cbiAgICAvLyB5b3VyIEhUTUwgcGFnZSBpcyB0byB1c2UgYW4gb2JqZWN0IHdpdGggYSBcInR5cGVcIiBwcm9wZXJ0eSBsaWtlIHRoaXMuXG4gICAgLy9jb25zb2xlLmxvZyhTVkdwYXRoLCBTVkdzZWdzLG5ldyBTVkdzZWdzKFwiTSAwLjUgLTAuNSBsIDAgMSAtMSAwIDAgLTEgelwiKSk7XG4gICAgY29uc29sZS5sb2coU1ZHUGF0aCk7XG4gICAgaWYgKG1zZy50eXBlID09PSBcImNyZWF0ZVwiKSB7XG4gICAgICAgIGNvbnN0IG5vZGVzID0gW107XG4gICAgICAgIGNvbnN0IGlkID0gbWFrZWlkKDUpO1xuICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgICAgICBjb25zdCBuZXdBbm5vdGF0aW9uc0xheWVyID0gZmlnbWEuY3JlYXRlRnJhbWUoKTtcbiAgICAgICAgY29uc3QgdmlzdWFsaXphdGlvbiA9IGZpZ21hLmNyZWF0ZU5vZGVGcm9tU3ZnKG1zZy5vYmplY3QpO1xuICAgICAgICB2aXN1YWxpemF0aW9uLm5hbWUgPSBgVmlzdWFsaXphdGlvbiAtICR7aWR9YDtcbiAgICAgICAgLy8gcGxhY2UgYW5ub3RhdGlvbnMgbGF5ZXIgb24gdG9wIGFuZCBtYWtlIHRyYW5zcGFyZW50XG4gICAgICAgIGNvbnN0IGZpbGxzID0gY2xvbmUobmV3QW5ub3RhdGlvbnNMYXllci5maWxscyk7XG4gICAgICAgIGZpbGxzWzBdLm9wYWNpdHkgPSAwO1xuICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLmZpbGxzID0gZmlsbHM7XG4gICAgICAgIG5ld0Fubm90YXRpb25zTGF5ZXIuY2xpcHNDb250ZW50ID0gZmFsc2U7XG4gICAgICAgIG5ld0Fubm90YXRpb25zTGF5ZXIubmFtZSA9IGBBbm5vdGF0aW9ucyBMYXllciAtICR7aWR9YDtcbiAgICAgICAgLy8gZ3JhYiB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgICAgIC8vIHNldCBhbm5vdGF0aW9ucyB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgICAgIGNvbnN0IHdpZHRoTWF0Y2hlcyA9IG1zZy5vYmplY3QubWF0Y2goU1ZHX1dJRFRIX1JFR0VYKTtcbiAgICAgICAgY29uc3QgaGVpZ2h0TWF0Y2hlcyA9IG1zZy5vYmplY3QubWF0Y2goU1ZHX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmICh3aWR0aE1hdGNoZXMgJiYgaGVpZ2h0TWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBOdW1iZXIod2lkdGhNYXRjaGVzWzBdKTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IE51bWJlcihoZWlnaHRNYXRjaGVzWzBdKTtcbiAgICAgICAgICAgIG5ld0Fubm90YXRpb25zTGF5ZXIucmVzaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhZGRpbmdXaWR0aE1hdGNoZXMgPSBtc2cub2JqZWN0Lm1hdGNoKFBBRERJTkdfV0lEVEhfUkVHRVgpO1xuICAgICAgICBjb25zdCBwYWRkaW5nSGVpZ2h0TWF0Y2hlcyA9IG1zZy5vYmplY3QubWF0Y2goUEFERElOR19IRUlHSFRfUkVHRVgpO1xuICAgICAgICBpZiAocGFkZGluZ1dpZHRoTWF0Y2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd2lkdGhTdHJpbmcgPSBwYWRkaW5nV2lkdGhNYXRjaGVzWzBdO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdXaWR0aFwiLCB3aWR0aFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhZGRpbmdIZWlnaHRNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHRTdHJpbmcgPSBwYWRkaW5nSGVpZ2h0TWF0Y2hlc1swXTtcbiAgICAgICAgICAgIG5ld0Fubm90YXRpb25zTGF5ZXIuc2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nSGVpZ2h0XCIsIGhlaWdodFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgZmlnbWEuY3VycmVudFBhZ2UuYXBwZW5kQ2hpbGQodmlzdWFsaXphdGlvbik7XG4gICAgICAgIG5vZGVzLnB1c2godmlzdWFsaXphdGlvbik7XG4gICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IG5vZGVzO1xuICAgICAgICBmaWdtYS52aWV3cG9ydC5zY3JvbGxBbmRab29tSW50b1ZpZXcobm9kZXMpO1xuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09IFwiZmV0Y2hcIikge1xuICAgICAgICAvLyBmaW5kIGN1cnJlbnQgc2VsZWN0aW9uXG4gICAgICAgIC8vQHRzLWlnbm9yZSAgICAvL1xuICAgICAgICAvLyBncmFiIGFubm5vdGF0aW9ucyBsYXllcixcbiAgICAgICAgLy8gZ3JhYiBwbHVnaW4gZGF0YSBmb3IgdGhlIHdpZHRoL2hlaWdodCBwYWRkaW5nXG4gICAgICAgIC8vY29uc3QgbmV3U2VsZWN0aW9uID0gW2ZpZ21hLmZsYXR0ZW4oZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uKV07XG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdGlvbiA9IGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbi5tYXAoKG5vZGUpID0+IG5vZGUuY2xvbmUoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY3VycmVudFNlbGVjdGlvblwiLCBuZXdTZWxlY3Rpb24pO1xuICAgICAgICBjb25zdCBtYXJrc1RvQWRkID0gW107XG4gICAgICAgIGZvciAoY29uc3Qgc2NlbmVOb2RlIG9mIG5ld1NlbGVjdGlvbikge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUl0ZXJhdG9yID0gd2Fsa1RyZWUoc2NlbmVOb2RlKTtcbiAgICAgICAgICAgIGxldCBub2RlU3RlcCA9IG5vZGVJdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICB3aGlsZSAoIW5vZGVTdGVwLmRvbmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZVN0ZXAudmFsdWUuY2xvbmUoKTtcbiAgICAgICAgICAgICAgICAvLyBza2lwIG5vZGUgdHlwZXMgXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gXCJGUkFNRVwiIHx8IG5vZGUudHlwZSA9PT0gXCJHUk9VUFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibm9kZSB2YWx1ZVwiLCBub2RlKTtcbiAgICAgICAgICAgICAgICAvLyBpZiBub2RlVHlwZSBpcyBncm91cFxuICAgICAgICAgICAgICAgIGNvbnN0IHZlY3Rvcml6ZWROb2RlID0gdmVjdG9yaXplKG5vZGUpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaWxscycsIHZlY3Rvcml6ZWROb2RlLmZpbGxzLCB2ZWN0b3JpemVkTm9kZS52ZWN0b3JQYXRocyk7XG4gICAgICAgICAgICAgICAgLy8gbWlnaHQgaGF2ZSAyIHBhdGhzLCB2ZWN0b3JzIHdpdGggMiBwYXRoIGFyZSBmaW5lIHNlcGFyYXRlbHkuIFxuICAgICAgICAgICAgICAgIC8vIDIgcGF0aHMgbWlnaHQgaGF2ZSBkaWZmZXJlbnQgZmlsbHMuIFxuICAgICAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgZGF0YTogdmVjdG9yaXplZE5vZGUudmVjdG9yUGF0aHMsIG5vZGVJZDogdmVjdG9yaXplZE5vZGUuaWQsIHR5cGU6IFwibW9kaWZ5UGF0aFwiIH0pO1xuICAgICAgICAgICAgICAgIC8vY29uc3Qgbm9kZVN0eWxlcyA9IGV4dHJhY3RTdHlsZXModmVjdG9yaXplZE5vZGUpOyAvLyBjaGFuZ2UgdG8gdHJhbnNsYXRlIHN0eWxlcyBpbnRvIHZlZ2FzcGVjXG4gICAgICAgICAgICAgICAgLypjb25zdCBzdmdQYXRoID0gY3JlYXRlTm9ybWFsaXplZFBhdGgodmVjdG9yaXplZE5vZGUpO1xuICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQsIHRYLCB0WSwgc2NhbGUgfSA9IGNhbGN1bGF0ZVBsYWNlbWVudChcbiAgICAgICAgICAgICAgICAgIHZlY3Rvcml6ZWROb2RlLFxuICAgICAgICAgICAgICAgICAgdmlzYXVsaXphdGlvblBhZGRpbmdXaWR0aCxcbiAgICAgICAgICAgICAgICAgIHZpc2F1bGl6YXRpb25QYWRkaW5nSGVpZ2h0XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgICB2ZWN0b3JpemVkTm9kZS54LFxuICAgICAgICAgICAgICAgICAgdmVjdG9yaXplZE5vZGUueSxcbiAgICAgICAgICAgICAgICAgIHZlY3Rvcml6ZWROb2RlLndpZHRoLFxuICAgICAgICAgICAgICAgICAgdmVjdG9yaXplZE5vZGUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgbm9kZS52ZWN0b3JQYXRoc1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGB7XG4gICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzeW1ib2xcIixcbiAgICAgICAgICAgICAgICAgIFwiaW50ZXJhY3RpdmVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICBcImVuY29kZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiZW50ZXJcIjoge1xuICAgICAgICAgICAgICAgICAgICAgIFwic2hhcGVcIjoge1widmFsdWVcIjogXCIke3N2Z1BhdGh9XCJ9LFxuICAgICAgICAgICAgICAgICAgICAgIFwic2l6ZVwiOntcInZhbHVlXCI6JHtzY2FsZX19LFxuICAgICAgICAgICAgICAgICAgICAgIFwiZmlsbFwiOntcInZhbHVlXCI6XCJibGFja1wifVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOntcInZhbHVlXCI6JHt3aWR0aH19LFxuICAgICAgICAgICAgICAgICAgICAgIFwiaGVpZ2h0XCI6e1widmFsdWVcIjoke2hlaWdodH19LFxuICAgICAgICAgICAgICAgICAgICAgIFwieFwiOiB7XCJ2YWx1ZVwiOiAke3RYfX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IHtcInZhbHVlXCI6ICR7dFl9fVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIH1gKTsqL1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICBjb25zdFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdub2RlIHR5cHcnLG5vZGUudHlwZSk7XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gR2V0IHNjZW5lIG5vZGUgdHlwZVxuICAgICAgICAgICAgICAgIC8vIGlmIHRleHRcbiAgICAgICAgICAgICAgICAvLyB0ZXh0IG1ha2Ugc3ZnIGZvciBhbGwgZWxlbWVudHNcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gdHJhbnNmb3JtIHRvIHZlY3RvclxuICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBwcm9jZXNzIHBhdGhcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgcFggPSAxNTsgLy8gY3VycmVudCBWZWdhIHBhZGRpbmdcbiAgICAgICAgICAgICAgICBjb25zdCBwWSA9IDU7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIHJvdGF0aW9uIHRocm93cyBpdCBvZmYhXG4gICAgICAgIFxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJ4XCIsICgxIC8gMikgKiBtYXhEaW1lbnNpb24sIHgsIHBYLCAwLCByb3QpO1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJ5XCIsICgxIC8gMikgKiBtYXhEaW1lbnNpb24sIHksIHBZLCAwKTtcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgY29uc3QgdmFscyA9IHBhdGhTdHJpbmdzLm1hcCgocGF0aCkgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGB7XG4gICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzeW1ib2xcIixcbiAgICAgICAgICAgICAgICAgIFwiaW50ZXJhY3RpdmVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICBcImVuY29kZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiZW50ZXJcIjoge1xuICAgICAgICAgICAgICAgICAgICAgIFwiYW5nbGVcIjp7XCJ2YWx1ZVwiOiR7MH19LFxuICAgICAgICAgICAgICAgICAgICAgIFwic2hhcGVcIjoge1widmFsdWVcIjogXCIke3BhdGh9XCJ9LFxuICAgICAgICAgICAgICAgICAgICAgIFwic2l6ZVwiOntcInZhbHVlXCI6JHt2ZWN0b3JTY2FsZX19LFxuICAgICAgICAgICAgICAgICAgICAgIFwiZmlsbFwiOntcInZhbHVlXCI6XCJibGFja1wifVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBcInVwZGF0ZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOntcInZhbHVlXCI6JHt3aWR0aH19LFxuICAgICAgICAgICAgICAgICAgICAgIFwiaGVpZ2h0XCI6e1widmFsdWVcIjoke2hlaWdodH19LFxuICAgICAgICAgICAgICAgICAgICAgIFwieFwiOiB7XCJ2YWx1ZVwiOiAke3RYfX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IHtcInZhbHVlXCI6ICR7dFl9fVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIH1gO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh2YWxzWzBdKS5yZXBsYWNlKC9cXFxcbi9nLCBcIlwiKS5yZXBsYWNlKC9cXFxcL2csIFwiXCIpKTsqL1xuICAgICAgICAgICAgICAgIG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09IFwic2VuZFNjYWxlZFwiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdpbiBzY2FsZWRTZW5kIScsIG1zZy5vYmplY3QpO1xuICAgICAgICBjb25zdCBuZXdTZWxlY3Rpb24gPSBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb247XG4gICAgICAgIGNvbnN0IHZpc2F1bGl6YXRpb25QYWRkaW5nV2lkdGggPSBOdW1iZXIobmV3U2VsZWN0aW9uWzBdLmdldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ1dpZHRoXCIpKTtcbiAgICAgICAgY29uc3QgdmlzYXVsaXphdGlvblBhZGRpbmdIZWlnaHQgPSBOdW1iZXIobmV3U2VsZWN0aW9uWzBdLmdldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ0hlaWdodFwiKSk7XG4gICAgICAgIGNvbnN0IHZlY3Rvcml6ZWROb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQobXNnLm5vZGVJZCk7XG4gICAgICAgIC8vIGxpbmVzIGFuZCB2ZWN0b3JcbiAgICAgICAgaWYgKHZlY3Rvcml6ZWROb2RlLnR5cGUgIT09ICdWRUNUT1InKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0LCB0WCwgdFksIHNjYWxlIH0gPSBjYWxjdWxhdGVQbGFjZW1lbnQodmVjdG9yaXplZE5vZGUsIHZpc2F1bGl6YXRpb25QYWRkaW5nV2lkdGgsIHZpc2F1bGl6YXRpb25QYWRkaW5nSGVpZ2h0KTtcbiAgICAgICAgY29uc3Qgc3Ryb2tlU3BlY3MgPSBjYWxjdWxhdGVTdHJva2VTcGVjcyh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgIGNvbnN0IGZpbGxTcGVjcyA9IGNhbGN1bGF0ZUZpbGxTcGVjcyh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgIGNvbnN0IG1pc2NTcGVjcyA9IGNhbGN1bGF0ZU1pc2NTcGVjcyh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgIGNvbnN0IHByb3BlcnR5U3BlY3MgPSBbXS5jb25jYXQoc3Ryb2tlU3BlY3MsIGZpbGxTcGVjcywgbWlzY1NwZWNzKTtcbiAgICAgICAgY29uc3QgdHJhbnNsYXRlZFNwZWNzID0gYHtcbiAgICAgIFwidHlwZVwiOiBcInN5bWJvbFwiLFxuICAgICAgXCJpbnRlcmFjdGl2ZVwiOiBmYWxzZSxcbiAgICAgIFwiZW5jb2RlXCI6IHtcbiAgICAgICAgXCJlbnRlclwiOiB7XG4gICAgICAgICAgXCJzaGFwZVwiOiB7XCJ2YWx1ZVwiOiBcIiR7bXNnLm9iamVjdH1cIn0sXG4gICAgICAgICAgXCJzaXplXCI6e1widmFsdWVcIjoke3NjYWxlfX0sXG4gICAgICAgICAgJHtwcm9wZXJ0eVNwZWNzLmpvaW4oJywnKX1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwid2lkdGhcIjp7XCJ2YWx1ZVwiOiR7d2lkdGh9fSxcbiAgICAgICAgICBcImhlaWdodFwiOntcInZhbHVlXCI6JHtoZWlnaHR9fSxcbiAgICAgICAgICBcInhcIjoge1widmFsdWVcIjogJHt0WH19LFxuICAgICAgICAgIFwieVwiOiB7XCJ2YWx1ZVwiOiAke3RZfX1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICB9YDtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyBzcGVjU3RyaW5nOiB0cmFuc2xhdGVkU3BlY3MsIHR5cGU6IFwiZmluaXNoZWRNYXJrc1wiIH0pO1xuICAgIH1cbiAgICAvLyBNYWtlIHN1cmUgdG8gY2xvc2UgdGhlIHBsdWdpbiB3aGVuIHlvdSdyZSBkb25lLiBPdGhlcndpc2UgdGhlIHBsdWdpbiB3aWxsXG4gICAgLy8ga2VlcCBydW5uaW5nLCB3aGljaCBzaG93cyB0aGUgY2FuY2VsIGJ1dHRvbiBhdCB0aGUgYm90dG9tIG9mIHRoZSBzY3JlZW4uXG4gICAgLy9maWdtYS5jbG9zZVBsdWdpbigpO1xufTtcbmZ1bmN0aW9uIGlzTm90Tm9uZShwcm9wZXJ0eSkge1xuICAgIHJldHVybiBwcm9wZXJ0eSAhPT0gJ05PTkUnO1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlTWlzY1NwZWNzKG5vZGUpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gW107XG4gICAgaWYgKG5vZGUub3BhY2l0eSkge1xuICAgICAgICAvL0B0cy1pZ25vcmUgd3JvbmcgdHlwaW5ncyA/XG4gICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJvcGFjaXR5XCI6IHtcInZhbHVlXCI6ICR7bm9kZS5vcGFjaXR5fX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVGaWxsU3BlY3Mobm9kZSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBbXTtcbiAgICBpZiAobm9kZS5maWxscykge1xuICAgICAgICAvL0B0cy1pZ25vcmUgd3JvbmcgdHlwaW5ncyA/XG4gICAgICAgIGNvbnN0IGNvbG9yID0gbm9kZS5maWxsc1swXS5jb2xvcjtcbiAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcImZpbGxcIjoge1widmFsdWVcIjogXCIke3JnYlRvSGV4KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpfVwifWApO1xuICAgICAgICBpZiAobm9kZS5maWxsc1swXS5vcGFjaXR5KSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwiZmlsbE9wYWNpdHlcIjoge1widmFsdWVcIjogJHtub2RlLmZpbGxzWzBdLm9wYWNpdHl9fWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlU3Ryb2tlU3BlY3Mobm9kZSkge1xuICAgIGNvbnNvbGUubG9nKCdpbiBjYWxjIHNwZWMnLCBub2RlKTtcbiAgICBjb25zdCBuYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG5vZGUpO1xuICAgIGNvbnNvbGUubG9nKCdpbiBjYWxjIHNwZWMgbmFtZXMnLCBuYW1lcyk7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtdO1xuICAgIGlmIChub2RlLnN0cm9rZXMgJiYgbm9kZS5zdHJva2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy9AdHMtaWdub3JlIHdyb25nIHR5cGluZ3MgP1xuICAgICAgICBjb25zdCBjb2xvciA9IG5vZGUuc3Ryb2tlc1swXS5jb2xvcjtcbiAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZVwiOiB7XCJ2YWx1ZVwiOiBcIiR7cmdiVG9IZXgoY29sb3IuciwgY29sb3IuZywgY29sb3IuYil9XCJ9YCk7XG4gICAgICAgIGlmIChub2RlLnN0cm9rZXNbMF0ub3BhY2l0eSkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZU9wYWNpdHlcIjoge1widmFsdWVcIjogJHtub2RlLnN0cm9rZXNbMF0ub3BhY2l0eX19YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc3Ryb2tlQ2FwID09PSAnUk9VTkQnIHx8IG5vZGUuc3Ryb2tlQ2FwID09PSAnU1FVQVJFJykge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZUNhcFwiOiB7XCJ2YWx1ZVwiOiBcInJvdW5kXCJ9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc3Ryb2tlV2VpZ2h0KSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYFwic3Ryb2tlV2lkdGhcIjoge1widmFsdWVcIjogJHtub2RlLnN0cm9rZVdlaWdodH19YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuZGFzaFBhdHRlcm4pIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMucHVzaChgXCJzdHJva2VEYXNoXCI6IHtcInZhbHVlXCI6ICR7bm9kZS5kYXNoUGF0dGVybn19YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc3Ryb2tlTWl0ZXJMaW1pdCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGBcInN0cm9rZU1pdGVyTGltaXRcIjoge1widmFsdWVcIjogJHtub2RlLnN0cm9rZU1pdGVyTGltaXR9fWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJldHVybiBhbGwgc3Ryb2tlIHByb3BlcnRpZXMgYXMgc3RyaW5nXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59XG5mdW5jdGlvbiBjb21wb25lbnRUb0hleChjKSB7XG4gICAgdmFyIGhleCA9IGMudG9TdHJpbmcoMTYpO1xuICAgIHJldHVybiBoZXgubGVuZ3RoID09IDEgPyBcIjBcIiArIGhleCA6IGhleDtcbn1cbmZ1bmN0aW9uIHJnYlRvSGV4KHIsIGcsIGIpIHtcbiAgICByZXR1cm4gXCIjXCIgKyBjb21wb25lbnRUb0hleChyKSArIGNvbXBvbmVudFRvSGV4KGcpICsgY29tcG9uZW50VG9IZXgoYik7XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVQbGFjZW1lbnQobm9kZSwgcGFkZGluZ1gsIHBhZGRpbmdZKSB7XG4gICAgY29uc3Qgd2lkdGggPSBub2RlLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgIGNvbnN0IHggPSBub2RlLng7XG4gICAgY29uc3QgeSA9IG5vZGUueTtcbiAgICBjb25zdCBtYXhEaW1lbnNpb24gPSBNYXRoLm1heCh3aWR0aCwgaGVpZ2h0KTtcbiAgICBjb25zdCB0WCA9ICgxIC8gMikgKiB3aWR0aCArIHggLSBwYWRkaW5nWDsgLy8rIChtYXhEaW1lbnNpb24taGVpZ2h0KS8yOyAvLyB0b3RhbCB0cmFuc2xhdGVcbiAgICBjb25zdCB0WSA9ICgxIC8gMikgKiBoZWlnaHQgKyB5IC0gcGFkZGluZ1k7IC8vKyAobWF4RGltZW5zaW9uLWhlaWdodCkvMjsgLy8gdG90YWwgdHJhbnNsYXRlXG4gICAgY29uc3Qgc2NhbGUgPSBtYXhEaW1lbnNpb24gKiBtYXhEaW1lbnNpb247XG4gICAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodCwgdFgsIHRZLCBzY2FsZSB9O1xufVxuZnVuY3Rpb24gc2hvdWxkTm9kZUJlT3V0bGluZVN0cm9rZXMobm9kZSkge1xuICAgIGNvbnNvbGUubG9nKCdpbiBvdXRsaW5lJywgbm9kZSk7XG4gICAgLy8gaWYgdGhlIGl0ZW0gaGFzIGFuIGFycm93IGVuZCwgb3V0bGluZSBzdHJva2UgYmVjYXVzZSBhcnJvdyBzdHJva2UgY2FwIGNhbm5vdCBiZSBhcHBsaWVkIDooXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gXCJWRUNUT1JcIiAmJiBcInN0cm9rZUNhcFwiIGluIG5vZGUudmVjdG9yTmV0d29yay52ZXJ0aWNlc1tub2RlLnZlY3Rvck5ldHdvcmsudmVydGljZXMubGVuZ3RoIC0gMV0gJiYgbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzW25vZGUudmVjdG9yTmV0d29yay52ZXJ0aWNlcy5sZW5ndGggLSAxXS5zdHJva2VDYXAgIT09ICdOT05FJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoXCJzdHJva2VBbGlnblwiIGluIG5vZGUgJiYgbm9kZS5zdHJva2VBbGlnbiAhPT0gXCJDRU5URVJcIikge1xuICAgICAgICAvLyBhcyB2ZWdhIGRvZXNuJ3Qgc3VwcG9ydCBpbnNpZGUgb3IgY2VudGVyLCBvdXRsaW5lIHN0cm9rZVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gdmVjdG9yaXplKG5vZGUpIHtcbiAgICAvLyBpZiBub2RlIGlzIHRleHQsIGNvbWJpbmUgYWxsIHZlY3RvciBwYXRoc1xuICAgIGxldCB2ZWN0b3JOb2RlID0gZmlnbWEuZmxhdHRlbihbbm9kZV0pO1xuICAgIGNvbnNvbGUubG9nKG5vZGUudHlwZSk7XG4gICAgLy8gaWYgdGV4dCwgbGluZSB3aXRoIHN0cm9rZVxuICAgIGNvbnNvbGUubG9nKCdiZWZvcmUnLCB2ZWN0b3JOb2RlLnZlY3RvclBhdGhzKTtcbiAgICAvLyBsaW5lcyBhbmQgdmVjdG9yIHBhdGhzIHdpdGggc3Ryb2tlcyBcbiAgICBjb25zdCBvdXRsaW5lZE5vZGVzID0gdmVjdG9yTm9kZS5vdXRsaW5lU3Ryb2tlKCk7XG4gICAgLy8gaWYgbm8gZmlsbHMsIG91dGxpbmUgc3Ryb2tlXG4gICAgY29uc29sZS5sb2codmVjdG9yTm9kZS5maWxscywgdmVjdG9yTm9kZS5zdHJva2VzKTtcbiAgICBpZiAob3V0bGluZWROb2RlcyAmJiBzaG91bGROb2RlQmVPdXRsaW5lU3Ryb2tlcyh2ZWN0b3JOb2RlKSkge1xuICAgICAgICB2ZWN0b3JOb2RlID0gb3V0bGluZWROb2RlcztcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ2FmdGVyJywgdmVjdG9yTm9kZS52ZWN0b3JQYXRocyk7XG4gICAgY29uc29sZS5sb2codmVjdG9yTm9kZSk7XG4gICAgcmV0dXJuIHZlY3Rvck5vZGU7XG59XG5mdW5jdGlvbiBkZWcyUmFkaWFuKGRlZykge1xuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MCk7XG59XG5mdW5jdGlvbiBtdWx0aXBseU1hdHJpY2VzKG1hdHJpeEEsIG1hdHJpeEIpIHtcbiAgICBsZXQgYU51bVJvd3MgPSBtYXRyaXhBLmxlbmd0aDtcbiAgICBsZXQgYU51bUNvbHMgPSBtYXRyaXhBWzBdLmxlbmd0aDtcbiAgICBsZXQgYk51bVJvd3MgPSBtYXRyaXhCLmxlbmd0aDtcbiAgICBsZXQgYk51bUNvbHMgPSBtYXRyaXhCWzBdLmxlbmd0aDtcbiAgICBsZXQgbmV3TWF0cml4ID0gbmV3IEFycmF5KGFOdW1Sb3dzKTtcbiAgICBmb3IgKGxldCByID0gMDsgciA8IGFOdW1Sb3dzOyArK3IpIHtcbiAgICAgICAgbmV3TWF0cml4W3JdID0gbmV3IEFycmF5KGJOdW1Db2xzKTtcbiAgICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCBiTnVtQ29sczsgKytjKSB7XG4gICAgICAgICAgICBuZXdNYXRyaXhbcl1bY10gPSAwO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhTnVtQ29sczsgKytpKSB7XG4gICAgICAgICAgICAgICAgbmV3TWF0cml4W3JdW2NdICs9IG1hdHJpeEFbcl1baV0gKiBtYXRyaXhCW2ldW2NdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXdNYXRyaXg7XG59XG5mdW5jdGlvbiBtdWx0aXBseShhLCBiKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgW1xuICAgICAgICAgICAgYVswXVswXSAqIGJbMF1bMF0gKyBhWzBdWzFdICogYlsxXVswXSxcbiAgICAgICAgICAgIGFbMF1bMF0gKiBiWzBdWzFdICsgYVswXVsxXSAqIGJbMV1bMV0sXG4gICAgICAgICAgICBhWzBdWzBdICogYlswXVsyXSArIGFbMF1bMV0gKiBiWzFdWzJdICsgYVswXVsyXSxcbiAgICAgICAgXSxcbiAgICAgICAgW1xuICAgICAgICAgICAgYVsxXVswXSAqIGJbMF1bMF0gKyBhWzFdWzFdICogYlsxXVswXSxcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzFdICsgYVsxXVsxXSAqIGJbMV1bMV0gKyAwLFxuICAgICAgICAgICAgYVsxXVswXSAqIGJbMF1bMl0gKyBhWzFdWzFdICogYlsxXVsyXSArIGFbMV1bMl0sXG4gICAgICAgIF0sXG4gICAgXTtcbn1cbi8vIENyZWF0ZXMgYSBcIm1vdmVcIiB0cmFuc2Zvcm0uXG5mdW5jdGlvbiBtb3ZlKHgsIHkpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICBbMSwgMCwgeF0sXG4gICAgICAgIFswLCAxLCB5XSxcbiAgICBdO1xufVxuLy8gQ3JlYXRlcyBhIFwicm90YXRlXCIgdHJhbnNmb3JtLlxuZnVuY3Rpb24gcm90YXRlKHRoZXRhKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgW01hdGguY29zKHRoZXRhKSwgTWF0aC5zaW4odGhldGEpLCAwXSxcbiAgICAgICAgWy1NYXRoLnNpbih0aGV0YSksIE1hdGguY29zKHRoZXRhKSwgMF0sXG4gICAgXTtcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZVhZRnJvbU5vZGUobm9kZSkge1xuICAgIGxldCBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRYID0gbm9kZS54O1xuICAgIGxldCBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRZID0gbm9kZS55O1xuICAgIGxldCB4ID0gbm9kZS53aWR0aCAvIDI7XG4gICAgbGV0IHkgPSBub2RlLndpZHRoIC8gMjtcbiAgICBsZXQgcm90YXRpb25EZWcgPSAtbm9kZS5yb3RhdGlvbjtcbiAgICBsZXQgcm90YXRpb25SYWQgPSAoTWF0aC5QSSAqIHJvdGF0aW9uRGVnKSAvIDE4MDtcbiAgICBsZXQgeFRyYW5zZm9ybSA9IHggLSB4ICogTWF0aC5jb3Mocm90YXRpb25SYWQpICsgeSAqIE1hdGguc2luKHJvdGF0aW9uUmFkKTtcbiAgICBsZXQgeVRyYW5zZm9ybSA9IHkgLSB4ICogTWF0aC5zaW4ocm90YXRpb25SYWQpICsgeSAqIE1hdGguY29zKHJvdGF0aW9uUmFkKTtcbiAgICBsZXQgcm90YXRpb25UcmFuc2Zvcm0gPSBbXG4gICAgICAgIFtNYXRoLmNvcyhyb3RhdGlvblJhZCksIC1NYXRoLnNpbihyb3RhdGlvblJhZCksIHhUcmFuc2Zvcm1dLFxuICAgICAgICBbTWF0aC5zaW4ocm90YXRpb25SYWQpLCBNYXRoLmNvcyhyb3RhdGlvblJhZCksIHlUcmFuc2Zvcm1dLFxuICAgIF07XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0gPSByb3RhdGlvblRyYW5zZm9ybTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbm9kZS54ICs9IGxvY2F0aW9uUmVsYXRpdmVUb1BhcmVudFg7XG4gICAgbm9kZS55ICs9IGxvY2F0aW9uUmVsYXRpdmVUb1BhcmVudFk7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS55KSwgSlNPTi5zdHJpbmdpZnkobm9kZS54KSk7XG59XG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgY2FsY3VsYXRlcyB0aGUgY29ycmVjdCBYWSBwb3NpdGlvbiBpZ25vcmluZyByb3RhdGlvblxuICogQHBhcmFtIG5vZGVcbiAqL1xuZnVuY3Rpb24gbmV3Q2FsY3VsYXRlUmVsYXRpdmUob3JpZ2luYWxOb2RlKSB7XG4gICAgY29uc3Qgbm9kZSA9IG9yaWdpbmFsTm9kZS5jbG9uZSgpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICAvL2NvbnN0IHggPSBvcmlnaW5hbE5vZGUueDtcbiAgICAvL2NvbnN0IHkgPSBvcmlnaW5hbE5vZGUueTtcbiAgICAvL25vZGUueCA9IDA7XG4gICAgLy9ub2RlLnkgPSAwO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUuYWJzb2x1dGVUcmFuc2Zvcm0pKTtcbiAgICAvL25vZGUucm90YXRpb24gPSAwO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBsZXQgdHJhbnNmb3JtID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy8gbW92ZSB0byAwXG4gICAgbGV0IHggPSB0cmFuc2Zvcm1bMF1bMl07XG4gICAgbGV0IHkgPSB0cmFuc2Zvcm1bMV1bMl07XG4gICAgdHJhbnNmb3JtWzBdWzJdID0gMDtcbiAgICB0cmFuc2Zvcm1bMV1bMl0gPSAwO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSAzNjBcIiwgSlNPTi5zdHJpbmdpZnkodHJhbnNmb3JtKSk7XG4gICAgdHJhbnNmb3JtID0gbXVsdGlwbHkocm90YXRlKDIgKiBNYXRoLlBJIC0gKG5vZGUucm90YXRpb24gLSBNYXRoLlBJKSAvIDE4MCksIHRyYW5zZm9ybSk7XG4gICAgY29uc29sZS5sb2coXCJmcm9tIGFmdGVyIHJvdFwiLCBKU09OLnN0cmluZ2lmeSh0cmFuc2Zvcm0pKTtcbiAgICB0cmFuc2Zvcm0gPSBtdWx0aXBseShtb3ZlKHgsIHkpLCB0cmFuc2Zvcm0pO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSBhZnRlciBtb3ZlXCIsIEpTT04uc3RyaW5naWZ5KHRyYW5zZm9ybSkpO1xuICAgIGNvbnN0IGRpZlggPSBub2RlLng7XG4gICAgY29uc3QgZGlmWSA9IG5vZGUueTtcbiAgICBjb25zb2xlLmxvZyhcImNhbGNlZFwiLCBkaWZYLCBkaWZZLCB4ICsgZGlmWCwgeSArIGRpZlkpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBjb25zb2xlLmxvZyhtdWx0aXBseShyb3RhdGUoLW5vZGUucm90YXRpb24pLCB0cmFuc2Zvcm0pKTtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gMzYwXCIsIG11bHRpcGx5KHJvdGF0ZSgtKG5vZGUucm90YXRpb24gLSBNYXRoLlBJKSAvIDE4MCksIG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICAvLyByb3RhdGUgYmFja1xuICAgIGNvbnN0IGFuZ2xlSW5SYWRpYW5zID0gZGVnMlJhZGlhbigtbm9kZS5yb3RhdGlvbik7XG4gICAgY29uc29sZS5sb2cobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSk7XG4gICAgY29uc3QgbmV0cmFuc2Zvcm0gPSBtdWx0aXBseShyb3RhdGUoYW5nbGVJblJhZGlhbnMpLCBub2RlLnJlbGF0aXZlVHJhbnNmb3JtKTtcbiAgICBjb25zb2xlLmxvZyhuZXRyYW5zZm9ybSk7XG4gICAgLypcbiAgICBjb25zb2xlLmxvZyhub2RlLnJlbGF0aXZlVHJhbnNmb3JtKVxuICAgIGxldCByb3RlciA9IG5vZGUucm90YXRpb247XG4gICAgbm9kZS5yb3RhdGlvbiA9IDA7XG4gIFxuICAgIGNvbnNvbGUubG9nKCdvbGQgeCcsSlNPTi5zdHJpbmdpZnkobm9kZS54KSxKU09OLnN0cmluZ2lmeShub2RlLnkpLEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBub2RlLnJvdGF0aW9uID0gcm90ZXI7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ25ldyB4Jyx4LHksSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpXG4gIFxuICBcbiAgXG4gICAgY29uc3Qgd2lkdGggPSBub2RlLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgIGNvbnNvbGUubG9nKHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgIGNvbnN0IHJvdCA9IChub2RlLnJvdGF0aW9uICogTWF0aC5QSSkgLyAxODA7IC8vIGluIHJhZGlhbnNcbiAgXG4gICAgLy8gbm90ZSwgdG8gY2FsY3VsYXRlIGRpc3RhbmNlIGZyb20gcm90YXRpb24sIHlvdSBtdXN0IGZsaXAgdGhlIHNpZ24gICgxLzIpSCBiZWNhdXNlIGluIGNhcnRlc2lhbiBjb29yZGluYXRlcyB5IERFQ1JFQVNFUyBhcyB5b3VcbiAgICBjb25zdCByZWFsWCA9IHggKyAoMSAvIDIpICogd2lkdGggKiBNYXRoLmNvcyhyb3QpIC8qLSAtMSAqICgxIC8gMikgKiBoZWlnaHQgKiBNYXRoLnNpbihyb3QpICAtICgxIC8gMikgKiB3aWR0aDtcbiAgICAgIGNvbnNvbGUubG9nKHksKDEgLyAyKSAqIHdpZHRoICogTWF0aC5zaW4ocm90KSwgLTEgKiAoMSAvIDIpICogaGVpZ2h0ICogTWF0aC5jb3Mocm90KSwgKDEgLyAyKSAqIGhlaWdodClcbiAgXG4gICAgY29uc3QgcmVhbFkgPVxuICAgICAgeSArICgxIC8gMikgKiB3aWR0aCAqIE1hdGguc2luKHJvdCkgLyorIC0xICogKDEgLyAyKSAqIGhlaWdodCAqIE1hdGguY29zKHJvdCkgKygxIC8gMikgKiBoZWlnaHQ7XG4gICAgcmV0dXJuIFtyZWFsWCwgcmVhbFldOyovXG4gICAgY29uc3QgdG90YWxMZW5ndGhPZkh5cG8gPSBNYXRoLnNxcnQobm9kZS53aWR0aCAqIG5vZGUud2lkdGggKyBub2RlLmhlaWdodCAqIG5vZGUuaGVpZ2h0KTtcbn1cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24sIGkuZS4gdGhlIHRyYW5zbGF0aW9uIGFuZCBzY2FsaW5nLCByZXF1aXJlZFxuLy8gdG8gZ2V0IHRoZSBwYXRoIHRvIGZpbGwgdGhlIHN2ZyBhcmVhLiBOb3RlIHRoYXQgdGhpcyBhc3N1bWVzIHVuaWZvcm1cbi8vIHNjYWxpbmcsIGEgcGF0aCB0aGF0IGhhcyBubyBvdGhlciB0cmFuc2Zvcm1zIGFwcGxpZWQgdG8gaXQsIGFuZCBub1xuLy8gZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgc3ZnIHZpZXdwb3J0IGFuZCB2aWV3Qm94IGRpbWVuc2lvbnMuXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBzdmdXZHRoID0gMjtcbiAgICB2YXIgc3ZnSGdodCA9IDI7XG4gICAgdmFyIG9yaWdQYXRoSGdodCA9IGhlaWdodDtcbiAgICB2YXIgb3JpZ1BhdGhXZHRoID0gd2lkdGg7XG4gICAgdmFyIG9yaWdQYXRoWSA9IHk7XG4gICAgdmFyIG9yaWdQYXRoWCA9IHg7XG4gICAgLy8gaG93IG11Y2ggYmlnZ2VyIGlzIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gICAgLy8gcmVsYXRpdmUgdG8gdGhlIHBhdGggaW4gZWFjaCBkaW1lbnNpb24/XG4gICAgdmFyIHNjYWxlQmFzZWRPbldkdGggPSBzdmdXZHRoIC8gb3JpZ1BhdGhXZHRoO1xuICAgIHZhciBzY2FsZUJhc2VkT25IZ2h0ID0gc3ZnSGdodCAvIG9yaWdQYXRoSGdodDtcbiAgICAvLyBvZiB0aGUgc2NhbGluZyBmYWN0b3JzIGRldGVybWluZWQgaW4gZWFjaCBkaW1lbnNpb24sXG4gICAgLy8gdXNlIHRoZSBzbWFsbGVyIG9uZTsgb3RoZXJ3aXNlIHBvcnRpb25zIG9mIHRoZSBwYXRoXG4gICAgLy8gd2lsbCBsaWUgb3V0c2lkZSB0aGUgdmlld3BvcnQgKGNvcnJlY3QgdGVybT8pXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oc2NhbGVCYXNlZE9uV2R0aCwgc2NhbGVCYXNlZE9uSGdodCk7XG4gICAgLy8gY2FsY3VsYXRlIHRoZSBib3VuZGluZyBib3ggcGFyYW1ldGVyc1xuICAgIC8vIGFmdGVyIHRoZSBwYXRoIGhhcyBiZWVuIHNjYWxlZCByZWxhdGl2ZSB0byB0aGUgb3JpZ2luXG4gICAgLy8gYnV0IGJlZm9yZSBhbnkgc3Vic2VxdWVudCB0cmFuc2xhdGlvbnMgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICB2YXIgc2NhbGVkUGF0aFggPSBvcmlnUGF0aFggKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aFkgPSBvcmlnUGF0aFkgKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aFdkdGggPSBvcmlnUGF0aFdkdGggKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aEhnaHQgPSBvcmlnUGF0aEhnaHQgKiBzY2FsZTtcbiAgICAvLyBjYWxjdWxhdGUgdGhlIGNlbnRyZSBwb2ludHMgb2YgdGhlIHNjYWxlZCBidXQgdW50cmFuc2xhdGVkIHBhdGhcbiAgICAvLyBhcyB3ZWxsIGFzIG9mIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gICAgdmFyIHNjYWxlZFBhdGhDZW50cmVYID0gc2NhbGVkUGF0aFggKyBzY2FsZWRQYXRoV2R0aCAvIDI7XG4gICAgdmFyIHNjYWxlZFBhdGhDZW50cmVZID0gc2NhbGVkUGF0aFkgKyBzY2FsZWRQYXRoSGdodCAvIDI7XG4gICAgdmFyIHN2Z1Jvb3RDZW50cmVYID0gMDsgLy8gLXN2Z1dkdGggLyAyO1xuICAgIHZhciBzdmdSb290Q2VudHJlWSA9IDA7IC8vLXN2Z0hnaHQgLyAyO1xuICAgIC8vIGNhbGN1bGF0ZSB0cmFuc2xhdGlvbiByZXF1aXJlZCB0byBjZW50cmUgdGhlIHBhdGhcbiAgICAvLyBvbiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIHZhciBwYXRoVHJhbnNsWCA9IHN2Z1Jvb3RDZW50cmVYIC0gc2NhbGVkUGF0aENlbnRyZVg7XG4gICAgdmFyIHBhdGhUcmFuc2xZID0gc3ZnUm9vdENlbnRyZVkgLSBzY2FsZWRQYXRoQ2VudHJlWTtcbiAgICBjb25zb2xlLmxvZyhcInNjYWxlZCBwYXRoIHhcIiwgc2NhbGVkUGF0aFgsIHNjYWxlZFBhdGhXZHRoLCBcInNjYWxlZCBwYXRoIHlcIiwgc2NhbGVkUGF0aFksIHNjYWxlZFBhdGhIZ2h0LCBcImZhY3RvciBmcm9tIHNjYWxlXCIsIChvcmlnUGF0aEhnaHQgLSBvcmlnUGF0aFdkdGgpIC8gMiwgXCJ4ZmFjdG9yIGZyb20gZ1wiKTtcbiAgICAvL1xuICAgIGNvbnNvbGUubG9nKHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpO1xuICAgIHJldHVybiB7IHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUgfTtcbn1cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybWVkUGF0aERTdHIob2xkUGF0aERTdHIsIHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpIHtcbiAgICAvLyBjb25zdGFudHMgdG8gaGVscCBrZWVwIHRyYWNrIG9mIHRoZSB0eXBlcyBvZiBTVkcgY29tbWFuZHMgaW4gdGhlIHBhdGhcbiAgICB2YXIgQk9USF9YX0FORF9ZID0gMTtcbiAgICB2YXIgSlVTVF9YID0gMjtcbiAgICB2YXIgSlVTVF9ZID0gMztcbiAgICB2YXIgTk9ORSA9IDQ7XG4gICAgdmFyIEVMTElQVElDQUxfQVJDID0gNTtcbiAgICB2YXIgQUJTT0xVVEUgPSA2O1xuICAgIHZhciBSRUxBVElWRSA9IDc7XG4gICAgLy8gdHdvIHBhcmFsbGVsIGFycmF5cywgd2l0aCBlYWNoIGVsZW1lbnQgYmVpbmcgb25lIGNvbXBvbmVudCBvZiB0aGVcbiAgICAvLyBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoLCB3aXRoIG9uZSBjb21wb25lbnQgYmVpbmcgZWl0aGVyXG4gICAgLy8gYW4gaW5zdHJ1Y3Rpb24gKGUuZy4gXCJNXCIgZm9yIG1vdmV0bywgZXRjLikgb3IgbnVtZXJpY2FsIHZhbHVlXG4gICAgLy8gZm9yIGVpdGhlciBhbiB4IG9yIHkgY29vcmRpbmF0ZVxuICAgIHZhciBvbGRQYXRoREFyciA9IGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMob2xkUGF0aERTdHIpO1xuICAgIHZhciBuZXdQYXRoREFyciA9IFtdO1xuICAgIGNvbnNvbGUubG9nKG9sZFBhdGhEQXJyKTtcbiAgICB2YXIgY29tbWFuZFBhcmFtcywgYWJzT3JSZWwsIG9sZFBhdGhEQ29tcCwgbmV3UGF0aERDb21wO1xuICAgIC8vIGVsZW1lbnQgaW5kZXhcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB3aGlsZSAoaWR4IDwgb2xkUGF0aERBcnIubGVuZ3RoKSB7XG4gICAgICAgIHZhciBvbGRQYXRoRENvbXAgPSBvbGRQYXRoREFycltpZHhdO1xuICAgICAgICBpZiAoL15bQS1aYS16XSQvLnRlc3Qob2xkUGF0aERDb21wKSkge1xuICAgICAgICAgICAgLy8gY29tcG9uZW50IGlzIGEgc2luZ2xlIGxldHRlciwgaS5lLiBhbiBzdmcgcGF0aCBjb21tYW5kXG4gICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9sZFBhdGhEQ29tcCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXdQYXRoREFycltpZHhdKTtcbiAgICAgICAgICAgIHN3aXRjaCAob2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVwiOiAvLyBlbGxpcHRpY2FsIGFyYyBjb21tYW5kLi4udGhlIG1vc3QgY29tcGxpY2F0ZWQgb25lXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBFTExJUFRJQ0FMX0FSQztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkhcIjogLy8gaG9yaXpvbnRhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGFuIHgtY29vcmRpbmF0ZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9YO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOiAvLyB2ZXJ0aWNhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGEgeS1jb29yZGluYXRlXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBKVVNUX1k7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJaXCI6IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBOT05FO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgb3RoZXIgY29tbWFuZHM7IGFsbCBvZiB0aGVtIHJlcXVpcmUgYm90aCB4IGFuZCB5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBCT1RIX1hfQU5EX1k7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhYnNPclJlbCA9IG9sZFBhdGhEQ29tcCA9PT0gb2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkgPyBBQlNPTFVURSA6IFJFTEFUSVZFO1xuICAgICAgICAgICAgLy8gbG93ZXJjYXNlIGNvbW1hbmRzIGFyZSByZWxhdGl2ZSwgdXBwZXJjYXNlIGFyZSBhYnNvbHV0ZVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgY29tcG9uZW50IGlzIG5vdCBhIGxldHRlciwgdGhlbiBpdCBpcyBhIG51bWVyaWMgdmFsdWVcbiAgICAgICAgICAgIHZhciB0cmFuc2xYLCB0cmFuc2xZO1xuICAgICAgICAgICAgaWYgKGFic09yUmVsID09PSBBQlNPTFVURSkge1xuICAgICAgICAgICAgICAgIC8vIHRoZSB0cmFuc2xhdGlvbiBpcyByZXF1aXJlZCBmb3IgYWJzb2x1dGUgY29tbWFuZHMuLi5cbiAgICAgICAgICAgICAgICB0cmFuc2xYID0gcGF0aFRyYW5zbFg7XG4gICAgICAgICAgICAgICAgdHJhbnNsWSA9IHBhdGhUcmFuc2xZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYWJzT3JSZWwgPT09IFJFTEFUSVZFKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uYnV0IG5vdCByZWxhdGl2ZSBvbmVzXG4gICAgICAgICAgICAgICAgdHJhbnNsWCA9IDA7XG4gICAgICAgICAgICAgICAgdHJhbnNsWSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGNvbW1hbmRQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAvLyBmaWd1cmUgb3V0IHdoaWNoIG9mIHRoZSBudW1lcmljIHZhbHVlcyBmb2xsb3dpbmcgYW4gc3ZnIGNvbW1hbmRcbiAgICAgICAgICAgICAgICAvLyBhcmUgcmVxdWlyZWQsIGFuZCB0aGVuIHRyYW5zZm9ybSB0aGUgbnVtZXJpYyB2YWx1ZShzKSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIHBhdGggZC1hdHRyaWJ1dGUgYW5kIHBsYWNlIGl0IGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZVxuICAgICAgICAgICAgICAgIC8vIGFycmF5IHRoYXQgd2lsbCBldmVudHVhbGx5IGJlY29tZSB0aGUgZC1hdHRyaWJ1dGUgZm9yIHRoZSBuZXcgcGF0aFxuICAgICAgICAgICAgICAgIGNhc2UgQk9USF9YX0FORF9ZOlxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgICAgICAgICAgIGlkeCArPSAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEpVU1RfWDpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgSlVTVF9ZOlxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBFTExJUFRJQ0FMX0FSQzpcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGVsbGlwdGljYWwgYXJjIGhhcyB4IGFuZCB5IHZhbHVlcyBpbiB0aGUgZmlyc3QgYW5kIHNlY29uZCBhcyB3ZWxsIGFzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSA2dGggYW5kIDd0aCBwb3NpdGlvbnMgZm9sbG93aW5nIHRoZSBjb21tYW5kOyB0aGUgaW50ZXJ2ZW5pbmcgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIC8vIGFyZSBub3QgYWZmZWN0ZWQgYnkgdGhlIHRyYW5zZm9ybWF0aW9uIGFuZCBzbyBjYW4gc2ltcGx5IGJlIGNvcGllZFxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDJdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDJdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgM10gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgM10pO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA0XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA0XSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDVdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDVdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNl0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gNztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBOT05FOlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJudW1lcmljIHZhbHVlIHNob3VsZCBub3QgZm9sbG93IHRoZSBTVkcgWi96IGNvbW1hbmRcIik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKG5ld1BhdGhEQXJyKTtcbiAgICByZXR1cm4gbmV3UGF0aERBcnIuam9pbihcIiBcIik7XG59XG5mdW5jdGlvbiBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKHN0cikge1xuICAgIC8vIGFzc3VtaW5nIHRoZSBzdHJpbmcgZnJvbSB0aGUgZC1hdHRyaWJ1dGUgb2YgdGhlIHBhdGggaGFzIGFsbCBjb21wb25lbnRzXG4gICAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLCB0aGVuIGNyZWF0ZSBhbiBhcnJheSBvZiBjb21wb25lbnRzIGJ5XG4gICAgLy8gc2ltcGx5IHNwbGl0dGluZyB0aGUgc3RyaW5nIGF0IHRob3NlIHNwYWNlc1xuICAgIHN0ciA9IHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKTtcbiAgICByZXR1cm4gc3RyLnNwbGl0KFwiIFwiKTtcbn1cbmZ1bmN0aW9uIHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKSB7XG4gICAgLy8gVGhlIFNWRyBzdGFuZGFyZCBpcyBmbGV4aWJsZSB3aXRoIHJlc3BlY3QgdG8gaG93IHBhdGggZC1zdHJpbmdzIGFyZVxuICAgIC8vIGZvcm1hdHRlZCBidXQgdGhpcyBtYWtlcyBwYXJzaW5nIHRoZW0gbW9yZSBkaWZmaWN1bHQuIFRoaXMgZnVuY3Rpb24gZW5zdXJlc1xuICAgIC8vIHRoYXQgYWxsIFNWRyBwYXRoIGQtc3RyaW5nIGNvbXBvbmVudHMgKGkuZS4gYm90aCBjb21tYW5kcyBhbmQgdmFsdWVzKSBhcmVcbiAgICAvLyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UuXG4gICAgcmV0dXJuIHN0clxuICAgICAgICAucmVwbGFjZSgvLC9nLCBcIiBcIikgLy8gcmVwbGFjZSBlYWNoIGNvbW1hIHdpdGggYSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvLS9nLCBcIiAtXCIpIC8vIHByZWNlZGUgZWFjaCBtaW51cyBzaWduIHdpdGggYSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvKFtBLVphLXpdKS9nLCBcIiAkMSBcIikgLy8gc2FuZHdpY2ggZWFjaCAgIGxldHRlciBiZXR3ZWVuIDIgc3BhY2VzXG4gICAgICAgIC5yZXBsYWNlKC8gIC9nLCBcIiBcIikgLy8gY29sbGFwc2UgcmVwZWF0ZWQgc3BhY2VzIHRvIGEgc2luZ2xlIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8gKFtFZV0pIC9nLCBcIiQxXCIpIC8vIHJlbW92ZSBmbGFua2luZyBzcGFjZXMgYXJvdW5kIGV4cG9uZW50IHN5bWJvbHNcbiAgICAgICAgLnJlcGxhY2UoL14gL2csIFwiXCIpIC8vIHRyaW0gYW55IGxlYWRpbmcgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLyAkL2csIFwiXCIpOyAvLyB0cmltIGFueSB0YWlsaW5nIHNwYWNlXG59XG5maWdtYS51aS5yZXNpemUoNjAwLCAzNTApO1xuLy8gVXNpbmcgcmVsYXRpdmUgdHJhbnNmb3JtYXRpb24gbWF0cml4IChnaXZlcyBza2V3ZWQgeCB2YWx1ZSBmb3Igbm9uLXJvdGF0ZWQpXG4vL2NvbnNvbGUubG9nKCdyZWx4JyxyZWxbMF1bMl0gKyAoMS8yKSp3aWR0aCpyZWxbMF1bMF0gLSgtMSkqKDEvMikqaGVpZ2h0KnJlbFswXVswXSAtICgxLzIpKndpZHRoKTtcbi8vY29uc29sZS5sb2coJ3JlbHknLHJlbFsxXVsyXSAgKygxLzIpKndpZHRoKnJlbFsxXVswXS0gKC0xKSooMS8yKSpoZWlnaHQqcmVsWzFdWzFdIC0gKDEvMikqaGVpZ2h0KTtcbi8qXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcFwiKS5pbm5lckhUTUwgPSBgXG48c3ZnICBpZD1cImJhc2VcIiB3aWR0aD1cIjgwMFwiIGhlaWdodD1cIjYwMFwiIHZpZXdCb3g9XCIwIDAgODAwIDYwMFwiIHN0eWxlPVwiYm9yZGVyOiAxcHggc29saWQgYmx1ZTtcIj5cbiAgICA8cGF0aCBpZD1cIm5vdG1vdmVkXCIgZmlsbD1cIiNmMDBcIiBzdHJva2U9XCJub25lXCIgZD1cIk0xMjIuNzY5IDQ4LjQ5MTRDMTI3LjAzOCA0Ni4xMTc5IDEyOS45ODMgNDMuMzcyNCAxMzEuMjc0IDQwLjIxNjhDMTM2LjYxNCAyNy4xNjg1IDEzMy40NzIgMTcuMzYwNCAxMjkuMDE0IDEwLjgwMDdDMTI2Ljc3OSA3LjUxMTU0IDEyNC4yMDggNS4wMzM3MiAxMjIuMTk1IDMuMzc3ODlDMTIxLjE4OCAyLjU1MDUgMTIwLjMyMyAxLjkyOTg1IDExOS43MTEgMS41MTcxNUMxMTkuNDA1IDEuMzEwODQgMTE5LjE2MyAxLjE1NjYyIDExOC45OTggMS4wNTQ2MUMxMTguOTE2IDEuMDAzNjIgMTE4Ljg1MyAwLjk2NTY4OSAxMTguODExIDAuOTQwODQ1TDExOC43NjUgMC45MTMzOTJMMTE4Ljc1NCAwLjkwNzAzM0wxMTguNzUxIDAuOTA1Njk4QzExOC43NTEgMC45MDU3MjQgMTE4Ljc1MSAwLjkwNTU5IDExOSAwLjQ3MTYxOEMxMTkuMjQ4IDAuMDM3NjQ2NiAxMTkuMjQ4IDAuMDM3ODI0MyAxMTkuMjQ5IDAuMDM4MDU0TDExOS4yNTQgMC4wNDExMzg1TDExOS4yNjkgMC4wNDk1ODkxQzExOS4yODEgMC4wNTY4NzYyIDExOS4yOTkgMC4wNjc0NzAxIDExOS4zMjIgMC4wODEzNjY3QzExOS4zNjkgMC4xMDkxNTcgMTE5LjQzNyAwLjE1MDE2OCAxMTkuNTI1IDAuMjA0Mzg2QzExOS43IDAuMzEyODExIDExOS45NTMgMC40NzQwOTYgMTIwLjI3IDAuNjg4MTM0QzEyMC45MDUgMS4xMTYxMyAxMjEuNzk2IDEuNzU1NTIgMTIyLjgzIDIuNjA1NDlDMTI0Ljg5NiA0LjMwNDM4IDEyNy41MzkgNi44NTA1OSAxMjkuODQxIDEwLjIzODdDMTM0LjQ1OSAxNy4wMzM0IDEzNy42ODUgMjcuMTkyNiAxMzIuMiA0MC41OTU1QzEzMC43ODUgNDQuMDUyNiAxMjcuNjE1IDQ2Ljk0MTYgMTIzLjI1NSA0OS4zNjU0QzExOC44ODggNTEuNzkzMSAxMTMuMjcgNTMuNzg2MSAxMDYuODY3IDU1LjQyMzdDOTQuMDU4NCA1OC42OTkzIDc4LjAxODggNjAuNTc0NCA2Mi4zNDI1IDYxLjYyMTJDNDYuNjYxMyA2Mi42NjgyIDMxLjMyMTQgNjIuODg3OCAxOS45MDM1IDYyLjg0NTdDMTQuMTk0IDYyLjgyNDYgOS40NjQxOCA2Mi43MzgxIDYuMTYxMjEgNjIuNjU2OUM0LjUwOTcxIDYyLjYxNjMgMy4yMTQ4OSA2Mi41NzcgMi4zMzI2NyA2Mi41NDc4QzIuMjgwNTEgNjIuNTQ2MSAyLjIyOTc5IDYyLjU0NDQgMi4xODA1MiA2Mi41NDI4TDQuNDE4MDQgNjQuOTY5MkM0LjYwNTI0IDY1LjE3MjIgNC41OTI0MyA2NS40ODg2IDQuMzg5NDMgNjUuNjc1OEM0LjE4NjQyIDY1Ljg2MyAzLjg3MDA5IDY1Ljg1MDEgMy42ODI4OSA2NS42NDcxTDAuNjMyMzEyIDYyLjMzOUMwLjQ0NTExNSA2Mi4xMzYgMC40NTc5MjMgNjEuODE5NiAwLjY2MDkyNyA2MS42MzI0TDMuOTY5MDggNTguNTgxOUM0LjE3MjA4IDU4LjM5NDcgNC40ODg0MiA1OC40MDc1IDQuNjc1NjEgNTguNjEwNUM0Ljg2MjgxIDU4LjgxMzUgNC44NSA1OS4xMjk4IDQuNjQ3IDU5LjMxN0wyLjIzMjA0IDYxLjU0MzlDMi4yNzU0NyA2MS41NDU0IDIuMzIwMDQgNjEuNTQ2OSAyLjM2NTcxIDYxLjU0ODRDMy4yNDUzMSA2MS41Nzc1IDQuNTM3MyA2MS42MTY3IDYuMTg1OCA2MS42NTcyQzkuNDgyODQgNjEuNzM4MyAxNC4yMDU3IDYxLjgyNDcgMTkuOTA3MiA2MS44NDU3QzMxLjMxMTEgNjEuODg3NyA0Ni42MjU5IDYxLjY2ODQgNjIuMjc1OSA2MC42MjM0Qzc3LjkzMDcgNTkuNTc4MSA5My44OTkgNTcuNzA3OSAxMDYuNjE5IDU0LjQ1NDlDMTEyLjk4IDUyLjgyODEgMTE4LjUwNiA1MC44NjEgMTIyLjc2OSA0OC40OTE0WlwiIG9wYWNpdHk9XCIwLjVcIiAvPlxuPC9zdmc+XG5gO1xuXG4vL00gMC44OTQ4Nzk4NDIyMzI1MDM0IC0wLjIyOTQ3Nzc2NTQ2NjMyNTE1IEwgLTAuOTExMzQ2MDQ2MjkwMDU2OCAtMC45ODQ4MDg2MjE1MTQyODg1IEwgLTAuOTA0OTkzMjkxMDA4MDY2NyAtMC45OTk5OTk5OTk5OTk5OTk5IEwgMC45MTEzNDYwMzMyMjQ4NDE2IC0wLjI0MDQ0MDk1NTQyOTAyMzg4IFYgMS4wMDAwMDAwMjQxMjAzOTY4IEggMC44OTQ4Nzk4NDIyMzI1MDM0IFYgLTAuMjI5NDc3NzY1NDY2MzI1MTUgWlxuLy8gUmV0cmlldmUgdGhlIFwiZFwiIGF0dHJpYnV0ZSBvZiB0aGUgU1ZHIHBhdGggeW91IHdpc2ggdG8gdHJhbnNmb3JtLlxudmFyIHN2Z1Jvb3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhc2VcIik7XG52YXIgcGF0aCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm90bW92ZWRcIik7XG52YXIgb2xkUGF0aERTdHIgPSBwYXRoLmdldEF0dHJpYnV0ZShcImRcIik7XG5cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24gcmVxdWlyZWQuXG52YXIgb2JqID0gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHN2Z1Jvb3QsIHBhdGgpO1xudmFyIHBhdGhUcmFuc2xYID0gb2JqLnBhdGhUcmFuc2xYO1xudmFyIHBhdGhUcmFuc2xZID0gb2JqLnBhdGhUcmFuc2xZO1xudmFyIHNjYWxlID0gb2JqLnNjYWxlO1xuXG4vLyBUaGUgcGF0aCBjb3VsZCBiZSB0cmFuc2Zvcm1lZCBhdCB0aGlzIHBvaW50IHdpdGggYSBzaW1wbGVcbi8vIFwidHJhbnNmb3JtXCIgYXR0cmlidXRlIGFzIHNob3duIGhlcmUuXG5cbi8vICRwYXRoLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgYHRyYW5zbGF0ZSgke3BhdGhUcmFuc2xYfSwgJHtwYXRoVHJhbnNsWX0pLCBzY2FsZSgke3NjYWxlfSlgKTtcblxuLy8gSG93ZXZlciwgYXMgZGVzY3JpYmVkIGluIHlvdXIgcXVlc3Rpb24geW91IGRpZG4ndCB3YW50IHRoaXMuXG4vLyBUaGVyZWZvcmUsIHRoZSBjb2RlIGZvbGxvd2luZyB0aGlzIGxpbmUgbXV0YXRlcyB0aGUgYWN0dWFsIHN2ZyBwYXRoLlxuXG4vLyBDYWxjdWxhdGUgdGhlIHBhdGggXCJkXCIgYXR0cmlidXRlcyBwYXJhbWV0ZXJzLlxudmFyIG5ld1BhdGhEU3RyID0gZ2V0VHJhbnNmb3JtZWRQYXRoRFN0cihcbiAgb2xkUGF0aERTdHIsXG4gIHBhdGhUcmFuc2xYLFxuICBwYXRoVHJhbnNsWSxcbiAgc2NhbGVcbik7XG5cbi8vIEFwcGx5IHRoZSBuZXcgXCJkXCIgYXR0cmlidXRlIHRvIHRoZSBwYXRoLCB0cmFuc2Zvcm1pbmcgaXQuXG5cbmRvY3VtZW50LndyaXRlKFxuICBcIjxwPkFsdGVyZWQgJ2QnIGF0dHJpYnV0ZSBvZiBwYXRoOjwvcD48cD5cIiArIG5ld1BhdGhEU3RyICsgXCI8L3A+XCJcbik7XG5cbi8vIFRoaXMgaXMgdGhlIGVuZCBvZiB0aGUgbWFpbiBjb2RlLiBCZWxvdyBhcmUgdGhlIGZ1bmN0aW9ucyBjYWxsZWQuXG5cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24sIGkuZS4gdGhlIHRyYW5zbGF0aW9uIGFuZCBzY2FsaW5nLCByZXF1aXJlZFxuLy8gdG8gZ2V0IHRoZSBwYXRoIHRvIGZpbGwgdGhlIHN2ZyBhcmVhLiBOb3RlIHRoYXQgdGhpcyBhc3N1bWVzIHVuaWZvcm1cbi8vIHNjYWxpbmcsIGEgcGF0aCB0aGF0IGhhcyBubyBvdGhlciB0cmFuc2Zvcm1zIGFwcGxpZWQgdG8gaXQsIGFuZCBub1xuLy8gZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgc3ZnIHZpZXdwb3J0IGFuZCB2aWV3Qm94IGRpbWVuc2lvbnMuXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoc3ZnLCBwYXRoKSB7XG4gIHZhciBzdmdXZHRoID0gMjtcbiAgdmFyIHN2Z0hnaHQgPSAyO1xuXG4gIHZhciBvcmlnUGF0aEJvdW5kaW5nQm94ID0gcGF0aC5nZXRCQm94KCk7XG5cbiAgdmFyIG9yaWdQYXRoSGdodCA9IG9yaWdQYXRoQm91bmRpbmdCb3guaGVpZ2h0O1xuICB2YXIgb3JpZ1BhdGhXZHRoID0gb3JpZ1BhdGhCb3VuZGluZ0JveC53aWR0aDtcblxuICB2YXIgb3JpZ1BhdGhZID0gb3JpZ1BhdGhCb3VuZGluZ0JveC55O1xuICB2YXIgb3JpZ1BhdGhYID0gb3JpZ1BhdGhCb3VuZGluZ0JveC54O1xuXG4gIGNvbnNvbGUubG9nKG9yaWdQYXRoV2R0aCwgb3JpZ1BhdGhIZ2h0LCBvcmlnUGF0aFdkdGgsIG9yaWdQYXRoWCwgb3JpZ1BhdGhZKTtcbiAgLy8gaG93IG11Y2ggYmlnZ2VyIGlzIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gIC8vIHJlbGF0aXZlIHRvIHRoZSBwYXRoIGluIGVhY2ggZGltZW5zaW9uP1xuICB2YXIgc2NhbGVCYXNlZE9uV2R0aCA9IHN2Z1dkdGggLyBvcmlnUGF0aFdkdGg7XG4gIHZhciBzY2FsZUJhc2VkT25IZ2h0ID0gc3ZnSGdodCAvIG9yaWdQYXRoSGdodDtcblxuICAvLyBvZiB0aGUgc2NhbGluZyBmYWN0b3JzIGRldGVybWluZWQgaW4gZWFjaCBkaW1lbnNpb24sXG4gIC8vIHVzZSB0aGUgc21hbGxlciBvbmU7IG90aGVyd2lzZSBwb3J0aW9ucyBvZiB0aGUgcGF0aFxuICAvLyB3aWxsIGxpZSBvdXRzaWRlIHRoZSB2aWV3cG9ydCAoY29ycmVjdCB0ZXJtPylcbiAgdmFyIHNjYWxlID0gTWF0aC5taW4oc2NhbGVCYXNlZE9uV2R0aCwgc2NhbGVCYXNlZE9uSGdodCk7XG4gIGFsZXJ0KFxuICAgIGBoZWlnaHQ6ICR7MSAvIHNjYWxlQmFzZWRPbkhnaHR9IHdpZHRoOiAkezEgLyBzY2FsZUJhc2VkT25XZHRofSwgJHtcbiAgICAgIG9yaWdQYXRoV2R0aCAqIG9yaWdQYXRoSGdodFxuICAgIH1gXG4gICk7XG4gIC8vIGNhbGN1bGF0ZSB0aGUgYm91bmRpbmcgYm94IHBhcmFtZXRlcnNcbiAgLy8gYWZ0ZXIgdGhlIHBhdGggaGFzIGJlZW4gc2NhbGVkIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW5cbiAgLy8gYnV0IGJlZm9yZSBhbnkgc3Vic2VxdWVudCB0cmFuc2xhdGlvbnMgaGF2ZSBiZWVuIGFwcGxpZWRcblxuICB2YXIgc2NhbGVkUGF0aFggPSBvcmlnUGF0aFggKiBzY2FsZTtcbiAgdmFyIHNjYWxlZFBhdGhZID0gb3JpZ1BhdGhZICogc2NhbGU7XG4gIHZhciBzY2FsZWRQYXRoV2R0aCA9IG9yaWdQYXRoV2R0aCAqIHNjYWxlO1xuICB2YXIgc2NhbGVkUGF0aEhnaHQgPSBvcmlnUGF0aEhnaHQgKiBzY2FsZTtcblxuICAvLyBjYWxjdWxhdGUgdGhlIGNlbnRyZSBwb2ludHMgb2YgdGhlIHNjYWxlZCBidXQgdW50cmFuc2xhdGVkIHBhdGhcbiAgLy8gYXMgd2VsbCBhcyBvZiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuXG4gIHZhciBzY2FsZWRQYXRoQ2VudHJlWCA9IHNjYWxlZFBhdGhYICsgc2NhbGVkUGF0aFdkdGggLyAyO1xuICB2YXIgc2NhbGVkUGF0aENlbnRyZVkgPSBzY2FsZWRQYXRoWSArIHNjYWxlZFBhdGhIZ2h0IC8gMjtcbiAgdmFyIHN2Z1Jvb3RDZW50cmVYID0gMDsgLy8gLXN2Z1dkdGggLyAyO1xuICB2YXIgc3ZnUm9vdENlbnRyZVkgPSAwOyAvLy1zdmdIZ2h0IC8gMjtcblxuICAvLyBjYWxjdWxhdGUgdHJhbnNsYXRpb24gcmVxdWlyZWQgdG8gY2VudHJlIHRoZSBwYXRoXG4gIC8vIG9uIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gIHZhciBwYXRoVHJhbnNsWCA9IHN2Z1Jvb3RDZW50cmVYIC0gc2NhbGVkUGF0aENlbnRyZVg7XG4gIHZhciBwYXRoVHJhbnNsWSA9IHN2Z1Jvb3RDZW50cmVZIC0gc2NhbGVkUGF0aENlbnRyZVk7XG4gIGNvbnNvbGUubG9nKFxuICAgIFwic2NhbGVkIHBhdGggeFwiLFxuICAgIHNjYWxlZFBhdGhYLFxuICAgIHNjYWxlZFBhdGhXZHRoLFxuICAgIFwic2NhbGVkIHBhdGggeVwiLFxuICAgIHNjYWxlZFBhdGhZLFxuICAgIHNjYWxlZFBhdGhIZ2h0LFxuICAgIFwiZmFjdG9yIGZyb20gc2NhbGVcIixcbiAgICAob3JpZ1BhdGhIZ2h0IC0gb3JpZ1BhdGhXZHRoKSAvIDIsXG4gICAgXCJ4ZmFjdG9yIGZyb20gZ1wiXG4gICk7XG4gIHJldHVybiB7IHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUgfTtcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtZWRQYXRoRFN0cihvbGRQYXRoRFN0ciwgcGF0aFRyYW5zbFgsIHBhdGhUcmFuc2xZLCBzY2FsZSkge1xuICAvLyBjb25zdGFudHMgdG8gaGVscCBrZWVwIHRyYWNrIG9mIHRoZSB0eXBlcyBvZiBTVkcgY29tbWFuZHMgaW4gdGhlIHBhdGhcbiAgdmFyIEJPVEhfWF9BTkRfWSA9IDE7XG4gIHZhciBKVVNUX1ggPSAyO1xuICB2YXIgSlVTVF9ZID0gMztcbiAgdmFyIE5PTkUgPSA0O1xuICB2YXIgRUxMSVBUSUNBTF9BUkMgPSA1O1xuICB2YXIgQUJTT0xVVEUgPSA2O1xuICB2YXIgUkVMQVRJVkUgPSA3O1xuXG4gIC8vIHR3byBwYXJhbGxlbCBhcnJheXMsIHdpdGggZWFjaCBlbGVtZW50IGJlaW5nIG9uZSBjb21wb25lbnQgb2YgdGhlXG4gIC8vIFwiZFwiIGF0dHJpYnV0ZSBvZiB0aGUgU1ZHIHBhdGgsIHdpdGggb25lIGNvbXBvbmVudCBiZWluZyBlaXRoZXJcbiAgLy8gYW4gaW5zdHJ1Y3Rpb24gKGUuZy4gXCJNXCIgZm9yIG1vdmV0bywgZXRjLikgb3IgbnVtZXJpY2FsIHZhbHVlXG4gIC8vIGZvciBlaXRoZXIgYW4geCBvciB5IGNvb3JkaW5hdGVcbiAgdmFyIG9sZFBhdGhEQXJyID0gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhvbGRQYXRoRFN0cik7XG4gIHZhciBuZXdQYXRoREFyciA9IFtdO1xuXG4gIHZhciBjb21tYW5kUGFyYW1zLCBhYnNPclJlbCwgb2xkUGF0aERDb21wLCBuZXdQYXRoRENvbXA7XG5cbiAgLy8gZWxlbWVudCBpbmRleFxuICB2YXIgaWR4ID0gMDtcblxuICB3aGlsZSAoaWR4IDwgb2xkUGF0aERBcnIubGVuZ3RoKSB7XG4gICAgdmFyIG9sZFBhdGhEQ29tcCA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgaWYgKC9eW0EtWmEtel0kLy50ZXN0KG9sZFBhdGhEQ29tcCkpIHtcbiAgICAgIC8vIGNvbXBvbmVudCBpcyBhIHNpbmdsZSBsZXR0ZXIsIGkuZS4gYW4gc3ZnIHBhdGggY29tbWFuZFxuICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgICBzd2l0Y2ggKG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgXCJBXCI6IC8vIGVsbGlwdGljYWwgYXJjIGNvbW1hbmQuLi50aGUgbW9zdCBjb21wbGljYXRlZCBvbmVcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gRUxMSVBUSUNBTF9BUkM7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJIXCI6IC8vIGhvcml6b250YWwgbGluZTsgcmVxdWlyZXMgb25seSBhbiB4LWNvb3JkaW5hdGVcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9YO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiVlwiOiAvLyB2ZXJ0aWNhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGEgeS1jb29yZGluYXRlXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlpcIjogLy8gY2xvc2UgdGhlIHBhdGhcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gTk9ORTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBhbGwgb3RoZXIgY29tbWFuZHM7IGFsbCBvZiB0aGVtIHJlcXVpcmUgYm90aCB4IGFuZCB5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEJPVEhfWF9BTkRfWTtcbiAgICAgIH1cbiAgICAgIGFic09yUmVsID1cbiAgICAgICAgb2xkUGF0aERDb21wID09PSBvbGRQYXRoRENvbXAudG9VcHBlckNhc2UoKSA/IEFCU09MVVRFIDogUkVMQVRJVkU7XG4gICAgICAvLyBsb3dlcmNhc2UgY29tbWFuZHMgYXJlIHJlbGF0aXZlLCB1cHBlcmNhc2UgYXJlIGFic29sdXRlXG4gICAgICBpZHggKz0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdGhlIGNvbXBvbmVudCBpcyBub3QgYSBsZXR0ZXIsIHRoZW4gaXQgaXMgYSBudW1lcmljIHZhbHVlXG4gICAgICB2YXIgdHJhbnNsWCwgdHJhbnNsWTtcbiAgICAgIGlmIChhYnNPclJlbCA9PT0gQUJTT0xVVEUpIHtcbiAgICAgICAgLy8gdGhlIHRyYW5zbGF0aW9uIGlzIHJlcXVpcmVkIGZvciBhYnNvbHV0ZSBjb21tYW5kcy4uLlxuICAgICAgICB0cmFuc2xYID0gcGF0aFRyYW5zbFg7XG4gICAgICAgIHRyYW5zbFkgPSBwYXRoVHJhbnNsWTtcbiAgICAgIH0gZWxzZSBpZiAoYWJzT3JSZWwgPT09IFJFTEFUSVZFKSB7XG4gICAgICAgIC8vIC4uLmJ1dCBub3QgcmVsYXRpdmUgb25lc1xuICAgICAgICB0cmFuc2xYID0gMDtcbiAgICAgICAgdHJhbnNsWSA9IDA7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGNvbW1hbmRQYXJhbXMpIHtcbiAgICAgICAgLy8gZmlndXJlIG91dCB3aGljaCBvZiB0aGUgbnVtZXJpYyB2YWx1ZXMgZm9sbG93aW5nIGFuIHN2ZyBjb21tYW5kXG4gICAgICAgIC8vIGFyZSByZXF1aXJlZCwgYW5kIHRoZW4gdHJhbnNmb3JtIHRoZSBudW1lcmljIHZhbHVlKHMpIGZyb20gdGhlXG4gICAgICAgIC8vIG9yaWdpbmFsIHBhdGggZC1hdHRyaWJ1dGUgYW5kIHBsYWNlIGl0IGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZVxuICAgICAgICAvLyBhcnJheSB0aGF0IHdpbGwgZXZlbnR1YWxseSBiZWNvbWUgdGhlIGQtYXR0cmlidXRlIGZvciB0aGUgbmV3IHBhdGhcbiAgICAgICAgY2FzZSBCT1RIX1hfQU5EX1k6XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgaWR4ICs9IDI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSlVTVF9YOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSlVTVF9ZOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRUxMSVBUSUNBTF9BUkM6XG4gICAgICAgICAgLy8gdGhlIGVsbGlwdGljYWwgYXJjIGhhcyB4IGFuZCB5IHZhbHVlcyBpbiB0aGUgZmlyc3QgYW5kIHNlY29uZCBhcyB3ZWxsIGFzXG4gICAgICAgICAgLy8gdGhlIDZ0aCBhbmQgN3RoIHBvc2l0aW9ucyBmb2xsb3dpbmcgdGhlIGNvbW1hbmQ7IHRoZSBpbnRlcnZlbmluZyB2YWx1ZXNcbiAgICAgICAgICAvLyBhcmUgbm90IGFmZmVjdGVkIGJ5IHRoZSB0cmFuc2Zvcm1hdGlvbiBhbmQgc28gY2FuIHNpbXBseSBiZSBjb3BpZWRcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDFdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDFdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAyXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAyXSk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgM10gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgM10pO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDRdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDRdKTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA1XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA1XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNl0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSA3O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5PTkU6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgXCJudW1lcmljIHZhbHVlIHNob3VsZCBub3QgZm9sbG93IHRoZSBTVkcgWi96IGNvbW1hbmRcIlxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdQYXRoREFyci5qb2luKFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhzdHIpIHtcbiAgLy8gYXNzdW1pbmcgdGhlIHN0cmluZyBmcm9tIHRoZSBkLWF0dHJpYnV0ZSBvZiB0aGUgcGF0aCBoYXMgYWxsIGNvbXBvbmVudHNcbiAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLCB0aGVuIGNyZWF0ZSBhbiBhcnJheSBvZiBjb21wb25lbnRzIGJ5XG4gIC8vIHNpbXBseSBzcGxpdHRpbmcgdGhlIHN0cmluZyBhdCB0aG9zZSBzcGFjZXNcbiAgc3RyID0gc3RhbmRhcmRpemVQYXRoRFN0ckZvcm1hdChzdHIpO1xuICByZXR1cm4gc3RyLnNwbGl0KFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gc3RhbmRhcmRpemVQYXRoRFN0ckZvcm1hdChzdHIpIHtcbiAgLy8gVGhlIFNWRyBzdGFuZGFyZCBpcyBmbGV4aWJsZSB3aXRoIHJlc3BlY3QgdG8gaG93IHBhdGggZC1zdHJpbmdzIGFyZVxuICAvLyBmb3JtYXR0ZWQgYnV0IHRoaXMgbWFrZXMgcGFyc2luZyB0aGVtIG1vcmUgZGlmZmljdWx0LiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXNcbiAgLy8gdGhhdCBhbGwgU1ZHIHBhdGggZC1zdHJpbmcgY29tcG9uZW50cyAoaS5lLiBib3RoIGNvbW1hbmRzIGFuZCB2YWx1ZXMpIGFyZVxuICAvLyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UuXG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvLC9nLCBcIiBcIikgLy8gcmVwbGFjZSBlYWNoIGNvbW1hIHdpdGggYSBzcGFjZVxuICAgIC5yZXBsYWNlKC8tL2csIFwiIC1cIikgLy8gcHJlY2VkZSBlYWNoIG1pbnVzIHNpZ24gd2l0aCBhIHNwYWNlXG4gICAgLnJlcGxhY2UoLyhbQS1aYS16XSkvZywgXCIgJDEgXCIpIC8vIHNhbmR3aWNoIGVhY2ggICBsZXR0ZXIgYmV0d2VlbiAyIHNwYWNlc1xuICAgIC5yZXBsYWNlKC8gIC9nLCBcIiBcIikgLy8gY29sbGFwc2UgcmVwZWF0ZWQgc3BhY2VzIHRvIGEgc2luZ2xlIHNwYWNlXG4gICAgLnJlcGxhY2UoLyAoW0VlXSkgL2csIFwiJDFcIikgLy8gcmVtb3ZlIGZsYW5raW5nIHNwYWNlcyBhcm91bmQgZXhwb25lbnQgc3ltYm9sc1xuICAgIC5yZXBsYWNlKC9eIC9nLCBcIlwiKSAvLyB0cmltIGFueSBsZWFkaW5nIHNwYWNlXG4gICAgLnJlcGxhY2UoLyAkL2csIFwiXCIpOyAvLyB0cmltIGFueSB0YWlsaW5nIHNwYWNlXG59XG4qL1xuIiwiLy8gPT1DbG9zdXJlQ29tcGlsZXI9PVxuLy8gQGNvbXBpbGF0aW9uX2xldmVsIEFEVkFOQ0VEX09QVElNSVpBVElPTlNcbi8vID09L0Nsb3N1cmVDb21waWxlcj09XG5cbi8vIFNWR1BhdGhcbi8vIEZhaHJpIEF5ZG9zLCBheWRvcy5jb21cbi8vIDIwMTYtMDYtMThcbi8vIGh0dHBzOi8vYXlkb3MuY29tL3N2Z2VkaXRcblxuLyoqIEBjb25zdHJ1Y3RvciAqL1xuXG5jbGFzcyBTVkdQYXRoIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gUGF0aCBzZWdtZW50c1xuICAgIHRoaXMuc2VnbWVudHMgPSBbXTtcbiAgICB0aGlzLmRlYyA9IDM7XG4gIH1cblxuICBpbXBvcnRTdHJpbmcoc3RyKSB7XG4gICAgc3RyID0gc3RyLnJlcGxhY2UoL1xccy9nLCBcIiBcIik7IC8vIHdoaXRlIHNwYWNlc1xuICAgIHN0ciA9IHN0ci50cmltKCk7IC8vIHNwYWNlcyBhdCBiZWdpbiBhbmQgZW5kXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLywvZywgXCIgXCIpOyAvLyBjb21tYXNcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgvKFtBLVphLXpdKShbQS1aYS16XSkvZywgXCIkMSAkMlwiKTsgLy8gdHdvIGNoYXJzXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLyhbQS1aYS16XSkoXFxkKS9nLCBcIiQxICQyXCIpOyAvLyBjaGFyICsgZGVjaW1hbFxuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8oW0EtWmEtel0pKFxcLikvZywgXCIkMSAuXCIpOyAvLyBjaGFyICsgZG90XG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLyhbQS1aYS16XSkoLSkvZywgXCIkMSAtXCIpOyAvLyBjaGFyICsgbmVnYXRpdmUgbnVtYmVyXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLyhcXGQpKFtBLVphLXpdKS9nLCBcIiQxICQyXCIpOyAvLyBkZWNpbWFsICsgY2hhclxuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8oXFxkKSgtKS9nLCBcIiQxIC1cIik7IC8vIGRlY2ltYWwgKyBuZWdhdGl2ZSBudW1iZXJcbiAgICB2YXIgcmVnID0gLygoPzotP1tcXGRdKilcXC5cXGQrKSgoPzpcXC5cXGQrKSspL2c7IC8vIGRlY2ltYWwgKyBkb3QgKyBkZWNpbWFsICsgZG90ICsgZGVjaW1hbFxuICAgIHdoaWxlIChyZWcudGVzdChzdHIpKSB7XG4gICAgICBzdHIgPSBzdHIucmVwbGFjZShyZWcsIFwiJDEgJDJcIik7XG4gICAgfVxuICAgIHdoaWxlICgvICAvLnRlc3Qoc3RyKSkge1xuICAgICAgc3RyID0gc3RyLnJlcGxhY2UoLyAgL2csIFwiIFwiKTsgLy8gY2xlYXIgZG91YmxlIHNwYWNlc1xuICAgIH1cbiAgICB2YXIgbGlzdCA9IHN0ci5zcGxpdChcIiBcIik7XG4gICAgdmFyIHByZXQgPSBcIlwiO1xuICAgIHZhciBwcmV4ID0gMDtcbiAgICB2YXIgcHJleSA9IDA7XG4gICAgdmFyIGJlZ3ggPSAwO1xuICAgIHZhciBiZWd5ID0gMDtcbiAgICB2YXIgaiA9IDA7XG4gICAgdmFyIGkgPSAwO1xuICAgIHRoaXMuc2VnbWVudHMgPSBbXTtcblxuICAgIHdoaWxlIChpIDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgIHZhciBzZWcgPSBuZXcgU2VnbWVudCgpO1xuICAgICAgICBzZWcudmFsdWUgPSBsaXN0W2ldO1xuICAgICAgaWYgKGxpc3RbaV0uY2hhckNvZGVBdCgwKSA+IDY0KSB7XG4gICAgICAgIHNlZy50ID0gbGlzdFtpKytdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByZXQgPT0gXCJcIikgYnJlYWs7XG4gICAgICAgIHNlZy50ID0gcHJldCA9PSBcIk1cIiA/IFwiTFwiIDogcHJldCA9PSBcIm1cIiA/IFwibFwiIDogcHJldDtcbiAgICAgIH1cbiAgICAgIHByZXQgPSBzZWcudDtcblxuICAgICAgc3dpdGNoIChzZWcudCkge1xuICAgICAgICBjYXNlIFwiWlwiOlxuICAgICAgICBjYXNlIFwielwiOlxuICAgICAgICAgIHNlZy54ID0gYmVneDtcbiAgICAgICAgICBzZWcueSA9IGJlZ3k7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgIGNhc2UgXCJMXCI6XG4gICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgIGNhc2UgXCJWXCI6XG4gICAgICAgIGNhc2UgXCJUXCI6XG4gICAgICAgICAgc2VnLnggPSBzZWcudCA9PSBcIlZcIiA/IHByZXggOiBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueSA9IHNlZy50ID09IFwiSFwiID8gcHJleSA6IE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIGJlZ3ggPSBzZWcudCA9PSBcIk1cIiA/IHNlZy54IDogYmVneDtcbiAgICAgICAgICBiZWd5ID0gc2VnLnQgPT0gXCJNXCIgPyBzZWcueSA6IGJlZ3k7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJtXCI6XG4gICAgICAgIGNhc2UgXCJsXCI6XG4gICAgICAgIGNhc2UgXCJoXCI6XG4gICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgc2VnLnggPSBzZWcudCA9PSBcInZcIiA/IHByZXggOiBwcmV4ICsgTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnkgPSBzZWcudCA9PSBcImhcIiA/IHByZXkgOiBwcmV5ICsgTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgYmVneCA9IHNlZy50ID09IFwibVwiID8gc2VnLnggOiBiZWd4O1xuICAgICAgICAgIGJlZ3kgPSBzZWcudCA9PSBcIm1cIiA/IHNlZy55IDogYmVneTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIkFcIjpcbiAgICAgICAgY2FzZSBcImFcIjpcbiAgICAgICAgICBzZWcucjEgPSBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcucjIgPSBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcuYXIgPSBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcuYWYgPSBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcuc2YgPSBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueCA9IHNlZy50ID09IFwiQVwiID8gTnVtYmVyKGxpc3RbaSsrXSkgOiBwcmV4ICsgTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnkgPSBzZWcudCA9PSBcIkFcIiA/IE51bWJlcihsaXN0W2krK10pIDogcHJleSArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiQ1wiOlxuICAgICAgICBjYXNlIFwiUVwiOlxuICAgICAgICBjYXNlIFwiU1wiOlxuICAgICAgICAgIHNlZy54MSA9IHNlZy50ID09IFwiU1wiID8gdW5kZWZpbmVkIDogTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnkxID0gc2VnLnQgPT0gXCJTXCIgPyB1bmRlZmluZWQgOiBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueDIgPSBzZWcudCA9PSBcIlFcIiA/IHVuZGVmaW5lZCA6IE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy55MiA9IHNlZy50ID09IFwiUVwiID8gdW5kZWZpbmVkIDogTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnggPSBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueSA9IE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICBjYXNlIFwicVwiOlxuICAgICAgICBjYXNlIFwic1wiOlxuICAgICAgICAgIHNlZy54MSA9IHNlZy50ID09IFwic1wiID8gdW5kZWZpbmVkIDogcHJleCArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy55MSA9IHNlZy50ID09IFwic1wiID8gdW5kZWZpbmVkIDogcHJleSArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy54MiA9IHNlZy50ID09IFwicVwiID8gdW5kZWZpbmVkIDogcHJleCArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy55MiA9IHNlZy50ID09IFwicVwiID8gdW5kZWZpbmVkIDogcHJleSArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy54ID0gcHJleCArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy55ID0gcHJleSArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGkrKztcbiAgICAgIH1cbiAgICAgIHNlZy5weCA9IHByZXg7XG4gICAgICBzZWcucHkgPSBwcmV5O1xuICAgICAgcHJleCA9IHNlZy54O1xuICAgICAgcHJleSA9IHNlZy55O1xuICAgICAgdGhpcy5zZWdtZW50c1tqKytdID0gc2VnO1xuICAgIH1cbiAgfVxuXG4gIGV4cG9ydCgpIHtcbiAgICB2YXIgc3RyID0gXCJcIjtcbiAgICB2YXIgcHJlID0gXCJcIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzZWcgPSB0aGlzLnNlZ21lbnRzW2ldOy8vdGhpcy5mb3JtYXRTZWdtZW50KHRoaXMuc2VnbWVudHNbaV0pO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhzZWcpO1xuICAgICAgc3dpdGNoIChzZWcudCkge1xuICAgICAgICBjYXNlIFwiWlwiOlxuICAgICAgICBjYXNlIFwielwiOlxuICAgICAgICAgIHN0ciArPSBzZWcudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgY2FzZSBcIm1cIjpcbiAgICAgICAgICBzdHIgKz0gc2VnLnQgKyBzZWcueCArIFwiIFwiICsgc2VnLnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJMXCI6XG4gICAgICAgICAgc3RyICs9IHByZSA9PSBzZWcudCB8fCBwcmUgPT0gXCJNXCIgPyBcIiBcIiA6IFwiTFwiO1xuICAgICAgICAgIHN0ciArPSBzZWcueCArIFwiIFwiICsgc2VnLnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJsXCI6XG4gICAgICAgICAgc3RyICs9IHByZSA9PSBzZWcudCB8fCBwcmUgPT0gXCJtXCIgPyBcIiBcIiA6IFwibFwiO1xuICAgICAgICAgIHN0ciArPSBzZWcueCArIFwiIFwiICsgc2VnLnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgIGNhc2UgXCJoXCI6XG4gICAgICAgICAgc3RyICs9IHByZSA9PSBzZWcudCA/IFwiIFwiIDogc2VnLnQ7XG4gICAgICAgICAgc3RyICs9IHNlZy54O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiVlwiOlxuICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgIHN0ciArPSBwcmUgPT0gc2VnLnQgPyBcIiBcIiA6IHNlZy50O1xuICAgICAgICAgIHN0ciArPSBzZWcueTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIkFcIjpcbiAgICAgICAgY2FzZSBcImFcIjpcbiAgICAgICAgICBzdHIgKz0gcHJlID09IHNlZy50ID8gXCIgXCIgOiBzZWcudDtcbiAgICAgICAgICBzdHIgKz1cbiAgICAgICAgICAgIHNlZy5yMSArXG4gICAgICAgICAgICBcIiBcIiArXG4gICAgICAgICAgICBzZWcucjIgK1xuICAgICAgICAgICAgXCIgXCIgK1xuICAgICAgICAgICAgc2VnLmFyICtcbiAgICAgICAgICAgIFwiIFwiICtcbiAgICAgICAgICAgIHNlZy5hZiArXG4gICAgICAgICAgICBcIiBcIiArXG4gICAgICAgICAgICBzZWcuc2YgK1xuICAgICAgICAgICAgXCIgXCIgK1xuICAgICAgICAgICAgc2VnLnggK1xuICAgICAgICAgICAgXCIgXCIgK1xuICAgICAgICAgICAgc2VnLnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJDXCI6XG4gICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgc3RyICs9IHByZSA9PSBzZWcudCA/IFwiIFwiIDogc2VnLnQ7XG4gICAgICAgICAgc3RyICs9IHNlZy54MSArIFwiIFwiICsgc2VnLnkxICsgXCIgXCIgKyBzZWcueDIgKyBcIiBcIiArIHNlZy55MiArIFwiIFwiICsgc2VnLnggKyBcIiBcIiArIHNlZy55O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiUVwiOlxuICAgICAgICBjYXNlIFwicVwiOlxuICAgICAgICAgIHN0ciArPSBwcmUgPT0gc2VnLnQgPyBcIiBcIiA6IHNlZy50O1xuICAgICAgICAgIHN0ciArPSBzZWcueDEgKyBcIiBcIiArIHNlZy55MSArIFwiIFwiICsgc2VnLnggKyBcIiBcIiArIHNlZy55O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiU1wiOlxuICAgICAgICBjYXNlIFwic1wiOlxuICAgICAgICAgIHN0ciArPSBwcmUgPT0gc2VnLnQgPyBcIiBcIiA6IHNlZy50O1xuICAgICAgICAgIHN0ciArPSBzZWcueDIgKyBcIiBcIiArIHNlZy55MiArIFwiIFwiICsgc2VnLnggKyBcIiBcIiArIHNlZy55O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiVFwiOlxuICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgIHN0ciArPSBwcmUgPT0gc2VnLnQgPyBcIiBcIiA6IHNlZy50O1xuICAgICAgICAgIHN0ciArPSBzZWcueCArIFwiIFwiICsgc2VnLnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBwcmUgPSBzZWcudDtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ2luZXhwb3J0JyxzdHIpXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLyAtL2csIFwiLVwiKTtcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgvLTBcXC4vZywgXCItLlwiKTtcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgvIDBcXC4vZywgXCIgLlwiKTtcbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgLy8gZXhwb3J0IHRoZSBzZWdtZW50cyBhcyBhcnJheVxuICBleHBvcnRMaXN0KCkge1xuICAgIHZhciBsaXN0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsaXN0W2ldID0gdGhpcy5mb3JtYXRTZWdtZW50KHRoaXMuc2VnbWVudHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG4gIC8vIG1ha2Ugc29tZSBhbmFseXNpcyB0byBtaW5pZnlcbiAgYW5hbHlzZShkaXN0KSB7XG4gICAgZGlzdCA9IE51bWJlcihkaXN0KTtcbiAgICBpZiAoaXNOYU4oZGlzdCkpIGRpc3QgPSAwO1xuICAgIGlmIChkaXN0IDwgMCkgZGlzdCA9IDA7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0uaW5mbyA9IFwiXCI7XG4gICAgfVxuXG4gICAgLy8gY29udmVydCBMIHRvIEggb3IgVlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuc2VnbWVudHNbaV0ueCA9PSB0aGlzLnNlZ21lbnRzW2ldLnB4ICYmIHRoaXMuc2VnbWVudHNbaV0udC50b1VwcGVyQ2FzZSgpID09IFwiTFwiKSB7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0udCA9IHRoaXMuc2VnbWVudHNbaV0udCA9PSBcIkxcIiA/IFwiVlwiIDogXCJ2XCI7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnkgPT0gdGhpcy5zZWdtZW50c1tpXS5weSAmJlxuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnQudG9VcHBlckNhc2UoKSA9PSBcIkxcIlxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0udCA9IHRoaXMuc2VnbWVudHNbaV0udCA9PSBcIkxcIiA/IFwiSFwiIDogXCJoXCI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGEgPSAtMTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICB2YXIgZHggPSB0aGlzLnNlZ21lbnRzW2ldLnggLSB0aGlzLnNlZ21lbnRzW2ldLnB4O1xuICAgICAgdmFyIGR5ID0gdGhpcy5zZWdtZW50c1tpXS55IC0gdGhpcy5zZWdtZW50c1tpXS5weTtcbiAgICAgIC8vIHR3byBjb25zZWN1dGl2ZSBNXG4gICAgICBpZiAodGhpcy5zZWdtZW50c1tpXS50LnRvVXBwZXJDYXNlKCkgPT0gXCJNXCIgJiYgdGhpcy5zZWdtZW50c1tpICsgMV0udC50b1VwcGVyQ2FzZSgpID09IFwiTVwiKSB7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0uaW5mbyA9IFwiWFwiO1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2kgKyAxXS5weCA9IGkgPT0gMCA/IDAgOiB0aGlzLnNlZ21lbnRzW2kgLSAxXS54O1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2kgKyAxXS5weSA9IGkgPT0gMCA/IDAgOiB0aGlzLnNlZ21lbnRzW2kgLSAxXS55O1xuICAgICAgfVxuICAgICAgLy8gdHdvIGNvbnNlY3V0aXZlIFpcbiAgICAgIGlmICh0aGlzLnNlZ21lbnRzW2ldLnQudG9VcHBlckNhc2UoKSA9PSBcIlpcIiAmJiB0aGlzLnNlZ21lbnRzW2kgKyAxXS50LnRvVXBwZXJDYXNlKCkgPT0gXCJaXCIpIHtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS5pbmZvID0gXCJYXCI7XG4gICAgICB9XG4gICAgICAvLyBvbiB0aGUgc2FtZSBsaW5lXG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0udC50b1VwcGVyQ2FzZSgpID09IFwiTFwiIHx8XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0udC50b1VwcGVyQ2FzZSgpID09IFwiSFwiIHx8XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0udC50b1VwcGVyQ2FzZSgpID09IFwiVlwiXG4gICAgICApIHtcbiAgICAgICAgdmFyIGIgPSBhdGFuMyhkeCwgZHkpO1xuICAgICAgICBpZiAoYiA9PSBhKSB7XG4gICAgICAgICAgdGhpcy5zZWdtZW50c1tpIC0gMV0uaW5mbyA9IFwiWFwiO1xuICAgICAgICB9XG4gICAgICAgIGEgPSBiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYSA9IC0xO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGZpcnN0IHNlZ21lbnQgbXVzdCBiZSBNXG4gICAgaWYgKHRoaXMuc2VnbWVudHNbMF0udC50b1VwcGVyQ2FzZSgpICE9IFwiTVwiKSB7XG4gICAgICB0aGlzLnNlZ21lbnRzWzBdLnQgPSB0aGlzLnNlZ21lbnRzWzBdLnQuY2hhckNvZGVBdCgwKSA8IDk2ID8gXCJNXCIgOiBcIm1cIjtcbiAgICB9XG5cbiAgICAvLyBsYXN0IHNlZ21lbnQgY2FudCBiZSBNXG4gICAgaWYgKHRoaXMuc2VnbWVudHNbdGhpcy5zZWdtZW50cy5sZW5ndGggLSAxXS50LnRvVXBwZXJDYXNlKCkgPT0gXCJNXCIpIHtcbiAgICAgIHRoaXMuc2VnbWVudHNbdGhpcy5zZWdtZW50cy5sZW5ndGggLSAxXS5pbmZvID0gXCJYXCI7XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIGNlcnRhaW5seSByZW1vdmFibGVzXG4gICAgdmFyIGkgPSB0aGlzLnNlZ21lbnRzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBpZiAodGhpcy5zZWdtZW50c1tpXS5pbmZvID09IFwiWFwiKSB0aGlzLnNlZ21lbnRzLnNwbGljZShpLCAxKTtcbiAgICB9XG5cbiAgICBpZiAoZGlzdCA9PSAwKSByZXR1cm47XG5cbiAgICAvLyB0b28gY2xvc2Ugc2VnbWVudHNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5zZWdtZW50c1tpXS50LnRvVXBwZXJDYXNlKCkgPT0gXCJaXCIpIGNvbnRpbnVlO1xuICAgICAgdmFyIGR4ID0gdGhpcy5zZWdtZW50c1tpXS54IC0gdGhpcy5zZWdtZW50c1tpICsgMV0ueDtcbiAgICAgIHZhciBkeSA9IHRoaXMuc2VnbWVudHNbaV0ueSAtIHRoaXMuc2VnbWVudHNbaSArIDFdLnk7XG4gICAgICB2YXIgZCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgICBpZiAoZCA8PSBkaXN0KSB7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0uaW5mbyA9IFwiRCBcIiArIGQgKyBcIiBcIjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gbWFrZSBhbGwgc2VnbWVudHMgYWJzb2x1dGVcbiAgYWJzb2x1dGUoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnQgPSB0aGlzLnNlZ21lbnRzW2ldLnQudG9VcHBlckNhc2UoKTtcbiAgICB9XG4gIH1cblxuICAvLyBtYWtlIGFsbCBzZWdtZW50cyByZWxhdGl2ZVxuICByZWxhdGl2ZSgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0udCA9IHRoaXMuc2VnbWVudHNbaV0udC50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHNldCB0aGUgZ2xvYmFsIGRlYyB2YXJpYWJsZSwgdG8gcm91bmRpbmcgZGVjaW1hbHNcbiAgcm91bmQoZCkge1xuICAgIGQgPSBOdW1iZXIoZCk7XG4gICAgaWYgKGlzTmFOKGQpKSBkID0gMDtcbiAgICBpZiAoZCA8IDApIGQgPSAtMTtcbiAgICBkZWMgPSBNYXRoLmZsb29yKGQpO1xuICB9XG5cbiAgLy8gbW92ZSBwYXRoIHdpdGggZ2l2ZW4gZHgsIGR5XG4gIG1vdmUoZHgsIGR5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnggKz0gZHg7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnkgKz0gZHk7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnB4ICs9IGR4O1xuICAgICAgdGhpcy5zZWdtZW50c1tpXS5weSArPSBkeTtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0ueDEgPSB0aGlzLnNlZ21lbnRzW2ldLngxID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMuc2VnbWVudHNbaV0ueDEgKyBkeDtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0ueTEgPSB0aGlzLnNlZ21lbnRzW2ldLnkxID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMuc2VnbWVudHNbaV0ueTEgKyBkeTtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0ueDIgPSB0aGlzLnNlZ21lbnRzW2ldLngyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMuc2VnbWVudHNbaV0ueDIgKyBkeDtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0ueTIgPSB0aGlzLnNlZ21lbnRzW2ldLnkyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMuc2VnbWVudHNbaV0ueTIgKyBkeTtcbiAgICB9XG4gICAgdGhpcy5zZWdtZW50c1swXS5weCA9IDA7XG4gICAgdGhpcy5zZWdtZW50c1swXS5weSA9IDA7XG4gIH1cblxuICAvLyBmbGlwIGhvcml6b250YWxseSB3aXRoIGZsaXAodW5kZWZpbmVkLCBjZW50ZXIpXG4gIC8vIGZsaXAgdmVydGljYWxseSwgd2l0aCBmbGlwKGNlbnRlciwgdW5kZWZpbmVkKVxuICAvLyBmbGlwIHdydCBhIHBvaW50IChweCwgcHkpXG4gIGZsaXAoeCwgeSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHggIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueCA9IHggKyAoeCAtIHRoaXMuc2VnbWVudHNbaV0ueCk7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ucHggPSB4ICsgKHggLSB0aGlzLnNlZ21lbnRzW2ldLnB4KTtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS54MSA9XG4gICAgICAgICAgdGhpcy5zZWdtZW50c1tpXS54MSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB4ICsgKHggLSB0aGlzLnNlZ21lbnRzW2ldLngxKTtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS54MiA9XG4gICAgICAgICAgdGhpcy5zZWdtZW50c1tpXS54MiA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB4ICsgKHggLSB0aGlzLnNlZ21lbnRzW2ldLngyKTtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS5zZiA9XG4gICAgICAgICAgdGhpcy5zZWdtZW50c1tpXS5zZiA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiAodGhpcy5zZWdtZW50c1tpXS5zZiArIDEpICUgMjtcbiAgICAgIH1cbiAgICAgIGlmICh5ICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnkgPSB5ICsgKHkgLSB0aGlzLnNlZ21lbnRzW2ldLnkpO1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnB5ID0geSArICh5IC0gdGhpcy5zZWdtZW50c1tpXS5weSk7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueTEgPVxuICAgICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueTEgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogeSArICh5IC0gdGhpcy5zZWdtZW50c1tpXS55MSk7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueTIgPVxuICAgICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueTIgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogeSArICh5IC0gdGhpcy5zZWdtZW50c1tpXS55Mik7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0uc2YgPVxuICAgICAgICAgIHRoaXMuc2VnbWVudHNbaV0uc2YgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogKHRoaXMuc2VnbWVudHNbaV0uc2YgKyAxKSAlIDI7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2VnbWVudHNbMF0ucHggPSAwO1xuICAgIHRoaXMuc2VnbWVudHNbMF0ucHkgPSAwO1xuICB9XG5cbiAgY2FsY3VsYXRlQm91bmRzKCl7XG4gICAgdmFyIG1pbnggPSB0aGlzLnNlZ21lbnRzWzBdLng7XG4gICAgdmFyIG1pbnkgPSB0aGlzLnNlZ21lbnRzWzBdLnk7XG4gICAgdmFyIG1heHggPSB0aGlzLnNlZ21lbnRzWzBdLng7XG4gICAgdmFyIG1heHkgPSB0aGlzLnNlZ21lbnRzWzBdLnk7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBtaW54ID0gdGhpcy5zZWdtZW50c1tpXS54IDwgbWlueCA/IHRoaXMuc2VnbWVudHNbaV0ueCA6IG1pbng7XG4gICAgICBtaW55ID0gdGhpcy5zZWdtZW50c1tpXS55IDwgbWlueSA/IHRoaXMuc2VnbWVudHNbaV0ueSA6IG1pbnk7XG4gICAgICBtYXh4ID0gdGhpcy5zZWdtZW50c1tpXS54ID4gbWF4eCA/IHRoaXMuc2VnbWVudHNbaV0ueCA6IG1heHg7XG4gICAgICBtYXh5ID0gdGhpcy5zZWdtZW50c1tpXS55ID4gbWF4eSA/IHRoaXMuc2VnbWVudHNbaV0ueSA6IG1heHk7XG4gICAgfVxuICAgIHZhciB3aWR0aCA9IG1heHggLSBtaW54O1xuICAgIHZhciBoZWlnaHQgPSBtYXh5IC0gbWlueTtcbiAgICByZXR1cm4gW21pbngsbWlueSxtYXh4LG1heHksd2lkdGgsaGVpZ2h0XVxuICB9XG5cbiAgLy8gbW92ZSBwYXRocyBjZW50ZXIgdG8gdGhlIGdpdmVuIGNvb3JkaW5hdGVzXG4gIGNlbnRlcih4LCB5KSB7XG4gICAgdmFyIG1pbnggPSB0aGlzLnNlZ21lbnRzWzBdLng7XG4gICAgdmFyIG1pbnkgPSB0aGlzLnNlZ21lbnRzWzBdLnk7XG4gICAgdmFyIG1heHggPSB0aGlzLnNlZ21lbnRzWzBdLng7XG4gICAgdmFyIG1heHkgPSB0aGlzLnNlZ21lbnRzWzBdLnk7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBtaW54ID0gdGhpcy5zZWdtZW50c1tpXS54IDwgbWlueCA/IHRoaXMuc2VnbWVudHNbaV0ueCA6IG1pbng7XG4gICAgICBtaW55ID0gdGhpcy5zZWdtZW50c1tpXS55IDwgbWlueSA/IHRoaXMuc2VnbWVudHNbaV0ueSA6IG1pbnk7XG4gICAgICBtYXh4ID0gdGhpcy5zZWdtZW50c1tpXS54ID4gbWF4eCA/IHRoaXMuc2VnbWVudHNbaV0ueCA6IG1heHg7XG4gICAgICBtYXh5ID0gdGhpcy5zZWdtZW50c1tpXS55ID4gbWF4eSA/IHRoaXMuc2VnbWVudHNbaV0ueSA6IG1heHk7XG4gICAgfVxuICAgIHZhciBkeCA9IHggLSBtaW54IC0gKG1heHggLSBtaW54KSAvIDI7XG4gICAgdmFyIGR5ID0geSAtIG1pbnkgLSAobWF4eSAtIG1pbnkpIC8gMjtcbiAgICB0aGlzLm1vdmUoZHgsIGR5KTtcbiAgfVxuXG4gIC8vIHNjYWxlIHBhdGggd2l0aCBhIGdpdmVuIHJhdGlvXG4gIHNjYWxlKHJhdGlvKSB7XG4gICAgcmF0aW8gPSBOdW1iZXIocmF0aW8pO1xuICAgIGlmIChpc05hTihyYXRpbykpIHJldHVybjtcbiAgICBpZiAocmF0aW8gPD0gMCkgcmV0dXJuO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNlZyA9IHRoaXMuc2VnbWVudHNbaV07XG4gICAgICBzZWcueCAqPSByYXRpbztcbiAgICAgIHNlZy55ICo9IHJhdGlvO1xuICAgICAgc2VnLnB4ICo9IHJhdGlvO1xuICAgICAgc2VnLnB5ICo9IHJhdGlvO1xuICAgICAgc2VnLngxID0gc2VnLngxID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHJhdGlvICogc2VnLngxO1xuICAgICAgc2VnLnkxID0gc2VnLnkxID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHJhdGlvICogc2VnLnkxO1xuICAgICAgc2VnLngyID0gc2VnLngyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHJhdGlvICogc2VnLngyO1xuICAgICAgc2VnLnkyID0gc2VnLnkyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHJhdGlvICogc2VnLnkyO1xuICAgICAgc2VnLnIxID0gc2VnLnIxID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHJhdGlvICogc2VnLnIxO1xuICAgICAgc2VnLnIyID0gc2VnLnIyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHJhdGlvICogc2VnLnIyO1xuICAgIH1cbiAgfVxuXG4gIC8vIHJvdGF0ZSB0aGUgcGF0aCB3aXRoIGdpdmVuIGNlbnRlciBhbmQgcm90YXRpb24gZGVncmVlXG4gIHJvdGF0ZSh4LCB5LCBkKSB7XG4gICAgZCAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbihkKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3MoZCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcnAgPSByb3RhdGVQb2ludCh0aGlzLnNlZ21lbnRzW2ldLngsIHRoaXMuc2VnbWVudHNbaV0ueSwgeCwgeSwgc2luLCBjb3MpO1xuICAgICAgdGhpcy5zZWdtZW50c1tpXS54ID0gcnBbMF07XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnkgPSBycFsxXTtcbiAgICAgIHZhciBycCA9IHJvdGF0ZVBvaW50KHRoaXMuc2VnbWVudHNbaV0ucHgsIHRoaXMuc2VnbWVudHNbaV0ucHksIHgsIHksIHNpbiwgY29zKTtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0ucHggPSBycFswXTtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0ucHkgPSBycFsxXTtcbiAgICAgIGlmICh0aGlzLnNlZ21lbnRzW2ldLngxICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgcnAgPSByb3RhdGVQb2ludCh0aGlzLnNlZ21lbnRzW2ldLngxLCB0aGlzLnNlZ21lbnRzW2ldLnkxLCB4LCB5LCBzaW4sIGNvcyk7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueDEgPSBycFswXTtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS55MSA9IHJwWzFdO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2VnbWVudHNbaV0ueDIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBycCA9IHJvdGF0ZVBvaW50KHRoaXMuc2VnbWVudHNbaV0ueDIsIHRoaXMuc2VnbWVudHNbaV0ueTIsIHgsIHksIHNpbiwgY29zKTtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS54MiA9IHJwWzBdO1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnkyID0gcnBbMV07XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zZWdtZW50c1tpXS50ID09IFwiSFwiIHx8IHRoaXMuc2VnbWVudHNbaV0udCA9PSBcIlZcIikge1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnQgPSBcIkxcIjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNlZ21lbnRzW2ldLnQgPT0gXCJoXCIgfHwgdGhpcy5zZWdtZW50c1tpXS50ID09IFwidlwiKSB7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0udCA9IFwibFwiO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNlZ21lbnRzWzBdLnB4ID0gMDtcbiAgICB0aGlzLnNlZ21lbnRzWzBdLnB5ID0gMDtcbiAgfVxuXG4gIGZvcm1hdFNlZ21lbnQocykge1xuICAgIHZhciBzZWcgPSBuZXcgU2VnbWVudCgpO1xuICAgIHNlZy50ID0gcy50O1xuICAgIHNlZy54ID0gcy50LmNoYXJDb2RlQXQoMCkgPCA5NiA/IHRoaXMucm91bmREZWMocy54KSA6IHRoaXMucm91bmREZWMocy54IC0gcy5weCk7XG4gICAgc2VnLnkgPSBzLnQuY2hhckNvZGVBdCgwKSA8IDk2ID8gdGhpcy5yb3VuZERlYyhzLnkpIDogdGhpcy5yb3VuZERlYyhzLnkgLSBzLnB5KTtcbiAgICBzZWcucHggPSB0aGlzLnJvdW5kRGVjKHMucHgpO1xuICAgIHNlZy5weSA9IHRoaXMucm91bmREZWMocy5weSk7XG4gICAgc2VnLngxID1cbiAgICAgIHMueDEgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogcy50LmNoYXJDb2RlQXQoMCkgPCA5NiA/IHRoaXMucm91bmREZWMocy54MSkgOiB0aGlzLnJvdW5kRGVjKHMueDEgLSBzLnB4KTtcbiAgICBzZWcueTEgPVxuICAgICAgcy55MSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBzLnQuY2hhckNvZGVBdCgwKSA8IDk2ID8gdGhpcy5yb3VuZERlYyhzLnkxKSA6IHRoaXMucm91bmREZWMocy55MSAtIHMucHkpO1xuICAgIHNlZy54MiA9XG4gICAgICBzLngyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHMudC5jaGFyQ29kZUF0KDApIDwgOTYgPyB0aGlzLnJvdW5kRGVjKHMueDIpIDogdGhpcy5yb3VuZERlYyhzLngyIC0gcy5weCk7XG4gICAgc2VnLnkyID1cbiAgICAgIHMueTIgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogcy50LmNoYXJDb2RlQXQoMCkgPCA5NiA/IHRoaXMucm91bmREZWMocy55MikgOiB0aGlzLnJvdW5kRGVjKHMueTIgLSBzLnB5KTtcbiAgICBzZWcucjEgPSBzLnIxID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMucm91bmREZWMocy5yMSk7XG4gICAgc2VnLnIyID0gcy5yMSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLnJvdW5kRGVjKHMucjIpO1xuICAgIHNlZy5hciA9IHMuYXIgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdGhpcy5yb3VuZERlYyhzLmFyKTtcbiAgICBzZWcuYWYgPSBzLmFmO1xuICAgIHNlZy5zZiA9IHMuc2Y7XG4gICAgc2VnLmluZm8gPSBzLmluZm87XG4gICAgaWYgKHMudCA9PSBcIk1cIikge1xuICAgICAgc2VnLmluZm8gKz0gXCJtIFwiICsgdGhpcy5yb3VuZERlYyhzLnggLSBzLnB4KSArIFwiIFwiICsgdGhpcy5yb3VuZERlYyhzLnkgLSBzLnB5KTtcbiAgICB9XG4gICAgaWYgKHMudCA9PSBcIm1cIikge1xuICAgICAgc2VnLmluZm8gKz0gXCJNIFwiICsgdGhpcy5yb3VuZERlYyhzLngpICsgXCIgXCIgKyB0aGlzLnJvdW5kRGVjKHMueSk7XG4gICAgfVxuICAgIHJldHVybiBzZWc7XG4gIH1cbiAgcm91bmREZWMoZGVjLG51bSkge1xuICAgIGlmIChkZWMgPCAwKSByZXR1cm4gbnVtO1xuICAgIGlmIChudW0gJSAxID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVtO1xuICAgIH0gZWxzZSBpZiAoZGVjID09IDApIHtcbiAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwb3cgPSBNYXRoLnBvdygxMCwgZGVjKTtcbiAgICAgIHJldHVybiBNYXRoLnJvdW5kKG51bSAqIHBvdykgLyBwb3c7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFNlZ21lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnQgPSBcIlwiOyAvLyByZWxhdGl2ZXMgYXJlIGNhbGN1bGF0ZSB2aWEgcHggYW5kIHB5XG4gICAgdGhpcy54ID0gdW5kZWZpbmVkOyAvLyB0aGlzIGlzIGdvb2QgZm9yIG9wdGltaXplLCBhbmFseXNlLCByb3RhdGUsIGV0Y1xuICAgIHRoaXMueSA9IHVuZGVmaW5lZDsgLy8gYmFkIGZvciByb3VuZCwgc28gcm91bmQgbG9naWMgdXBkYXRlZFxuICAgIHRoaXMucHggPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5weSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLngxID0gdW5kZWZpbmVkO1xuICAgIHRoaXMueTEgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy54MiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnkyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucjEgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5yMiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmFyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYWYgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5zZiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmluZm8gPSBcIlwiO1xuICAgIHRoaXMudmFsdWUgPSAnJztcbiAgfVxufVxuXG4vLyBmb3JtYXQgdGhlIHNlZ21lbnQgZm9yIGV4cG9ydFxuLy8gY2hlY2sgYWJzb2x1dGUtcmVsYXRpdmUsIGFuZCByb3VuZCBkZWNpbWFsc1xuXG5mdW5jdGlvbiByb3RhdGVQb2ludChweCwgcHksIG94LCBveSwgc2luLCBjb3MpIHtcbiAgdmFyIHggPSBjb3MgKiAocHggLSBveCkgLSBzaW4gKiAocHkgLSBveSkgKyBveDtcbiAgdmFyIHkgPSBzaW4gKiAocHggLSBveCkgKyBjb3MgKiAocHkgLSBveSkgKyBveTtcbiAgcmV0dXJuIFt4LCB5XTtcbn1cblxuZnVuY3Rpb24gYXRhbjMoeCwgeSkge1xuICB2YXIgcmVzdWx0ID0gTWF0aC5hdGFuMih5LCB4KTtcbiAgaWYgKHJlc3VsdCA8IDApIHtcbiAgICByZXN1bHQgKz0gMiAqIE1hdGguUEk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCBTVkdQYXRoOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdGlmKF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0pIHtcblx0XHRyZXR1cm4gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZVxuX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2NvZGUudHNcIik7XG4vLyBUaGlzIGVudHJ5IG1vZHVsZSB1c2VkICdleHBvcnRzJyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG4iXSwic291cmNlUm9vdCI6IiJ9