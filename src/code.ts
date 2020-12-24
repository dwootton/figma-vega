//@ts-ignore

import { SingleEntryPlugin } from "webpack";
import SVGPath from "./SVGPaths.js";

//import {SVGpath, SVGsegs} from './SVGPaths.js';
// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  //console.log(SVGpath, SVGsegs,new SVGsegs("M 0.5 -0.5 l 0 1 -1 0 0 -1 z"));

  console.log(SVGPath);

  if (msg.type === "create") {
    const nodes: SceneNode[] = [];
    console.log(msg);
    const rect = figma.createNodeFromSvg(msg.object);

    figma.createComponent();

    figma.currentPage.appendChild(rect);
    nodes.push(rect);

    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === "fetch") {
    // grab annnotations layer, 
    // grab plugin data for the width/height padding 
    const newSelection = [figma.flatten(figma.currentPage.selection)];
    console.log(newSelection);

    for (const sceneNode of newSelection) {
      if (sceneNode.type !== "VECTOR") {
        continue;
      }
      const newNode = sceneNode// as VectorNode;
      
      const rot = newNode.rotation;

      
      console.log('stroked',newNode.relativeTransform,newNode.absoluteTransform);
      const x = newNode.x;
      const y = newNode.y;

      const width = newNode.width;
      const height = newNode.height;
      console.log('new vals',x,y,width,height);
      const paths = newNode.vectorPaths.map((vector) => {
        console.log('vectodata',vector.data);
        return vector.data;
      });

      //const { pathTranslX, pathTranslY, scale } = getTranslationAndScaling(x, y, width, height);
      console.log(paths);

      const pathSegs = paths.map((pathString) => {
        const svgPath = new SVGPath();
        const fixedPath = pathString.replace(/[\d]+[.][\d]+([e][-][\d]+)/g, '0.0');
        console.log("imported", fixedPath);

        svgPath.importString(fixedPath);
        console.log("imported", svgPath);
        return svgPath;
      });

      const pathStrings = pathSegs.map((segCollection) => {
        const [minx, miny, maxx, maxy, svgWidth, svgHeight] = segCollection.calculateBounds();
        console.log("scaled", minx, miny, maxx, maxy, svgWidth, svgHeight);

        const maxDimension = Math.max(svgWidth, svgHeight);

        console.log(maxDimension);
        //segCollection.rotate(0, 0, -rot);
        segCollection.scale(2 / maxDimension);
        console.log(segCollection);
        segCollection.center(0, 0);
        console.log(segCollection);
        console.log(segCollection);
        return segCollection.export();
      });
     

      const maxDimension = Math.max(width, height);

      const pX = 15; // current Vega padding
      const pY = 5;

      // rotation throws it off!

      console.log("x", (1 / 2) * maxDimension, x, pX, 0, rot);
      console.log("y", (1 / 2) * maxDimension, y, pY, 0);

      const tX = (1 / 2) * width + x - pX //+ (maxDimension-height)/2; // total translate
      const tY = (1 / 2) * height + y - pY //+ (maxDimension-height)/2; // total translate

      const vectorScale = maxDimension * maxDimension;

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

      console.log(JSON.stringify(vals[0]).replace(/\\n/g, "").replace(/\\/g, ""));
    }
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  //figma.closePlugin();
};

function deg2Radian(deg){
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
    [ a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1], a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2] ],
    [ a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1] + 0, a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2] ]
  ]
}

// Creates a "move" transform.
function move(x, y) {
  return [
    [1, 0, x],
    [0, 1, y]
  ]
}

// Creates a "rotate" transform.
function rotate(theta) {
  return [
    [Math.cos(theta), Math.sin(theta), 0],
    [-Math.sin(theta), Math.cos(theta), 0]
  ]
}
function calculateXYFromNode(node){
  let locationRelativeToParentX = node.x;
  let locationRelativeToParentY = node.y;

  let x = node.width/2
  let y = node.width/2


  let rotationDeg = -node.rotation;
  let rotationRad = (Math.PI*rotationDeg)/180;

  let xTransform = x - x *Math.cos(rotationRad) + y*Math.sin(rotationRad);
  let yTransform = y - x *Math.sin(rotationRad) + y*Math.cos(rotationRad);

  let rotationTransform = [[Math.cos(rotationRad),-Math.sin(rotationRad),xTransform],[Math.sin(rotationRad),Math.cos(rotationRad), yTransform]];
  console.log(JSON.stringify(node.relativeTransform))

  node.relativeTransform = rotationTransform;

  console.log(JSON.stringify(node.relativeTransform))
  node.x += locationRelativeToParentX;
  node.y += locationRelativeToParentY;
  console.log(JSON.stringify(node.y),JSON.stringify(node.x))

}
/**
 * Function that calculates the correct XY position ignoring rotation
 * @param node
 */
function newCalculateRelative (originalNode) {

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

  console.log('from 360', JSON.stringify(transform));
  transform = multiply(rotate( 2*Math.PI - (node.rotation-Math.PI)/180), transform)
  console.log('from after rot', JSON.stringify(transform));

  transform = multiply(move(x,y), transform);

  console.log('from after move', JSON.stringify(transform));


  const difX = node.x;
  const difY = node.y;
  console.log('calced',difX,difY, x+difX,y+difY);
  console.log(JSON.stringify(node.relativeTransform));
  console.log(multiply(rotate( - node.rotation), transform));


  console.log('from 360', multiply(rotate( - (node.rotation-Math.PI)/180), node.relativeTransform));




  // rotate back
  const angleInRadians = deg2Radian(-node.rotation);
  console.log(node.relativeTransform)
  const netransform = multiply(rotate(angleInRadians), node.relativeTransform)
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
  const totalLengthOfHypo = Math.sqrt(node.width*node.width+node.height*node.height);
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
