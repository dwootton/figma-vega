//@ts-ignore
import { parse } from 'svg-parser';

export function convert(SVGString){
    console.log('in svg parse',SVGString)
    console.log(parse);
    console.log(parse(SVGString));
}

