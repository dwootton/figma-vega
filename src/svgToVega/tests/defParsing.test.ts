import {convert} from '../svgToVega';

test.only('renders a rect', () => {
    const start = `<svg>
    <rect x="269" width="343" height="463" fill="url(#pattern0)"/>
    <defs>
    <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
    <use xlink:href="#image0" transform="scale(0.00188002 0.00139276)"/>
    </pattern>
    <image id="image0" width="532" height="718"></image>
    </defs>
    </svg>`
   

    // if normal rect, use img mark
    // if not normal rect, use group and add path
    // make the elements into vega 
    const returnVal = {"type":"image",
            "encode": {
                "enter":{
                    "url":{
                        "value":"data:image/png;base64,..."
                    },
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
            }
        }
        
    // TODO: Figure out how to update the original rect using 
    // What if you did it rect down? Rect updates all . If mark has type property, then do a deep merge (https://stackoverflow.com/questions/39246101/deep-merge-using-lodash)
    // have inner child overwrite non layout properties. 
    // also throw compilation warnings- no rotation of images is possible :(

    const vegaRect = {
        "type": "rect",
        "encode": {
          "enter": {
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
        }
      };

    expect(convert(start)).toMatchObject(vegaRect)
});



/*
 const store = {};
    let element = {tagName:"pattern"};

    if(tagName === "pattern"){
        // if image, update type and then add in the rest of the properties. 
    }

    //
    // make the defs a child of the element
    const next = `<svg>
    <rect x="269" width="343" height="463" fill="url(#pattern0)">
        <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
            <use xlink:href="#image0" transform="translate(1.4109) scale(0.00253732 0.0018797) rotate(90)"> 
                <image id="image0" width="532" height="718" xlink:href="data:image/png;base64...."></image> 
            </use>
        </pattern>
    </rect>
    </svg>`
*/