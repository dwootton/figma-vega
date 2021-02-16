import { extractProperty } from "./utils";

//@ts-ignore
import { get } from "color-string";

/**
 * Calculates the normalized bounding box for a gradient 
 * @param gradientElement 
 * @param boundingElement 
 */
export function calculateNormalizedBoundingBox(gradientElement, boundingElement) {
  // extract x,y,width,height from bounding
  const boundingX = extractProperty("x", boundingElement),
    boundingY = extractProperty("y", boundingElement),
    boundingWidth = extractProperty("width", boundingElement),
    boundingHeight = extractProperty("height", boundingElement);

  const elementX1 = extractProperty("x1", gradientElement),
    elementX2 = extractProperty("x2", gradientElement),
    elementY1 = extractProperty("y1", gradientElement),
    elementY2 = extractProperty("y2", gradientElement);

  const x1 = (elementX1 - boundingX) / boundingWidth;
  const x2 = (elementX2 - boundingX) / boundingWidth;
  const y1 = (elementY1 - boundingY) / boundingHeight;
  const y2 = (elementY2 - boundingY) / boundingHeight;
  return { x1, x2, y1, y2 };
}

/**
 * Parses <stop> svg elements and converts them to a vega spec
 * @param gradientElement 
 */
export function extractStops(gradientElement) {
  let stops = [];
  for (const child of gradientElement.children) {
    if (child.tagName === "stop") {
      // extract rgba color:
      let colorInfo = get(child.properties["stop-color"]),
        alpha = 1;
      const [r, g, b, colorAlpha] = colorInfo.value;
      if (child.properties["stop-opacity"] !== undefined) {
        alpha = child.properties["stop-opacity"];
      }
      // replace initialAlpha
      const color = `rgba(${r},${b},${g},${alpha * colorAlpha})`;

      let offset = 0;
      // extract offset
      if (child.properties["offset"]) {
        offset = child.properties["offset"];
      }
      const stop = { offset: offset, color: color };
      stops.push(stop);
    }
  }
  return stops;
}

/**
 * Calculates the corresponding path data of a circular svg element
 * Note: this is requried as Vega doesn't support rx, ry properties on circles
 * @param cx center x coordinate of circle
 * @param cy center y coordinate of circle
 * @param rx the x radius (in perfect circles this is the same as ry)
 * @param ry the y radius (in perfect circles this is the same as rx)
 */
function getCircularPath(cx, cy, rx, ry) {
  let output = "M" + (cx - rx).toString() + "," + cy.toString();
  output += "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + (2 * rx).toString() + ",0";
  output += "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + (-2 * rx).toString() + ",0";
  output += "Z";
  return output;
}

/**
 * Utility method to convert the circle element into a path string
 * @param element
 */
export function convertCircleToPath(element) {
  let cx = extractProperty("cx", element),
    cy = extractProperty("cy", element),
    rx = extractProperty("rx", element),
    ry = extractProperty("ry", element),
    r = extractProperty("r", element);
  if (r) {
    rx = r;
    ry = r;
  }

  return getCircularPath(cx, cy, rx, ry);
}
