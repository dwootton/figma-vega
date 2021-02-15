import {convert} from '../svgToVega';

test.only('renders a rect', () => {
    const input = `<svg>
    <rect x="341" y="80" width="208" height="186" fill="url(#pattern0)"/>
    <defs>
    <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
    <use xlink:href="#image0" transform="scale(0.00188002 0.00139276)"/>
    </pattern>
    <image id="image0" width="232" height="196" xlink:href="data:image/png;base64,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"/>

    </defs>
    </svg>`
   

    // if normal rect, use img mark
    // if not normal rect, use group and add path
    // make the elements into vega 
    const returnVal = {"marks":[
        {"type":"group",
        "marks":[{"type":"image",
            "encode": {
                "enter":{
                    "id":{
                        "value":"image0"
                    },
                    "fill":{
                        "value":"url(#pattern0)"
                    },
                    "url":{
                        "value":"data:image/png;base64,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"
                    },
                    "x": {
                        "value":341
                    },
                    "y": {
                        "value":80
                    },
                    "width":{
                        "value":208
                    },
                    "height":{
                        "value":186
                    }
                }
            }
        }]
    }
    ]}
        
    const result = convert(input);

    expect(result).toMatchObject(returnVal)
});

test.only('tests linear gradients',()=>{
    const input = `<svg><rect x="82" y="266" width="58" height="121" fill="url(#paint0_linear)"/>
    <defs>
    <linearGradient id="paint0_linear" x1="111" y1="266" x2="111" y2="387" gradientUnits="userSpaceOnUse">
    <stop stop-color="#D71313"/>
    <stop offset="1" stop-color="#C4C4C4" stop-opacity="0"/>
    </linearGradient>
    </defs>
    </svg>`

    //

    const returnVal = {"marks":[
        {"type":"group",
        "marks":[{"type":"rect",
            "encode": {
                "enter":{
                    "x": {
                        "value":82
                    },
                    "y": {
                        "value":266
                    },
                    "width":{
                        "value":58
                    },
                    "height":{
                        "value":121
                    },
                    "fill":{
                        "gradient":"linear",
                        "stops":[{
                            "color":"rgba(215, 19, 19, 1)", "offset":0
                        },{
                            "color":"rgba(196, 196, 196, 0)", "offset":1
                        }],
                        "x1":"0",
                        "x2":"0",
                        "y1":"0",
                        "y2":"1",
                        "value": "url(#paint0_linear)"
                    }
                }
            }
        }]
    }
    ]}

    const result = convert(input);

    expect(result).toMatchObject(returnVal)
})

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