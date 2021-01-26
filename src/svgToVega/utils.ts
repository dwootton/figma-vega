
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
  