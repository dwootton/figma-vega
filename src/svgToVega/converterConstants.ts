export const PROPERTY_TYPES = Object.freeze({
    layout: "layout",
    aesthetic: "aesthetic",
  });
  
export const SVG_TO_VEGA_MAPPING = Object.freeze({
    d: { vegaId: "path", type: PROPERTY_TYPES.layout },
    x1: { vegaId: "x1", type: PROPERTY_TYPES.layout },
    x2: { vegaId: "x2", type: PROPERTY_TYPES.layout },
    y1: { vegaId: "y1", type: PROPERTY_TYPES.layout },
    y2: { vegaId: "y2", type: PROPERTY_TYPES.layout },
    cx: { vegaId: "cx", type: PROPERTY_TYPES.layout },
    cy: { vegaId: "cy", type: PROPERTY_TYPES.layout },
    x: { vegaId: "x", type: PROPERTY_TYPES.layout },
    y: { vegaId: "y", type: PROPERTY_TYPES.layout },
    width: { vegaId: "width", type: PROPERTY_TYPES.layout },
    height: { vegaId: "height", type: PROPERTY_TYPES.layout },
    // Aesthetic properties (do not affect layout)
  
    fill: { vegaId: "fill", type: PROPERTY_TYPES.aesthetic },
    "fill-opacity": {
      vegaId: "fillOpacity",
  
      type: PROPERTY_TYPES.aesthetic,
    },
    opacity: { vegaId: "opacity", type: PROPERTY_TYPES.aesthetic },
    stroke: { vegaId: "stroke", type: PROPERTY_TYPES.aesthetic },
    "stroke-opacity": {
      vegaId: "strokeOpacity",
  
      type: PROPERTY_TYPES.aesthetic,
    },
    "stroke-linecap": {
      vegaId: "strokeCap",
  
      type: PROPERTY_TYPES.aesthetic,
    },
    "stroke-width": {
      vegaId: "strokeWeight",
  
      type: PROPERTY_TYPES.aesthetic,
    },
    "stroke-dasharray": {
      vegaId: "strokeDash",
  
      type: PROPERTY_TYPES.aesthetic,
    },
    "stroke-miterlimit": {
      vegaId: "strokeMiterLimit",
  
      type: PROPERTY_TYPES.aesthetic,
    },
    "xlink:href": {
      vegaId: "url",
  
      type: PROPERTY_TYPES.aesthetic,
    },
  });