import {convert} from '../svgToVega';

test.only('renders a rect', () => {
    const basicRectSVG = `<rect x="5" y="10" width="10" height="20" fill="#00ff00"></rect>`

    const vegaRect = {
        "type": "rect",
        "encode": {
          "enter": {
            "fill": {"value": "#00ff00"},
             "x": {"value": 5},
            "y": {"value": 10},
            "width": {"value": 10},
            "height":{"value": 20}
          }
        }
      };

    expect(convert(basicRectSVG)).toMatchObject(vegaRect)
});


