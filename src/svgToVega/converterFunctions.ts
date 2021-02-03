
export function convertTree(root,offsets){
    return walkTree(root,(element)=>convertElement(element,offsets));
     
}

function selfReplication (value){
    return value;
}

const SVG_TO_VEGA_MAPPING = Object.freeze({
    "d":{name:"path",valueTransform:selfReplication}
});

function mapSvgToVegaProperties(svgPropertyName,svgPropertyValue){
    let name=svgPropertyName, value=svgPropertyValue;
    if(SVG_TO_VEGA_MAPPING[svgPropertyName]){
        // transform property name and value
        name = SVG_TO_VEGA_MAPPING[svgPropertyName].name;
        value = SVG_TO_VEGA_MAPPING[svgPropertyName].valueTransform(svgPropertyValue);
    }
    return [name,value];
}
interface IGeometryVegaSpec {
    type:String,
    encode:{enter:Object},
}

function offsetElement(spec,offsets){
    if(spec.encode.enter){
        let xOffset = spec.encode.enter?.['x']?.value ? spec.encode.enter['x'].value : 0;
        xOffset += offsets.width

        let yOffset = spec.encode.enter?.['y']?.value ? spec.encode.enter['y'].value : 0;
        yOffset += offsets.height

        spec.encode.enter['x'] = {value:xOffset};
        spec.encode.enter['y'] = {value:yOffset};
    }
    return spec;
}

export function convertElement(element,offsets){
    let base = {};
    if(element.tagName === "rect"){
        let rectSpec : IGeometryVegaSpec = {type:"rect","encode": {enter:{}}};
        // transform the property into the vega version
        for(const [svgPropertyName, svgPropertyValue] of Object.entries(element.properties)){
            const [vegaName, vegaValue] = mapSvgToVegaProperties(svgPropertyName, svgPropertyValue);
            rectSpec.encode.enter[vegaName] = {"value":vegaValue};   
        }
        rectSpec = offsetElement(rectSpec,offsets)
        Object.assign(base,rectSpec);
    } else if(element.tagName === "path"){
        console.log(offsets);
        let pathSpec : IGeometryVegaSpec = {type:"path","encode": {enter:{"path":"",}}} ;
        // transform the property into the vega version
        for(const [svgPropertyName, svgPropertyValue] of Object.entries(element.properties)){
            const [vegaName, vegaValue] = mapSvgToVegaProperties(svgPropertyName, svgPropertyValue);
            pathSpec.encode.enter[vegaName] = {"value":vegaValue};   
        }
        pathSpec = offsetElement(pathSpec,offsets);
        Object.assign(base,pathSpec);
    } else if(element.type === "root"){
       
    }
     else if(element.tagName === "svg"){
        //render an annotations node
        interface IRootNode {
            type:string,
            marks:Array<any>
        }
        let rootSpec : IRootNode = {type:"group",marks:[]} ;
        // TODO: move all element offsets inside of here?
        Object.assign(base,rootSpec);
        
    }else {
        // element is not currently supported
        console.log('invalid element:',element)
        throw new Error(`An invalid tag name was found (${element.tagName}), please use svg with only valid tags.`)
    }
    // if element is def tag, stop 
    

    return base;
  }

export function convertDefs(defNode){
    return {}
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
function walkTree(node,transformationFunc){
    let transformedNode = transformationFunc(node);

    // filter out null updates
    // add in any child nodes as updates to the object itself. 
        // ie gradients update the value
    // if node is a svg node, add children as marks?
    if(node.children){
        const rawUpdates = node.children.map(child=>walkTree(child,transformationFunc));
        const updates = rawUpdates.filter(update=>!!update);

        // if update is a mark, append it to transformedNode's marks property, else update
        // copy over any old marks
        // update the original node according to the transform.
        updates.forEach(update=>{
            if(isMarkType(update)){
                if(transformedNode.marks){
                    transformedNode.marks.push(update);
                } else {
                    transformedNode.marks = [update];
                }
            } else {
                transformedNode = Object.assign(transformedNode,update);
            }
        })
    }
    return transformedNode;
}

function isMarkType(element){
    return true;
}