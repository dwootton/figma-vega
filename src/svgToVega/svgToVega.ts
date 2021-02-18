//@ts-ignore
import { parse } from 'svg-parser';

import {convertRecursive} from './converterFunctions';


function convert(SVGString, offsets = {width:0,height:0}){
  // parse SVG from a string into a JSON object with children and properties 
   const root = parseSVGString(SVGString);
   
   if(root instanceof Error){
     return root;
   }

   // convert 
   const matchedVega = convertRecursive(root,offsets);

   return matchedVega
}

/**
 * 
 * @param SVGString the string representation of the svg to be converted into a vega spec
 * @throws SVG could not be parsed error
 */
function parseSVGString(SVGString){
  try {
    return parse(SVGString);
  } catch (err){
    throw new Error("SVG could not be parsed. Please validate the SVG and try again.")
  }
}

export default convert;