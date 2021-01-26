export function matchObjectsInHierarchy(node, matchFunction, returnFunction = (node) => node, childrenAccessor = 'children') {
    // if no children, returnempty array
    if (!node[childrenAccessor]) {
        return [];
    }
    function matchObjectsRecrusive(input) {
        let recursiveResult = [];
        input.forEach(element => {
            var _a;
            if (matchFunction(element)) {
                recursiveResult.push(element);
            }
            if ((_a = element[childrenAccessor]) === null || _a === void 0 ? void 0 : _a.length) {
                recursiveResult = recursiveResult.concat(matchObjectsRecrusive(element[childrenAccessor]));
            }
        });
        return recursiveResult;
    }
    return matchObjectsRecrusive(node[childrenAccessor]);
}
