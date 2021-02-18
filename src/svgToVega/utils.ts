//@ts-ignore
import { cloneDeep, merge } from "lodash";

import {SVG_TO_VEGA_MAPPING, PROPERTY_TYPES} from './converterConstants';

// REGEX pattern for matching a def reference by url or href
const URL_OR_HREF_ID_REGEX_MATCH = /((?<=href":"#)([a-zA-Z0-9_]+)|(?<=url\(#)([a-zA-Z0-9_]+))/;

/**
 * Extracts the first id found to a reference for this object.
 * @param element JSON representation of that SVG element
 */
export function extractReferenceId(element) {
  const strigifiedElement = JSON.stringify(element);
  const matches = strigifiedElement.match(URL_OR_HREF_ID_REGEX_MATCH);
  if (matches && matches.length > 0) {
    // TODO: Solve bug where multiple regex matches occur
    return matches[0];
  }
  return null;
}

/**
 * Determines if a svg element contains a reference to a def
 * checks whether or not there's an href="#id" or a url(#id)
 * @param element 
 */
export function isReference(element) {
  if (element.tagName === "svg" || element.type === "root") {
    return false;
  }
  return extractReferenceId(element) !== null;
}

/**
 * Utility function to traverse a tree in post-order traversal.
 * @param node
 * @param transformationFunc
 */
export function walkTree(node, transformationFunc, stoppingFunction) {
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
      if (Object.keys(update).length > 0) {
        if (transformedNode.marks) {
          transformedNode.marks.push(update);
        } else {
          transformedNode.marks = [update];
        }
      } 
    });
  }
  return transformedNode;
}

export function mergeReferencedElements(original, reference) {
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
  
export function extractProperty(property, elementToExtractFrom) {
    //TODO BUG:       // if width or height and path tagName, use path data to calculate width or height
    if (elementToExtractFrom.properties[property]) {
      return elementToExtractFrom.properties[property];
    }
    return null;
  }

export function stopTraversalFunction(element) {
    // don't process defs (should have already been visited already)
    return element?.tagName === "defs";
}
  

  
export function mapSvgToVegaProperties(svgPropertyName, svgPropertyValue) {
    let name = svgPropertyName,
      value = svgPropertyValue;
    if (SVG_TO_VEGA_MAPPING[svgPropertyName]) {
      // transform property name and value
      name = SVG_TO_VEGA_MAPPING[svgPropertyName].vegaId;
  
      value = svgPropertyValue;
      if (SVG_TO_VEGA_MAPPING[svgPropertyName].valueTransform) {
        value = SVG_TO_VEGA_MAPPING[svgPropertyName].valueTransform(svgPropertyValue);
      }
    }
    return [name, value];
  }
export function matchObjectsInHierarchy(node,matchFunction,returnFunction=(node)=>node,childrenAccessor='children'){
    // if no children, returnempty array
    if(!node[childrenAccessor]){
      return [];
    }
    function matchObjectsRecrusive(input){
      let recursiveResult = [];
      input.forEach(element=> {
        if(matchFunction(element)){
          recursiveResult.push(element);
        }
  
        if(element[childrenAccessor]?.length){
          recursiveResult = recursiveResult.concat(matchObjectsRecrusive(element[childrenAccessor]))
        }
      })
      return recursiveResult;
    }
  
    return matchObjectsRecrusive(node[childrenAccessor])
  }
  