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


test('throws on invalid svg - wrong tags', () => {
  function invalidConvert(){
    convert("<k><lol>blah</lol></k>")
  }
    // expect error message to contain "not be parsed";
    expect(invalidConvert).toThrowError("not be parsed");
});


