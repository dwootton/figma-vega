
export function convertTree(root){
    return walkTree(root,convertElement);
     
}

function selfReplication (value){
    return value;
}

const SVG_TO_VEGA_MAPPING = Object.freeze({

});

function mapSvgToVegaProperties(svgPropertyName,svgPropertyValue){
    let name=svgPropertyName, value=svgPropertyValue;
    if(SVG_TO_VEGA_MAPPING[svgPropertyName]){
        // transform property name and value
        name = SVG_TO_VEGA_MAPPING[svgPropertyName].name;
        value = SVG_TO_VEGA_MAPPING[svgPropertyName].valueMapper(svgPropertyValue);
    }
    return [name,value];
}
interface IRectVegaSpec {
    type:String,
    encode:Object,
}
export function convertElement(element){
    let base = {};
    if(element.tagName === "rect"){
        base = {type:"rect","encode": {enter:{}}} ;
        base = base as IRectVegaSpec;
        // transform the property into the vega version
        for(const [svgPropertyName, svgPropertyValue] of Object.entries(element.properties)){
            const [vegaName, vegaValue] = mapSvgToVegaProperties(svgPropertyName, svgPropertyValue);
            //@ts-ignore
            base.encode.enter[vegaName] = {"value":vegaValue};   
        }
    } else if(element.tagName === "path"){
        base = {type:"path","encode": {enter:{}}} ;

    }
    else if(!element.tagName){
        // do nothing
    }else {
        // element is not currently supported
        throw new Error('An invalid tag name was found, please use svg with only valid tags.')
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
        
    if(node.children){
        const rawUpdates = node.children.map(child=>walkTree(child,transformationFunc));
        const updates = rawUpdates.filter(update=>!!update);
        // update the original node according to the transform.
        updates.forEach(update=>{
            transformedNode = Object.assign(transformedNode,update);
        })
    }
    return transformedNode;
}