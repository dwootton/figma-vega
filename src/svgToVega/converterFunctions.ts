//@ts-ignore
import { matchObjectsInHierarchy } from "./utils";
//@ts-ignore
import { cloneDeep, merge } from "lodash";

function stopFunction(element) {
  // don't process defs (should have already been visited already)
  return element?.tagName === "defs";
}

export function convertTree(root, offsets) {
  return walkTree(root, (element) => convertElement(element, offsets, root), stopFunction);
}

function selfReplication(value) {
  return value;
}

const PROPERTY_TYPES = Object.freeze({
  layout: "layout",
  aesthetic: "aesthetic",
});

const SVG_TO_VEGA_MAPPING = Object.freeze({
  d: { vegaId: "path", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  x1: { vegaId: "x1", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  x2: { vegaId: "x2", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  y1: { vegaId: "y1", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  y2: { vegaId: "y2", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  x: { vegaId: "x", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  y: { vegaId: "y", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  width: { vegaId: "width", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  height: { vegaId: "height", valueTransform: selfReplication, type: PROPERTY_TYPES.layout },
  // Aesthetic properties (do not affect layout)

  fill: { vegaId: "fill", valueTransform: selfReplication, type: PROPERTY_TYPES.aesthetic },
  "fill-opacity": {
    vegaId: "fillOpacity",
    valueTransform: selfReplication,
    type: PROPERTY_TYPES.aesthetic,
  },
  opacity: { vegaId: "opacity", valueTransform: selfReplication, type: PROPERTY_TYPES.aesthetic },
  stroke: { vegaId: "stroke", valueTransform: selfReplication, type: PROPERTY_TYPES.aesthetic },
  "stroke-opacity": {
    vegaId: "strokeOpacity",
    valueTransform: selfReplication,
    type: PROPERTY_TYPES.aesthetic,
  },
  "stroke-linecap": {
    vegaId: "strokeCap",
    valueTransform: selfReplication,
    type: PROPERTY_TYPES.aesthetic,
  },
  "stroke-width": {
    vegaId: "strokeWeight",
    valueTransform: selfReplication,
    type: PROPERTY_TYPES.aesthetic,
  },
  "stroke-dasharray": {
    vegaId: "strokeDash",
    valueTransform: selfReplication,
    type: PROPERTY_TYPES.aesthetic,
  },
  "stroke-miterlimit": {
    vegaId: "strokeMiterLimit",
    valueTransform: selfReplication,
    type: PROPERTY_TYPES.aesthetic,
  },
  "xlink:href": {
    vegaId: "url",
    valueTransform: selfReplication,
    type: PROPERTY_TYPES.aesthetic,
  },
});

function mapSvgToVegaProperties(svgPropertyName, svgPropertyValue) {
  let name = svgPropertyName,
    value = svgPropertyValue;
  if (SVG_TO_VEGA_MAPPING[svgPropertyName]) {
    // transform property name and value
    name = SVG_TO_VEGA_MAPPING[svgPropertyName].vegaId;
    value = SVG_TO_VEGA_MAPPING[svgPropertyName].valueTransform(svgPropertyValue);
  }
  return [name, value];
}
interface IGeometryVegaSpec {
  type: String;
  encode: { enter: Object };
}

function offsetElement(spec, offsets) {
  if (spec.encode.enter) {
    let xOffset = spec.encode.enter?.["x"]?.value ? spec.encode.enter["x"].value : 0;
    xOffset += offsets.width;

    let yOffset = spec.encode.enter?.["y"]?.value ? spec.encode.enter["y"].value : 0;
    yOffset += offsets.height;

    spec.encode.enter["x"] = { value: xOffset };
    spec.encode.enter["y"] = { value: yOffset };
  }
  return spec;
}

export function convertElement(element, offsets, root, parentRef=null) {
  let base = {};
  if (element.tagName === "rect") {
    let rectSpec: IGeometryVegaSpec = { type: "rect", encode: { enter: {} } };
    // transform the property into the vega version
    for (const [svgPropertyName, svgPropertyValue] of Object.entries(element.properties)) {
      const [vegaName, vegaValue] = mapSvgToVegaProperties(svgPropertyName, svgPropertyValue);
      rectSpec.encode.enter[vegaName] = { value: vegaValue };
    }
    rectSpec = offsetElement(rectSpec, offsets);
    Object.assign(base, rectSpec);
  } else if (element.tagName === "path") {
    console.log(offsets);
    let pathSpec: IGeometryVegaSpec = { type: "path", encode: { enter: { path: "" } } };
    // transform the property into the vega version
    for (const [svgPropertyName, svgPropertyValue] of Object.entries(element.properties)) {
      const [vegaName, vegaValue] = mapSvgToVegaProperties(svgPropertyName, svgPropertyValue);
      pathSpec.encode.enter[vegaName] = { value: vegaValue };
    }
    pathSpec = offsetElement(pathSpec, offsets);
    Object.assign(base, pathSpec);
  } else if (element.tagName === "image") {
    let rectSpec: IGeometryVegaSpec = { type: "image", encode: { enter: {} } };
    // transform the property into the vega version
    for (const [svgPropertyName, svgPropertyValue] of Object.entries(element.properties)) {
      const [vegaName, vegaValue] = mapSvgToVegaProperties(svgPropertyName, svgPropertyValue);
      rectSpec.encode.enter[vegaName] = { value: vegaValue };
    }
    rectSpec = offsetElement(rectSpec, offsets);
    Object.assign(base, rectSpec);
  } else if (element.tagName === "radialGradient" || element.tagName === "linearGradient") {
    console.log(element);
    let gradientType = element.tagName === "linearGradient" ? "linear" : "radial";
    let gradientSpec = {"gradient": gradientType, stops: [] };
    
    gradientSpec.stops = extractStops(element);
    // TODO: you must extract c1 
    // 
    const normalizedBounds = calculateNormalizedBoundingBox(element,parentRef)
    Object.assign(gradientSpec,normalizedBounds)

    const nestedSpec = {"encode":{"enter":{"fill":{"value":gradientSpec}}}}
    Object.assign(base, nestedSpec);
  } else if (element.tagName === "pattern" || element.tagName === "use") {
    // let linking handle it
  } else if (element.type === "root") {
  } else if (element.tagName === "defs") {
    // early return so defs don't get processed for references
    return base;
  } else if (element.tagName === "svg") {
    //render an annotations node
    interface IRootNode {
      type: string;
      marks: Array<any>;
    }
    let rootSpec: IRootNode = { type: "group", marks: [] };
    // TODO: move all element offsets inside of here?
    Object.assign(base, rootSpec);
  } else {
    // element is not currently supported
    console.log("invalid element:", element);
    throw new Error(
      `An invalid tag name was found (${element.tagName}), please use svg with only valid tags.`
    );
  }

  // if element is actually a reference, merge base with reference
  if (isReference(element)) {
    const referenceId = extractReferenceId(element);
    try {
      const referencedElements = matchObjectsInHierarchy(
        root,
        (node) => node && node.properties && node.properties.id === referenceId
      );
      if (referencedElements && referencedElements.length > 0) {
        const convertedElement = convertElement(referencedElements[0], offsets, root,element);
        base = mergeReferencedElements(base, convertedElement);
      }
    } catch (err) {
      let val = 5;
      let vl = 5;
    }
  }

  return base;
}

function mergeReferencedElements(original, reference) {
  const clonedOriginal = cloneDeep(original);
  let merged = merge(clonedOriginal, reference);

  for (const propertyId in SVG_TO_VEGA_MAPPING) {
    const propertyMetaData = SVG_TO_VEGA_MAPPING[propertyId];
    // overwrite any layout properties with corresponding parent values
    if (propertyMetaData.type === PROPERTY_TYPES.layout) {
      if (original?.encode?.enter[propertyMetaData.vegaId]) {
        merged.encode.enter[propertyMetaData.vegaId] =
          original.encode.enter[propertyMetaData.vegaId];
      }
    }
  }
  // for each layout property, update merged to
  // for each property in original and reference
  // deep merge, take all properties of
  return merged;
}

// matches the id of an object in a href or a url reference
const URL_OR_HREF_ID_REGEX_MATCH = /((?<=href":"#)([a-zA-Z0-9_]+)|(?<=url\(#)([a-zA-Z0-9_]+))/;

/**
 * Extracts the first id found to a reference for this object.
 * @param element JSON representation of that SVG element
 */
function extractReferenceId(element) {
  const strigifiedElement = JSON.stringify(element);
  const matches = strigifiedElement.match(URL_OR_HREF_ID_REGEX_MATCH);
  if (matches && matches.length > 0) {
    // TODO: Solve bug where multiple regex matches occur
    return matches[0];
  }
  return null;
}

function isReference(element) {
  if (element.tagName === "svg" || element.type === "root") {
    return false;
  }
  return extractReferenceId(element) !== null;
}

export function convertDefs(defNode) {
  return {};
}

function processGradient() {
  // current challenge: no gradientTransform property exists in vega
  // this means that we can use transform, scale, and rotate properties provided by the svg
  // one hunch I have is that we can compute the effect of these three properties on the x1,x2,y1,y2 properties
  // if we can do that, then we can get similar gradients!
  return null;
}

/**
 * Utility function to traverse a tree in post-order traversal.
 * @param node
 * @param transformationFunc
 */
function walkTree(node, transformationFunc, stoppingFunction) {
  let transformedNode = transformationFunc(node);

  // filter out null updates
  // add in any child nodes as updates to the object itself.
  // ie gradients update the value
  // if node is a svg node, add children as marks?
  if (node.children && !stoppingFunction(node)) {
    const rawUpdates = node.children.map((child) =>
      walkTree(child, transformationFunc, stoppingFunction)
    );
    const updates = rawUpdates.filter((update) => !!update);

    // if update is a mark, append it to transformedNode's marks property, else update
    // copy over any old marks
    // update the original node according to the transform.
    updates.forEach((update) => {
      //if update.update function exists,
      if (isMarkType(update)) {
        if (transformedNode.marks) {
          transformedNode.marks.push(update);
        } else {
          transformedNode.marks = [update];
        }
      } else {
        transformedNode = Object.assign(transformedNode, update);
      }
    });
  }
  return transformedNode;
}

function isMarkType(element) {
  // if element has properties
  return Object.keys(element).length > 0;
}


// Gradient Utils
function parseColor(input) {
  var div = document.createElement("div"),
    m;
  div.style.color = input;
  m = getComputedStyle(div).color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (m) return [m[1], m[2], m[3]];
  else throw new Error("Colour " + input + " could not be parsed.");
}


function calculateNormalizedBoundingBox(gradientElement,boundingElement){
  // extract x,y,width,height from bounding
  const boundingX = extractProperty('x',boundingElement),
  boundingY = extractProperty('y',boundingElement),
  boundingWidth = extractProperty('width',boundingElement),
  boundingHeight = extractProperty('height',boundingElement);

  const elementX1 = extractProperty('x1',gradientElement),
  elementX2 = extractProperty('x2',gradientElement),
  elementY1 = extractProperty('y1',gradientElement),
  elementY2 = extractProperty('y2',gradientElement);

  const x1 = (elementX1 - boundingX)/boundingWidth;
  const x2 = (elementX2 - boundingX)/boundingWidth;
  const y1 = (elementY1 - boundingY)/boundingHeight;
  const y2 = (elementY2 - boundingY)/boundingHeight;
  return {x1,x2,y1,y2};
}

function extractProperty(property,elementToExtractFrom){
  //TODO BUG:       // if width or height and path tagName, use path data to calculate width or height

  return elementToExtractFrom.properties[property];
}
//parent has all 
function extractStops(gradientElement) {
  let stops = [];
  for (const child of gradientElement.children) {
    if (child.tagName === "stop") {
      // extract rgba color:
      let [r, g, b] = parseColor(child.properties["stop-color"]),
        a = 1;
      if (child.properties["stop-opacity"]) {
        a = child.properties["stop-opacity"];
      }
      const color = `rgba(${r},${b},${g},${a})`;

      let offset = 0;
      // extract offset
      if (child.properties["offset"]) {
        offset = child.properties["offset"];
      }
      const stop = { offset: offset, color: color };
      stops.push(stop);
    }
  }
  return stops;
}