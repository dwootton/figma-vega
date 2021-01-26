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
        // uses a fetch by id
        //@ts-ignore
        const annotationsLayer = figma.getNodeById(annotationsId);
        function ab2str(buf) {
            return String.fromCharCode.apply(null, new Uint16Array(buf));
        }
        // go through for each export get promises
        // once all promises have e
        const svgString = annotationsLayer.exportAsync({ format: "SVG" }).then((svgCode) => {
            const svg = ab2str(svgCode);
            console.log('dywootto svg', svg, svgCode);
            figma.ui.postMessage({
                svgString: svg,
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
export {};
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
