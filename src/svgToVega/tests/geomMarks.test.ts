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
                  value:
                    "M269,373C269, 353.1177490072, 285.1177490072, 337, 305, 337,C324.8822509928, 337, 341, 353.1177490072, 341, 373,C341, 392.8822509928, 324.8822509928, 409, 305, 409,C285.1177490072, 409, 269, 392.8822509928, 269, 373,z",
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
  const basicCircleSVG = `<svg>
  <circle cx="305" cy="373" rx="36" ry="24"  fill="#C4C4C4"></circle>
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
                  value:
                  'M269,373C269, 359.7451660048, 285.1177490072, 349, 305, 349,C324.8822509928, 349, 341, 359.7451660048, 341, 373,C341, 386.2548339952, 324.8822509928, 397, 305, 397,C285.1177490072, 397, 269, 386.2548339952, 269, 373,z',
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
