//@ts-ignore
import { parse } from 'svg-parser';

import {matchObjectsInHierarchy} from './utils';


import {convertTree} from './converterFunctions';


function parseSVGString(SVGString){
  
  try {
    return parse(SVGString);
  } catch (err){
    throw new Error("SVG could not be parsed. Please validate the SVG and try again.")
  }
}

export function convert(SVGString, offsets = {width:0,height:0}){
    // process defs 
      // for each def, add it to a hashmap based on 
      // if id that is node's name
      // if url or use is referenced, that's a link
    
    const root = parseSVGString(SVGString);
    
    // transform so defs are child elements of their parent
    // if element has a reference
    
    if(root instanceof Error){
      return root;
    }

    const matchedVega = convertTree(root,offsets);


  
    //
    //const defs = matchObjectsInHierarchy(svgRoot,(node)=>node.tagName==="defs");
    //const convertedVega = convertTree(svgRoot);
    // have a hashmap  
    // for each def, create a 
    // find any element with defs tag name 

    console.log('in svg parse',matchedVega, JSON.stringify(matchedVega))
    return matchedVega
}




    /*Example conversions
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

function calculateMiscSpecs(properties) {
    const attributes = [];
    if (properties.opacity) {
      //@ts-ignore wrong typings ?
      attributes.push(`"opacity": {"value": ${properties.opacity}}`);
    }

    if(properties.fillOpacity){
        attributes.push(`"fillOpacity": {"value": ${properties.fillOpacity}}`);

    }
    if (properties.blendMode !== "NORMAL" && BLEND_MODE_MAPPINGS[properties.blendMode]) {
      attributes.push(`"blend": {"value": "${BLEND_MODE_MAPPINGS[properties.blendMode]}"}`);
    }
    return attributes;
  }
  function inAny(paintArr: readonly Paint[], predicate) {
    let flag = false;
    for (const value of paintArr) {
      if (predicate(value)) {
        flag = true;
      }
    }
    return flag;
  }
  function calculateIsVisible(node: VectorNode) {
    let isVisible = false;
    //@ts-ignore
    if (inAny(node.fills, (paint) => paint.visible && paint.opacity > 0)) {
      isVisible = true;
      //@ts-ignore
    } else if (inAny(node.strokes, (paint) => paint.visible && paint.opacity > 0)) {
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

  // SVG Path Plan

  // traverse through and remove image objects from view. If present, mark their insertion order and add basic image tags. 
  // if api key provided, post image?
  // 
  
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
    return (
      "#" +
      componentToHex(Math.round(r * 255)) +
      componentToHex(Math.round(255 * g)) +
      componentToHex(Math.round(255 * b))
    );
  }

  */
  