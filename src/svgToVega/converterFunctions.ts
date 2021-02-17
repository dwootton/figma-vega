// import utility functions
import {
  matchObjectsInHierarchy,
  walkTree,
  stopTraversalFunction,
  isReference,
  extractReferenceId,
  mergeReferencedElements,
  mapSvgToVegaProperties,
} from "./utils";

import {
  convertProperties,
  generateCircleSpec,
  generateRectSpec,
  generatePathSpec,
  offsetProperties,
  generateImageSpec,
  generateGradientSpec,
} from "./markUtils";

/**
 * Wrapping function for the recursive traversal of the provided svg tree
 * @param root the root node of the svg tree
 * @param offsets the x and y offsets for the root node of the vega chart
 */
export function convertRecursive(root, offsets) {
  return walkTree(root, (element) => convertElement(element, offsets, root), stopTraversalFunction);
}

interface IBaseSpecification {
  encode?: {
    enter? : Object
  }
}

export function convertElement(element, offsets, root, parentRef = null) {
  let base : IBaseSpecification = {};
  if (element.tagName === "rect") {
    const rectangleSpec = generateRectSpec(element);
    Object.assign(base, rectangleSpec);
  } else if (element.tagName === "circle" || element.tagName === "ellipse") {
    const circleSpec = generateCircleSpec(element);
    Object.assign(base, circleSpec);
  } else if (element.tagName === "path") {
    const pathSpec = generatePathSpec(element);
    Object.assign(base, pathSpec);
  } else if (element.tagName === "image") {
    const imageSpec = generateImageSpec(element);
    Object.assign(base, imageSpec);
  } else if (element.tagName === "radialGradient" || element.tagName === "linearGradient") {
    const gradientSpec = generateGradientSpec(element,parentRef);
    Object.assign(base, gradientSpec);
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

  // adjust mark coordinates to match vega chart padding
  if (base && base.encode && base.encode.enter) {
    const adjustedProperties = offsetProperties(base.encode.enter, offsets);
    base.encode.enter = adjustedProperties;
  }

  // if element is actually a reference, merge base with reference
  if (isReference(element)) {
    const referenceId = extractReferenceId(element);
    const referencedElements = matchObjectsInHierarchy(
      root,
      (node) => node && node.properties && node.properties.id === referenceId
    );
    if (referencedElements && referencedElements.length > 0) {
      const convertedElement = convertElement(referencedElements[0], offsets, root, element);
      base = mergeReferencedElements(base, convertedElement);
    }
  }

  return base;
}
