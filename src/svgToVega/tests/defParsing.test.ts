import {convert} from '../svgToVega';

test.only('renders a rect', () => {
    const start = `<svg>
    <rect x="269" width="343" height="463" fill="url(#pattern0)"/>
    <defs>
    <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
    <use xlink:href="#image0" transform="scale(0.00188002 0.00139276)"/>
    </pattern>
    <image id="image0" width="532" height="718"></image>
    </svg>`

    // make the defs a child of the element
    const next = `<svg>
    <rect x="269" width="343" height="463" fill="url(#pattern0)">
        <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
            <use xlink:href="#image0" transform="translate(1.4109) scale(0.00253732 0.0018797) rotate(90)"> 
                <image id="image0" width="532" height="718"></image> 
            </use>
        </pattern>
    </rect>
    </svg>`
    // if normal rect, use img mark
    // if not normal rect, use group and add path
    // make the elements into vega 
    const returnVal = {
        "type":"group",
        "encode": {
            "enter":{
                "x": {
                    "value":269
                },
                "width":{
                    "value":343
                },
                "height":{
                    "value":463
                }
            }
        },
        "marks": [
            {"type":"image",
            "encode": {
                "enter":{
                    "width":{
                        "value":880
                    },
                    "height":{
                        "value":608
                    }
                }
            }
        ]
        
    }

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

