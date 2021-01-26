export const processSvg = (svg) => {
    const parsedSvg = new DOMParser()
        .parseFromString(svg, 'image/svg+xml')
        .querySelector('svg');
    return new XMLSerializer().serializeToString(parsedSvg);
};
function* walkTree(node) {
    yield node;
    let children = node.children;
    if (children) {
        for (let child of children) {
            yield* walkTree(child);
        }
    }
}
