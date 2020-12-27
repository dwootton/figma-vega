
import * as paper from 'paper';

export function createNormalizedPath(node: VectorNode) {
    const x = node.x;
    const y = node.y;
  
    const width = node.width;
    const height = node.height;
  
    const paths = node.vectorPaths.map((vector) => {
      console.log("vectodata", vector.data);
      return vector.data;
    });
  
    const combinedPath = paths.join(" ");
    console.log("combinedpath", combinedPath);
    console.log("combinedpath", paper);
  
    /*const paperPath = new paper.Path(combinedPath);
    console.log("combinedpath",paperPath );
  
    console.log("combinedpath",paperPath.bounds, paperPath.bounds.width,paperPath.bounds.height );
    console.log("combinedpath",paperPath.bounds, paperPath.bounds.x,paperPath.bounds.y );*/
  
  
    /*const svgPath = new SVGPath();
    // replace any negative exponents with 0
    const fixedPath = combinedPath.replace(/[\d]+[.][\d]+([e][-][\d]+)/g, "0.0");
    const pathSeg = svgPath.importString(fixedPath);
    console.log(pathSeg,fixedPath,pathSeg);
    const [minx, miny, maxx, maxy, svgWidth, svgHeight] = pathSeg.calculateBounds();
    console.log("pathsegs", pathSeg,svgWidth, svgHeight);
  
    const maxDimension = Math.max(svgWidth, svgHeight);
  
    pathSeg.scale(2 / maxDimension);
    pathSeg.center(0, 0);
    return pathSeg.export();*/

  }

