// import utility functions 
import { matchObjectsInHierarchy,walkTree,stopFunction, extractProperty, isReference, extractReferenceId,mergeReferencedElements,mapSvgToVegaProperties } from "./utils";

import {calculateNormalizedBoundingBox, extractStops, convertCircleToPath,} from './markUtils'



interface IGeometryVegaSpec {
  type: String;
  encode: { enter: Object };
}

function offsetElement(spec, offsets) {
  // TODO, also update xc, yc?
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

export function convertRecursive(root, offsets) {
  return walkTree(root, (element) => convertElement(element, offsets, root), stopFunction);
}

export function convertElement(element, offsets, root, parentRef = null) {
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
  } else if (element.tagName === "circle" || element.tagName === "ellipse") {
    // Vega spec  doesn't support circle elements, must convert the circle to a path and render as a path
    let circleSpec: IGeometryVegaSpec = {
      type: "path",
      encode: {
        enter: {
          path: { value: convertCircleToPath(element) },
        },
      },
    };
    // transform the property into the vega version
    for (const [svgPropertyName, svgPropertyValue] of Object.entries(element.properties)) {
      // don't transfer circle layout properties
      if (["r", "rx", "ry", "cx", "cy"].includes(svgPropertyName)) {
        continue;
      }
      const [vegaName, vegaValue] = mapSvgToVegaProperties(svgPropertyName, svgPropertyValue);
      circleSpec.encode.enter[vegaName] = { value: vegaValue };
    }

    circleSpec = offsetElement(circleSpec, offsets);
    Object.assign(base, circleSpec);
  } else if (element.tagName === "path") {
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
    let gradientType = element.tagName === "linearGradient" ? "linear" : "radial";
    let gradientSpec = { gradient: gradientType, stops: [] };

    gradientSpec.stops = extractStops(element);
    const normalizedBounds = calculateNormalizedBoundingBox(element, parentRef);
    Object.assign(gradientSpec, normalizedBounds);

    const nestedSpec = { encode: { enter: { fill: { value: gradientSpec } } } };
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
        const convertedElement = convertElement(referencedElements[0], offsets, root, element);
        base = mergeReferencedElements(base, convertedElement);
      }
    } catch (err) {
      let val = 5;
      let vl = 5;
    }
  }

  return base;
}
