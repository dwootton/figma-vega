import { convert } from "../svgToVega";

test("renders a rect", () => {
  const basicRectSVG = `<svg><rect x="5" y="10" width="10" height="20" fill="#00ff00"></rect></svg>`;

  const vegaRect = {
    marks: [
      {
        type: "group",
        marks: [
          {
            type: "rect",
            encode: {
              enter: {
                fill: { value: "#00ff00" },
                x: { value: 5 },
                y: { value: 10 },
                width: { value: 10 },
                height: { value: 20 },
              },
            },
          },
        ],
      },
    ],
  };
  const returnedValue = convert(basicRectSVG);
  expect(returnedValue).toMatchObject(vegaRect);
});

test("renders a circle", () => {
  const basicCircleSVG = `<svg>
  <circle cx="305" cy="373" r="36"  fill="#C4C4C4"></circle>
  </svg>`;

  const vegaCircle = {
    marks: [
      {
        type: "group",
        marks: [
          {
            type: "path",
            encode: {
              enter: {
                path: {
                  value: "M269,373a36,36 0 1,0 72,0a36,36 0 1,0 -72,0Z",
                },
                fill: { value: "#C4C4C4" },
                x: { value: 0 },
                y: { value: 0 },
              },
            },
          },
        ],
      },
    ],
  };
  const returnValue = convert(basicCircleSVG);
  expect(returnValue).toMatchObject(vegaCircle);
});

test("renders an ellipse", () => {
  const ellipseSVG = `<svg>
  <circle cx="305" cy="373" rx="36" ry="24" fill="#C4C4C4"></circle>
  </svg>`;

  const vegaCircle = {
    marks: [
      {
        type: "group",
        marks: [
          {
            type: "path",
            encode: {
              enter: {
                path: {
                  value: "M269,373a36,24 0 1,0 72,0a36,24 0 1,0 -72,0Z",
                },
                fill: { value: "#C4C4C4" },
                x: { value: 0 },
                y: { value: 0 },
              },
            },
          },
        ],
      },
    ],
  };
  const returnValue = convert(ellipseSVG);
  expect(returnValue).toMatchObject(vegaCircle);
});
