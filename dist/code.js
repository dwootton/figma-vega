/******/ (() => { // webpackBootstrap
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
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
    if (msg.type === "create") {
        const nodes = [];
        console.log(msg);
        const rect = figma.createNodeFromSvg(msg.object);
        figma.createComponent();
        figma.currentPage.appendChild(rect);
        nodes.push(rect);
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
    }
    if (msg.type === "fetch") {
        for (const sceneNode of figma.currentPage.selection) {
            if (sceneNode.type !== "VECTOR") {
                continue;
            }
            const node = sceneNode;
            const paths = node.vectorPaths.map((vector) => {
                return vector.data;
            });
            const [x, y] = calculateXYFromNode(node);
            const width = node.width;
            const height = node.height;
            const { pathTranslX, pathTranslY, scale } = getTranslationAndScaling(x, y, width, height);
            console.log(paths);
            const newPaths = paths.map((path) => getTransformedPathDStr(path, pathTranslX, pathTranslY, scale));
            console.log(newPaths);
            //
            const scaledSVGPath = `{
        "type": "symbol",
        "interactive": false,
        "encode": {
          "enter": {
            "shape": {"value": ${"hi"}},
            "size":{"value":14752.881480552256},
            "fill":{"value":"black"}
          },
          "update": {
            "x": {"value": 66.346},
            "y": {"value": 70.73}
          }
        }
       }`;
        }
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    //figma.closePlugin();
};
/**
 * Function that calculates the correct XY position ignoring rotation
 * @param node
 */
function calculateXYFromNode(node) {
    const x = node.x;
    const y = node.y;
    const width = node.width;
    const height = node.height;
    console.log(x, y, width, height);
    const rot = (node.rotation * Math.PI) / 180; // in radians
    // note, to calculate distance from rotation, you must flip the sign  (1/2)H because in cartesian coordinates y DECREASES as you
    const realX = x + (1 / 2) * width * Math.cos(rot) - -1 * (1 / 2) * height * Math.sin(rot) - (1 / 2) * width;
    const realY = y + (1 / 2) * width * Math.sin(rot) - -1 * (1 / 2) * height * Math.cos(rot) - (1 / 2) * height;
    return [realX, realY];
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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92ZWdhLWZpLy4vc3JjL2NvZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixrQ0FBa0M7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCLFdBQVcsTUFBTTtBQUN2QyxvQkFBb0IsMkJBQTJCO0FBQy9DLG9CQUFvQjtBQUNwQixXQUFXO0FBQ1g7QUFDQSxrQkFBa0IsZ0JBQWdCO0FBQ2xDLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdEO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQiwyQkFBMkI7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQSwyQ0FBMkM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMENBQTBDO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVFQUF1RTtBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZGQUE2RjtBQUM3RjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsd0NBQXdDLFlBQVksSUFBSSxZQUFZLFdBQVcsTUFBTTs7QUFFckY7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EsZUFBZSxxQkFBcUIsVUFBVSxxQkFBcUI7QUFDbkU7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCLHlCQUF5Qjs7QUFFekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQ7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQSIsImZpbGUiOiJjb2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhpcyBwbHVnaW4gd2lsbCBvcGVuIGEgd2luZG93IHRvIHByb21wdCB0aGUgdXNlciB0byBlbnRlciBhIG51bWJlciwgYW5kXG4vLyBpdCB3aWxsIHRoZW4gY3JlYXRlIHRoYXQgbWFueSByZWN0YW5nbGVzIG9uIHRoZSBzY3JlZW4uXG4vLyBUaGlzIGZpbGUgaG9sZHMgdGhlIG1haW4gY29kZSBmb3IgdGhlIHBsdWdpbnMuIEl0IGhhcyBhY2Nlc3MgdG8gdGhlICpkb2N1bWVudCouXG4vLyBZb3UgY2FuIGFjY2VzcyBicm93c2VyIEFQSXMgaW4gdGhlIDxzY3JpcHQ+IHRhZyBpbnNpZGUgXCJ1aS5odG1sXCIgd2hpY2ggaGFzIGFcbi8vIGZ1bGwgYnJvd3NlciBlbnZpcm9ubWVudCAoc2VlIGRvY3VtZW50YXRpb24pLlxuLy8gVGhpcyBzaG93cyB0aGUgSFRNTCBwYWdlIGluIFwidWkuaHRtbFwiLlxuZmlnbWEuc2hvd1VJKF9faHRtbF9fKTtcbi8vIENhbGxzIHRvIFwicGFyZW50LnBvc3RNZXNzYWdlXCIgZnJvbSB3aXRoaW4gdGhlIEhUTUwgcGFnZSB3aWxsIHRyaWdnZXIgdGhpc1xuLy8gY2FsbGJhY2suIFRoZSBjYWxsYmFjayB3aWxsIGJlIHBhc3NlZCB0aGUgXCJwbHVnaW5NZXNzYWdlXCIgcHJvcGVydHkgb2YgdGhlXG4vLyBwb3N0ZWQgbWVzc2FnZS5cbmZpZ21hLnVpLm9ubWVzc2FnZSA9IChtc2cpID0+IHtcbiAgICAvLyBPbmUgd2F5IG9mIGRpc3Rpbmd1aXNoaW5nIGJldHdlZW4gZGlmZmVyZW50IHR5cGVzIG9mIG1lc3NhZ2VzIHNlbnQgZnJvbVxuICAgIC8vIHlvdXIgSFRNTCBwYWdlIGlzIHRvIHVzZSBhbiBvYmplY3Qgd2l0aCBhIFwidHlwZVwiIHByb3BlcnR5IGxpa2UgdGhpcy5cbiAgICBpZiAobXNnLnR5cGUgPT09IFwiY3JlYXRlXCIpIHtcbiAgICAgICAgY29uc3Qgbm9kZXMgPSBbXTtcbiAgICAgICAgY29uc29sZS5sb2cobXNnKTtcbiAgICAgICAgY29uc3QgcmVjdCA9IGZpZ21hLmNyZWF0ZU5vZGVGcm9tU3ZnKG1zZy5vYmplY3QpO1xuICAgICAgICBmaWdtYS5jcmVhdGVDb21wb25lbnQoKTtcbiAgICAgICAgZmlnbWEuY3VycmVudFBhZ2UuYXBwZW5kQ2hpbGQocmVjdCk7XG4gICAgICAgIG5vZGVzLnB1c2gocmVjdCk7XG4gICAgICAgIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IG5vZGVzO1xuICAgICAgICBmaWdtYS52aWV3cG9ydC5zY3JvbGxBbmRab29tSW50b1ZpZXcobm9kZXMpO1xuICAgIH1cbiAgICBpZiAobXNnLnR5cGUgPT09IFwiZmV0Y2hcIikge1xuICAgICAgICBmb3IgKGNvbnN0IHNjZW5lTm9kZSBvZiBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChzY2VuZU5vZGUudHlwZSAhPT0gXCJWRUNUT1JcIikge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lTm9kZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gbm9kZS52ZWN0b3JQYXRocy5tYXAoKHZlY3RvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB2ZWN0b3IuZGF0YTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgW3gsIHldID0gY2FsY3VsYXRlWFlGcm9tTm9kZShub2RlKTtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gbm9kZS53aWR0aDtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IG5vZGUuaGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgeyBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlIH0gPSBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwYXRocyk7XG4gICAgICAgICAgICBjb25zdCBuZXdQYXRocyA9IHBhdGhzLm1hcCgocGF0aCkgPT4gZ2V0VHJhbnNmb3JtZWRQYXRoRFN0cihwYXRoLCBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXdQYXRocyk7XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgY29uc3Qgc2NhbGVkU1ZHUGF0aCA9IGB7XG4gICAgICAgIFwidHlwZVwiOiBcInN5bWJvbFwiLFxuICAgICAgICBcImludGVyYWN0aXZlXCI6IGZhbHNlLFxuICAgICAgICBcImVuY29kZVwiOiB7XG4gICAgICAgICAgXCJlbnRlclwiOiB7XG4gICAgICAgICAgICBcInNoYXBlXCI6IHtcInZhbHVlXCI6ICR7XCJoaVwifX0sXG4gICAgICAgICAgICBcInNpemVcIjp7XCJ2YWx1ZVwiOjE0NzUyLjg4MTQ4MDU1MjI1Nn0sXG4gICAgICAgICAgICBcImZpbGxcIjp7XCJ2YWx1ZVwiOlwiYmxhY2tcIn1cbiAgICAgICAgICB9LFxuICAgICAgICAgIFwidXBkYXRlXCI6IHtcbiAgICAgICAgICAgIFwieFwiOiB7XCJ2YWx1ZVwiOiA2Ni4zNDZ9LFxuICAgICAgICAgICAgXCJ5XCI6IHtcInZhbHVlXCI6IDcwLjczfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgIH1gO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIE1ha2Ugc3VyZSB0byBjbG9zZSB0aGUgcGx1Z2luIHdoZW4geW91J3JlIGRvbmUuIE90aGVyd2lzZSB0aGUgcGx1Z2luIHdpbGxcbiAgICAvLyBrZWVwIHJ1bm5pbmcsIHdoaWNoIHNob3dzIHRoZSBjYW5jZWwgYnV0dG9uIGF0IHRoZSBib3R0b20gb2YgdGhlIHNjcmVlbi5cbiAgICAvL2ZpZ21hLmNsb3NlUGx1Z2luKCk7XG59O1xuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IGNhbGN1bGF0ZXMgdGhlIGNvcnJlY3QgWFkgcG9zaXRpb24gaWdub3Jpbmcgcm90YXRpb25cbiAqIEBwYXJhbSBub2RlXG4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZVhZRnJvbU5vZGUobm9kZSkge1xuICAgIGNvbnN0IHggPSBub2RlLng7XG4gICAgY29uc3QgeSA9IG5vZGUueTtcbiAgICBjb25zdCB3aWR0aCA9IG5vZGUud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gbm9kZS5oZWlnaHQ7XG4gICAgY29uc29sZS5sb2coeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgY29uc3Qgcm90ID0gKG5vZGUucm90YXRpb24gKiBNYXRoLlBJKSAvIDE4MDsgLy8gaW4gcmFkaWFuc1xuICAgIC8vIG5vdGUsIHRvIGNhbGN1bGF0ZSBkaXN0YW5jZSBmcm9tIHJvdGF0aW9uLCB5b3UgbXVzdCBmbGlwIHRoZSBzaWduICAoMS8yKUggYmVjYXVzZSBpbiBjYXJ0ZXNpYW4gY29vcmRpbmF0ZXMgeSBERUNSRUFTRVMgYXMgeW91XG4gICAgY29uc3QgcmVhbFggPSB4ICsgKDEgLyAyKSAqIHdpZHRoICogTWF0aC5jb3Mocm90KSAtIC0xICogKDEgLyAyKSAqIGhlaWdodCAqIE1hdGguc2luKHJvdCkgLSAoMSAvIDIpICogd2lkdGg7XG4gICAgY29uc3QgcmVhbFkgPSB5ICsgKDEgLyAyKSAqIHdpZHRoICogTWF0aC5zaW4ocm90KSAtIC0xICogKDEgLyAyKSAqIGhlaWdodCAqIE1hdGguY29zKHJvdCkgLSAoMSAvIDIpICogaGVpZ2h0O1xuICAgIHJldHVybiBbcmVhbFgsIHJlYWxZXTtcbn1cbi8vIENhbGN1bGF0ZSB0aGUgdHJhbnNmb3JtYXRpb24sIGkuZS4gdGhlIHRyYW5zbGF0aW9uIGFuZCBzY2FsaW5nLCByZXF1aXJlZFxuLy8gdG8gZ2V0IHRoZSBwYXRoIHRvIGZpbGwgdGhlIHN2ZyBhcmVhLiBOb3RlIHRoYXQgdGhpcyBhc3N1bWVzIHVuaWZvcm1cbi8vIHNjYWxpbmcsIGEgcGF0aCB0aGF0IGhhcyBubyBvdGhlciB0cmFuc2Zvcm1zIGFwcGxpZWQgdG8gaXQsIGFuZCBub1xuLy8gZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgc3ZnIHZpZXdwb3J0IGFuZCB2aWV3Qm94IGRpbWVuc2lvbnMuXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBzdmdXZHRoID0gMjtcbiAgICB2YXIgc3ZnSGdodCA9IDI7XG4gICAgdmFyIG9yaWdQYXRoSGdodCA9IGhlaWdodDtcbiAgICB2YXIgb3JpZ1BhdGhXZHRoID0gd2lkdGg7XG4gICAgdmFyIG9yaWdQYXRoWSA9IHk7XG4gICAgdmFyIG9yaWdQYXRoWCA9IHg7XG4gICAgLy8gaG93IG11Y2ggYmlnZ2VyIGlzIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gICAgLy8gcmVsYXRpdmUgdG8gdGhlIHBhdGggaW4gZWFjaCBkaW1lbnNpb24/XG4gICAgdmFyIHNjYWxlQmFzZWRPbldkdGggPSBzdmdXZHRoIC8gb3JpZ1BhdGhXZHRoO1xuICAgIHZhciBzY2FsZUJhc2VkT25IZ2h0ID0gc3ZnSGdodCAvIG9yaWdQYXRoSGdodDtcbiAgICAvLyBvZiB0aGUgc2NhbGluZyBmYWN0b3JzIGRldGVybWluZWQgaW4gZWFjaCBkaW1lbnNpb24sXG4gICAgLy8gdXNlIHRoZSBzbWFsbGVyIG9uZTsgb3RoZXJ3aXNlIHBvcnRpb25zIG9mIHRoZSBwYXRoXG4gICAgLy8gd2lsbCBsaWUgb3V0c2lkZSB0aGUgdmlld3BvcnQgKGNvcnJlY3QgdGVybT8pXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oc2NhbGVCYXNlZE9uV2R0aCwgc2NhbGVCYXNlZE9uSGdodCk7XG4gICAgLy8gY2FsY3VsYXRlIHRoZSBib3VuZGluZyBib3ggcGFyYW1ldGVyc1xuICAgIC8vIGFmdGVyIHRoZSBwYXRoIGhhcyBiZWVuIHNjYWxlZCByZWxhdGl2ZSB0byB0aGUgb3JpZ2luXG4gICAgLy8gYnV0IGJlZm9yZSBhbnkgc3Vic2VxdWVudCB0cmFuc2xhdGlvbnMgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICB2YXIgc2NhbGVkUGF0aFggPSBvcmlnUGF0aFggKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aFkgPSBvcmlnUGF0aFkgKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aFdkdGggPSBvcmlnUGF0aFdkdGggKiBzY2FsZTtcbiAgICB2YXIgc2NhbGVkUGF0aEhnaHQgPSBvcmlnUGF0aEhnaHQgKiBzY2FsZTtcbiAgICAvLyBjYWxjdWxhdGUgdGhlIGNlbnRyZSBwb2ludHMgb2YgdGhlIHNjYWxlZCBidXQgdW50cmFuc2xhdGVkIHBhdGhcbiAgICAvLyBhcyB3ZWxsIGFzIG9mIHRoZSBzdmcgcm9vdCBlbGVtZW50XG4gICAgdmFyIHNjYWxlZFBhdGhDZW50cmVYID0gc2NhbGVkUGF0aFggKyBzY2FsZWRQYXRoV2R0aCAvIDI7XG4gICAgdmFyIHNjYWxlZFBhdGhDZW50cmVZID0gc2NhbGVkUGF0aFkgKyBzY2FsZWRQYXRoSGdodCAvIDI7XG4gICAgdmFyIHN2Z1Jvb3RDZW50cmVYID0gMDsgLy8gLXN2Z1dkdGggLyAyO1xuICAgIHZhciBzdmdSb290Q2VudHJlWSA9IDA7IC8vLXN2Z0hnaHQgLyAyO1xuICAgIC8vIGNhbGN1bGF0ZSB0cmFuc2xhdGlvbiByZXF1aXJlZCB0byBjZW50cmUgdGhlIHBhdGhcbiAgICAvLyBvbiB0aGUgc3ZnIHJvb3QgZWxlbWVudFxuICAgIHZhciBwYXRoVHJhbnNsWCA9IHN2Z1Jvb3RDZW50cmVYIC0gc2NhbGVkUGF0aENlbnRyZVg7XG4gICAgdmFyIHBhdGhUcmFuc2xZID0gc3ZnUm9vdENlbnRyZVkgLSBzY2FsZWRQYXRoQ2VudHJlWTtcbiAgICBjb25zb2xlLmxvZyhcInNjYWxlZCBwYXRoIHhcIiwgc2NhbGVkUGF0aFgsIHNjYWxlZFBhdGhXZHRoLCBcInNjYWxlZCBwYXRoIHlcIiwgc2NhbGVkUGF0aFksIHNjYWxlZFBhdGhIZ2h0LCBcImZhY3RvciBmcm9tIHNjYWxlXCIsIChvcmlnUGF0aEhnaHQgLSBvcmlnUGF0aFdkdGgpIC8gMiwgXCJ4ZmFjdG9yIGZyb20gZ1wiKTtcbiAgICBjb25zb2xlLmxvZyhwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKTtcbiAgICByZXR1cm4geyBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlIH07XG59XG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1lZFBhdGhEU3RyKG9sZFBhdGhEU3RyLCBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKSB7XG4gICAgLy8gY29uc3RhbnRzIHRvIGhlbHAga2VlcCB0cmFjayBvZiB0aGUgdHlwZXMgb2YgU1ZHIGNvbW1hbmRzIGluIHRoZSBwYXRoXG4gICAgdmFyIEJPVEhfWF9BTkRfWSA9IDE7XG4gICAgdmFyIEpVU1RfWCA9IDI7XG4gICAgdmFyIEpVU1RfWSA9IDM7XG4gICAgdmFyIE5PTkUgPSA0O1xuICAgIHZhciBFTExJUFRJQ0FMX0FSQyA9IDU7XG4gICAgdmFyIEFCU09MVVRFID0gNjtcbiAgICB2YXIgUkVMQVRJVkUgPSA3O1xuICAgIC8vIHR3byBwYXJhbGxlbCBhcnJheXMsIHdpdGggZWFjaCBlbGVtZW50IGJlaW5nIG9uZSBjb21wb25lbnQgb2YgdGhlXG4gICAgLy8gXCJkXCIgYXR0cmlidXRlIG9mIHRoZSBTVkcgcGF0aCwgd2l0aCBvbmUgY29tcG9uZW50IGJlaW5nIGVpdGhlclxuICAgIC8vIGFuIGluc3RydWN0aW9uIChlLmcuIFwiTVwiIGZvciBtb3ZldG8sIGV0Yy4pIG9yIG51bWVyaWNhbCB2YWx1ZVxuICAgIC8vIGZvciBlaXRoZXIgYW4geCBvciB5IGNvb3JkaW5hdGVcbiAgICB2YXIgb2xkUGF0aERBcnIgPSBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKG9sZFBhdGhEU3RyKTtcbiAgICB2YXIgbmV3UGF0aERBcnIgPSBbXTtcbiAgICB2YXIgY29tbWFuZFBhcmFtcywgYWJzT3JSZWwsIG9sZFBhdGhEQ29tcCwgbmV3UGF0aERDb21wO1xuICAgIC8vIGVsZW1lbnQgaW5kZXhcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB3aGlsZSAoaWR4IDwgb2xkUGF0aERBcnIubGVuZ3RoKSB7XG4gICAgICAgIHZhciBvbGRQYXRoRENvbXAgPSBvbGRQYXRoREFycltpZHhdO1xuICAgICAgICBpZiAoL15bQS1aYS16XSQvLnRlc3Qob2xkUGF0aERDb21wKSkge1xuICAgICAgICAgICAgLy8gY29tcG9uZW50IGlzIGEgc2luZ2xlIGxldHRlciwgaS5lLiBhbiBzdmcgcGF0aCBjb21tYW5kXG4gICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICAgICAgICAgIHN3aXRjaCAob2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVwiOiAvLyBlbGxpcHRpY2FsIGFyYyBjb21tYW5kLi4udGhlIG1vc3QgY29tcGxpY2F0ZWQgb25lXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBFTExJUFRJQ0FMX0FSQztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkhcIjogLy8gaG9yaXpvbnRhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGFuIHgtY29vcmRpbmF0ZVxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9YO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOiAvLyB2ZXJ0aWNhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGEgeS1jb29yZGluYXRlXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBKVVNUX1k7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJaXCI6IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBOT05FO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBhbGwgb3RoZXIgY29tbWFuZHM7IGFsbCBvZiB0aGVtIHJlcXVpcmUgYm90aCB4IGFuZCB5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBCT1RIX1hfQU5EX1k7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhYnNPclJlbCA9IG9sZFBhdGhEQ29tcCA9PT0gb2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkgPyBBQlNPTFVURSA6IFJFTEFUSVZFO1xuICAgICAgICAgICAgLy8gbG93ZXJjYXNlIGNvbW1hbmRzIGFyZSByZWxhdGl2ZSwgdXBwZXJjYXNlIGFyZSBhYnNvbHV0ZVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgY29tcG9uZW50IGlzIG5vdCBhIGxldHRlciwgdGhlbiBpdCBpcyBhIG51bWVyaWMgdmFsdWVcbiAgICAgICAgICAgIHZhciB0cmFuc2xYLCB0cmFuc2xZO1xuICAgICAgICAgICAgaWYgKGFic09yUmVsID09PSBBQlNPTFVURSkge1xuICAgICAgICAgICAgICAgIC8vIHRoZSB0cmFuc2xhdGlvbiBpcyByZXF1aXJlZCBmb3IgYWJzb2x1dGUgY29tbWFuZHMuLi5cbiAgICAgICAgICAgICAgICB0cmFuc2xYID0gcGF0aFRyYW5zbFg7XG4gICAgICAgICAgICAgICAgdHJhbnNsWSA9IHBhdGhUcmFuc2xZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYWJzT3JSZWwgPT09IFJFTEFUSVZFKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uYnV0IG5vdCByZWxhdGl2ZSBvbmVzXG4gICAgICAgICAgICAgICAgdHJhbnNsWCA9IDA7XG4gICAgICAgICAgICAgICAgdHJhbnNsWSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGNvbW1hbmRQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAvLyBmaWd1cmUgb3V0IHdoaWNoIG9mIHRoZSBudW1lcmljIHZhbHVlcyBmb2xsb3dpbmcgYW4gc3ZnIGNvbW1hbmRcbiAgICAgICAgICAgICAgICAvLyBhcmUgcmVxdWlyZWQsIGFuZCB0aGVuIHRyYW5zZm9ybSB0aGUgbnVtZXJpYyB2YWx1ZShzKSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIHBhdGggZC1hdHRyaWJ1dGUgYW5kIHBsYWNlIGl0IGluIHRoZSBzYW1lIGxvY2F0aW9uIGluIHRoZVxuICAgICAgICAgICAgICAgIC8vIGFycmF5IHRoYXQgd2lsbCBldmVudHVhbGx5IGJlY29tZSB0aGUgZC1hdHRyaWJ1dGUgZm9yIHRoZSBuZXcgcGF0aFxuICAgICAgICAgICAgICAgIGNhc2UgQk9USF9YX0FORF9ZOlxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgICAgICAgICAgIGlkeCArPSAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEpVU1RfWDpcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgSlVTVF9ZOlxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBFTExJUFRJQ0FMX0FSQzpcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGVsbGlwdGljYWwgYXJjIGhhcyB4IGFuZCB5IHZhbHVlcyBpbiB0aGUgZmlyc3QgYW5kIHNlY29uZCBhcyB3ZWxsIGFzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSA2dGggYW5kIDd0aCBwb3NpdGlvbnMgZm9sbG93aW5nIHRoZSBjb21tYW5kOyB0aGUgaW50ZXJ2ZW5pbmcgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIC8vIGFyZSBub3QgYWZmZWN0ZWQgYnkgdGhlIHRyYW5zZm9ybWF0aW9uIGFuZCBzbyBjYW4gc2ltcGx5IGJlIGNvcGllZFxuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAxXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAxXSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDJdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDJdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgM10gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgM10pO1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA0XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA0XSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDVdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDVdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICAgICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNl0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNl0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgICAgICAgICAgICBpZHggKz0gNztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBOT05FOlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJudW1lcmljIHZhbHVlIHNob3VsZCBub3QgZm9sbG93IHRoZSBTVkcgWi96IGNvbW1hbmRcIik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXdQYXRoREFyci5qb2luKFwiIFwiKTtcbn1cbmZ1bmN0aW9uIGdldEFycmF5T2ZQYXRoRENvbXBvbmVudHMoc3RyKSB7XG4gICAgLy8gYXNzdW1pbmcgdGhlIHN0cmluZyBmcm9tIHRoZSBkLWF0dHJpYnV0ZSBvZiB0aGUgcGF0aCBoYXMgYWxsIGNvbXBvbmVudHNcbiAgICAvLyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UsIHRoZW4gY3JlYXRlIGFuIGFycmF5IG9mIGNvbXBvbmVudHMgYnlcbiAgICAvLyBzaW1wbHkgc3BsaXR0aW5nIHRoZSBzdHJpbmcgYXQgdGhvc2Ugc3BhY2VzXG4gICAgc3RyID0gc3RhbmRhcmRpemVQYXRoRFN0ckZvcm1hdChzdHIpO1xuICAgIHJldHVybiBzdHIuc3BsaXQoXCIgXCIpO1xufVxuZnVuY3Rpb24gc3RhbmRhcmRpemVQYXRoRFN0ckZvcm1hdChzdHIpIHtcbiAgICAvLyBUaGUgU1ZHIHN0YW5kYXJkIGlzIGZsZXhpYmxlIHdpdGggcmVzcGVjdCB0byBob3cgcGF0aCBkLXN0cmluZ3MgYXJlXG4gICAgLy8gZm9ybWF0dGVkIGJ1dCB0aGlzIG1ha2VzIHBhcnNpbmcgdGhlbSBtb3JlIGRpZmZpY3VsdC4gVGhpcyBmdW5jdGlvbiBlbnN1cmVzXG4gICAgLy8gdGhhdCBhbGwgU1ZHIHBhdGggZC1zdHJpbmcgY29tcG9uZW50cyAoaS5lLiBib3RoIGNvbW1hbmRzIGFuZCB2YWx1ZXMpIGFyZVxuICAgIC8vIHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzcGFjZS5cbiAgICByZXR1cm4gc3RyXG4gICAgICAgIC5yZXBsYWNlKC8sL2csIFwiIFwiKSAvLyByZXBsYWNlIGVhY2ggY29tbWEgd2l0aCBhIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8tL2csIFwiIC1cIikgLy8gcHJlY2VkZSBlYWNoIG1pbnVzIHNpZ24gd2l0aCBhIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC8oW0EtWmEtel0pL2csIFwiICQxIFwiKSAvLyBzYW5kd2ljaCBlYWNoICAgbGV0dGVyIGJldHdlZW4gMiBzcGFjZXNcbiAgICAgICAgLnJlcGxhY2UoLyAgL2csIFwiIFwiKSAvLyBjb2xsYXBzZSByZXBlYXRlZCBzcGFjZXMgdG8gYSBzaW5nbGUgc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoLyAoW0VlXSkgL2csIFwiJDFcIikgLy8gcmVtb3ZlIGZsYW5raW5nIHNwYWNlcyBhcm91bmQgZXhwb25lbnQgc3ltYm9sc1xuICAgICAgICAucmVwbGFjZSgvXiAvZywgXCJcIikgLy8gdHJpbSBhbnkgbGVhZGluZyBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvICQvZywgXCJcIik7IC8vIHRyaW0gYW55IHRhaWxpbmcgc3BhY2Vcbn1cbmZpZ21hLnVpLnJlc2l6ZSg1MDAsIDc1MCk7XG4vLyBVc2luZyByZWxhdGl2ZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggKGdpdmVzIHNrZXdlZCB4IHZhbHVlIGZvciBub24tcm90YXRlZClcbi8vY29uc29sZS5sb2coJ3JlbHgnLHJlbFswXVsyXSArICgxLzIpKndpZHRoKnJlbFswXVswXSAtKC0xKSooMS8yKSpoZWlnaHQqcmVsWzBdWzBdIC0gKDEvMikqd2lkdGgpO1xuLy9jb25zb2xlLmxvZygncmVseScscmVsWzFdWzJdICArKDEvMikqd2lkdGgqcmVsWzFdWzBdLSAoLTEpKigxLzIpKmhlaWdodCpyZWxbMV1bMV0gLSAoMS8yKSpoZWlnaHQpO1xuLypcbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXBwXCIpLmlubmVySFRNTCA9IGBcbjxzdmcgIGlkPVwiYmFzZVwiIHdpZHRoPVwiODAwXCIgaGVpZ2h0PVwiNjAwXCIgdmlld0JveD1cIjAgMCA4MDAgNjAwXCIgc3R5bGU9XCJib3JkZXI6IDFweCBzb2xpZCBibHVlO1wiPlxuICAgIDxwYXRoIGlkPVwibm90bW92ZWRcIiBmaWxsPVwiI2YwMFwiIHN0cm9rZT1cIm5vbmVcIiBkPVwiTTEyMi43NjkgNDguNDkxNEMxMjcuMDM4IDQ2LjExNzkgMTI5Ljk4MyA0My4zNzI0IDEzMS4yNzQgNDAuMjE2OEMxMzYuNjE0IDI3LjE2ODUgMTMzLjQ3MiAxNy4zNjA0IDEyOS4wMTQgMTAuODAwN0MxMjYuNzc5IDcuNTExNTQgMTI0LjIwOCA1LjAzMzcyIDEyMi4xOTUgMy4zNzc4OUMxMjEuMTg4IDIuNTUwNSAxMjAuMzIzIDEuOTI5ODUgMTE5LjcxMSAxLjUxNzE1QzExOS40MDUgMS4zMTA4NCAxMTkuMTYzIDEuMTU2NjIgMTE4Ljk5OCAxLjA1NDYxQzExOC45MTYgMS4wMDM2MiAxMTguODUzIDAuOTY1Njg5IDExOC44MTEgMC45NDA4NDVMMTE4Ljc2NSAwLjkxMzM5MkwxMTguNzU0IDAuOTA3MDMzTDExOC43NTEgMC45MDU2OThDMTE4Ljc1MSAwLjkwNTcyNCAxMTguNzUxIDAuOTA1NTkgMTE5IDAuNDcxNjE4QzExOS4yNDggMC4wMzc2NDY2IDExOS4yNDggMC4wMzc4MjQzIDExOS4yNDkgMC4wMzgwNTRMMTE5LjI1NCAwLjA0MTEzODVMMTE5LjI2OSAwLjA0OTU4OTFDMTE5LjI4MSAwLjA1Njg3NjIgMTE5LjI5OSAwLjA2NzQ3MDEgMTE5LjMyMiAwLjA4MTM2NjdDMTE5LjM2OSAwLjEwOTE1NyAxMTkuNDM3IDAuMTUwMTY4IDExOS41MjUgMC4yMDQzODZDMTE5LjcgMC4zMTI4MTEgMTE5Ljk1MyAwLjQ3NDA5NiAxMjAuMjcgMC42ODgxMzRDMTIwLjkwNSAxLjExNjEzIDEyMS43OTYgMS43NTU1MiAxMjIuODMgMi42MDU0OUMxMjQuODk2IDQuMzA0MzggMTI3LjUzOSA2Ljg1MDU5IDEyOS44NDEgMTAuMjM4N0MxMzQuNDU5IDE3LjAzMzQgMTM3LjY4NSAyNy4xOTI2IDEzMi4yIDQwLjU5NTVDMTMwLjc4NSA0NC4wNTI2IDEyNy42MTUgNDYuOTQxNiAxMjMuMjU1IDQ5LjM2NTRDMTE4Ljg4OCA1MS43OTMxIDExMy4yNyA1My43ODYxIDEwNi44NjcgNTUuNDIzN0M5NC4wNTg0IDU4LjY5OTMgNzguMDE4OCA2MC41NzQ0IDYyLjM0MjUgNjEuNjIxMkM0Ni42NjEzIDYyLjY2ODIgMzEuMzIxNCA2Mi44ODc4IDE5LjkwMzUgNjIuODQ1N0MxNC4xOTQgNjIuODI0NiA5LjQ2NDE4IDYyLjczODEgNi4xNjEyMSA2Mi42NTY5QzQuNTA5NzEgNjIuNjE2MyAzLjIxNDg5IDYyLjU3NyAyLjMzMjY3IDYyLjU0NzhDMi4yODA1MSA2Mi41NDYxIDIuMjI5NzkgNjIuNTQ0NCAyLjE4MDUyIDYyLjU0MjhMNC40MTgwNCA2NC45NjkyQzQuNjA1MjQgNjUuMTcyMiA0LjU5MjQzIDY1LjQ4ODYgNC4zODk0MyA2NS42NzU4QzQuMTg2NDIgNjUuODYzIDMuODcwMDkgNjUuODUwMSAzLjY4Mjg5IDY1LjY0NzFMMC42MzIzMTIgNjIuMzM5QzAuNDQ1MTE1IDYyLjEzNiAwLjQ1NzkyMyA2MS44MTk2IDAuNjYwOTI3IDYxLjYzMjRMMy45NjkwOCA1OC41ODE5QzQuMTcyMDggNTguMzk0NyA0LjQ4ODQyIDU4LjQwNzUgNC42NzU2MSA1OC42MTA1QzQuODYyODEgNTguODEzNSA0Ljg1IDU5LjEyOTggNC42NDcgNTkuMzE3TDIuMjMyMDQgNjEuNTQzOUMyLjI3NTQ3IDYxLjU0NTQgMi4zMjAwNCA2MS41NDY5IDIuMzY1NzEgNjEuNTQ4NEMzLjI0NTMxIDYxLjU3NzUgNC41MzczIDYxLjYxNjcgNi4xODU4IDYxLjY1NzJDOS40ODI4NCA2MS43MzgzIDE0LjIwNTcgNjEuODI0NyAxOS45MDcyIDYxLjg0NTdDMzEuMzExMSA2MS44ODc3IDQ2LjYyNTkgNjEuNjY4NCA2Mi4yNzU5IDYwLjYyMzRDNzcuOTMwNyA1OS41NzgxIDkzLjg5OSA1Ny43MDc5IDEwNi42MTkgNTQuNDU0OUMxMTIuOTggNTIuODI4MSAxMTguNTA2IDUwLjg2MSAxMjIuNzY5IDQ4LjQ5MTRaXCIgb3BhY2l0eT1cIjAuNVwiIC8+XG48L3N2Zz5cbmA7XG5cbi8vTSAwLjg5NDg3OTg0MjIzMjUwMzQgLTAuMjI5NDc3NzY1NDY2MzI1MTUgTCAtMC45MTEzNDYwNDYyOTAwNTY4IC0wLjk4NDgwODYyMTUxNDI4ODUgTCAtMC45MDQ5OTMyOTEwMDgwNjY3IC0wLjk5OTk5OTk5OTk5OTk5OTkgTCAwLjkxMTM0NjAzMzIyNDg0MTYgLTAuMjQwNDQwOTU1NDI5MDIzODggViAxLjAwMDAwMDAyNDEyMDM5NjggSCAwLjg5NDg3OTg0MjIzMjUwMzQgViAtMC4yMjk0Nzc3NjU0NjYzMjUxNSBaXG4vLyBSZXRyaWV2ZSB0aGUgXCJkXCIgYXR0cmlidXRlIG9mIHRoZSBTVkcgcGF0aCB5b3Ugd2lzaCB0byB0cmFuc2Zvcm0uXG52YXIgc3ZnUm9vdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFzZVwiKTtcbnZhciBwYXRoID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJub3Rtb3ZlZFwiKTtcbnZhciBvbGRQYXRoRFN0ciA9IHBhdGguZ2V0QXR0cmlidXRlKFwiZFwiKTtcblxuLy8gQ2FsY3VsYXRlIHRoZSB0cmFuc2Zvcm1hdGlvbiByZXF1aXJlZC5cbnZhciBvYmogPSBnZXRUcmFuc2xhdGlvbkFuZFNjYWxpbmcoc3ZnUm9vdCwgcGF0aCk7XG52YXIgcGF0aFRyYW5zbFggPSBvYmoucGF0aFRyYW5zbFg7XG52YXIgcGF0aFRyYW5zbFkgPSBvYmoucGF0aFRyYW5zbFk7XG52YXIgc2NhbGUgPSBvYmouc2NhbGU7XG5cbi8vIFRoZSBwYXRoIGNvdWxkIGJlIHRyYW5zZm9ybWVkIGF0IHRoaXMgcG9pbnQgd2l0aCBhIHNpbXBsZVxuLy8gXCJ0cmFuc2Zvcm1cIiBhdHRyaWJ1dGUgYXMgc2hvd24gaGVyZS5cblxuLy8gJHBhdGguYXR0cihcInRyYW5zZm9ybVwiLCBgdHJhbnNsYXRlKCR7cGF0aFRyYW5zbFh9LCAke3BhdGhUcmFuc2xZfSksIHNjYWxlKCR7c2NhbGV9KWApO1xuXG4vLyBIb3dldmVyLCBhcyBkZXNjcmliZWQgaW4geW91ciBxdWVzdGlvbiB5b3UgZGlkbid0IHdhbnQgdGhpcy5cbi8vIFRoZXJlZm9yZSwgdGhlIGNvZGUgZm9sbG93aW5nIHRoaXMgbGluZSBtdXRhdGVzIHRoZSBhY3R1YWwgc3ZnIHBhdGguXG5cbi8vIENhbGN1bGF0ZSB0aGUgcGF0aCBcImRcIiBhdHRyaWJ1dGVzIHBhcmFtZXRlcnMuXG52YXIgbmV3UGF0aERTdHIgPSBnZXRUcmFuc2Zvcm1lZFBhdGhEU3RyKFxuICBvbGRQYXRoRFN0cixcbiAgcGF0aFRyYW5zbFgsXG4gIHBhdGhUcmFuc2xZLFxuICBzY2FsZVxuKTtcblxuLy8gQXBwbHkgdGhlIG5ldyBcImRcIiBhdHRyaWJ1dGUgdG8gdGhlIHBhdGgsIHRyYW5zZm9ybWluZyBpdC5cblxuZG9jdW1lbnQud3JpdGUoXG4gIFwiPHA+QWx0ZXJlZCAnZCcgYXR0cmlidXRlIG9mIHBhdGg6PC9wPjxwPlwiICsgbmV3UGF0aERTdHIgKyBcIjwvcD5cIlxuKTtcblxuLy8gVGhpcyBpcyB0aGUgZW5kIG9mIHRoZSBtYWluIGNvZGUuIEJlbG93IGFyZSB0aGUgZnVuY3Rpb25zIGNhbGxlZC5cblxuLy8gQ2FsY3VsYXRlIHRoZSB0cmFuc2Zvcm1hdGlvbiwgaS5lLiB0aGUgdHJhbnNsYXRpb24gYW5kIHNjYWxpbmcsIHJlcXVpcmVkXG4vLyB0byBnZXQgdGhlIHBhdGggdG8gZmlsbCB0aGUgc3ZnIGFyZWEuIE5vdGUgdGhhdCB0aGlzIGFzc3VtZXMgdW5pZm9ybVxuLy8gc2NhbGluZywgYSBwYXRoIHRoYXQgaGFzIG5vIG90aGVyIHRyYW5zZm9ybXMgYXBwbGllZCB0byBpdCwgYW5kIG5vXG4vLyBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBzdmcgdmlld3BvcnQgYW5kIHZpZXdCb3ggZGltZW5zaW9ucy5cbmZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uQW5kU2NhbGluZyhzdmcsIHBhdGgpIHtcbiAgdmFyIHN2Z1dkdGggPSAyO1xuICB2YXIgc3ZnSGdodCA9IDI7XG5cbiAgdmFyIG9yaWdQYXRoQm91bmRpbmdCb3ggPSBwYXRoLmdldEJCb3goKTtcblxuICB2YXIgb3JpZ1BhdGhIZ2h0ID0gb3JpZ1BhdGhCb3VuZGluZ0JveC5oZWlnaHQ7XG4gIHZhciBvcmlnUGF0aFdkdGggPSBvcmlnUGF0aEJvdW5kaW5nQm94LndpZHRoO1xuXG4gIHZhciBvcmlnUGF0aFkgPSBvcmlnUGF0aEJvdW5kaW5nQm94Lnk7XG4gIHZhciBvcmlnUGF0aFggPSBvcmlnUGF0aEJvdW5kaW5nQm94Lng7XG5cbiAgY29uc29sZS5sb2cob3JpZ1BhdGhXZHRoLCBvcmlnUGF0aEhnaHQsIG9yaWdQYXRoV2R0aCwgb3JpZ1BhdGhYLCBvcmlnUGF0aFkpO1xuICAvLyBob3cgbXVjaCBiaWdnZXIgaXMgdGhlIHN2ZyByb290IGVsZW1lbnRcbiAgLy8gcmVsYXRpdmUgdG8gdGhlIHBhdGggaW4gZWFjaCBkaW1lbnNpb24/XG4gIHZhciBzY2FsZUJhc2VkT25XZHRoID0gc3ZnV2R0aCAvIG9yaWdQYXRoV2R0aDtcbiAgdmFyIHNjYWxlQmFzZWRPbkhnaHQgPSBzdmdIZ2h0IC8gb3JpZ1BhdGhIZ2h0O1xuXG4gIC8vIG9mIHRoZSBzY2FsaW5nIGZhY3RvcnMgZGV0ZXJtaW5lZCBpbiBlYWNoIGRpbWVuc2lvbixcbiAgLy8gdXNlIHRoZSBzbWFsbGVyIG9uZTsgb3RoZXJ3aXNlIHBvcnRpb25zIG9mIHRoZSBwYXRoXG4gIC8vIHdpbGwgbGllIG91dHNpZGUgdGhlIHZpZXdwb3J0IChjb3JyZWN0IHRlcm0/KVxuICB2YXIgc2NhbGUgPSBNYXRoLm1pbihzY2FsZUJhc2VkT25XZHRoLCBzY2FsZUJhc2VkT25IZ2h0KTtcbiAgYWxlcnQoXG4gICAgYGhlaWdodDogJHsxIC8gc2NhbGVCYXNlZE9uSGdodH0gd2lkdGg6ICR7MSAvIHNjYWxlQmFzZWRPbldkdGh9LCAke1xuICAgICAgb3JpZ1BhdGhXZHRoICogb3JpZ1BhdGhIZ2h0XG4gICAgfWBcbiAgKTtcbiAgLy8gY2FsY3VsYXRlIHRoZSBib3VuZGluZyBib3ggcGFyYW1ldGVyc1xuICAvLyBhZnRlciB0aGUgcGF0aCBoYXMgYmVlbiBzY2FsZWQgcmVsYXRpdmUgdG8gdGhlIG9yaWdpblxuICAvLyBidXQgYmVmb3JlIGFueSBzdWJzZXF1ZW50IHRyYW5zbGF0aW9ucyBoYXZlIGJlZW4gYXBwbGllZFxuXG4gIHZhciBzY2FsZWRQYXRoWCA9IG9yaWdQYXRoWCAqIHNjYWxlO1xuICB2YXIgc2NhbGVkUGF0aFkgPSBvcmlnUGF0aFkgKiBzY2FsZTtcbiAgdmFyIHNjYWxlZFBhdGhXZHRoID0gb3JpZ1BhdGhXZHRoICogc2NhbGU7XG4gIHZhciBzY2FsZWRQYXRoSGdodCA9IG9yaWdQYXRoSGdodCAqIHNjYWxlO1xuXG4gIC8vIGNhbGN1bGF0ZSB0aGUgY2VudHJlIHBvaW50cyBvZiB0aGUgc2NhbGVkIGJ1dCB1bnRyYW5zbGF0ZWQgcGF0aFxuICAvLyBhcyB3ZWxsIGFzIG9mIHRoZSBzdmcgcm9vdCBlbGVtZW50XG5cbiAgdmFyIHNjYWxlZFBhdGhDZW50cmVYID0gc2NhbGVkUGF0aFggKyBzY2FsZWRQYXRoV2R0aCAvIDI7XG4gIHZhciBzY2FsZWRQYXRoQ2VudHJlWSA9IHNjYWxlZFBhdGhZICsgc2NhbGVkUGF0aEhnaHQgLyAyO1xuICB2YXIgc3ZnUm9vdENlbnRyZVggPSAwOyAvLyAtc3ZnV2R0aCAvIDI7XG4gIHZhciBzdmdSb290Q2VudHJlWSA9IDA7IC8vLXN2Z0hnaHQgLyAyO1xuXG4gIC8vIGNhbGN1bGF0ZSB0cmFuc2xhdGlvbiByZXF1aXJlZCB0byBjZW50cmUgdGhlIHBhdGhcbiAgLy8gb24gdGhlIHN2ZyByb290IGVsZW1lbnRcbiAgdmFyIHBhdGhUcmFuc2xYID0gc3ZnUm9vdENlbnRyZVggLSBzY2FsZWRQYXRoQ2VudHJlWDtcbiAgdmFyIHBhdGhUcmFuc2xZID0gc3ZnUm9vdENlbnRyZVkgLSBzY2FsZWRQYXRoQ2VudHJlWTtcbiAgY29uc29sZS5sb2coXG4gICAgXCJzY2FsZWQgcGF0aCB4XCIsXG4gICAgc2NhbGVkUGF0aFgsXG4gICAgc2NhbGVkUGF0aFdkdGgsXG4gICAgXCJzY2FsZWQgcGF0aCB5XCIsXG4gICAgc2NhbGVkUGF0aFksXG4gICAgc2NhbGVkUGF0aEhnaHQsXG4gICAgXCJmYWN0b3IgZnJvbSBzY2FsZVwiLFxuICAgIChvcmlnUGF0aEhnaHQgLSBvcmlnUGF0aFdkdGgpIC8gMixcbiAgICBcInhmYWN0b3IgZnJvbSBnXCJcbiAgKTtcbiAgcmV0dXJuIHsgcGF0aFRyYW5zbFgsIHBhdGhUcmFuc2xZLCBzY2FsZSB9O1xufVxuXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1lZFBhdGhEU3RyKG9sZFBhdGhEU3RyLCBwYXRoVHJhbnNsWCwgcGF0aFRyYW5zbFksIHNjYWxlKSB7XG4gIC8vIGNvbnN0YW50cyB0byBoZWxwIGtlZXAgdHJhY2sgb2YgdGhlIHR5cGVzIG9mIFNWRyBjb21tYW5kcyBpbiB0aGUgcGF0aFxuICB2YXIgQk9USF9YX0FORF9ZID0gMTtcbiAgdmFyIEpVU1RfWCA9IDI7XG4gIHZhciBKVVNUX1kgPSAzO1xuICB2YXIgTk9ORSA9IDQ7XG4gIHZhciBFTExJUFRJQ0FMX0FSQyA9IDU7XG4gIHZhciBBQlNPTFVURSA9IDY7XG4gIHZhciBSRUxBVElWRSA9IDc7XG5cbiAgLy8gdHdvIHBhcmFsbGVsIGFycmF5cywgd2l0aCBlYWNoIGVsZW1lbnQgYmVpbmcgb25lIGNvbXBvbmVudCBvZiB0aGVcbiAgLy8gXCJkXCIgYXR0cmlidXRlIG9mIHRoZSBTVkcgcGF0aCwgd2l0aCBvbmUgY29tcG9uZW50IGJlaW5nIGVpdGhlclxuICAvLyBhbiBpbnN0cnVjdGlvbiAoZS5nLiBcIk1cIiBmb3IgbW92ZXRvLCBldGMuKSBvciBudW1lcmljYWwgdmFsdWVcbiAgLy8gZm9yIGVpdGhlciBhbiB4IG9yIHkgY29vcmRpbmF0ZVxuICB2YXIgb2xkUGF0aERBcnIgPSBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKG9sZFBhdGhEU3RyKTtcbiAgdmFyIG5ld1BhdGhEQXJyID0gW107XG5cbiAgdmFyIGNvbW1hbmRQYXJhbXMsIGFic09yUmVsLCBvbGRQYXRoRENvbXAsIG5ld1BhdGhEQ29tcDtcblxuICAvLyBlbGVtZW50IGluZGV4XG4gIHZhciBpZHggPSAwO1xuXG4gIHdoaWxlIChpZHggPCBvbGRQYXRoREFyci5sZW5ndGgpIHtcbiAgICB2YXIgb2xkUGF0aERDb21wID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICBpZiAoL15bQS1aYS16XSQvLnRlc3Qob2xkUGF0aERDb21wKSkge1xuICAgICAgLy8gY29tcG9uZW50IGlzIGEgc2luZ2xlIGxldHRlciwgaS5lLiBhbiBzdmcgcGF0aCBjb21tYW5kXG4gICAgICBuZXdQYXRoREFycltpZHhdID0gb2xkUGF0aERBcnJbaWR4XTtcbiAgICAgIHN3aXRjaCAob2xkUGF0aERDb21wLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgICAgY2FzZSBcIkFcIjogLy8gZWxsaXB0aWNhbCBhcmMgY29tbWFuZC4uLnRoZSBtb3N0IGNvbXBsaWNhdGVkIG9uZVxuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBFTExJUFRJQ0FMX0FSQztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIkhcIjogLy8gaG9yaXpvbnRhbCBsaW5lOyByZXF1aXJlcyBvbmx5IGFuIHgtY29vcmRpbmF0ZVxuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBKVVNUX1g7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJWXCI6IC8vIHZlcnRpY2FsIGxpbmU7IHJlcXVpcmVzIG9ubHkgYSB5LWNvb3JkaW5hdGVcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gSlVTVF9ZO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiWlwiOiAvLyBjbG9zZSB0aGUgcGF0aFxuICAgICAgICAgIGNvbW1hbmRQYXJhbXMgPSBOT05FO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIGFsbCBvdGhlciBjb21tYW5kczsgYWxsIG9mIHRoZW0gcmVxdWlyZSBib3RoIHggYW5kIHkgY29vcmRpbmF0ZXNcbiAgICAgICAgICBjb21tYW5kUGFyYW1zID0gQk9USF9YX0FORF9ZO1xuICAgICAgfVxuICAgICAgYWJzT3JSZWwgPVxuICAgICAgICBvbGRQYXRoRENvbXAgPT09IG9sZFBhdGhEQ29tcC50b1VwcGVyQ2FzZSgpID8gQUJTT0xVVEUgOiBSRUxBVElWRTtcbiAgICAgIC8vIGxvd2VyY2FzZSBjb21tYW5kcyBhcmUgcmVsYXRpdmUsIHVwcGVyY2FzZSBhcmUgYWJzb2x1dGVcbiAgICAgIGlkeCArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiB0aGUgY29tcG9uZW50IGlzIG5vdCBhIGxldHRlciwgdGhlbiBpdCBpcyBhIG51bWVyaWMgdmFsdWVcbiAgICAgIHZhciB0cmFuc2xYLCB0cmFuc2xZO1xuICAgICAgaWYgKGFic09yUmVsID09PSBBQlNPTFVURSkge1xuICAgICAgICAvLyB0aGUgdHJhbnNsYXRpb24gaXMgcmVxdWlyZWQgZm9yIGFic29sdXRlIGNvbW1hbmRzLi4uXG4gICAgICAgIHRyYW5zbFggPSBwYXRoVHJhbnNsWDtcbiAgICAgICAgdHJhbnNsWSA9IHBhdGhUcmFuc2xZO1xuICAgICAgfSBlbHNlIGlmIChhYnNPclJlbCA9PT0gUkVMQVRJVkUpIHtcbiAgICAgICAgLy8gLi4uYnV0IG5vdCByZWxhdGl2ZSBvbmVzXG4gICAgICAgIHRyYW5zbFggPSAwO1xuICAgICAgICB0cmFuc2xZID0gMDtcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAoY29tbWFuZFBhcmFtcykge1xuICAgICAgICAvLyBmaWd1cmUgb3V0IHdoaWNoIG9mIHRoZSBudW1lcmljIHZhbHVlcyBmb2xsb3dpbmcgYW4gc3ZnIGNvbW1hbmRcbiAgICAgICAgLy8gYXJlIHJlcXVpcmVkLCBhbmQgdGhlbiB0cmFuc2Zvcm0gdGhlIG51bWVyaWMgdmFsdWUocykgZnJvbSB0aGVcbiAgICAgICAgLy8gb3JpZ2luYWwgcGF0aCBkLWF0dHJpYnV0ZSBhbmQgcGxhY2UgaXQgaW4gdGhlIHNhbWUgbG9jYXRpb24gaW4gdGhlXG4gICAgICAgIC8vIGFycmF5IHRoYXQgd2lsbCBldmVudHVhbGx5IGJlY29tZSB0aGUgZC1hdHRyaWJ1dGUgZm9yIHRoZSBuZXcgcGF0aFxuICAgICAgICBjYXNlIEJPVEhfWF9BTkRfWTpcbiAgICAgICAgICBuZXdQYXRoREFycltpZHhdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeF0pICogc2NhbGUgKyB0cmFuc2xYO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDFdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDFdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICBpZHggKz0gMjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBKVVNUX1g6XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBKVVNUX1k6XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4XSA9IE51bWJlcihvbGRQYXRoREFycltpZHhdKSAqIHNjYWxlICsgdHJhbnNsWTtcbiAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTExJUFRJQ0FMX0FSQzpcbiAgICAgICAgICAvLyB0aGUgZWxsaXB0aWNhbCBhcmMgaGFzIHggYW5kIHkgdmFsdWVzIGluIHRoZSBmaXJzdCBhbmQgc2Vjb25kIGFzIHdlbGwgYXNcbiAgICAgICAgICAvLyB0aGUgNnRoIGFuZCA3dGggcG9zaXRpb25zIGZvbGxvd2luZyB0aGUgY29tbWFuZDsgdGhlIGludGVydmVuaW5nIHZhbHVlc1xuICAgICAgICAgIC8vIGFyZSBub3QgYWZmZWN0ZWQgYnkgdGhlIHRyYW5zZm9ybWF0aW9uIGFuZCBzbyBjYW4gc2ltcGx5IGJlIGNvcGllZFxuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4XSkgKiBzY2FsZSArIHRyYW5zbFg7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgMV0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgMV0pICogc2NhbGUgKyB0cmFuc2xZO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDJdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDJdKTtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyAzXSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyAzXSk7XG4gICAgICAgICAgbmV3UGF0aERBcnJbaWR4ICsgNF0gPSBOdW1iZXIob2xkUGF0aERBcnJbaWR4ICsgNF0pO1xuICAgICAgICAgIG5ld1BhdGhEQXJyW2lkeCArIDVdID0gTnVtYmVyKG9sZFBhdGhEQXJyW2lkeCArIDVdKSAqIHNjYWxlICsgdHJhbnNsWDtcbiAgICAgICAgICBuZXdQYXRoREFycltpZHggKyA2XSA9IE51bWJlcihvbGRQYXRoREFycltpZHggKyA2XSkgKiBzY2FsZSArIHRyYW5zbFk7XG4gICAgICAgICAgaWR4ICs9IDc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTk9ORTpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBcIm51bWVyaWMgdmFsdWUgc2hvdWxkIG5vdCBmb2xsb3cgdGhlIFNWRyBaL3ogY29tbWFuZFwiXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ld1BhdGhEQXJyLmpvaW4oXCIgXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRBcnJheU9mUGF0aERDb21wb25lbnRzKHN0cikge1xuICAvLyBhc3N1bWluZyB0aGUgc3RyaW5nIGZyb20gdGhlIGQtYXR0cmlidXRlIG9mIHRoZSBwYXRoIGhhcyBhbGwgY29tcG9uZW50c1xuICAvLyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UsIHRoZW4gY3JlYXRlIGFuIGFycmF5IG9mIGNvbXBvbmVudHMgYnlcbiAgLy8gc2ltcGx5IHNwbGl0dGluZyB0aGUgc3RyaW5nIGF0IHRob3NlIHNwYWNlc1xuICBzdHIgPSBzdGFuZGFyZGl6ZVBhdGhEU3RyRm9ybWF0KHN0cik7XG4gIHJldHVybiBzdHIuc3BsaXQoXCIgXCIpO1xufVxuXG5mdW5jdGlvbiBzdGFuZGFyZGl6ZVBhdGhEU3RyRm9ybWF0KHN0cikge1xuICAvLyBUaGUgU1ZHIHN0YW5kYXJkIGlzIGZsZXhpYmxlIHdpdGggcmVzcGVjdCB0byBob3cgcGF0aCBkLXN0cmluZ3MgYXJlXG4gIC8vIGZvcm1hdHRlZCBidXQgdGhpcyBtYWtlcyBwYXJzaW5nIHRoZW0gbW9yZSBkaWZmaWN1bHQuIFRoaXMgZnVuY3Rpb24gZW5zdXJlc1xuICAvLyB0aGF0IGFsbCBTVkcgcGF0aCBkLXN0cmluZyBjb21wb25lbnRzIChpLmUuIGJvdGggY29tbWFuZHMgYW5kIHZhbHVlcykgYXJlXG4gIC8vIHNlcGFyYXRlZCBieSBhIHNpbmdsZSBzcGFjZS5cbiAgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlKC8sL2csIFwiIFwiKSAvLyByZXBsYWNlIGVhY2ggY29tbWEgd2l0aCBhIHNwYWNlXG4gICAgLnJlcGxhY2UoLy0vZywgXCIgLVwiKSAvLyBwcmVjZWRlIGVhY2ggbWludXMgc2lnbiB3aXRoIGEgc3BhY2VcbiAgICAucmVwbGFjZSgvKFtBLVphLXpdKS9nLCBcIiAkMSBcIikgLy8gc2FuZHdpY2ggZWFjaCAgIGxldHRlciBiZXR3ZWVuIDIgc3BhY2VzXG4gICAgLnJlcGxhY2UoLyAgL2csIFwiIFwiKSAvLyBjb2xsYXBzZSByZXBlYXRlZCBzcGFjZXMgdG8gYSBzaW5nbGUgc3BhY2VcbiAgICAucmVwbGFjZSgvIChbRWVdKSAvZywgXCIkMVwiKSAvLyByZW1vdmUgZmxhbmtpbmcgc3BhY2VzIGFyb3VuZCBleHBvbmVudCBzeW1ib2xzXG4gICAgLnJlcGxhY2UoL14gL2csIFwiXCIpIC8vIHRyaW0gYW55IGxlYWRpbmcgc3BhY2VcbiAgICAucmVwbGFjZSgvICQvZywgXCJcIik7IC8vIHRyaW0gYW55IHRhaWxpbmcgc3BhY2Vcbn1cbiovXG4iXSwic291cmNlUm9vdCI6IiJ9