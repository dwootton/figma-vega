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
        const strokeSpec = calculcateStrokeSpec(vectorizedNode);
        console.log(`{
      "type": "symbol",
      "interactive": false,
      "encode": {
        "enter": {
          "shape": {"value": "${msg.object}"},
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
     }`);
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    //figma.closePlugin();
};
function calculcateStrokeSpec(node) {
    console.log('in calc spec', node);
    const names = Object.getOwnPropertyNames(node);
    console.log('in calc spec names', names);
    for (const name of names) {
        console.log(`${name}: ${node[name]}`);
    }
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
function extractStyles(node) {
    // extract fills, color, strokes, etc
    return {
        opacity: node.opacity,
        effects: node.effects,
        fills: node.fills,
        strokes: node.strokes,
        strokeWeight: node.strokeWeight,
    };
}
function shouldNodeBeOutlineStrokes(node) {
    console.log('in outline', node);
    // if the item has an arrow end, outline stroke because arrow [ stroke cap cannot be applied :( ]
    if (node.type === "VECTOR" && "strokeCap" in node.vectorNetwork.vertices[node.vectorNetwork.vertices.length - 1] && node.vectorNetwork.vertices[node.vectorNetwork.vertices.length - 1].strokeCap !== 'NONE') {
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
figma.ui.resize(500, 750);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92ZWdhLWZpLy4vc3JjL2NvZGUudHMiLCJ3ZWJwYWNrOi8vdmVnYS1maS8uL3NyYy9TVkdQYXRocy5qcyIsIndlYnBhY2s6Ly92ZWdhLWZpL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3ZlZ2EtZmkvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3ZlZ2EtZmkvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly92ZWdhLWZpL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdmVnYS1maS93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFDb0M7QUFDcEMsVUFBVSxxQkFBcUI7QUFDL0IsVUFBVSxpQkFBaUI7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLFlBQVk7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFdBQVc7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IsaURBQU87QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELEdBQUc7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxHQUFHO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLGtGQUFrRjtBQUN4SCxtRUFBbUU7QUFDbkU7O0FBRUEsdUJBQXVCLCtCQUErQjtBQUN0RDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLFlBQVksUUFBUSxFQUFFO0FBQ3RELDhCQUE4QixVQUFVLE9BQU87QUFDL0MsOEJBQThCO0FBQzlCLHFCQUFxQjtBQUNyQjtBQUNBLCtCQUErQixVQUFVLE9BQU87QUFDaEQsZ0NBQWdDLFVBQVUsUUFBUTtBQUNsRCw0QkFBNEIsV0FBVyxJQUFJO0FBQzNDLDRCQUE0QixXQUFXO0FBQ3ZDO0FBQ0E7QUFDQSxrQkFBa0IsR0FBRztBQUNyQjtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7Ozs7OztBQU9BLDhCQUE4QjtBQUM5Qjs7QUFFQTs7QUFFQTtBQUNBOzs7O0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsVUFBVSxHQUFHO0FBQzVDLGdDQUFnQyxZQUFZLEtBQUssRUFBRTtBQUNuRCw4QkFBOEIsVUFBVSxhQUFhO0FBQ3JELDhCQUE4QjtBQUM5QixxQkFBcUI7QUFDckI7QUFDQSwrQkFBK0IsVUFBVSxPQUFPO0FBQ2hELGdDQUFnQyxVQUFVLFFBQVE7QUFDbEQsNEJBQTRCLFdBQVcsSUFBSTtBQUMzQyw0QkFBNEIsV0FBVztBQUN2QztBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCLGlCQUFpQjs7QUFFakIsNEZBQTRGO0FBQzVGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLCtCQUErQjtBQUM5QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsWUFBWSxXQUFXLEVBQUU7QUFDN0Msa0JBQWtCLFVBQVUsT0FBTztBQUNuQyxrQkFBa0I7QUFDbEIsU0FBUztBQUNUO0FBQ0EsbUJBQW1CLFVBQVUsT0FBTztBQUNwQyxvQkFBb0IsVUFBVSxRQUFRO0FBQ3RDLGdCQUFnQixXQUFXLElBQUk7QUFDL0IsZ0JBQWdCLFdBQVc7QUFDM0I7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixLQUFLLElBQUksV0FBVztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLDZCQUE2QjtBQUMzRSwrQ0FBK0MsNkJBQTZCO0FBQzVFO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixjQUFjO0FBQ2pDO0FBQ0EsdUJBQXVCLGNBQWM7QUFDckM7QUFDQSwyQkFBMkIsY0FBYztBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOzs7O0FBSUE7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdEOztBQUVoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDBCQUEwQjtBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkI7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkI7QUFDM0IsMkJBQTJCO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQSwyQ0FBMkM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMENBQTBDO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVFQUF1RTtBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkZBQTZGO0FBQzdGO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSx3Q0FBd0MsWUFBWSxJQUFJLFlBQVksV0FBVyxNQUFNOztBQUVyRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQSxlQUFlLHFCQUFxQixVQUFVLHFCQUFxQjtBQUNuRTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIseUJBQXlCOztBQUV6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0EsbUNBQW1DO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZEQUE2RDtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUNyMEJBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxrQ0FBa0M7QUFDbEMscUJBQXFCO0FBQ3JCLGlDQUFpQztBQUNqQyx3REFBd0Q7QUFDeEQsa0RBQWtEO0FBQ2xELGlEQUFpRDtBQUNqRCxnREFBZ0Q7QUFDaEQsa0RBQWtEO0FBQ2xELDBDQUEwQztBQUMxQyxnREFBZ0Q7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQ0FBb0M7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLDBCQUEwQjtBQUM3QyxpQ0FBaUM7O0FBRWpDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBOztBQUVBO0FBQ0EsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG1CQUFtQiw4QkFBOEI7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLG1CQUFtQiw4QkFBOEI7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsMEJBQTBCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLDBCQUEwQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwwQkFBMEI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCLHVCQUF1QjtBQUN2Qix1QkFBdUI7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0EsaUVBQWUsT0FBTyxFOzs7Ozs7VUNsaEJ0QjtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0NyQkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx3Q0FBd0MseUNBQXlDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHNGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHNEQUFzRCxrQkFBa0I7V0FDeEU7V0FDQSwrQ0FBK0MsY0FBYztXQUM3RCxFOzs7O1VDTkE7VUFDQTtVQUNBO1VBQ0EiLCJmaWxlIjoiY29kZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vY29uc3QgUGFwZXIgPSByZXF1aXJlKCdwYXBlcicpXG5pbXBvcnQgU1ZHUGF0aCBmcm9tIFwiLi9TVkdQYXRocy5qc1wiO1xuLy9pbXBvcnQge2NyZWF0ZU5vcm1hbGl6ZWRQYXRofSBmcm9tIFwiLi9oZWxwZXJGdW5jdGlvbnNcIjtcbi8vaW1wb3J0IHtTVkdwYXRoLCBTVkdzZWdzfSBmcm9tICcuL1NWR1BhdGhzLmpzJztcbi8vIFRoaXMgcGx1Z2luIHdpbGwgb3BlbiBhIHdpbmRvdyB0byBwcm9tcHQgdGhlIHVzZXIgdG8gZW50ZXIgYSBudW1iZXIsIGFuZFxuLy8gaXQgd2lsbCB0aGVuIGNyZWF0ZSB0aGF0IG1hbnkgcmVjdGFuZ2xlcyBvbiB0aGUgc2NyZWVuLlxuLy8gVGhpcyBmaWxlIGhvbGRzIHRoZSBtYWluIGNvZGUgZm9yIHRoZSBwbHVnaW5zLiBJdCBoYXMgYWNjZXNzIHRvIHRoZSAqZG9jdW1lbnQqLlxuLy8gWW91IGNhbiBhY2Nlc3MgYnJvd3NlciBBUElzIGluIHRoZSA8c2NyaXB0PiB0YWcgaW5zaWRlIFwidWkuaHRtbFwiIHdoaWNoIGhhcyBhXG4vLyBmdWxsIGJyb3dzZXIgZW52aXJvbm1lbnQgKHNlZSBkb2N1bWVudGF0aW9uKS5cbi8vIFRoaXMgc2hvd3MgdGhlIEhUTUwgcGFnZSBpbiBcInVpLmh0bWxcIi5cbmZpZ21hLnNob3dVSShfX2h0bWxfXyk7XG5jb25zdCBQQURESU5HX1dJRFRIX1JFR0VYID0gLyg/PD10cmFuc2xhdGVcXCgpXFxkKy87XG5jb25zdCBQQURESU5HX0hFSUdIVF9SRUdFWCA9IC8oPzw9dHJhbnNsYXRlXFwoXFxkKywpXFxkKy87XG5jb25zdCBTVkdfV0lEVEhfUkVHRVggPSAvKD88PXdpZHRoPVwiKVxcZCsvO1xuY29uc3QgU1ZHX0hFSUdIVF9SRUdFWCA9IC8oPzw9aGVpZ2h0PVwiKVxcZCsvO1xuZnVuY3Rpb24gbWFrZWlkKGxlbmd0aCkge1xuICAgIHZhciByZXN1bHQgPSBcIlwiO1xuICAgIHZhciBjaGFyYWN0ZXJzID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OVwiO1xuICAgIHZhciBjaGFyYWN0ZXJzTGVuZ3RoID0gY2hhcmFjdGVycy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHQgKz0gY2hhcmFjdGVycy5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcmFjdGVyc0xlbmd0aCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gY2xvbmUodmFsKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlID09PSBcIm51bWJlclwiIHx8IHR5cGUgPT09IFwic3RyaW5nXCIgfHwgdHlwZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwubWFwKCh4KSA9PiBjbG9uZSh4KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgbyA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsKSB7XG4gICAgICAgICAgICAgICAgb1trZXldID0gY2xvbmUodmFsW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG87XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgXCJ1bmtub3duXCI7XG59XG5mdW5jdGlvbiogd2Fsa1RyZWUobm9kZSkge1xuICAgIHlpZWxkIG5vZGU7XG4gICAgY29uc3QgeyBjaGlsZHJlbiB9ID0gbm9kZTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgeWllbGQqIHdhbGtUcmVlKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIENhbGxzIHRvIFwicGFyZW50LnBvc3RNZXNzYWdlXCIgZnJvbSB3aXRoaW4gdGhlIEhUTUwgcGFnZSB3aWxsIHRyaWdnZXIgdGhpc1xuLy8gY2FsbGJhY2suIFRoZSBjYWxsYmFjayB3aWxsIGJlIHBhc3NlZCB0aGUgXCJwbHVnaW5NZXNzYWdlXCIgcHJvcGVydHkgb2YgdGhlXG4vLyBwb3N0ZWQgbWVzc2FnZS5cbmZpZ21hLnVpLm9ubWVzc2FnZSA9IChtc2cpID0+IHtcbiAgICAvLyBPbmUgd2F5IG9mIGRpc3Rpbmd1aXNoaW5nIGJldHdlZW4gZGlmZmVyZW50IHR5cGVzIG9mIG1lc3NhZ2VzIHNlbnQgZnJvbVxuICAgIC8vIHlvdXIgSFRNTCBwYWdlIGlzIHRvIHVzZSBhbiBvYmplY3Qgd2l0aCBhIFwidHlwZVwiIHByb3BlcnR5IGxpa2UgdGhpcy5cbiAgICAvL2NvbnNvbGUubG9nKFNWR3BhdGgsIFNWR3NlZ3MsbmV3IFNWR3NlZ3MoXCJNIDAuNSAtMC41IGwgMCAxIC0xIDAgMCAtMSB6XCIpKTtcbiAgICBjb25zb2xlLmxvZyhTVkdQYXRoKTtcbiAgICBpZiAobXNnLnR5cGUgPT09IFwiY3JlYXRlXCIpIHtcbiAgICAgICAgY29uc3Qgbm9kZXMgPSBbXTtcbiAgICAgICAgY29uc3QgaWQgPSBtYWtlaWQoNSk7XG4gICAgICAgIGNvbnNvbGUubG9nKG1zZyk7XG4gICAgICAgIGNvbnN0IG5ld0Fubm90YXRpb25zTGF5ZXIgPSBmaWdtYS5jcmVhdGVGcmFtZSgpO1xuICAgICAgICBjb25zdCB2aXN1YWxpemF0aW9uID0gZmlnbWEuY3JlYXRlTm9kZUZyb21TdmcobXNnLm9iamVjdCk7XG4gICAgICAgIHZpc3VhbGl6YXRpb24ubmFtZSA9IGBWaXN1YWxpemF0aW9uIC0gJHtpZH1gO1xuICAgICAgICAvLyBwbGFjZSBhbm5vdGF0aW9ucyBsYXllciBvbiB0b3AgYW5kIG1ha2UgdHJhbnNwYXJlbnRcbiAgICAgICAgY29uc3QgZmlsbHMgPSBjbG9uZShuZXdBbm5vdGF0aW9uc0xheWVyLmZpbGxzKTtcbiAgICAgICAgZmlsbHNbMF0ub3BhY2l0eSA9IDA7XG4gICAgICAgIG5ld0Fubm90YXRpb25zTGF5ZXIuZmlsbHMgPSBmaWxscztcbiAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5jbGlwc0NvbnRlbnQgPSBmYWxzZTtcbiAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5uYW1lID0gYEFubm90YXRpb25zIExheWVyIC0gJHtpZH1gO1xuICAgICAgICAvLyBncmFiIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgLy8gc2V0IGFubm90YXRpb25zIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgY29uc3Qgd2lkdGhNYXRjaGVzID0gbXNnLm9iamVjdC5tYXRjaChTVkdfV0lEVEhfUkVHRVgpO1xuICAgICAgICBjb25zdCBoZWlnaHRNYXRjaGVzID0gbXNnLm9iamVjdC5tYXRjaChTVkdfSEVJR0hUX1JFR0VYKTtcbiAgICAgICAgaWYgKHdpZHRoTWF0Y2hlcyAmJiBoZWlnaHRNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IE51bWJlcih3aWR0aE1hdGNoZXNbMF0pO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gTnVtYmVyKGhlaWdodE1hdGNoZXNbMF0pO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5yZXNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFkZGluZ1dpZHRoTWF0Y2hlcyA9IG1zZy5vYmplY3QubWF0Y2goUEFERElOR19XSURUSF9SRUdFWCk7XG4gICAgICAgIGNvbnN0IHBhZGRpbmdIZWlnaHRNYXRjaGVzID0gbXNnLm9iamVjdC5tYXRjaChQQURESU5HX0hFSUdIVF9SRUdFWCk7XG4gICAgICAgIGlmIChwYWRkaW5nV2lkdGhNYXRjaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3aWR0aFN0cmluZyA9IHBhZGRpbmdXaWR0aE1hdGNoZXNbMF07XG4gICAgICAgICAgICBuZXdBbm5vdGF0aW9uc0xheWVyLnNldFBsdWdpbkRhdGEoXCJ2ZWdhUGFkZGluZ1dpZHRoXCIsIHdpZHRoU3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFkZGluZ0hlaWdodE1hdGNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodFN0cmluZyA9IHBhZGRpbmdIZWlnaHRNYXRjaGVzWzBdO1xuICAgICAgICAgICAgbmV3QW5ub3RhdGlvbnNMYXllci5zZXRQbHVnaW5EYXRhKFwidmVnYVBhZGRpbmdIZWlnaHRcIiwgaGVpZ2h0U3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5hcHBlbmRDaGlsZCh2aXN1YWxpemF0aW9uKTtcbiAgICAgICAgbm9kZXMucHVzaCh2aXN1YWxpemF0aW9uKTtcbiAgICAgICAgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uID0gbm9kZXM7XG4gICAgICAgIGZpZ21hLnZpZXdwb3J0LnNjcm9sbEFuZFpvb21JbnRvVmlldyhub2Rlcyk7XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gXCJmZXRjaFwiKSB7XG4gICAgICAgIC8vIGZpbmQgY3VycmVudCBzZWxlY3Rpb25cbiAgICAgICAgLy9AdHMtaWdub3JlICAgIC8vXG4gICAgICAgIC8vIGdyYWIgYW5ubm90YXRpb25zIGxheWVyLFxuICAgICAgICAvLyBncmFiIHBsdWdpbiBkYXRhIGZvciB0aGUgd2lkdGgvaGVpZ2h0IHBhZGRpbmdcbiAgICAgICAgLy9jb25zdCBuZXdTZWxlY3Rpb24gPSBbZmlnbWEuZmxhdHRlbihmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24pXTtcbiAgICAgICAgY29uc3QgbmV3U2VsZWN0aW9uID0gZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uLm1hcCgobm9kZSkgPT4gbm9kZS5jbG9uZSgpKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJjdXJyZW50U2VsZWN0aW9uXCIsIG5ld1NlbGVjdGlvbik7XG4gICAgICAgIGNvbnN0IG1hcmtzVG9BZGQgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBzY2VuZU5vZGUgb2YgbmV3U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSXRlcmF0b3IgPSB3YWxrVHJlZShzY2VuZU5vZGUpO1xuICAgICAgICAgICAgbGV0IG5vZGVTdGVwID0gbm9kZUl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgIHdoaWxlICghbm9kZVN0ZXAuZG9uZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2RlU3RlcC52YWx1ZS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIC8vIHNraXAgbm9kZSB0eXBlcyBcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSBcIkZSQU1FXCIgfHwgbm9kZS50eXBlID09PSBcIkdST1VQXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVN0ZXAgPSBub2RlSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJub2RlIHZhbHVlXCIsIG5vZGUpO1xuICAgICAgICAgICAgICAgIC8vIGlmIG5vZGVUeXBlIGlzIGdyb3VwXG4gICAgICAgICAgICAgICAgY29uc3QgdmVjdG9yaXplZE5vZGUgPSB2ZWN0b3JpemUobm9kZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGxzJywgdmVjdG9yaXplZE5vZGUuZmlsbHMsIHZlY3Rvcml6ZWROb2RlLnZlY3RvclBhdGhzKTtcbiAgICAgICAgICAgICAgICAvLyBtaWdodCBoYXZlIDIgcGF0aHMsIHZlY3RvcnMgd2l0aCAyIHBhdGggYXJlIGZpbmUgc2VwYXJhdGVseS4gXG4gICAgICAgICAgICAgICAgLy8gMiBwYXRocyBtaWdodCBoYXZlIGRpZmZlcmVudCBmaWxscy4gXG4gICAgICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyBkYXRhOiB2ZWN0b3JpemVkTm9kZS52ZWN0b3JQYXRocywgbm9kZUlkOiB2ZWN0b3JpemVkTm9kZS5pZCwgdHlwZTogXCJtb2RpZnlQYXRoXCIgfSk7XG4gICAgICAgICAgICAgICAgLy9jb25zdCBub2RlU3R5bGVzID0gZXh0cmFjdFN0eWxlcyh2ZWN0b3JpemVkTm9kZSk7IC8vIGNoYW5nZSB0byB0cmFuc2xhdGUgc3R5bGVzIGludG8gdmVnYXNwZWNcbiAgICAgICAgICAgICAgICAvKmNvbnN0IHN2Z1BhdGggPSBjcmVhdGVOb3JtYWxpemVkUGF0aCh2ZWN0b3JpemVkTm9kZSk7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCwgdFgsIHRZLCBzY2FsZSB9ID0gY2FsY3VsYXRlUGxhY2VtZW50KFxuICAgICAgICAgICAgICAgICAgdmVjdG9yaXplZE5vZGUsXG4gICAgICAgICAgICAgICAgICB2aXNhdWxpemF0aW9uUGFkZGluZ1dpZHRoLFxuICAgICAgICAgICAgICAgICAgdmlzYXVsaXphdGlvblBhZGRpbmdIZWlnaHRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgIHZlY3Rvcml6ZWROb2RlLngsXG4gICAgICAgICAgICAgICAgICB2ZWN0b3JpemVkTm9kZS55LFxuICAgICAgICAgICAgICAgICAgdmVjdG9yaXplZE5vZGUud2lkdGgsXG4gICAgICAgICAgICAgICAgICB2ZWN0b3JpemVkTm9kZS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICBub2RlLnZlY3RvclBhdGhzXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYHtcbiAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN5bWJvbFwiLFxuICAgICAgICAgICAgICAgICAgXCJpbnRlcmFjdGl2ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIFwiZW5jb2RlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJlbnRlclwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgXCJzaGFwZVwiOiB7XCJ2YWx1ZVwiOiBcIiR7c3ZnUGF0aH1cIn0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJzaXplXCI6e1widmFsdWVcIjoke3NjYWxlfX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJmaWxsXCI6e1widmFsdWVcIjpcImJsYWNrXCJ9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6e1widmFsdWVcIjoke3dpZHRofX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJoZWlnaHRcIjp7XCJ2YWx1ZVwiOiR7aGVpZ2h0fX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IHtcInZhbHVlXCI6ICR7dFh9fSxcbiAgICAgICAgICAgICAgICAgICAgICBcInlcIjoge1widmFsdWVcIjogJHt0WX19XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgfWApOyovXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgIGNvbnN0XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ25vZGUgdHlwdycsbm9kZS50eXBlKTtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBHZXQgc2NlbmUgbm9kZSB0eXBlXG4gICAgICAgICAgICAgICAgLy8gaWYgdGV4dFxuICAgICAgICAgICAgICAgIC8vIHRleHQgbWFrZSBzdmcgZm9yIGFsbCBlbGVtZW50c1xuICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyB0cmFuc2Zvcm0gdG8gdmVjdG9yXG4gICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIHByb2Nlc3MgcGF0aFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBwWCA9IDE1OyAvLyBjdXJyZW50IFZlZ2EgcGFkZGluZ1xuICAgICAgICAgICAgICAgIGNvbnN0IHBZID0gNTtcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gcm90YXRpb24gdGhyb3dzIGl0IG9mZiFcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcInhcIiwgKDEgLyAyKSAqIG1heERpbWVuc2lvbiwgeCwgcFgsIDAsIHJvdCk7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcInlcIiwgKDEgLyAyKSAqIG1heERpbWVuc2lvbiwgeSwgcFksIDApO1xuICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICBjb25zdCB2YWxzID0gcGF0aFN0cmluZ3MubWFwKChwYXRoKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gYHtcbiAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN5bWJvbFwiLFxuICAgICAgICAgICAgICAgICAgXCJpbnRlcmFjdGl2ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIFwiZW5jb2RlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJlbnRlclwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgXCJhbmdsZVwiOntcInZhbHVlXCI6JHswfX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJzaGFwZVwiOiB7XCJ2YWx1ZVwiOiBcIiR7cGF0aH1cIn0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJzaXplXCI6e1widmFsdWVcIjoke3ZlY3RvclNjYWxlfX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJmaWxsXCI6e1widmFsdWVcIjpcImJsYWNrXCJ9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6e1widmFsdWVcIjoke3dpZHRofX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJoZWlnaHRcIjp7XCJ2YWx1ZVwiOiR7aGVpZ2h0fX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IHtcInZhbHVlXCI6ICR7dFh9fSxcbiAgICAgICAgICAgICAgICAgICAgICBcInlcIjoge1widmFsdWVcIjogJHt0WX19XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgfWA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHZhbHNbMF0pLnJlcGxhY2UoL1xcXFxuL2csIFwiXCIpLnJlcGxhY2UoL1xcXFwvZywgXCJcIikpOyovXG4gICAgICAgICAgICAgICAgbm9kZVN0ZXAgPSBub2RlSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gXCJzZW5kU2NhbGVkXCIpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2luIHNjYWxlZFNlbmQhJywgbXNnLm9iamVjdCk7XG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdGlvbiA9IGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbjtcbiAgICAgICAgY29uc3QgdmlzYXVsaXphdGlvblBhZGRpbmdXaWR0aCA9IE51bWJlcihuZXdTZWxlY3Rpb25bMF0uZ2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nV2lkdGhcIikpO1xuICAgICAgICBjb25zdCB2aXNhdWxpemF0aW9uUGFkZGluZ0hlaWdodCA9IE51bWJlcihuZXdTZWxlY3Rpb25bMF0uZ2V0UGx1Z2luRGF0YShcInZlZ2FQYWRkaW5nSGVpZ2h0XCIpKTtcbiAgICAgICAgY29uc3QgdmVjdG9yaXplZE5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChtc2cubm9kZUlkKTtcbiAgICAgICAgLy8gbGluZXMgYW5kIHZlY3RvclxuICAgICAgICBpZiAodmVjdG9yaXplZE5vZGUudHlwZSAhPT0gJ1ZFQ1RPUicpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQsIHRYLCB0WSwgc2NhbGUgfSA9IGNhbGN1bGF0ZVBsYWNlbWVudCh2ZWN0b3JpemVkTm9kZSwgdmlzYXVsaXphdGlvblBhZGRpbmdXaWR0aCwgdmlzYXVsaXphdGlvblBhZGRpbmdIZWlnaHQpO1xuICAgICAgICBjb25zdCBzdHJva2VTcGVjID0gY2FsY3VsY2F0ZVN0cm9rZVNwZWModmVjdG9yaXplZE5vZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhge1xuICAgICAgXCJ0eXBlXCI6IFwic3ltYm9sXCIsXG4gICAgICBcImludGVyYWN0aXZlXCI6IGZhbHNlLFxuICAgICAgXCJlbmNvZGVcIjoge1xuICAgICAgICBcImVudGVyXCI6IHtcbiAgICAgICAgICBcInNoYXBlXCI6IHtcInZhbHVlXCI6IFwiJHttc2cub2JqZWN0fVwifSxcbiAgICAgICAgICBcInNpemVcIjp7XCJ2YWx1ZVwiOiR7c2NhbGV9fSxcbiAgICAgICAgICBcImZpbGxcIjp7XCJ2YWx1ZVwiOlwiYmxhY2tcIn1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgIFwid2lkdGhcIjp7XCJ2YWx1ZVwiOiR7d2lkdGh9fSxcbiAgICAgICAgICBcImhlaWdodFwiOntcInZhbHVlXCI6JHtoZWlnaHR9fSxcbiAgICAgICAgICBcInhcIjoge1widmFsdWVcIjogJHt0WH19LFxuICAgICAgICAgIFwieVwiOiB7XCJ2YWx1ZVwiOiAke3RZfX1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICB9YCk7XG4gICAgfVxuICAgIC8vIE1ha2Ugc3VyZSB0byBjbG9zZSB0aGUgcGx1Z2luIHdoZW4geW91J3JlIGRvbmUuIE90aGVyd2lzZSB0aGUgcGx1Z2luIHdpbGxcbiAgICAvLyBrZWVwIHJ1bm5pbmcsIHdoaWNoIHNob3dzIHRoZSBjYW5jZWwgYnV0dG9uIGF0IHRoZSBib3R0b20gb2YgdGhlIHNjcmVlbi5cbiAgICAvL2ZpZ21hLmNsb3NlUGx1Z2luKCk7XG59O1xuZnVuY3Rpb24gY2FsY3VsY2F0ZVN0cm9rZVNwZWMobm9kZSkge1xuICAgIGNvbnNvbGUubG9nKCdpbiBjYWxjIHNwZWMnLCBub2RlKTtcbiAgICBjb25zdCBuYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG5vZGUpO1xuICAgIGNvbnNvbGUubG9nKCdpbiBjYWxjIHNwZWMgbmFtZXMnLCBuYW1lcyk7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke25hbWV9OiAke25vZGVbbmFtZV19YCk7XG4gICAgfVxufVxuZnVuY3Rpb24gY2FsY3VsYXRlUGxhY2VtZW50KG5vZGUsIHBhZGRpbmdYLCBwYWRkaW5nWSkge1xuICAgIGNvbnN0IHdpZHRoID0gbm9kZS53aWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSBub2RlLmhlaWdodDtcbiAgICBjb25zdCB4ID0gbm9kZS54O1xuICAgIGNvbnN0IHkgPSBub2RlLnk7XG4gICAgY29uc3QgbWF4RGltZW5zaW9uID0gTWF0aC5tYXgod2lkdGgsIGhlaWdodCk7XG4gICAgY29uc3QgdFggPSAoMSAvIDIpICogd2lkdGggKyB4IC0gcGFkZGluZ1g7IC8vKyAobWF4RGltZW5zaW9uLWhlaWdodCkvMjsgLy8gdG90YWwgdHJhbnNsYXRlXG4gICAgY29uc3QgdFkgPSAoMSAvIDIpICogaGVpZ2h0ICsgeSAtIHBhZGRpbmdZOyAvLysgKG1heERpbWVuc2lvbi1oZWlnaHQpLzI7IC8vIHRvdGFsIHRyYW5zbGF0ZVxuICAgIGNvbnN0IHNjYWxlID0gbWF4RGltZW5zaW9uICogbWF4RGltZW5zaW9uO1xuICAgIHJldHVybiB7IHdpZHRoLCBoZWlnaHQsIHRYLCB0WSwgc2NhbGUgfTtcbn1cbmZ1bmN0aW9uIGV4dHJhY3RTdHlsZXMobm9kZSkge1xuICAgIC8vIGV4dHJhY3QgZmlsbHMsIGNvbG9yLCBzdHJva2VzLCBldGNcbiAgICByZXR1cm4ge1xuICAgICAgICBvcGFjaXR5OiBub2RlLm9wYWNpdHksXG4gICAgICAgIGVmZmVjdHM6IG5vZGUuZWZmZWN0cyxcbiAgICAgICAgZmlsbHM6IG5vZGUuZmlsbHMsXG4gICAgICAgIHN0cm9rZXM6IG5vZGUuc3Ryb2tlcyxcbiAgICAgICAgc3Ryb2tlV2VpZ2h0OiBub2RlLnN0cm9rZVdlaWdodCxcbiAgICB9O1xufVxuZnVuY3Rpb24gc2hvdWxkTm9kZUJlT3V0bGluZVN0cm9rZXMobm9kZSkge1xuICAgIGNvbnNvbGUubG9nKCdpbiBvdXRsaW5lJywgbm9kZSk7XG4gICAgLy8gaWYgdGhlIGl0ZW0gaGFzIGFuIGFycm93IGVuZCwgb3V0bGluZSBzdHJva2UgYmVjYXVzZSBhcnJvdyBbIHN0cm9rZSBjYXAgY2Fubm90IGJlIGFwcGxpZWQgOiggXVxuICAgIGlmIChub2RlLnR5cGUgPT09IFwiVkVDVE9SXCIgJiYgXCJzdHJva2VDYXBcIiBpbiBub2RlLnZlY3Rvck5ldHdvcmsudmVydGljZXNbbm9kZS52ZWN0b3JOZXR3b3JrLnZlcnRpY2VzLmxlbmd0aCAtIDFdICYmIG5vZGUudmVjdG9yTmV0d29yay52ZXJ0aWNlc1tub2RlLnZlY3Rvck5ldHdvcmsudmVydGljZXMubGVuZ3RoIC0gMV0uc3Ryb2tlQ2FwICE9PSAnTk9ORScpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHZlY3Rvcml6ZShub2RlKSB7XG4gICAgLy8gaWYgbm9kZSBpcyB0ZXh0LCBjb21iaW5lIGFsbCB2ZWN0b3IgcGF0aHNcbiAgICBsZXQgdmVjdG9yTm9kZSA9IGZpZ21hLmZsYXR0ZW4oW25vZGVdKTtcbiAgICBjb25zb2xlLmxvZyhub2RlLnR5cGUpO1xuICAgIC8vIGlmIHRleHQsIGxpbmUgd2l0aCBzdHJva2VcbiAgICBjb25zb2xlLmxvZygnYmVmb3JlJywgdmVjdG9yTm9kZS52ZWN0b3JQYXRocyk7XG4gICAgLy8gbGluZXMgYW5kIHZlY3RvciBwYXRocyB3aXRoIHN0cm9rZXMgXG4gICAgY29uc3Qgb3V0bGluZWROb2RlcyA9IHZlY3Rvck5vZGUub3V0bGluZVN0cm9rZSgpO1xuICAgIC8vIGlmIG5vIGZpbGxzLCBvdXRsaW5lIHN0cm9rZVxuICAgIGNvbnNvbGUubG9nKHZlY3Rvck5vZGUuZmlsbHMsIHZlY3Rvck5vZGUuc3Ryb2tlcyk7XG4gICAgaWYgKG91dGxpbmVkTm9kZXMgJiYgc2hvdWxkTm9kZUJlT3V0bGluZVN0cm9rZXModmVjdG9yTm9kZSkpIHtcbiAgICAgICAgdmVjdG9yTm9kZSA9IG91dGxpbmVkTm9kZXM7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdhZnRlcicsIHZlY3Rvck5vZGUudmVjdG9yUGF0aHMpO1xuICAgIGNvbnNvbGUubG9nKHZlY3Rvck5vZGUpO1xuICAgIHJldHVybiB2ZWN0b3JOb2RlO1xufVxuZnVuY3Rpb24gZGVnMlJhZGlhbihkZWcpIHtcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xufVxuZnVuY3Rpb24gbXVsdGlwbHlNYXRyaWNlcyhtYXRyaXhBLCBtYXRyaXhCKSB7XG4gICAgbGV0IGFOdW1Sb3dzID0gbWF0cml4QS5sZW5ndGg7XG4gICAgbGV0IGFOdW1Db2xzID0gbWF0cml4QVswXS5sZW5ndGg7XG4gICAgbGV0IGJOdW1Sb3dzID0gbWF0cml4Qi5sZW5ndGg7XG4gICAgbGV0IGJOdW1Db2xzID0gbWF0cml4QlswXS5sZW5ndGg7XG4gICAgbGV0IG5ld01hdHJpeCA9IG5ldyBBcnJheShhTnVtUm93cyk7XG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCBhTnVtUm93czsgKytyKSB7XG4gICAgICAgIG5ld01hdHJpeFtyXSA9IG5ldyBBcnJheShiTnVtQ29scyk7XG4gICAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgYk51bUNvbHM7ICsrYykge1xuICAgICAgICAgICAgbmV3TWF0cml4W3JdW2NdID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYU51bUNvbHM7ICsraSkge1xuICAgICAgICAgICAgICAgIG5ld01hdHJpeFtyXVtjXSArPSBtYXRyaXhBW3JdW2ldICogbWF0cml4QltpXVtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3TWF0cml4O1xufVxuZnVuY3Rpb24gbXVsdGlwbHkoYSwgYikge1xuICAgIHJldHVybiBbXG4gICAgICAgIFtcbiAgICAgICAgICAgIGFbMF1bMF0gKiBiWzBdWzBdICsgYVswXVsxXSAqIGJbMV1bMF0sXG4gICAgICAgICAgICBhWzBdWzBdICogYlswXVsxXSArIGFbMF1bMV0gKiBiWzFdWzFdLFxuICAgICAgICAgICAgYVswXVswXSAqIGJbMF1bMl0gKyBhWzBdWzFdICogYlsxXVsyXSArIGFbMF1bMl0sXG4gICAgICAgIF0sXG4gICAgICAgIFtcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzBdICsgYVsxXVsxXSAqIGJbMV1bMF0sXG4gICAgICAgICAgICBhWzFdWzBdICogYlswXVsxXSArIGFbMV1bMV0gKiBiWzFdWzFdICsgMCxcbiAgICAgICAgICAgIGFbMV1bMF0gKiBiWzBdWzJdICsgYVsxXVsxXSAqIGJbMV1bMl0gKyBhWzFdWzJdLFxuICAgICAgICBdLFxuICAgIF07XG59XG4vLyBDcmVhdGVzIGEgXCJtb3ZlXCIgdHJhbnNmb3JtLlxuZnVuY3Rpb24gbW92ZSh4LCB5KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgWzEsIDAsIHhdLFxuICAgICAgICBbMCwgMSwgeV0sXG4gICAgXTtcbn1cbi8vIENyZWF0ZXMgYSBcInJvdGF0ZVwiIHRyYW5zZm9ybS5cbmZ1bmN0aW9uIHJvdGF0ZSh0aGV0YSkge1xuICAgIHJldHVybiBbXG4gICAgICAgIFtNYXRoLmNvcyh0aGV0YSksIE1hdGguc2luKHRoZXRhKSwgMF0sXG4gICAgICAgIFstTWF0aC5zaW4odGhldGEpLCBNYXRoLmNvcyh0aGV0YSksIDBdLFxuICAgIF07XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVYWUZyb21Ob2RlKG5vZGUpIHtcbiAgICBsZXQgbG9jYXRpb25SZWxhdGl2ZVRvUGFyZW50WCA9IG5vZGUueDtcbiAgICBsZXQgbG9jYXRpb25SZWxhdGl2ZVRvUGFyZW50WSA9IG5vZGUueTtcbiAgICBsZXQgeCA9IG5vZGUud2lkdGggLyAyO1xuICAgIGxldCB5ID0gbm9kZS53aWR0aCAvIDI7XG4gICAgbGV0IHJvdGF0aW9uRGVnID0gLW5vZGUucm90YXRpb247XG4gICAgbGV0IHJvdGF0aW9uUmFkID0gKE1hdGguUEkgKiByb3RhdGlvbkRlZykgLyAxODA7XG4gICAgbGV0IHhUcmFuc2Zvcm0gPSB4IC0geCAqIE1hdGguY29zKHJvdGF0aW9uUmFkKSArIHkgKiBNYXRoLnNpbihyb3RhdGlvblJhZCk7XG4gICAgbGV0IHlUcmFuc2Zvcm0gPSB5IC0geCAqIE1hdGguc2luKHJvdGF0aW9uUmFkKSArIHkgKiBNYXRoLmNvcyhyb3RhdGlvblJhZCk7XG4gICAgbGV0IHJvdGF0aW9uVHJhbnNmb3JtID0gW1xuICAgICAgICBbTWF0aC5jb3Mocm90YXRpb25SYWQpLCAtTWF0aC5zaW4ocm90YXRpb25SYWQpLCB4VHJhbnNmb3JtXSxcbiAgICAgICAgW01hdGguc2luKHJvdGF0aW9uUmFkKSwgTWF0aC5jb3Mocm90YXRpb25SYWQpLCB5VHJhbnNmb3JtXSxcbiAgICBdO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKTtcbiAgICBub2RlLnJlbGF0aXZlVHJhbnNmb3JtID0gcm90YXRpb25UcmFuc2Zvcm07XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIG5vZGUueCArPSBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRYO1xuICAgIG5vZGUueSArPSBsb2NhdGlvblJlbGF0aXZlVG9QYXJlbnRZO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG5vZGUueSksIEpTT04uc3RyaW5naWZ5KG5vZGUueCkpO1xufVxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IGNhbGN1bGF0ZXMgdGhlIGNvcnJlY3QgWFkgcG9zaXRpb24gaWdub3Jpbmcgcm90YXRpb25cbiAqIEBwYXJhbSBub2RlXG4gKi9cbmZ1bmN0aW9uIG5ld0NhbGN1bGF0ZVJlbGF0aXZlKG9yaWdpbmFsTm9kZSkge1xuICAgIGNvbnN0IG5vZGUgPSBvcmlnaW5hbE5vZGUuY2xvbmUoKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy9jb25zdCB4ID0gb3JpZ2luYWxOb2RlLng7XG4gICAgLy9jb25zdCB5ID0gb3JpZ2luYWxOb2RlLnk7XG4gICAgLy9ub2RlLnggPSAwO1xuICAgIC8vbm9kZS55ID0gMDtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLmFic29sdXRlVHJhbnNmb3JtKSk7XG4gICAgLy9ub2RlLnJvdGF0aW9uID0gMDtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbGV0IHRyYW5zZm9ybSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSkpO1xuICAgIC8vIG1vdmUgdG8gMFxuICAgIGxldCB4ID0gdHJhbnNmb3JtWzBdWzJdO1xuICAgIGxldCB5ID0gdHJhbnNmb3JtWzFdWzJdO1xuICAgIHRyYW5zZm9ybVswXVsyXSA9IDA7XG4gICAgdHJhbnNmb3JtWzFdWzJdID0gMDtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gMzYwXCIsIEpTT04uc3RyaW5naWZ5KHRyYW5zZm9ybSkpO1xuICAgIHRyYW5zZm9ybSA9IG11bHRpcGx5KHJvdGF0ZSgyICogTWF0aC5QSSAtIChub2RlLnJvdGF0aW9uIC0gTWF0aC5QSSkgLyAxODApLCB0cmFuc2Zvcm0pO1xuICAgIGNvbnNvbGUubG9nKFwiZnJvbSBhZnRlciByb3RcIiwgSlNPTi5zdHJpbmdpZnkodHJhbnNmb3JtKSk7XG4gICAgdHJhbnNmb3JtID0gbXVsdGlwbHkobW92ZSh4LCB5KSwgdHJhbnNmb3JtKTtcbiAgICBjb25zb2xlLmxvZyhcImZyb20gYWZ0ZXIgbW92ZVwiLCBKU09OLnN0cmluZ2lmeSh0cmFuc2Zvcm0pKTtcbiAgICBjb25zdCBkaWZYID0gbm9kZS54O1xuICAgIGNvbnN0IGRpZlkgPSBub2RlLnk7XG4gICAgY29uc29sZS5sb2coXCJjYWxjZWRcIiwgZGlmWCwgZGlmWSwgeCArIGRpZlgsIHkgKyBkaWZZKTtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgY29uc29sZS5sb2cobXVsdGlwbHkocm90YXRlKC1ub2RlLnJvdGF0aW9uKSwgdHJhbnNmb3JtKSk7XG4gICAgY29uc29sZS5sb2coXCJmcm9tIDM2MFwiLCBtdWx0aXBseShyb3RhdGUoLShub2RlLnJvdGF0aW9uIC0gTWF0aC5QSSkgLyAxODApLCBub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgLy8gcm90YXRlIGJhY2tcbiAgICBjb25zdCBhbmdsZUluUmFkaWFucyA9IGRlZzJSYWRpYW4oLW5vZGUucm90YXRpb24pO1xuICAgIGNvbnNvbGUubG9nKG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pO1xuICAgIGNvbnN0IG5ldHJhbnNmb3JtID0gbXVsdGlwbHkocm90YXRlKGFuZ2xlSW5SYWRpYW5zKSwgbm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSk7XG4gICAgY29uc29sZS5sb2cobmV0cmFuc2Zvcm0pO1xuICAgIC8qXG4gICAgY29uc29sZS5sb2cobm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSlcbiAgICBsZXQgcm90ZXIgPSBub2RlLnJvdGF0aW9uO1xuICAgIG5vZGUucm90YXRpb24gPSAwO1xuICBcbiAgICBjb25zb2xlLmxvZygnb2xkIHgnLEpTT04uc3RyaW5naWZ5KG5vZGUueCksSlNPTi5zdHJpbmdpZnkobm9kZS55KSxKU09OLnN0cmluZ2lmeShub2RlLnJlbGF0aXZlVHJhbnNmb3JtKSk7XG4gICAgbm9kZS5yb3RhdGlvbiA9IHJvdGVyO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCduZXcgeCcseCx5LEpTT04uc3RyaW5naWZ5KG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0pKVxuICBcbiAgXG4gIFxuICAgIGNvbnN0IHdpZHRoID0gbm9kZS53aWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSBub2RlLmhlaWdodDtcbiAgICBjb25zb2xlLmxvZyh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjb25zdCByb3QgPSAobm9kZS5yb3RhdGlvbiAqIE1hdGguUEkpIC8gMTgwOyAvLyBpbiByYWRpYW5zXG4gIFxuICAgIC8vIG5vdGUsIHRvIGNhbGN1bGF0ZSBkaXN0YW5jZSBmcm9tIHJvdGF0aW9uLCB5b3UgbXVzdCBmbGlwIHRoZSBzaWduICAoMS8yKUggYmVjYXVzZSBpbiBjYXJ0ZXNpYW4gY29vcmRpbmF0ZXMgeSBERUNSRUFTRVMgYXMgeW91XG4gICAgY29uc3QgcmVhbFggPSB4ICsgKDEgLyAyKSAqIHdpZHRoICogTWF0aC5jb3Mocm90KSAvKi0gLTEgKiAoMSAvIDIpICogaGVpZ2h0ICogTWF0aC5zaW4ocm90KSAgLSAoMSAvIDIpICogd2lkdGg7XG4gICAgICBjb25zb2xlLmxvZyh5LCgxIC8gMikgKiB3aWR0aCAqIE1hdGguc2luKHJvdCksIC0xICogKDEgLyAyKSAqIGhlaWdodCAqIE1hdGguY29zKHJvdCksICgxIC8gMikgKiBoZWlnaHQpXG4gIFxuICAgIGNvbnN0IHJlYWxZID1cbiAgICAgIHkgKyAoMSAvIDIpICogd2lkdGggKiBNYXRoLnNpbihyb3QpIC8qKyAtMSAqICgxIC8gMikgKiBoZWlnaHQgKiBNYXRoLmNvcyhyb3QpICsoMSAvIDIpICogaGVpZ2h0O1xuICAgIHJldHVybiBbcmVhbFgsIHJlYWxZXTsqL1xuICAgIGNvbnN0IHRvdGFsTGVuZ3RoT2ZIeXBvID0gTWF0aC5zcXJ0KG5vZGUud2lkdGggKiBub2RlLndpZHRoICsgbm9kZS5oZWlnaHQgKiBub2RlLmhlaWdodCk7XG59XG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uLCBpLmUuIHRoZSB0cmFuc2xhdGlvbiBhbmQgc2NhbGluZywgcmVxdWlyZWRcbi8vIHRvIGdldCB0aGUgcGF0aCB0byBmaWxsIHRoZSBzdmcgYXJlYS4gTm90ZSB0aGF0IHRoaXMgYXNzdW1lcyB1bmlmb3JtXG4vLyBzY2FsaW5nLCBhIHBhdGggdGhhdCBoYXMgbm8gb3RoZXIgdHJhbnNmb3JtcyBhcHBsaWVkIHRvIGl0LCBhbmQgbm9cbi8vIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIHN2ZyB2aWV3cG9ydCBhbmQgdmlld0JveCBkaW1lbnNpb25zLlxuZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB2YXIgc3ZnV2R0aCA9IDI7XG4gICAgdmFyIHN2Z0hnaHQgPSAyO1xuICAgIHZhciBvcmlnUGF0aEhnaHQgPSBoZWlnaHQ7XG4gICAgdmFyIG9yaWdQYXRoV2R0aCA9IHdpZHRoO1xuICAgIHZhciBvcmlnUGF0aFkgPSB5O1xuICAgIHZhciBvcmlnUGF0aFggPSB4O1xuICAgIC8vIGhvdyBtdWNoIGJpZ2dlciBpcyB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBwYXRoIGluIGVhY2ggZGltZW5zaW9uP1xuICAgIHZhciBzY2FsZUJhc2VkT25XZHRoID0gc3ZnV2R0aCAvIG9yaWdQYXRoV2R0aDtcbiAgICB2YXIgc2NhbGVCYXNlZE9uSGdodCA9IHN2Z0hnaHQgLyBvcmlnUGF0aEhnaHQ7XG4gICAgLy8gb2YgdGhlIHNjYWxpbmcgZmFjdG9ycyBkZXRlcm1pbmVkIGluIGVhY2ggZGltZW5zaW9uLFxuICAgIC8vIHVzZSB0aGUgc21hbGxlciBvbmU7IG90aGVyd2lzZSBwb3J0aW9ucyBvZiB0aGUgcGF0aFxuICAgIC8vIHdpbGwgbGllIG91dHNpZGUgdGhlIHZpZXdwb3J0IChjb3JyZWN0IHRlcm0/KVxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKHNjYWxlQmFzZWRPbldkdGgsIHNjYWxlQmFzZWRPbkhnaHQpO1xuICAgIC8vIGNhbGN1bGF0ZSB0aGUgYm91bmRpbmcgYm94IHBhcmFtZXRlcnNcbiAgICAvLyBhZnRlciB0aGUgcGF0aCBoYXMgYmVlbiBzY2FsZWQgcmVsYXRpdmUgdG8gdGhlIG9yaWdpblxuICAgIC8vIGJ1dCBiZWZvcmUgYW55IHN1YnNlcXVlbnQgdHJhbnNsYXRpb25zIGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgdmFyIHNjYWxlZFBhdGhYID0gb3JpZ1BhdGhYICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhZID0gb3JpZ1BhdGhZICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhXZHRoID0gb3JpZ1BhdGhXZHRoICogc2NhbGU7XG4gICAgdmFyIHNjYWxlZFBhdGhIZ2h0ID0gb3JpZ1BhdGhIZ2h0ICogc2NhbGU7XG4gICAgLy8gY2FsY3VsYXRlIHRoZSBjZW50cmUgcG9pbnRzIG9mIHRoZSBzY2FsZWQgYnV0IHVudHJhbnNsYXRlZCBwYXRoXG4gICAgLy8gYXMgd2VsbCBhcyBvZiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIHZhciBzY2FsZWRQYXRoQ2VudHJlWCA9IHNjYWxlZFBhdGhYICsgc2NhbGVkUGF0aFdkdGggLyAyO1xuICAgIHZhciBzY2FsZWRQYXRoQ2VudHJlWSA9IHNjYWxlZFBhdGhZICsgc2NhbGVkUGF0aEhnaHQgLyAyO1xuICAgIHZhciBzdmdSb290Q2VudHJlWCA9IDA7IC8vIC1zdmdXZHRoIC8gMjtcbiAgICB2YXIgc3ZnUm9vdENlbnRyZVkgPSAwOyAvLy1zdmdIZ2h0IC8gMjtcbiAgICAvLyBjYWxjdWxhdGUgdHJhbnNsYXRpb24gcmVxdWlyZWQgdG8gY2VudHJlIHRoZSBwYXRoXG4gICAgLy8gb24gdGhlIHN2ZyByb290IGVsZW1lbnRcbiAgICB2YXIgcGF0aFRyYW5zbFggPSBzdmdSb290Q2VudHJlWCAtIHNjYWxlZFBhdGhDZW50cmVYO1xuICAgIHZhciBwYXRoVHJhbnNsWSA9IHN2Z1Jvb3RDZW50cmVZIC0gc2NhbGVkUGF0aENlbnRyZVk7XG4gICAgY29uc29sZS5sb2coXCJzY2FsZWQgcGF0aCB4XCIsIHNjYWxlZFBhdGhYLCBzY2FsZWRQYXRoV2R0aCwgXCJzY2FsZWQgcGF0aCB5XCIsIHNjYWxlZFBhdGhZLCBzY2FsZWRQYXRoSGdodCwgXCJmYWN0b3IgZnJvbSBzY2FsZVwiLCAob3JpZ1BhdGhIZ2h0IC0gb3JpZ1BhdGhXZHRoKSAvIDIsIFwieGZhY3RvciBmcm9tIGdcIik7XG4gICAgLy9cbiAgICBjb25zb2xlLmxvZyhwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKTtcbiAgICByZXR1cm4geyBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlIH07XG59XG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1lZFBhdGhEU3RyKG9sZFBhdGhEU3RyLCBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKSB7XG4gICAgLy8gY29uc3RhbnRzIHRvIGhlbHAga2VlcCB0cmFjayBvZiB0aGUgdHlwZXMgb2YgU1ZHIGNvbW1hbmRzIGluIHRoZSBwYXRoXG4gICAgdmFyIEJPVEhfWF9BTkRfWSA9IDE7XG4gICAgdmFyIEpVU1RfWCA9IDI7XG4gICAgdmFyIEpVU1RfWSA9IDM7XG4gICAgdmFyIE5PTkUgPSA0O1xuICAgIHZhciBFTExJUFRJQ0FMX0FSQyA9IDU7XG4gICAgdmFyIEFCU09MVVRFID0gNjtcbiAgICB2YXIgUkVMQVRJVkUgPSA3O1xuICAgIC8vIHR3byBwYXJhbGxlbCBhcnJheXMsIHdpdGggZWFjaCBlbGVtZW50IGJlaW5nIG9uZSBjb21wb25lbnQgb2YgdGhlXG4gICAgLy8gXCJkXCIgYXR0cmlidXRlIG9mIHRoZSBTVkcgcGF0aCwgd2l0aCBvbmUgY29tcG9uZW50IGJlaW5nIGVpdGhlclxuICAgIC8vIGFuIGluc3RydWN0aW9uIChlLmcuIFwiTVwiIGZvciBtb3ZldG8sIGV0Yy4pIG9yIG51bWVyaWNhbCB2YWx1ZVxuICAgIC8vIGZvciBlaXRoZXIgYW4geCBvciB5IGNvb3JkaW5hdGVcbiAgICB2YXIgb2xkUGF0aERBcnIgPSBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKG9sZFBhdGhEU3RyKTtcbiAgICB2YXIgbmV3UGF0aERBcnIgPSBbXTtcbiAgICBjb25zb2xlLmxvZyhvbGRQYXRoREFycik7XG4gICAgdmFyIGNvbW1hbmRQYXJhbXMsIGFic09yUmVsLCBvbGRQYXRoRENvbXAsIG5ld1BhdGhEQ29tcDtcbiAgICAvLyBlbGVtZW50IGluZGV4XG4gICAgdmFyIGlkeCA9IDA7XG4gICAgd2hpbGUgKGlkeCA8IG9sZFBhdGhEQXJyLmxlbmd0aCkge1xuICAgICAgICB2YXIgb2xkUGF0aERDb21wID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICAgICAgaWYgKC9eW0EtWmEtel0kLy50ZXN0KG9sZFBhdGhEQ29tcCkpIHtcbiAgICAgICAgICAgIC8vIGNvbXBvbmVudCBpcyBhIHNpbmdsZSBsZXR0ZXIsIGkuZS4gYW4gc3ZnIHBhdGggY29tbWFuZFxuICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IG9sZFBhdGhEQXJyW2lkeF07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvbGRQYXRoRENvbXApO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmV3UGF0aERBcnJbaWR4XSk7XG4gICAgICAgICAgICBzd2l0Y2ggKG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFcIjogLy8gZWxsaXB0aWNhbCBhcmMgY29tbWFuZC4uLnRoZSBtb3N0IGNvbXBsaWNhdGVkIG9uZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gRUxMSVBUSUNBTF9BUkM7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6IC8vIGhvcml6b250YWwgbGluZTsgcmVxdWlyZXMgb25seSBhbiB4LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlZcIjogLy8gdmVydGljYWwgbGluZTsgcmVxdWlyZXMgb25seSBhIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9ZO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiWlwiOiAvLyBjbG9zZSB0aGUgcGF0aFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gTk9ORTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsIG90aGVyIGNvbW1hbmRzOyBhbGwgb2YgdGhlbSByZXF1aXJlIGJvdGggeCBhbmQgeSBjb29yZGluYXRlc1xuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gQk9USF9YX0FORF9ZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWJzT3JSZWwgPSBvbGRQYXRoRENvbXAgPT09IG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpID8gQUJTT0xVVEUgOiBSRUxBVElWRTtcbiAgICAgICAgICAgIC8vIGxvd2VyY2FzZSBjb21tYW5kcyBhcmUgcmVsYXRpdmUsIHVwcGVyY2FzZSBhcmUgYWJzb2x1dGVcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhlIGNvbXBvbmVudCBpcyBub3QgYSBsZXR0ZXIsIHRoZW4gaXQgaXMgYSBudW1lcmljIHZhbHVlXG4gICAgICAgICAgICB2YXIgdHJhbnNsWCwgdHJhbnNsWTtcbiAgICAgICAgICAgIGlmIChhYnNPclJlbCA9PT0gQUJTT0xVVEUpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgdHJhbnNsYXRpb24gaXMgcmVxdWlyZWQgZm9yIGFic29sdXRlIGNvbW1hbmRzLi4uXG4gICAgICAgICAgICAgICAgdHJhbnNsWCA9IHBhdGhUcmFuc2xYO1xuICAgICAgICAgICAgICAgIHRyYW5zbFkgPSBwYXRoVHJhbnNsWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFic09yUmVsID09PSBSRUxBVElWRSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLmJ1dCBub3QgcmVsYXRpdmUgb25lc1xuICAgICAgICAgICAgICAgIHRyYW5zbFggPSAwO1xuICAgICAgICAgICAgICAgIHRyYW5zbFkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChjb21tYW5kUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgLy8gZmlndXJlIG91dCB3aGljaCBvZiB0aGUgbnVtZXJpYyB2YWx1ZXMgZm9sbG93aW5nIGFuIHN2ZyBjb21tYW5kXG4gICAgICAgICAgICAgICAgLy8gYXJlIHJlcXVpcmVkLCBhbmQgdGhlbiB0cmFuc2Zvcm0gdGhlIG51bWVyaWMgdmFsdWUocykgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBvcmlnaW5hbCBwYXRoIGQtYXR0cmlidXRlIGFuZCBwbGFjZSBpdCBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGVcbiAgICAgICAgICAgICAgICAvLyBhcnJheSB0aGF0IHdpbGwgZXZlbnR1YWxseSBiZWNvbWUgdGhlIGQtYXR0cmlidXRlIGZvciB0aGUgbmV3IHBhdGhcbiAgICAgICAgICAgICAgICBjYXNlIEJPVEhfWF9BTkRfWTpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBKVVNUX1g6XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEpVU1RfWTpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgRUxMSVBUSUNBTF9BUkM6XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBlbGxpcHRpY2FsIGFyYyBoYXMgeCBhbmQgeSB2YWx1ZXMgaW4gdGhlIGZpcnN0IGFuZCBzZWNvbmQgYXMgd2VsbCBhc1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgNnRoIGFuZCA3dGggcG9zaXRpb25zIGZvbGxvd2luZyB0aGUgY29tbWFuZDsgdGhlIGludGVydmVuaW5nIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAvLyBhcmUgbm90IGFmZmVjdGVkIGJ5IHRoZSB0cmFuc2Zvcm1hdGlvbiBhbmQgc28gY2FuIHNpbXBseSBiZSBjb3BpZWRcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAyXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAyXSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDNdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDNdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNF0pO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA1XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA1XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDZdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDZdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgTk9ORTpcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibnVtZXJpYyB2YWx1ZSBzaG91bGQgbm90IGZvbGxvdyB0aGUgU1ZHIFoveiBjb21tYW5kXCIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhuZXdQYXRoREFycik7XG4gICAgcmV0dXJuIG5ld1BhdGhEQXJyLmpvaW4oXCIgXCIpO1xufVxuZnVuY3Rpb24gZ2V0QXJyYXlPZlBhdGhEQ29tcG9uZW50cyhzdHIpIHtcbiAgICAvLyBhc3N1bWluZyB0aGUgc3RyaW5nIGZyb20gdGhlIGQtYXR0cmlidXRlIG9mIHRoZSBwYXRoIGhhcyBhbGwgY29tcG9uZW50c1xuICAgIC8vIHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzcGFjZSwgdGhlbiBjcmVhdGUgYW4gYXJyYXkgb2YgY29tcG9uZW50cyBieVxuICAgIC8vIHNpbXBseSBzcGxpdHRpbmcgdGhlIHN0cmluZyBhdCB0aG9zZSBzcGFjZXNcbiAgICBzdHIgPSBzdGFuZGFyZGl6ZVBhdGhEU3RyRm9ybWF0KHN0cik7XG4gICAgcmV0dXJuIHN0ci5zcGxpdChcIiBcIik7XG59XG5mdW5jdGlvbiBzdGFuZGFyZGl6ZVBhdGhEU3RyRm9ybWF0KHN0cikge1xuICAgIC8vIFRoZSBTVkcgc3RhbmRhcmQgaXMgZmxleGlibGUgd2l0aCByZXNwZWN0IHRvIGhvdyBwYXRoIGQtc3RyaW5ncyBhcmVcbiAgICAvLyBmb3JtYXR0ZWQgYnV0IHRoaXMgbWFrZXMgcGFyc2luZyB0aGVtIG1vcmUgZGlmZmljdWx0LiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXNcbiAgICAvLyB0aGF0IGFsbCBTVkcgcGF0aCBkLXN0cmluZyBjb21wb25lbnRzIChpLmUuIGJvdGggY29tbWFuZHMgYW5kIHZhbHVlcykgYXJlXG4gICAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLlxuICAgIHJldHVybiBzdHJcbiAgICAgICAgLnJlcGxhY2UoLywvZywgXCIgXCIpIC8vIHJlcGxhY2UgZWFjaCBjb21tYSB3aXRoIGEgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLy0vZywgXCIgLVwiKSAvLyBwcmVjZWRlIGVhY2ggbWludXMgc2lnbiB3aXRoIGEgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLyhbQS1aYS16XSkvZywgXCIgJDEgXCIpIC8vIHNhbmR3aWNoIGVhY2ggICBsZXR0ZXIgYmV0d2VlbiAyIHNwYWNlc1xuICAgICAgICAucmVwbGFjZSgvICAvZywgXCIgXCIpIC8vIGNvbGxhcHNlIHJlcGVhdGVkIHNwYWNlcyB0byBhIHNpbmdsZSBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvIChbRWVdKSAvZywgXCIkMVwiKSAvLyByZW1vdmUgZmxhbmtpbmcgc3BhY2VzIGFyb3VuZCBleHBvbmVudCBzeW1ib2xzXG4gICAgICAgIC5yZXBsYWNlKC9eIC9nLCBcIlwiKSAvLyB0cmltIGFueSBsZWFkaW5nIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8gJC9nLCBcIlwiKTsgLy8gdHJpbSBhbnkgdGFpbGluZyBzcGFjZVxufVxuZmlnbWEudWkucmVzaXplKDUwMCwgNzUwKTtcbi8vIFVzaW5nIHJlbGF0aXZlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCAoZ2l2ZXMgc2tld2VkIHggdmFsdWUgZm9yIG5vbi1yb3RhdGVkKVxuLy9jb25zb2xlLmxvZygncmVseCcscmVsWzBdWzJdICsgKDEvMikqd2lkdGgqcmVsWzBdWzBdIC0oLTEpKigxLzIpKmhlaWdodCpyZWxbMF1bMF0gLSAoMS8yKSp3aWR0aCk7XG4vL2NvbnNvbGUubG9nKCdyZWx5JyxyZWxbMV1bMl0gICsoMS8yKSp3aWR0aCpyZWxbMV1bMF0tICgtMSkqKDEvMikqaGVpZ2h0KnJlbFsxXVsxXSAtICgxLzIpKmhlaWdodCk7XG4vKlxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHBcIikuaW5uZXJIVE1MID0gYFxuPHN2ZyAgaWQ9XCJiYXNlXCIgd2lkdGg9XCI4MDBcIiBoZWlnaHQ9XCI2MDBcIiB2aWV3Qm94PVwiMCAwIDgwMCA2MDBcIiBzdHlsZT1cImJvcmRlcjogMXB4IHNvbGlkIGJsdWU7XCI+XG4gICAgPHBhdGggaWQ9XCJub3Rtb3ZlZFwiIGZpbGw9XCIjZjAwXCIgc3Ryb2tlPVwibm9uZVwiIGQ9XCJNMTIyLjc2OSA0OC40OTE0QzEyNy4wMzggNDYuMTE3OSAxMjkuOTgzIDQzLjM3MjQgMTMxLjI3NCA0MC4yMTY4QzEzNi42MTQgMjcuMTY4NSAxMzMuNDcyIDE3LjM2MDQgMTI5LjAxNCAxMC44MDA3QzEyNi43NzkgNy41MTE1NCAxMjQuMjA4IDUuMDMzNzIgMTIyLjE5NSAzLjM3Nzg5QzEyMS4xODggMi41NTA1IDEyMC4zMjMgMS45Mjk4NSAxMTkuNzExIDEuNTE3MTVDMTE5LjQwNSAxLjMxMDg0IDExOS4xNjMgMS4xNTY2MiAxMTguOTk4IDEuMDU0NjFDMTE4LjkxNiAxLjAwMzYyIDExOC44NTMgMC45NjU2ODkgMTE4LjgxMSAwLjk0MDg0NUwxMTguNzY1IDAuOTEzMzkyTDExOC43NTQgMC45MDcwMzNMMTE4Ljc1MSAwLjkwNTY5OEMxMTguNzUxIDAuOTA1NzI0IDExOC43NTEgMC45MDU1OSAxMTkgMC40NzE2MThDMTE5LjI0OCAwLjAzNzY0NjYgMTE5LjI0OCAwLjAzNzgyNDMgMTE5LjI0OSAwLjAzODA1NEwxMTkuMjU0IDAuMDQxMTM4NUwxMTkuMjY5IDAuMDQ5NTg5MUMxMTkuMjgxIDAuMDU2ODc2MiAxMTkuMjk5IDAuMDY3NDcwMSAxMTkuMzIyIDAuMDgxMzY2N0MxMTkuMzY5IDAuMTA5MTU3IDExOS40MzcgMC4xNTAxNjggMTE5LjUyNSAwLjIwNDM4NkMxMTkuNyAwLjMxMjgxMSAxMTkuOTUzIDAuNDc0MDk2IDEyMC4yNyAwLjY4ODEzNEMxMjAuOTA1IDEuMTE2MTMgMTIxLjc5NiAxLjc1NTUyIDEyMi44MyAyLjYwNTQ5QzEyNC44OTYgNC4zMDQzOCAxMjcuNTM5IDYuODUwNTkgMTI5Ljg0MSAxMC4yMzg3QzEzNC40NTkgMTcuMDMzNCAxMzcuNjg1IDI3LjE5MjYgMTMyLjIgNDAuNTk1NUMxMzAuNzg1IDQ0LjA1MjYgMTI3LjYxNSA0Ni45NDE2IDEyMy4yNTUgNDkuMzY1NEMxMTguODg4IDUxLjc5MzEgMTEzLjI3IDUzLjc4NjEgMTA2Ljg2NyA1NS40MjM3Qzk0LjA1ODQgNTguNjk5MyA3OC4wMTg4IDYwLjU3NDQgNjIuMzQyNSA2MS42MjEyQzQ2LjY2MTMgNjIuNjY4MiAzMS4zMjE0IDYyLjg4NzggMTkuOTAzNSA2Mi44NDU3QzE0LjE5NCA2Mi44MjQ2IDkuNDY0MTggNjIuNzM4MSA2LjE2MTIxIDYyLjY1NjlDNC41MDk3MSA2Mi42MTYzIDMuMjE0ODkgNjIuNTc3IDIuMzMyNjcgNjIuNTQ3OEMyLjI4MDUxIDYyLjU0NjEgMi4yMjk3OSA2Mi41NDQ0IDIuMTgwNTIgNjIuNTQyOEw0LjQxODA0IDY0Ljk2OTJDNC42MDUyNCA2NS4xNzIyIDQuNTkyNDMgNjUuNDg4NiA0LjM4OTQzIDY1LjY3NThDNC4xODY0MiA2NS44NjMgMy44NzAwOSA2NS44NTAxIDMuNjgyODkgNjUuNjQ3MUwwLjYzMjMxMiA2Mi4zMzlDMC40NDUxMTUgNjIuMTM2IDAuNDU3OTIzIDYxLjgxOTYgMC42NjA5MjcgNjEuNjMyNEwzLjk2OTA4IDU4LjU4MTlDNC4xNzIwOCA1OC4zOTQ3IDQuNDg4NDIgNTguNDA3NSA0LjY3NTYxIDU4LjYxMDVDNC44NjI4MSA1OC44MTM1IDQuODUgNTkuMTI5OCA0LjY0NyA1OS4zMTdMMi4yMzIwNCA2MS41NDM5QzIuMjc1NDcgNjEuNTQ1NCAyLjMyMDA0IDYxLjU0NjkgMi4zNjU3MSA2MS41NDg0QzMuMjQ1MzEgNjEuNTc3NSA0LjUzNzMgNjEuNjE2NyA2LjE4NTggNjEuNjU3MkM5LjQ4Mjg0IDYxLjczODMgMTQuMjA1NyA2MS44MjQ3IDE5LjkwNzIgNjEuODQ1N0MzMS4zMTExIDYxLjg4NzcgNDYuNjI1OSA2MS42Njg0IDYyLjI3NTkgNjAuNjIzNEM3Ny45MzA3IDU5LjU3ODEgOTMuODk5IDU3LjcwNzkgMTA2LjYxOSA1NC40NTQ5QzExMi45OCA1Mi44MjgxIDExOC41MDYgNTAuODYxIDEyMi43NjkgNDguNDkxNFpcIiBvcGFjaXR5PVwiMC41XCIgLz5cbjwvc3ZnPlxuYDtcblxuLy9NIDAuODk0ODc5ODQyMjMyNTAzNCAtMC4yMjk0Nzc3NjU0NjYzMjUxNSBMIC0wLjkxMTM0NjA0NjI5MDA1NjggLTAuOTg0ODA4NjIxNTE0Mjg4NSBMIC0wLjkwNDk5MzI5MTAwODA2NjcgLTAuOTk5OTk5OTk5OTk5OTk5OSBMIDAuOTExMzQ2MDMzMjI0ODQxNiAtMC4yNDA0NDA5NTU0MjkwMjM4OCBWIDEuMDAwMDAwMDI0MTIwMzk2OCBIIDAuODk0ODc5ODQyMjMyNTAzNCBWIC0wLjIyOTQ3Nzc2NTQ2NjMyNTE1IFpcbi8vIFJldHJpZXZlIHRoZSBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoIHlvdSB3aXNoIHRvIHRyYW5zZm9ybS5cbnZhciBzdmdSb290ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYXNlXCIpO1xudmFyIHBhdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vdG1vdmVkXCIpO1xudmFyIG9sZFBhdGhEU3RyID0gcGF0aC5nZXRBdHRyaWJ1dGUoXCJkXCIpO1xuXG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uIHJlcXVpcmVkLlxudmFyIG9iaiA9IGdldFRyYW5zbGF0aW9uQW5kU2NhbGluZyhzdmdSb290LCBwYXRoKTtcbnZhciBwYXRoVHJhbnNsWCA9IG9iai5wYXRoVHJhbnNsWDtcbnZhciBwYXRoVHJhbnNsWSA9IG9iai5wYXRoVHJhbnNsWTtcbnZhciBzY2FsZSA9IG9iai5zY2FsZTtcblxuLy8gVGhlIHBhdGggY291bGQgYmUgdHJhbnNmb3JtZWQgYXQgdGhpcyBwb2ludCB3aXRoIGEgc2ltcGxlXG4vLyBcInRyYW5zZm9ybVwiIGF0dHJpYnV0ZSBhcyBzaG93biBoZXJlLlxuXG4vLyAkcGF0aC5hdHRyKFwidHJhbnNmb3JtXCIsIGB0cmFuc2xhdGUoJHtwYXRoVHJhbnNsWH0sICR7cGF0aFRyYW5zbFl9KSwgc2NhbGUoJHtzY2FsZX0pYCk7XG5cbi8vIEhvd2V2ZXIsIGFzIGRlc2NyaWJlZCBpbiB5b3VyIHF1ZXN0aW9uIHlvdSBkaWRuJ3Qgd2FudCB0aGlzLlxuLy8gVGhlcmVmb3JlLCB0aGUgY29kZSBmb2xsb3dpbmcgdGhpcyBsaW5lIG11dGF0ZXMgdGhlIGFjdHVhbCBzdmcgcGF0aC5cblxuLy8gQ2FsY3VsYXRlIHRoZSBwYXRoIFwiZFwiIGF0dHJpYnV0ZXMgcGFyYW1ldGVycy5cbnZhciBuZXdQYXRoRFN0ciA9IGdldFRyYW5zZm9ybWVkUGF0aERTdHIoXG4gIG9sZFBhdGhEU3RyLFxuICBwYXRoVHJhbnNsWCxcbiAgcGF0aFRyYW5zbFksXG4gIHNjYWxlXG4pO1xuXG4vLyBBcHBseSB0aGUgbmV3IFwiZFwiIGF0dHJpYnV0ZSB0byB0aGUgcGF0aCwgdHJhbnNmb3JtaW5nIGl0LlxuXG5kb2N1bWVudC53cml0ZShcbiAgXCI8cD5BbHRlcmVkICdkJyBhdHRyaWJ1dGUgb2YgcGF0aDo8L3A+PHA+XCIgKyBuZXdQYXRoRFN0ciArIFwiPC9wPlwiXG4pO1xuXG4vLyBUaGlzIGlzIHRoZSBlbmQgb2YgdGhlIG1haW4gY29kZS4gQmVsb3cgYXJlIHRoZSBmdW5jdGlvbnMgY2FsbGVkLlxuXG4vLyBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybWF0aW9uLCBpLmUuIHRoZSB0cmFuc2xhdGlvbiBhbmQgc2NhbGluZywgcmVxdWlyZWRcbi8vIHRvIGdldCB0aGUgcGF0aCB0byBmaWxsIHRoZSBzdmcgYXJlYS4gTm90ZSB0aGF0IHRoaXMgYXNzdW1lcyB1bmlmb3JtXG4vLyBzY2FsaW5nLCBhIHBhdGggdGhhdCBoYXMgbm8gb3RoZXIgdHJhbnNmb3JtcyBhcHBsaWVkIHRvIGl0LCBhbmQgbm9cbi8vIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIHN2ZyB2aWV3cG9ydCBhbmQgdmlld0JveCBkaW1lbnNpb25zLlxuZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25BbmRTY2FsaW5nKHN2ZywgcGF0aCkge1xuICB2YXIgc3ZnV2R0aCA9IDI7XG4gIHZhciBzdmdIZ2h0ID0gMjtcblxuICB2YXIgb3JpZ1BhdGhCb3VuZGluZ0JveCA9IHBhdGguZ2V0QkJveCgpO1xuXG4gIHZhciBvcmlnUGF0aEhnaHQgPSBvcmlnUGF0aEJvdW5kaW5nQm94LmhlaWdodDtcbiAgdmFyIG9yaWdQYXRoV2R0aCA9IG9yaWdQYXRoQm91bmRpbmdCb3gud2lkdGg7XG5cbiAgdmFyIG9yaWdQYXRoWSA9IG9yaWdQYXRoQm91bmRpbmdCb3gueTtcbiAgdmFyIG9yaWdQYXRoWCA9IG9yaWdQYXRoQm91bmRpbmdCb3gueDtcblxuICBjb25zb2xlLmxvZyhvcmlnUGF0aFdkdGgsIG9yaWdQYXRoSGdodCwgb3JpZ1BhdGhXZHRoLCBvcmlnUGF0aFgsIG9yaWdQYXRoWSk7XG4gIC8vIGhvdyBtdWNoIGJpZ2dlciBpcyB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAvLyByZWxhdGl2ZSB0byB0aGUgcGF0aCBpbiBlYWNoIGRpbWVuc2lvbj9cbiAgdmFyIHNjYWxlQmFzZWRPbldkdGggPSBzdmdXZHRoIC8gb3JpZ1BhdGhXZHRoO1xuICB2YXIgc2NhbGVCYXNlZE9uSGdodCA9IHN2Z0hnaHQgLyBvcmlnUGF0aEhnaHQ7XG5cbiAgLy8gb2YgdGhlIHNjYWxpbmcgZmFjdG9ycyBkZXRlcm1pbmVkIGluIGVhY2ggZGltZW5zaW9uLFxuICAvLyB1c2UgdGhlIHNtYWxsZXIgb25lOyBvdGhlcndpc2UgcG9ydGlvbnMgb2YgdGhlIHBhdGhcbiAgLy8gd2lsbCBsaWUgb3V0c2lkZSB0aGUgdmlld3BvcnQgKGNvcnJlY3QgdGVybT8pXG4gIHZhciBzY2FsZSA9IE1hdGgubWluKHNjYWxlQmFzZWRPbldkdGgsIHNjYWxlQmFzZWRPbkhnaHQpO1xuICBhbGVydChcbiAgICBgaGVpZ2h0OiAkezEgLyBzY2FsZUJhc2VkT25IZ2h0fSB3aWR0aDogJHsxIC8gc2NhbGVCYXNlZE9uV2R0aH0sICR7XG4gICAgICBvcmlnUGF0aFdkdGggKiBvcmlnUGF0aEhnaHRcbiAgICB9YFxuICApO1xuICAvLyBjYWxjdWxhdGUgdGhlIGJvdW5kaW5nIGJveCBwYXJhbWV0ZXJzXG4gIC8vIGFmdGVyIHRoZSBwYXRoIGhhcyBiZWVuIHNjYWxlZCByZWxhdGl2ZSB0byB0aGUgb3JpZ2luXG4gIC8vIGJ1dCBiZWZvcmUgYW55IHN1YnNlcXVlbnQgdHJhbnNsYXRpb25zIGhhdmUgYmVlbiBhcHBsaWVkXG5cbiAgdmFyIHNjYWxlZFBhdGhYID0gb3JpZ1BhdGhYICogc2NhbGU7XG4gIHZhciBzY2FsZWRQYXRoWSA9IG9yaWdQYXRoWSAqIHNjYWxlO1xuICB2YXIgc2NhbGVkUGF0aFdkdGggPSBvcmlnUGF0aFdkdGggKiBzY2FsZTtcbiAgdmFyIHNjYWxlZFBhdGhIZ2h0ID0gb3JpZ1BhdGhIZ2h0ICogc2NhbGU7XG5cbiAgLy8gY2FsY3VsYXRlIHRoZSBjZW50cmUgcG9pbnRzIG9mIHRoZSBzY2FsZWQgYnV0IHVudHJhbnNsYXRlZCBwYXRoXG4gIC8vIGFzIHdlbGwgYXMgb2YgdGhlIHN2ZyByb290IGVsZW1lbnRcblxuICB2YXIgc2NhbGVkUGF0aENlbnRyZVggPSBzY2FsZWRQYXRoWCArIHNjYWxlZFBhdGhXZHRoIC8gMjtcbiAgdmFyIHNjYWxlZFBhdGhDZW50cmVZID0gc2NhbGVkUGF0aFkgKyBzY2FsZWRQYXRoSGdodCAvIDI7XG4gIHZhciBzdmdSb290Q2VudHJlWCA9IDA7IC8vIC1zdmdXZHRoIC8gMjtcbiAgdmFyIHN2Z1Jvb3RDZW50cmVZID0gMDsgLy8tc3ZnSGdodCAvIDI7XG5cbiAgLy8gY2FsY3VsYXRlIHRyYW5zbGF0aW9uIHJlcXVpcmVkIHRvIGNlbnRyZSB0aGUgcGF0aFxuICAvLyBvbiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICB2YXIgcGF0aFRyYW5zbFggPSBzdmdSb290Q2VudHJlWCAtIHNjYWxlZFBhdGhDZW50cmVYO1xuICB2YXIgcGF0aFRyYW5zbFkgPSBzdmdSb290Q2VudHJlWSAtIHNjYWxlZFBhdGhDZW50cmVZO1xuICBjb25zb2xlLmxvZyhcbiAgICBcInNjYWxlZCBwYXRoIHhcIixcbiAgICBzY2FsZWRQYXRoWCxcbiAgICBzY2FsZWRQYXRoV2R0aCxcbiAgICBcInNjYWxlZCBwYXRoIHlcIixcbiAgICBzY2FsZWRQYXRoWSxcbiAgICBzY2FsZWRQYXRoSGdodCxcbiAgICBcImZhY3RvciBmcm9tIHNjYWxlXCIsXG4gICAgKG9yaWdQYXRoSGdodCAtIG9yaWdQYXRoV2R0aCkgLyAyLFxuICAgIFwieGZhY3RvciBmcm9tIGdcIlxuICApO1xuICByZXR1cm4geyBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlIH07XG59XG5cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybWVkUGF0aERTdHIob2xkUGF0aERTdHIsIHBhdGhUcmFuc2xYLCBwYXRoVHJhbnNsWSwgc2NhbGUpIHtcbiAgLy8gY29uc3RhbnRzIHRvIGhlbHAga2VlcCB0cmFjayBvZiB0aGUgdHlwZXMgb2YgU1ZHIGNvbW1hbmRzIGluIHRoZSBwYXRoXG4gIHZhciBCT1RIX1hfQU5EX1kgPSAxO1xuICB2YXIgSlVTVF9YID0gMjtcbiAgdmFyIEpVU1RfWSA9IDM7XG4gIHZhciBOT05FID0gNDtcbiAgdmFyIEVMTElQVElDQUxfQVJDID0gNTtcbiAgdmFyIEFCU09MVVRFID0gNjtcbiAgdmFyIFJFTEFUSVZFID0gNztcblxuICAvLyB0d28gcGFyYWxsZWwgYXJyYXlzLCB3aXRoIGVhY2ggZWxlbWVudCBiZWluZyBvbmUgY29tcG9uZW50IG9mIHRoZVxuICAvLyBcImRcIiBhdHRyaWJ1dGUgb2YgdGhlIFNWRyBwYXRoLCB3aXRoIG9uZSBjb21wb25lbnQgYmVpbmcgZWl0aGVyXG4gIC8vIGFuIGluc3RydWN0aW9uIChlLmcuIFwiTVwiIGZvciBtb3ZldG8sIGV0Yy4pIG9yIG51bWVyaWNhbCB2YWx1ZVxuICAvLyBmb3IgZWl0aGVyIGFuIHggb3IgeSBjb29yZGluYXRlXG4gIHZhciBvbGRQYXRoREFyciA9IGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMob2xkUGF0aERTdHIpO1xuICB2YXIgbmV3UGF0aERBcnIgPSBbXTtcblxuICB2YXIgY29tbWFuZFBhcmFtcywgYWJzT3JSZWwsIG9sZFBhdGhEQ29tcCwgbmV3UGF0aERDb21wO1xuXG4gIC8vIGVsZW1lbnQgaW5kZXhcbiAgdmFyIGlkeCA9IDA7XG5cbiAgd2hpbGUgKGlkeCA8IG9sZFBhdGhEQXJyLmxlbmd0aCkge1xuICAgIHZhciBvbGRQYXRoRENvbXAgPSBvbGRQYXRoREFycltpZHhdO1xuICAgIGlmICgvXltBLVphLXpdJC8udGVzdChvbGRQYXRoRENvbXApKSB7XG4gICAgICAvLyBjb21wb25lbnQgaXMgYSBzaW5nbGUgbGV0dGVyLCBpLmUuIGFuIHN2ZyBwYXRoIGNvbW1hbmRcbiAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBvbGRQYXRoREFycltpZHhdO1xuICAgICAgc3dpdGNoIChvbGRQYXRoRENvbXAudG9VcHBlckNhc2UoKSkge1xuICAgICAgICBjYXNlIFwiQVwiOiAvLyBlbGxpcHRpY2FsIGFyYyBjb21tYW5kLi4udGhlIG1vc3QgY29tcGxpY2F0ZWQgb25lXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEVMTElQVElDQUxfQVJDO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiSFwiOiAvLyBob3Jpem9udGFsIGxpbmU7IHJlcXVpcmVzIG9ubHkgYW4geC1jb29yZGluYXRlXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IEpVU1RfWDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlZcIjogLy8gdmVydGljYWwgbGluZTsgcmVxdWlyZXMgb25seSBhIHktY29vcmRpbmF0ZVxuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBKVVNUX1k7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJaXCI6IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgICAgY29tbWFuZFBhcmFtcyA9IE5PTkU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gYWxsIG90aGVyIGNvbW1hbmRzOyBhbGwgb2YgdGhlbSByZXF1aXJlIGJvdGggeCBhbmQgeSBjb29yZGluYXRlc1xuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBCT1RIX1hfQU5EX1k7XG4gICAgICB9XG4gICAgICBhYnNPclJlbCA9XG4gICAgICAgIG9sZFBhdGhEQ29tcCA9PT0gb2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkgPyBBQlNPTFVURSA6IFJFTEFUSVZFO1xuICAgICAgLy8gbG93ZXJjYXNlIGNvbW1hbmRzIGFyZSByZWxhdGl2ZSwgdXBwZXJjYXNlIGFyZSBhYnNvbHV0ZVxuICAgICAgaWR4ICs9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlmIHRoZSBjb21wb25lbnQgaXMgbm90IGEgbGV0dGVyLCB0aGVuIGl0IGlzIGEgbnVtZXJpYyB2YWx1ZVxuICAgICAgdmFyIHRyYW5zbFgsIHRyYW5zbFk7XG4gICAgICBpZiAoYWJzT3JSZWwgPT09IEFCU09MVVRFKSB7XG4gICAgICAgIC8vIHRoZSB0cmFuc2xhdGlvbiBpcyByZXF1aXJlZCBmb3IgYWJzb2x1dGUgY29tbWFuZHMuLi5cbiAgICAgICAgdHJhbnNsWCA9IHBhdGhUcmFuc2xYO1xuICAgICAgICB0cmFuc2xZID0gcGF0aFRyYW5zbFk7XG4gICAgICB9IGVsc2UgaWYgKGFic09yUmVsID09PSBSRUxBVElWRSkge1xuICAgICAgICAvLyAuLi5idXQgbm90IHJlbGF0aXZlIG9uZXNcbiAgICAgICAgdHJhbnNsWCA9IDA7XG4gICAgICAgIHRyYW5zbFkgPSAwO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChjb21tYW5kUGFyYW1zKSB7XG4gICAgICAgIC8vIGZpZ3VyZSBvdXQgd2hpY2ggb2YgdGhlIG51bWVyaWMgdmFsdWVzIGZvbGxvd2luZyBhbiBzdmcgY29tbWFuZFxuICAgICAgICAvLyBhcmUgcmVxdWlyZWQsIGFuZCB0aGVuIHRyYW5zZm9ybSB0aGUgbnVtZXJpYyB2YWx1ZShzKSBmcm9tIHRoZVxuICAgICAgICAvLyBvcmlnaW5hbCBwYXRoIGQtYXR0cmlidXRlIGFuZCBwbGFjZSBpdCBpbiB0aGUgc2FtZSBsb2NhdGlvbiBpbiB0aGVcbiAgICAgICAgLy8gYXJyYXkgdGhhdCB3aWxsIGV2ZW50dWFsbHkgYmVjb21lIHRoZSBkLWF0dHJpYnV0ZSBmb3IgdGhlIG5ldyBwYXRoXG4gICAgICAgIGNhc2UgQk9USF9YX0FORF9ZOlxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSAyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEpVU1RfWDpcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEpVU1RfWTpcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVMTElQVElDQUxfQVJDOlxuICAgICAgICAgIC8vIHRoZSBlbGxpcHRpY2FsIGFyYyBoYXMgeCBhbmQgeSB2YWx1ZXMgaW4gdGhlIGZpcnN0IGFuZCBzZWNvbmQgYXMgd2VsbCBhc1xuICAgICAgICAgIC8vIHRoZSA2dGggYW5kIDd0aCBwb3NpdGlvbnMgZm9sbG93aW5nIHRoZSBjb21tYW5kOyB0aGUgaW50ZXJ2ZW5pbmcgdmFsdWVzXG4gICAgICAgICAgLy8gYXJlIG5vdCBhZmZlY3RlZCBieSB0aGUgdHJhbnNmb3JtYXRpb24gYW5kIHNvIGNhbiBzaW1wbHkgYmUgY29waWVkXG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMl0pO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDNdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDNdKTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA0XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA0XSk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNV0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDZdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDZdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICBpZHggKz0gNztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOT05FOlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwibnVtZXJpYyB2YWx1ZSBzaG91bGQgbm90IGZvbGxvdyB0aGUgU1ZHIFoveiBjb21tYW5kXCJcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmV3UGF0aERBcnIuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMoc3RyKSB7XG4gIC8vIGFzc3VtaW5nIHRoZSBzdHJpbmcgZnJvbSB0aGUgZC1hdHRyaWJ1dGUgb2YgdGhlIHBhdGggaGFzIGFsbCBjb21wb25lbnRzXG4gIC8vIHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzcGFjZSwgdGhlbiBjcmVhdGUgYW4gYXJyYXkgb2YgY29tcG9uZW50cyBieVxuICAvLyBzaW1wbHkgc3BsaXR0aW5nIHRoZSBzdHJpbmcgYXQgdGhvc2Ugc3BhY2VzXG4gIHN0ciA9IHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKTtcbiAgcmV0dXJuIHN0ci5zcGxpdChcIiBcIik7XG59XG5cbmZ1bmN0aW9uIHN0YW5kYXJkaXplUGF0aERTdHJGb3JtYXQoc3RyKSB7XG4gIC8vIFRoZSBTVkcgc3RhbmRhcmQgaXMgZmxleGlibGUgd2l0aCByZXNwZWN0IHRvIGhvdyBwYXRoIGQtc3RyaW5ncyBhcmVcbiAgLy8gZm9ybWF0dGVkIGJ1dCB0aGlzIG1ha2VzIHBhcnNpbmcgdGhlbSBtb3JlIGRpZmZpY3VsdC4gVGhpcyBmdW5jdGlvbiBlbnN1cmVzXG4gIC8vIHRoYXQgYWxsIFNWRyBwYXRoIGQtc3RyaW5nIGNvbXBvbmVudHMgKGkuZS4gYm90aCBjb21tYW5kcyBhbmQgdmFsdWVzKSBhcmVcbiAgLy8gc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNwYWNlLlxuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoLywvZywgXCIgXCIpIC8vIHJlcGxhY2UgZWFjaCBjb21tYSB3aXRoIGEgc3BhY2VcbiAgICAucmVwbGFjZSgvLS9nLCBcIiAtXCIpIC8vIHByZWNlZGUgZWFjaCBtaW51cyBzaWduIHdpdGggYSBzcGFjZVxuICAgIC5yZXBsYWNlKC8oW0EtWmEtel0pL2csIFwiICQxIFwiKSAvLyBzYW5kd2ljaCBlYWNoICAgbGV0dGVyIGJldHdlZW4gMiBzcGFjZXNcbiAgICAucmVwbGFjZSgvICAvZywgXCIgXCIpIC8vIGNvbGxhcHNlIHJlcGVhdGVkIHNwYWNlcyB0byBhIHNpbmdsZSBzcGFjZVxuICAgIC5yZXBsYWNlKC8gKFtFZV0pIC9nLCBcIiQxXCIpIC8vIHJlbW92ZSBmbGFua2luZyBzcGFjZXMgYXJvdW5kIGV4cG9uZW50IHN5bWJvbHNcbiAgICAucmVwbGFjZSgvXiAvZywgXCJcIikgLy8gdHJpbSBhbnkgbGVhZGluZyBzcGFjZVxuICAgIC5yZXBsYWNlKC8gJC9nLCBcIlwiKTsgLy8gdHJpbSBhbnkgdGFpbGluZyBzcGFjZVxufVxuKi9cbiIsIi8vID09Q2xvc3VyZUNvbXBpbGVyPT1cbi8vIEBjb21waWxhdGlvbl9sZXZlbCBBRFZBTkNFRF9PUFRJTUlaQVRJT05TXG4vLyA9PS9DbG9zdXJlQ29tcGlsZXI9PVxuXG4vLyBTVkdQYXRoXG4vLyBGYWhyaSBBeWRvcywgYXlkb3MuY29tXG4vLyAyMDE2LTA2LTE4XG4vLyBodHRwczovL2F5ZG9zLmNvbS9zdmdlZGl0XG5cbi8qKiBAY29uc3RydWN0b3IgKi9cblxuY2xhc3MgU1ZHUGF0aCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIFBhdGggc2VnbWVudHNcbiAgICB0aGlzLnNlZ21lbnRzID0gW107XG4gICAgdGhpcy5kZWMgPSAzO1xuICB9XG5cbiAgaW1wb3J0U3RyaW5nKHN0cikge1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC9cXHMvZywgXCIgXCIpOyAvLyB3aGl0ZSBzcGFjZXNcbiAgICBzdHIgPSBzdHIudHJpbSgpOyAvLyBzcGFjZXMgYXQgYmVnaW4gYW5kIGVuZFxuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8sL2csIFwiIFwiKTsgLy8gY29tbWFzXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLyhbQS1aYS16XSkoW0EtWmEtel0pL2csIFwiJDEgJDJcIik7IC8vIHR3byBjaGFyc1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8oW0EtWmEtel0pKFxcZCkvZywgXCIkMSAkMlwiKTsgLy8gY2hhciArIGRlY2ltYWxcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgvKFtBLVphLXpdKShcXC4pL2csIFwiJDEgLlwiKTsgLy8gY2hhciArIGRvdFxuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8oW0EtWmEtel0pKC0pL2csIFwiJDEgLVwiKTsgLy8gY2hhciArIG5lZ2F0aXZlIG51bWJlclxuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8oXFxkKShbQS1aYS16XSkvZywgXCIkMSAkMlwiKTsgLy8gZGVjaW1hbCArIGNoYXJcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgvKFxcZCkoLSkvZywgXCIkMSAtXCIpOyAvLyBkZWNpbWFsICsgbmVnYXRpdmUgbnVtYmVyXG4gICAgdmFyIHJlZyA9IC8oKD86LT9bXFxkXSopXFwuXFxkKykoKD86XFwuXFxkKykrKS9nOyAvLyBkZWNpbWFsICsgZG90ICsgZGVjaW1hbCArIGRvdCArIGRlY2ltYWxcbiAgICB3aGlsZSAocmVnLnRlc3Qoc3RyKSkge1xuICAgICAgc3RyID0gc3RyLnJlcGxhY2UocmVnLCBcIiQxICQyXCIpO1xuICAgIH1cbiAgICB3aGlsZSAoLyAgLy50ZXN0KHN0cikpIHtcbiAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8gIC9nLCBcIiBcIik7IC8vIGNsZWFyIGRvdWJsZSBzcGFjZXNcbiAgICB9XG4gICAgdmFyIGxpc3QgPSBzdHIuc3BsaXQoXCIgXCIpO1xuICAgIHZhciBwcmV0ID0gXCJcIjtcbiAgICB2YXIgcHJleCA9IDA7XG4gICAgdmFyIHByZXkgPSAwO1xuICAgIHZhciBiZWd4ID0gMDtcbiAgICB2YXIgYmVneSA9IDA7XG4gICAgdmFyIGogPSAwO1xuICAgIHZhciBpID0gMDtcbiAgICB0aGlzLnNlZ21lbnRzID0gW107XG5cbiAgICB3aGlsZSAoaSA8IGxpc3QubGVuZ3RoKSB7XG4gICAgICB2YXIgc2VnID0gbmV3IFNlZ21lbnQoKTtcbiAgICAgICAgc2VnLnZhbHVlID0gbGlzdFtpXTtcbiAgICAgIGlmIChsaXN0W2ldLmNoYXJDb2RlQXQoMCkgPiA2NCkge1xuICAgICAgICBzZWcudCA9IGxpc3RbaSsrXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwcmV0ID09IFwiXCIpIGJyZWFrO1xuICAgICAgICBzZWcudCA9IHByZXQgPT0gXCJNXCIgPyBcIkxcIiA6IHByZXQgPT0gXCJtXCIgPyBcImxcIiA6IHByZXQ7XG4gICAgICB9XG4gICAgICBwcmV0ID0gc2VnLnQ7XG5cbiAgICAgIHN3aXRjaCAoc2VnLnQpIHtcbiAgICAgICAgY2FzZSBcIlpcIjpcbiAgICAgICAgY2FzZSBcInpcIjpcbiAgICAgICAgICBzZWcueCA9IGJlZ3g7XG4gICAgICAgICAgc2VnLnkgPSBiZWd5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiTVwiOlxuICAgICAgICBjYXNlIFwiTFwiOlxuICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICBjYXNlIFwiVlwiOlxuICAgICAgICBjYXNlIFwiVFwiOlxuICAgICAgICAgIHNlZy54ID0gc2VnLnQgPT0gXCJWXCIgPyBwcmV4IDogTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnkgPSBzZWcudCA9PSBcIkhcIiA/IHByZXkgOiBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBiZWd4ID0gc2VnLnQgPT0gXCJNXCIgPyBzZWcueCA6IGJlZ3g7XG4gICAgICAgICAgYmVneSA9IHNlZy50ID09IFwiTVwiID8gc2VnLnkgOiBiZWd5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwibVwiOlxuICAgICAgICBjYXNlIFwibFwiOlxuICAgICAgICBjYXNlIFwiaFwiOlxuICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgIHNlZy54ID0gc2VnLnQgPT0gXCJ2XCIgPyBwcmV4IDogcHJleCArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy55ID0gc2VnLnQgPT0gXCJoXCIgPyBwcmV5IDogcHJleSArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIGJlZ3ggPSBzZWcudCA9PSBcIm1cIiA/IHNlZy54IDogYmVneDtcbiAgICAgICAgICBiZWd5ID0gc2VnLnQgPT0gXCJtXCIgPyBzZWcueSA6IGJlZ3k7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJBXCI6XG4gICAgICAgIGNhc2UgXCJhXCI6XG4gICAgICAgICAgc2VnLnIxID0gTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnIyID0gTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLmFyID0gTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLmFmID0gTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnNmID0gTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnggPSBzZWcudCA9PSBcIkFcIiA/IE51bWJlcihsaXN0W2krK10pIDogcHJleCArIE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy55ID0gc2VnLnQgPT0gXCJBXCIgPyBOdW1iZXIobGlzdFtpKytdKSA6IHByZXkgKyBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIkNcIjpcbiAgICAgICAgY2FzZSBcIlFcIjpcbiAgICAgICAgY2FzZSBcIlNcIjpcbiAgICAgICAgICBzZWcueDEgPSBzZWcudCA9PSBcIlNcIiA/IHVuZGVmaW5lZCA6IE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy55MSA9IHNlZy50ID09IFwiU1wiID8gdW5kZWZpbmVkIDogTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLngyID0gc2VnLnQgPT0gXCJRXCIgPyB1bmRlZmluZWQgOiBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueTIgPSBzZWcudCA9PSBcIlFcIiA/IHVuZGVmaW5lZCA6IE51bWJlcihsaXN0W2krK10pO1xuICAgICAgICAgIHNlZy54ID0gTnVtYmVyKGxpc3RbaSsrXSk7XG4gICAgICAgICAgc2VnLnkgPSBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgY2FzZSBcInFcIjpcbiAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICBzZWcueDEgPSBzZWcudCA9PSBcInNcIiA/IHVuZGVmaW5lZCA6IHByZXggKyBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueTEgPSBzZWcudCA9PSBcInNcIiA/IHVuZGVmaW5lZCA6IHByZXkgKyBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueDIgPSBzZWcudCA9PSBcInFcIiA/IHVuZGVmaW5lZCA6IHByZXggKyBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueTIgPSBzZWcudCA9PSBcInFcIiA/IHVuZGVmaW5lZCA6IHByZXkgKyBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueCA9IHByZXggKyBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBzZWcueSA9IHByZXkgKyBOdW1iZXIobGlzdFtpKytdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpKys7XG4gICAgICB9XG4gICAgICBzZWcucHggPSBwcmV4O1xuICAgICAgc2VnLnB5ID0gcHJleTtcbiAgICAgIHByZXggPSBzZWcueDtcbiAgICAgIHByZXkgPSBzZWcueTtcbiAgICAgIHRoaXMuc2VnbWVudHNbaisrXSA9IHNlZztcbiAgICB9XG4gIH1cblxuICBleHBvcnQoKSB7XG4gICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgdmFyIHByZSA9IFwiXCI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgc2VnID0gdGhpcy5zZWdtZW50c1tpXTsvL3RoaXMuZm9ybWF0U2VnbWVudCh0aGlzLnNlZ21lbnRzW2ldKTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coc2VnKTtcbiAgICAgIHN3aXRjaCAoc2VnLnQpIHtcbiAgICAgICAgY2FzZSBcIlpcIjpcbiAgICAgICAgY2FzZSBcInpcIjpcbiAgICAgICAgICBzdHIgKz0gc2VnLnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgIGNhc2UgXCJtXCI6XG4gICAgICAgICAgc3RyICs9IHNlZy50ICsgc2VnLnggKyBcIiBcIiArIHNlZy55O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiTFwiOlxuICAgICAgICAgIHN0ciArPSBwcmUgPT0gc2VnLnQgfHwgcHJlID09IFwiTVwiID8gXCIgXCIgOiBcIkxcIjtcbiAgICAgICAgICBzdHIgKz0gc2VnLnggKyBcIiBcIiArIHNlZy55O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwibFwiOlxuICAgICAgICAgIHN0ciArPSBwcmUgPT0gc2VnLnQgfHwgcHJlID09IFwibVwiID8gXCIgXCIgOiBcImxcIjtcbiAgICAgICAgICBzdHIgKz0gc2VnLnggKyBcIiBcIiArIHNlZy55O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICBjYXNlIFwiaFwiOlxuICAgICAgICAgIHN0ciArPSBwcmUgPT0gc2VnLnQgPyBcIiBcIiA6IHNlZy50O1xuICAgICAgICAgIHN0ciArPSBzZWcueDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlZcIjpcbiAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICBzdHIgKz0gcHJlID09IHNlZy50ID8gXCIgXCIgOiBzZWcudDtcbiAgICAgICAgICBzdHIgKz0gc2VnLnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJBXCI6XG4gICAgICAgIGNhc2UgXCJhXCI6XG4gICAgICAgICAgc3RyICs9IHByZSA9PSBzZWcudCA/IFwiIFwiIDogc2VnLnQ7XG4gICAgICAgICAgc3RyICs9XG4gICAgICAgICAgICBzZWcucjEgK1xuICAgICAgICAgICAgXCIgXCIgK1xuICAgICAgICAgICAgc2VnLnIyICtcbiAgICAgICAgICAgIFwiIFwiICtcbiAgICAgICAgICAgIHNlZy5hciArXG4gICAgICAgICAgICBcIiBcIiArXG4gICAgICAgICAgICBzZWcuYWYgK1xuICAgICAgICAgICAgXCIgXCIgK1xuICAgICAgICAgICAgc2VnLnNmICtcbiAgICAgICAgICAgIFwiIFwiICtcbiAgICAgICAgICAgIHNlZy54ICtcbiAgICAgICAgICAgIFwiIFwiICtcbiAgICAgICAgICAgIHNlZy55O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiQ1wiOlxuICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgIHN0ciArPSBwcmUgPT0gc2VnLnQgPyBcIiBcIiA6IHNlZy50O1xuICAgICAgICAgIHN0ciArPSBzZWcueDEgKyBcIiBcIiArIHNlZy55MSArIFwiIFwiICsgc2VnLngyICsgXCIgXCIgKyBzZWcueTIgKyBcIiBcIiArIHNlZy54ICsgXCIgXCIgKyBzZWcueTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlFcIjpcbiAgICAgICAgY2FzZSBcInFcIjpcbiAgICAgICAgICBzdHIgKz0gcHJlID09IHNlZy50ID8gXCIgXCIgOiBzZWcudDtcbiAgICAgICAgICBzdHIgKz0gc2VnLngxICsgXCIgXCIgKyBzZWcueTEgKyBcIiBcIiArIHNlZy54ICsgXCIgXCIgKyBzZWcueTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlNcIjpcbiAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICBzdHIgKz0gcHJlID09IHNlZy50ID8gXCIgXCIgOiBzZWcudDtcbiAgICAgICAgICBzdHIgKz0gc2VnLngyICsgXCIgXCIgKyBzZWcueTIgKyBcIiBcIiArIHNlZy54ICsgXCIgXCIgKyBzZWcueTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlRcIjpcbiAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICBzdHIgKz0gcHJlID09IHNlZy50ID8gXCIgXCIgOiBzZWcudDtcbiAgICAgICAgICBzdHIgKz0gc2VnLnggKyBcIiBcIiArIHNlZy55O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgcHJlID0gc2VnLnQ7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdpbmV4cG9ydCcsc3RyKVxuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC8gLS9nLCBcIi1cIik7XG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLy0wXFwuL2csIFwiLS5cIik7XG4gICAgc3RyID0gc3RyLnJlcGxhY2UoLyAwXFwuL2csIFwiIC5cIik7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuXG4gIC8vIGV4cG9ydCB0aGUgc2VnbWVudHMgYXMgYXJyYXlcbiAgZXhwb3J0TGlzdCgpIHtcbiAgICB2YXIgbGlzdCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgbGlzdFtpXSA9IHRoaXMuZm9ybWF0U2VnbWVudCh0aGlzLnNlZ21lbnRzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cblxuICAvLyBtYWtlIHNvbWUgYW5hbHlzaXMgdG8gbWluaWZ5XG4gIGFuYWx5c2UoZGlzdCkge1xuICAgIGRpc3QgPSBOdW1iZXIoZGlzdCk7XG4gICAgaWYgKGlzTmFOKGRpc3QpKSBkaXN0ID0gMDtcbiAgICBpZiAoZGlzdCA8IDApIGRpc3QgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLmluZm8gPSBcIlwiO1xuICAgIH1cblxuICAgIC8vIGNvbnZlcnQgTCB0byBIIG9yIFZcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLnNlZ21lbnRzW2ldLnggPT0gdGhpcy5zZWdtZW50c1tpXS5weCAmJiB0aGlzLnNlZ21lbnRzW2ldLnQudG9VcHBlckNhc2UoKSA9PSBcIkxcIikge1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnQgPSB0aGlzLnNlZ21lbnRzW2ldLnQgPT0gXCJMXCIgPyBcIlZcIiA6IFwidlwiO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS55ID09IHRoaXMuc2VnbWVudHNbaV0ucHkgJiZcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS50LnRvVXBwZXJDYXNlKCkgPT0gXCJMXCJcbiAgICAgICkge1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnQgPSB0aGlzLnNlZ21lbnRzW2ldLnQgPT0gXCJMXCIgPyBcIkhcIiA6IFwiaFwiO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBhID0gLTE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgdmFyIGR4ID0gdGhpcy5zZWdtZW50c1tpXS54IC0gdGhpcy5zZWdtZW50c1tpXS5weDtcbiAgICAgIHZhciBkeSA9IHRoaXMuc2VnbWVudHNbaV0ueSAtIHRoaXMuc2VnbWVudHNbaV0ucHk7XG4gICAgICAvLyB0d28gY29uc2VjdXRpdmUgTVxuICAgICAgaWYgKHRoaXMuc2VnbWVudHNbaV0udC50b1VwcGVyQ2FzZSgpID09IFwiTVwiICYmIHRoaXMuc2VnbWVudHNbaSArIDFdLnQudG9VcHBlckNhc2UoKSA9PSBcIk1cIikge1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLmluZm8gPSBcIlhcIjtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpICsgMV0ucHggPSBpID09IDAgPyAwIDogdGhpcy5zZWdtZW50c1tpIC0gMV0ueDtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpICsgMV0ucHkgPSBpID09IDAgPyAwIDogdGhpcy5zZWdtZW50c1tpIC0gMV0ueTtcbiAgICAgIH1cbiAgICAgIC8vIHR3byBjb25zZWN1dGl2ZSBaXG4gICAgICBpZiAodGhpcy5zZWdtZW50c1tpXS50LnRvVXBwZXJDYXNlKCkgPT0gXCJaXCIgJiYgdGhpcy5zZWdtZW50c1tpICsgMV0udC50b1VwcGVyQ2FzZSgpID09IFwiWlwiKSB7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0uaW5mbyA9IFwiWFwiO1xuICAgICAgfVxuICAgICAgLy8gb24gdGhlIHNhbWUgbGluZVxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnQudG9VcHBlckNhc2UoKSA9PSBcIkxcIiB8fFxuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnQudG9VcHBlckNhc2UoKSA9PSBcIkhcIiB8fFxuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnQudG9VcHBlckNhc2UoKSA9PSBcIlZcIlxuICAgICAgKSB7XG4gICAgICAgIHZhciBiID0gYXRhbjMoZHgsIGR5KTtcbiAgICAgICAgaWYgKGIgPT0gYSkge1xuICAgICAgICAgIHRoaXMuc2VnbWVudHNbaSAtIDFdLmluZm8gPSBcIlhcIjtcbiAgICAgICAgfVxuICAgICAgICBhID0gYjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGEgPSAtMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBmaXJzdCBzZWdtZW50IG11c3QgYmUgTVxuICAgIGlmICh0aGlzLnNlZ21lbnRzWzBdLnQudG9VcHBlckNhc2UoKSAhPSBcIk1cIikge1xuICAgICAgdGhpcy5zZWdtZW50c1swXS50ID0gdGhpcy5zZWdtZW50c1swXS50LmNoYXJDb2RlQXQoMCkgPCA5NiA/IFwiTVwiIDogXCJtXCI7XG4gICAgfVxuXG4gICAgLy8gbGFzdCBzZWdtZW50IGNhbnQgYmUgTVxuICAgIGlmICh0aGlzLnNlZ21lbnRzW3RoaXMuc2VnbWVudHMubGVuZ3RoIC0gMV0udC50b1VwcGVyQ2FzZSgpID09IFwiTVwiKSB7XG4gICAgICB0aGlzLnNlZ21lbnRzW3RoaXMuc2VnbWVudHMubGVuZ3RoIC0gMV0uaW5mbyA9IFwiWFwiO1xuICAgIH1cblxuICAgIC8vIHJlbW92ZSBjZXJ0YWlubHkgcmVtb3ZhYmxlc1xuICAgIHZhciBpID0gdGhpcy5zZWdtZW50cy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKHRoaXMuc2VnbWVudHNbaV0uaW5mbyA9PSBcIlhcIikgdGhpcy5zZWdtZW50cy5zcGxpY2UoaSwgMSk7XG4gICAgfVxuXG4gICAgaWYgKGRpc3QgPT0gMCkgcmV0dXJuO1xuXG4gICAgLy8gdG9vIGNsb3NlIHNlZ21lbnRzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgaWYgKHRoaXMuc2VnbWVudHNbaV0udC50b1VwcGVyQ2FzZSgpID09IFwiWlwiKSBjb250aW51ZTtcbiAgICAgIHZhciBkeCA9IHRoaXMuc2VnbWVudHNbaV0ueCAtIHRoaXMuc2VnbWVudHNbaSArIDFdLng7XG4gICAgICB2YXIgZHkgPSB0aGlzLnNlZ21lbnRzW2ldLnkgLSB0aGlzLnNlZ21lbnRzW2kgKyAxXS55O1xuICAgICAgdmFyIGQgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgICAgaWYgKGQgPD0gZGlzdCkge1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLmluZm8gPSBcIkQgXCIgKyBkICsgXCIgXCI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIG1ha2UgYWxsIHNlZ21lbnRzIGFic29sdXRlXG4gIGFic29sdXRlKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5zZWdtZW50c1tpXS50ID0gdGhpcy5zZWdtZW50c1tpXS50LnRvVXBwZXJDYXNlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gbWFrZSBhbGwgc2VnbWVudHMgcmVsYXRpdmVcbiAgcmVsYXRpdmUoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnQgPSB0aGlzLnNlZ21lbnRzW2ldLnQudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gIH1cblxuICAvLyBzZXQgdGhlIGdsb2JhbCBkZWMgdmFyaWFibGUsIHRvIHJvdW5kaW5nIGRlY2ltYWxzXG4gIHJvdW5kKGQpIHtcbiAgICBkID0gTnVtYmVyKGQpO1xuICAgIGlmIChpc05hTihkKSkgZCA9IDA7XG4gICAgaWYgKGQgPCAwKSBkID0gLTE7XG4gICAgZGVjID0gTWF0aC5mbG9vcihkKTtcbiAgfVxuXG4gIC8vIG1vdmUgcGF0aCB3aXRoIGdpdmVuIGR4LCBkeVxuICBtb3ZlKGR4LCBkeSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5zZWdtZW50c1tpXS54ICs9IGR4O1xuICAgICAgdGhpcy5zZWdtZW50c1tpXS55ICs9IGR5O1xuICAgICAgdGhpcy5zZWdtZW50c1tpXS5weCArPSBkeDtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0ucHkgKz0gZHk7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLngxID0gdGhpcy5zZWdtZW50c1tpXS54MSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLnNlZ21lbnRzW2ldLngxICsgZHg7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnkxID0gdGhpcy5zZWdtZW50c1tpXS55MSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLnNlZ21lbnRzW2ldLnkxICsgZHk7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLngyID0gdGhpcy5zZWdtZW50c1tpXS54MiA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLnNlZ21lbnRzW2ldLngyICsgZHg7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnkyID0gdGhpcy5zZWdtZW50c1tpXS55MiA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLnNlZ21lbnRzW2ldLnkyICsgZHk7XG4gICAgfVxuICAgIHRoaXMuc2VnbWVudHNbMF0ucHggPSAwO1xuICAgIHRoaXMuc2VnbWVudHNbMF0ucHkgPSAwO1xuICB9XG5cbiAgLy8gZmxpcCBob3Jpem9udGFsbHkgd2l0aCBmbGlwKHVuZGVmaW5lZCwgY2VudGVyKVxuICAvLyBmbGlwIHZlcnRpY2FsbHksIHdpdGggZmxpcChjZW50ZXIsIHVuZGVmaW5lZClcbiAgLy8gZmxpcCB3cnQgYSBwb2ludCAocHgsIHB5KVxuICBmbGlwKHgsIHkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh4ICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnggPSB4ICsgKHggLSB0aGlzLnNlZ21lbnRzW2ldLngpO1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnB4ID0geCArICh4IC0gdGhpcy5zZWdtZW50c1tpXS5weCk7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueDEgPVxuICAgICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueDEgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogeCArICh4IC0gdGhpcy5zZWdtZW50c1tpXS54MSk7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueDIgPVxuICAgICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueDIgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogeCArICh4IC0gdGhpcy5zZWdtZW50c1tpXS54Mik7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0uc2YgPVxuICAgICAgICAgIHRoaXMuc2VnbWVudHNbaV0uc2YgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogKHRoaXMuc2VnbWVudHNbaV0uc2YgKyAxKSAlIDI7XG4gICAgICB9XG4gICAgICBpZiAoeSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS55ID0geSArICh5IC0gdGhpcy5zZWdtZW50c1tpXS55KTtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS5weSA9IHkgKyAoeSAtIHRoaXMuc2VnbWVudHNbaV0ucHkpO1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnkxID1cbiAgICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnkxID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHkgKyAoeSAtIHRoaXMuc2VnbWVudHNbaV0ueTEpO1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnkyID1cbiAgICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnkyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHkgKyAoeSAtIHRoaXMuc2VnbWVudHNbaV0ueTIpO1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnNmID1cbiAgICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnNmID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6ICh0aGlzLnNlZ21lbnRzW2ldLnNmICsgMSkgJSAyO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNlZ21lbnRzWzBdLnB4ID0gMDtcbiAgICB0aGlzLnNlZ21lbnRzWzBdLnB5ID0gMDtcbiAgfVxuXG4gIGNhbGN1bGF0ZUJvdW5kcygpe1xuICAgIHZhciBtaW54ID0gdGhpcy5zZWdtZW50c1swXS54O1xuICAgIHZhciBtaW55ID0gdGhpcy5zZWdtZW50c1swXS55O1xuICAgIHZhciBtYXh4ID0gdGhpcy5zZWdtZW50c1swXS54O1xuICAgIHZhciBtYXh5ID0gdGhpcy5zZWdtZW50c1swXS55O1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgbWlueCA9IHRoaXMuc2VnbWVudHNbaV0ueCA8IG1pbnggPyB0aGlzLnNlZ21lbnRzW2ldLnggOiBtaW54O1xuICAgICAgbWlueSA9IHRoaXMuc2VnbWVudHNbaV0ueSA8IG1pbnkgPyB0aGlzLnNlZ21lbnRzW2ldLnkgOiBtaW55O1xuICAgICAgbWF4eCA9IHRoaXMuc2VnbWVudHNbaV0ueCA+IG1heHggPyB0aGlzLnNlZ21lbnRzW2ldLnggOiBtYXh4O1xuICAgICAgbWF4eSA9IHRoaXMuc2VnbWVudHNbaV0ueSA+IG1heHkgPyB0aGlzLnNlZ21lbnRzW2ldLnkgOiBtYXh5O1xuICAgIH1cbiAgICB2YXIgd2lkdGggPSBtYXh4IC0gbWlueDtcbiAgICB2YXIgaGVpZ2h0ID0gbWF4eSAtIG1pbnk7XG4gICAgcmV0dXJuIFttaW54LG1pbnksbWF4eCxtYXh5LHdpZHRoLGhlaWdodF1cbiAgfVxuXG4gIC8vIG1vdmUgcGF0aHMgY2VudGVyIHRvIHRoZSBnaXZlbiBjb29yZGluYXRlc1xuICBjZW50ZXIoeCwgeSkge1xuICAgIHZhciBtaW54ID0gdGhpcy5zZWdtZW50c1swXS54O1xuICAgIHZhciBtaW55ID0gdGhpcy5zZWdtZW50c1swXS55O1xuICAgIHZhciBtYXh4ID0gdGhpcy5zZWdtZW50c1swXS54O1xuICAgIHZhciBtYXh5ID0gdGhpcy5zZWdtZW50c1swXS55O1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgbWlueCA9IHRoaXMuc2VnbWVudHNbaV0ueCA8IG1pbnggPyB0aGlzLnNlZ21lbnRzW2ldLnggOiBtaW54O1xuICAgICAgbWlueSA9IHRoaXMuc2VnbWVudHNbaV0ueSA8IG1pbnkgPyB0aGlzLnNlZ21lbnRzW2ldLnkgOiBtaW55O1xuICAgICAgbWF4eCA9IHRoaXMuc2VnbWVudHNbaV0ueCA+IG1heHggPyB0aGlzLnNlZ21lbnRzW2ldLnggOiBtYXh4O1xuICAgICAgbWF4eSA9IHRoaXMuc2VnbWVudHNbaV0ueSA+IG1heHkgPyB0aGlzLnNlZ21lbnRzW2ldLnkgOiBtYXh5O1xuICAgIH1cbiAgICB2YXIgZHggPSB4IC0gbWlueCAtIChtYXh4IC0gbWlueCkgLyAyO1xuICAgIHZhciBkeSA9IHkgLSBtaW55IC0gKG1heHkgLSBtaW55KSAvIDI7XG4gICAgdGhpcy5tb3ZlKGR4LCBkeSk7XG4gIH1cblxuICAvLyBzY2FsZSBwYXRoIHdpdGggYSBnaXZlbiByYXRpb1xuICBzY2FsZShyYXRpbykge1xuICAgIHJhdGlvID0gTnVtYmVyKHJhdGlvKTtcbiAgICBpZiAoaXNOYU4ocmF0aW8pKSByZXR1cm47XG4gICAgaWYgKHJhdGlvIDw9IDApIHJldHVybjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzZWcgPSB0aGlzLnNlZ21lbnRzW2ldO1xuICAgICAgc2VnLnggKj0gcmF0aW87XG4gICAgICBzZWcueSAqPSByYXRpbztcbiAgICAgIHNlZy5weCAqPSByYXRpbztcbiAgICAgIHNlZy5weSAqPSByYXRpbztcbiAgICAgIHNlZy54MSA9IHNlZy54MSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiByYXRpbyAqIHNlZy54MTtcbiAgICAgIHNlZy55MSA9IHNlZy55MSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiByYXRpbyAqIHNlZy55MTtcbiAgICAgIHNlZy54MiA9IHNlZy54MiA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiByYXRpbyAqIHNlZy54MjtcbiAgICAgIHNlZy55MiA9IHNlZy55MiA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiByYXRpbyAqIHNlZy55MjtcbiAgICAgIHNlZy5yMSA9IHNlZy5yMSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiByYXRpbyAqIHNlZy5yMTtcbiAgICAgIHNlZy5yMiA9IHNlZy5yMiA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiByYXRpbyAqIHNlZy5yMjtcbiAgICB9XG4gIH1cblxuICAvLyByb3RhdGUgdGhlIHBhdGggd2l0aCBnaXZlbiBjZW50ZXIgYW5kIHJvdGF0aW9uIGRlZ3JlZVxuICByb3RhdGUoeCwgeSwgZCkge1xuICAgIGQgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4oZCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKGQpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJwID0gcm90YXRlUG9pbnQodGhpcy5zZWdtZW50c1tpXS54LCB0aGlzLnNlZ21lbnRzW2ldLnksIHgsIHksIHNpbiwgY29zKTtcbiAgICAgIHRoaXMuc2VnbWVudHNbaV0ueCA9IHJwWzBdO1xuICAgICAgdGhpcy5zZWdtZW50c1tpXS55ID0gcnBbMV07XG4gICAgICB2YXIgcnAgPSByb3RhdGVQb2ludCh0aGlzLnNlZ21lbnRzW2ldLnB4LCB0aGlzLnNlZ21lbnRzW2ldLnB5LCB4LCB5LCBzaW4sIGNvcyk7XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnB4ID0gcnBbMF07XG4gICAgICB0aGlzLnNlZ21lbnRzW2ldLnB5ID0gcnBbMV07XG4gICAgICBpZiAodGhpcy5zZWdtZW50c1tpXS54MSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHJwID0gcm90YXRlUG9pbnQodGhpcy5zZWdtZW50c1tpXS54MSwgdGhpcy5zZWdtZW50c1tpXS55MSwgeCwgeSwgc2luLCBjb3MpO1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLngxID0gcnBbMF07XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueTEgPSBycFsxXTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNlZ21lbnRzW2ldLngyICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgcnAgPSByb3RhdGVQb2ludCh0aGlzLnNlZ21lbnRzW2ldLngyLCB0aGlzLnNlZ21lbnRzW2ldLnkyLCB4LCB5LCBzaW4sIGNvcyk7XG4gICAgICAgIHRoaXMuc2VnbWVudHNbaV0ueDIgPSBycFswXTtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS55MiA9IHJwWzFdO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2VnbWVudHNbaV0udCA9PSBcIkhcIiB8fCB0aGlzLnNlZ21lbnRzW2ldLnQgPT0gXCJWXCIpIHtcbiAgICAgICAgdGhpcy5zZWdtZW50c1tpXS50ID0gXCJMXCI7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zZWdtZW50c1tpXS50ID09IFwiaFwiIHx8IHRoaXMuc2VnbWVudHNbaV0udCA9PSBcInZcIikge1xuICAgICAgICB0aGlzLnNlZ21lbnRzW2ldLnQgPSBcImxcIjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zZWdtZW50c1swXS5weCA9IDA7XG4gICAgdGhpcy5zZWdtZW50c1swXS5weSA9IDA7XG4gIH1cblxuICBmb3JtYXRTZWdtZW50KHMpIHtcbiAgICB2YXIgc2VnID0gbmV3IFNlZ21lbnQoKTtcbiAgICBzZWcudCA9IHMudDtcbiAgICBzZWcueCA9IHMudC5jaGFyQ29kZUF0KDApIDwgOTYgPyB0aGlzLnJvdW5kRGVjKHMueCkgOiB0aGlzLnJvdW5kRGVjKHMueCAtIHMucHgpO1xuICAgIHNlZy55ID0gcy50LmNoYXJDb2RlQXQoMCkgPCA5NiA/IHRoaXMucm91bmREZWMocy55KSA6IHRoaXMucm91bmREZWMocy55IC0gcy5weSk7XG4gICAgc2VnLnB4ID0gdGhpcy5yb3VuZERlYyhzLnB4KTtcbiAgICBzZWcucHkgPSB0aGlzLnJvdW5kRGVjKHMucHkpO1xuICAgIHNlZy54MSA9XG4gICAgICBzLngxID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHMudC5jaGFyQ29kZUF0KDApIDwgOTYgPyB0aGlzLnJvdW5kRGVjKHMueDEpIDogdGhpcy5yb3VuZERlYyhzLngxIC0gcy5weCk7XG4gICAgc2VnLnkxID1cbiAgICAgIHMueTEgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogcy50LmNoYXJDb2RlQXQoMCkgPCA5NiA/IHRoaXMucm91bmREZWMocy55MSkgOiB0aGlzLnJvdW5kRGVjKHMueTEgLSBzLnB5KTtcbiAgICBzZWcueDIgPVxuICAgICAgcy54MiA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBzLnQuY2hhckNvZGVBdCgwKSA8IDk2ID8gdGhpcy5yb3VuZERlYyhzLngyKSA6IHRoaXMucm91bmREZWMocy54MiAtIHMucHgpO1xuICAgIHNlZy55MiA9XG4gICAgICBzLnkyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHMudC5jaGFyQ29kZUF0KDApIDwgOTYgPyB0aGlzLnJvdW5kRGVjKHMueTIpIDogdGhpcy5yb3VuZERlYyhzLnkyIC0gcy5weSk7XG4gICAgc2VnLnIxID0gcy5yMSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLnJvdW5kRGVjKHMucjEpO1xuICAgIHNlZy5yMiA9IHMucjEgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdGhpcy5yb3VuZERlYyhzLnIyKTtcbiAgICBzZWcuYXIgPSBzLmFyID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMucm91bmREZWMocy5hcik7XG4gICAgc2VnLmFmID0gcy5hZjtcbiAgICBzZWcuc2YgPSBzLnNmO1xuICAgIHNlZy5pbmZvID0gcy5pbmZvO1xuICAgIGlmIChzLnQgPT0gXCJNXCIpIHtcbiAgICAgIHNlZy5pbmZvICs9IFwibSBcIiArIHRoaXMucm91bmREZWMocy54IC0gcy5weCkgKyBcIiBcIiArIHRoaXMucm91bmREZWMocy55IC0gcy5weSk7XG4gICAgfVxuICAgIGlmIChzLnQgPT0gXCJtXCIpIHtcbiAgICAgIHNlZy5pbmZvICs9IFwiTSBcIiArIHRoaXMucm91bmREZWMocy54KSArIFwiIFwiICsgdGhpcy5yb3VuZERlYyhzLnkpO1xuICAgIH1cbiAgICByZXR1cm4gc2VnO1xuICB9XG4gIHJvdW5kRGVjKGRlYyxudW0pIHtcbiAgICBpZiAoZGVjIDwgMCkgcmV0dXJuIG51bTtcbiAgICBpZiAobnVtICUgMSA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bTtcbiAgICB9IGVsc2UgaWYgKGRlYyA9PSAwKSB7XG4gICAgICByZXR1cm4gTWF0aC5yb3VuZChudW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcG93ID0gTWF0aC5wb3coMTAsIGRlYyk7XG4gICAgICByZXR1cm4gTWF0aC5yb3VuZChudW0gKiBwb3cpIC8gcG93O1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBTZWdtZW50IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy50ID0gXCJcIjsgLy8gcmVsYXRpdmVzIGFyZSBjYWxjdWxhdGUgdmlhIHB4IGFuZCBweVxuICAgIHRoaXMueCA9IHVuZGVmaW5lZDsgLy8gdGhpcyBpcyBnb29kIGZvciBvcHRpbWl6ZSwgYW5hbHlzZSwgcm90YXRlLCBldGNcbiAgICB0aGlzLnkgPSB1bmRlZmluZWQ7IC8vIGJhZCBmb3Igcm91bmQsIHNvIHJvdW5kIGxvZ2ljIHVwZGF0ZWRcbiAgICB0aGlzLnB4ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucHkgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy54MSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnkxID0gdW5kZWZpbmVkO1xuICAgIHRoaXMueDIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy55MiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnIxID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucjIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5hciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmFmID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuc2YgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5pbmZvID0gXCJcIjtcbiAgICB0aGlzLnZhbHVlID0gJyc7XG4gIH1cbn1cblxuLy8gZm9ybWF0IHRoZSBzZWdtZW50IGZvciBleHBvcnRcbi8vIGNoZWNrIGFic29sdXRlLXJlbGF0aXZlLCBhbmQgcm91bmQgZGVjaW1hbHNcblxuZnVuY3Rpb24gcm90YXRlUG9pbnQocHgsIHB5LCBveCwgb3ksIHNpbiwgY29zKSB7XG4gIHZhciB4ID0gY29zICogKHB4IC0gb3gpIC0gc2luICogKHB5IC0gb3kpICsgb3g7XG4gIHZhciB5ID0gc2luICogKHB4IC0gb3gpICsgY29zICogKHB5IC0gb3kpICsgb3k7XG4gIHJldHVybiBbeCwgeV07XG59XG5cbmZ1bmN0aW9uIGF0YW4zKHgsIHkpIHtcbiAgdmFyIHJlc3VsdCA9IE1hdGguYXRhbjIoeSwgeCk7XG4gIGlmIChyZXN1bHQgPCAwKSB7XG4gICAgcmVzdWx0ICs9IDIgKiBNYXRoLlBJO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgU1ZHUGF0aDsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHRpZihfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdKSB7XG5cdFx0cmV0dXJuIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0uZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGVcbl9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9jb2RlLnRzXCIpO1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgdXNlZCAnZXhwb3J0cycgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxuIl0sInNvdXJjZVJvb3QiOiIifQ==