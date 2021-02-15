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
    const root = parseSVGString(SVGString);
    
    // transform so defs are child elements of their parent
    // if element has a reference
    if(root instanceof Error){
      return root;
    }

    const matchedVega = convertTree(root,offsets);

    return matchedVega
}