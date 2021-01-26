import {convert} from './svgToVega';

test('throws on invalid svg - blank', () => {
  function invalidConvert(){
    convert("")
  }
    // expect error message to contain "not be parsed";
    expect(invalidConvert).toThrowError("not be parsed");
});


test('throws on invalid svg - text', () => {
  function invalidConvert(){
    convert("sample text")
  }
    // expect error message to contain "not be parsed";
    expect(invalidConvert).toThrowError("not be parsed");
});


test('[BROKEN] throws on invalid svg - wrong tags', () => {
    // expect error message to contain "not be parsed";
    const validAnswer = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "k",
          properties: {
          },
          children: [
            {
              type: "element",
              tagName: "lol",
              properties: {
              },
              children: [
                {
                  type: "text",
                  value: "blah",
                },
              ],
            },
          ],
        },
      ],
    }
    
    expect(convert("<k><lol>blah</lol></k>")).toMatchObject(validAnswer);
});


