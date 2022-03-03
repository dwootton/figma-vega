import convert from '../svgToVega';

test.only('renders a rect', () => {
    const input = `<svg>
    <rect x="341" y="80" width="208" height="186" fill="url(#pattern0)"/>
    <defs>
    <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
    <use xlink:href="#image0" transform="scale(0.00188002 0.00139276)"/>
    </pattern>
    <image id="image0" width="232" height="196" xlink:href="data:image/png;base64,iVBOR"/>

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
                        "value":"data:image/png;base64,iVBOR"
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
                        "value":{
                            "gradient":"linear",
                            "stops":[{
                                "color":"rgba(215,19,19,1)", "offset":0
                            },{
                                "color":"rgba(196,196,196,0)", "offset":1
                            }],
                            "x1":0.5,
                            "x2":0.5,
                            "y1":0,
                            "y2":1
                        }
                    }
                }
            }
        }]
    }
    ]}

    const result = convert(input);
    expect(result).toMatchObject(returnVal)
})