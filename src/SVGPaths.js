// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// ==/ClosureCompiler==

// SVGPath
// Fahri Aydos, aydos.com
// 2016-06-18
// https://aydos.com/svgedit

/** @constructor */

class SVGPath {
  constructor() {
    // Path segments
    this.segments = [];
    this.dec = 3;
  }

  importString(str) {
    str = str.replace(/\s/g, " "); // white spaces
    str = str.trim(); // spaces at begin and end
    str = str.replace(/,/g, " "); // commas
    str = str.replace(/([A-Za-z])([A-Za-z])/g, "$1 $2"); // two chars
    str = str.replace(/([A-Za-z])(\d)/g, "$1 $2"); // char + decimal
    str = str.replace(/([A-Za-z])(\.)/g, "$1 ."); // char + dot
    str = str.replace(/([A-Za-z])(-)/g, "$1 -"); // char + negative number
    str = str.replace(/(\d)([A-Za-z])/g, "$1 $2"); // decimal + char
    str = str.replace(/(\d)(-)/g, "$1 -"); // decimal + negative number
    var reg = /((?:-?[\d]*)\.\d+)((?:\.\d+)+)/g; // decimal + dot + decimal + dot + decimal
    while (reg.test(str)) {
      str = str.replace(reg, "$1 $2");
    }
    while (/  /.test(str)) {
      str = str.replace(/  /g, " "); // clear double spaces
    }
    var list = str.split(" ");
    var pret = "";
    var prex = 0;
    var prey = 0;
    var begx = 0;
    var begy = 0;
    var j = 0;
    var i = 0;
    this.segments = [];

    while (i < list.length) {
      var seg = new Segment();
        seg.value = list[i];
      if (list[i].charCodeAt(0) > 64) {
        seg.t = list[i++];
      } else {
        if (pret == "") break;
        seg.t = pret == "M" ? "L" : pret == "m" ? "l" : pret;
      }
      pret = seg.t;

      switch (seg.t) {
        case "Z":
        case "z":
          seg.x = begx;
          seg.y = begy;
          break;
        case "M":
        case "L":
        case "H":
        case "V":
        case "T":
          seg.x = seg.t == "V" ? prex : Number(list[i++]);
          seg.y = seg.t == "H" ? prey : Number(list[i++]);
          begx = seg.t == "M" ? seg.x : begx;
          begy = seg.t == "M" ? seg.y : begy;
          break;
        case "m":
        case "l":
        case "h":
        case "v":
        case "t":
          seg.x = seg.t == "v" ? prex : prex + Number(list[i++]);
          seg.y = seg.t == "h" ? prey : prey + Number(list[i++]);
          begx = seg.t == "m" ? seg.x : begx;
          begy = seg.t == "m" ? seg.y : begy;
          break;
        case "A":
        case "a":
          seg.r1 = Number(list[i++]);
          seg.r2 = Number(list[i++]);
          seg.ar = Number(list[i++]);
          seg.af = Number(list[i++]);
          seg.sf = Number(list[i++]);
          seg.x = seg.t == "A" ? Number(list[i++]) : prex + Number(list[i++]);
          seg.y = seg.t == "A" ? Number(list[i++]) : prey + Number(list[i++]);
          break;
        case "C":
        case "Q":
        case "S":
          seg.x1 = seg.t == "S" ? undefined : Number(list[i++]);
          seg.y1 = seg.t == "S" ? undefined : Number(list[i++]);
          seg.x2 = seg.t == "Q" ? undefined : Number(list[i++]);
          seg.y2 = seg.t == "Q" ? undefined : Number(list[i++]);
          seg.x = Number(list[i++]);
          seg.y = Number(list[i++]);
          break;
        case "c":
        case "q":
        case "s":
          seg.x1 = seg.t == "s" ? undefined : prex + Number(list[i++]);
          seg.y1 = seg.t == "s" ? undefined : prey + Number(list[i++]);
          seg.x2 = seg.t == "q" ? undefined : prex + Number(list[i++]);
          seg.y2 = seg.t == "q" ? undefined : prey + Number(list[i++]);
          seg.x = prex + Number(list[i++]);
          seg.y = prey + Number(list[i++]);
          break;
        default:
          i++;
      }
      seg.px = prex;
      seg.py = prey;
      prex = seg.x;
      prey = seg.y;
      this.segments[j++] = seg;
    }
  }

  export() {
    var str = "";
    var pre = "";
    for (var i = 0; i < this.segments.length; i++) {
      var seg = this.segments[i];//this.formatSegment(this.segments[i]);
      
      console.log(seg);
      switch (seg.t) {
        case "Z":
        case "z":
          str += seg.t;
          break;
        case "M":
        case "m":
          str += seg.t + seg.x + " " + seg.y;
          break;
        case "L":
          str += pre == seg.t || pre == "M" ? " " : "L";
          str += seg.x + " " + seg.y;
          break;
        case "l":
          str += pre == seg.t || pre == "m" ? " " : "l";
          str += seg.x + " " + seg.y;
          break;
        case "H":
        case "h":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x;
          break;
        case "V":
        case "v":
          str += pre == seg.t ? " " : seg.t;
          str += seg.y;
          break;
        case "A":
        case "a":
          str += pre == seg.t ? " " : seg.t;
          str +=
            seg.r1 +
            " " +
            seg.r2 +
            " " +
            seg.ar +
            " " +
            seg.af +
            " " +
            seg.sf +
            " " +
            seg.x +
            " " +
            seg.y;
          break;
        case "C":
        case "c":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x1 + " " + seg.y1 + " " + seg.x2 + " " + seg.y2 + " " + seg.x + " " + seg.y;
          break;
        case "Q":
        case "q":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x1 + " " + seg.y1 + " " + seg.x + " " + seg.y;
          break;
        case "S":
        case "s":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x2 + " " + seg.y2 + " " + seg.x + " " + seg.y;
          break;
        case "T":
        case "t":
          str += pre == seg.t ? " " : seg.t;
          str += seg.x + " " + seg.y;
          break;
      }
      pre = seg.t;
    }
    console.log('inexport',str)
    str = str.replace(/ -/g, "-");
    str = str.replace(/-0\./g, "-.");
    str = str.replace(/ 0\./g, " .");
    return str;
  }

  // export the segments as array
  exportList() {
    var list = [];
    for (var i = 0; i < this.segments.length; i++) {
      list[i] = this.formatSegment(this.segments[i]);
    }
    return list;
  }

  // make some analysis to minify
  analyse(dist) {
    dist = Number(dist);
    if (isNaN(dist)) dist = 0;
    if (dist < 0) dist = 0;

    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].info = "";
    }

    // convert L to H or V
    for (var i = 0; i < this.segments.length; i++) {
      if (this.segments[i].x == this.segments[i].px && this.segments[i].t.toUpperCase() == "L") {
        this.segments[i].t = this.segments[i].t == "L" ? "V" : "v";
      } else if (
        this.segments[i].y == this.segments[i].py &&
        this.segments[i].t.toUpperCase() == "L"
      ) {
        this.segments[i].t = this.segments[i].t == "L" ? "H" : "h";
      }
    }

    var a = -1;
    for (var i = 0; i < this.segments.length - 1; i++) {
      var dx = this.segments[i].x - this.segments[i].px;
      var dy = this.segments[i].y - this.segments[i].py;
      // two consecutive M
      if (this.segments[i].t.toUpperCase() == "M" && this.segments[i + 1].t.toUpperCase() == "M") {
        this.segments[i].info = "X";
        this.segments[i + 1].px = i == 0 ? 0 : this.segments[i - 1].x;
        this.segments[i + 1].py = i == 0 ? 0 : this.segments[i - 1].y;
      }
      // two consecutive Z
      if (this.segments[i].t.toUpperCase() == "Z" && this.segments[i + 1].t.toUpperCase() == "Z") {
        this.segments[i].info = "X";
      }
      // on the same line
      if (
        this.segments[i].t.toUpperCase() == "L" ||
        this.segments[i].t.toUpperCase() == "H" ||
        this.segments[i].t.toUpperCase() == "V"
      ) {
        var b = atan3(dx, dy);
        if (b == a) {
          this.segments[i - 1].info = "X";
        }
        a = b;
      } else {
        a = -1;
      }
    }

    // first segment must be M
    if (this.segments[0].t.toUpperCase() != "M") {
      this.segments[0].t = this.segments[0].t.charCodeAt(0) < 96 ? "M" : "m";
    }

    // last segment cant be M
    if (this.segments[this.segments.length - 1].t.toUpperCase() == "M") {
      this.segments[this.segments.length - 1].info = "X";
    }

    // remove certainly removables
    var i = this.segments.length;
    while (i--) {
      if (this.segments[i].info == "X") this.segments.splice(i, 1);
    }

    if (dist == 0) return;

    // too close segments
    for (var i = 0; i < this.segments.length - 1; i++) {
      if (this.segments[i].t.toUpperCase() == "Z") continue;
      var dx = this.segments[i].x - this.segments[i + 1].x;
      var dy = this.segments[i].y - this.segments[i + 1].y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= dist) {
        this.segments[i].info = "D " + d + " ";
      }
    }
  }
  // make all segments absolute
  absolute() {
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].t = this.segments[i].t.toUpperCase();
    }
  }

  // make all segments relative
  relative() {
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].t = this.segments[i].t.toLowerCase();
    }
  }

  // set the global dec variable, to rounding decimals
  round(d) {
    d = Number(d);
    if (isNaN(d)) d = 0;
    if (d < 0) d = -1;
    dec = Math.floor(d);
  }

  // move path with given dx, dy
  move(dx, dy) {
    for (var i = 0; i < this.segments.length; i++) {
      this.segments[i].x += dx;
      this.segments[i].y += dy;
      this.segments[i].px += dx;
      this.segments[i].py += dy;
      this.segments[i].x1 = this.segments[i].x1 == undefined ? undefined : this.segments[i].x1 + dx;
      this.segments[i].y1 = this.segments[i].y1 == undefined ? undefined : this.segments[i].y1 + dy;
      this.segments[i].x2 = this.segments[i].x2 == undefined ? undefined : this.segments[i].x2 + dx;
      this.segments[i].y2 = this.segments[i].y2 == undefined ? undefined : this.segments[i].y2 + dy;
    }
    this.segments[0].px = 0;
    this.segments[0].py = 0;
  }

  // flip horizontally with flip(undefined, center)
  // flip vertically, with flip(center, undefined)
  // flip wrt a point (px, py)
  flip(x, y) {
    for (var i = 0; i < this.segments.length; i++) {
      if (x != undefined) {
        this.segments[i].x = x + (x - this.segments[i].x);
        this.segments[i].px = x + (x - this.segments[i].px);
        this.segments[i].x1 =
          this.segments[i].x1 == undefined ? undefined : x + (x - this.segments[i].x1);
        this.segments[i].x2 =
          this.segments[i].x2 == undefined ? undefined : x + (x - this.segments[i].x2);
        this.segments[i].sf =
          this.segments[i].sf == undefined ? undefined : (this.segments[i].sf + 1) % 2;
      }
      if (y != undefined) {
        this.segments[i].y = y + (y - this.segments[i].y);
        this.segments[i].py = y + (y - this.segments[i].py);
        this.segments[i].y1 =
          this.segments[i].y1 == undefined ? undefined : y + (y - this.segments[i].y1);
        this.segments[i].y2 =
          this.segments[i].y2 == undefined ? undefined : y + (y - this.segments[i].y2);
        this.segments[i].sf =
          this.segments[i].sf == undefined ? undefined : (this.segments[i].sf + 1) % 2;
      }
    }
    this.segments[0].px = 0;
    this.segments[0].py = 0;
  }

  calculateBounds(){
    var minx = this.segments[0].x;
    var miny = this.segments[0].y;
    var maxx = this.segments[0].x;
    var maxy = this.segments[0].y;
    for (var i = 1; i < this.segments.length; i++) {
      minx = this.segments[i].x < minx ? this.segments[i].x : minx;
      miny = this.segments[i].y < miny ? this.segments[i].y : miny;
      maxx = this.segments[i].x > maxx ? this.segments[i].x : maxx;
      maxy = this.segments[i].y > maxy ? this.segments[i].y : maxy;
    }
    var width = maxx - minx;
    var height = maxy - miny;
    return [minx,miny,maxx,maxy,width,height]
  }

  // move paths center to the given coordinates
  center(x, y) {
    var minx = this.segments[0].x;
    var miny = this.segments[0].y;
    var maxx = this.segments[0].x;
    var maxy = this.segments[0].y;
    for (var i = 1; i < this.segments.length; i++) {
      minx = this.segments[i].x < minx ? this.segments[i].x : minx;
      miny = this.segments[i].y < miny ? this.segments[i].y : miny;
      maxx = this.segments[i].x > maxx ? this.segments[i].x : maxx;
      maxy = this.segments[i].y > maxy ? this.segments[i].y : maxy;
    }
    var dx = x - minx - (maxx - minx) / 2;
    var dy = y - miny - (maxy - miny) / 2;
    this.move(dx, dy);
  }

  // scale path with a given ratio
  scale(ratio) {
    ratio = Number(ratio);
    if (isNaN(ratio)) return;
    if (ratio <= 0) return;
    for (var i = 0; i < this.segments.length; i++) {
      var seg = this.segments[i];
      seg.x *= ratio;
      seg.y *= ratio;
      seg.px *= ratio;
      seg.py *= ratio;
      seg.x1 = seg.x1 == undefined ? undefined : ratio * seg.x1;
      seg.y1 = seg.y1 == undefined ? undefined : ratio * seg.y1;
      seg.x2 = seg.x2 == undefined ? undefined : ratio * seg.x2;
      seg.y2 = seg.y2 == undefined ? undefined : ratio * seg.y2;
      seg.r1 = seg.r1 == undefined ? undefined : ratio * seg.r1;
      seg.r2 = seg.r2 == undefined ? undefined : ratio * seg.r2;
    }
  }

  // rotate the path with given center and rotation degree
  rotate(x, y, d) {
    d *= Math.PI / 180;
    var sin = Math.sin(d);
    var cos = Math.cos(d);
    for (var i = 0; i < this.segments.length; i++) {
      var rp = rotatePoint(this.segments[i].x, this.segments[i].y, x, y, sin, cos);
      this.segments[i].x = rp[0];
      this.segments[i].y = rp[1];
      var rp = rotatePoint(this.segments[i].px, this.segments[i].py, x, y, sin, cos);
      this.segments[i].px = rp[0];
      this.segments[i].py = rp[1];
      if (this.segments[i].x1 != undefined) {
        var rp = rotatePoint(this.segments[i].x1, this.segments[i].y1, x, y, sin, cos);
        this.segments[i].x1 = rp[0];
        this.segments[i].y1 = rp[1];
      }
      if (this.segments[i].x2 != undefined) {
        var rp = rotatePoint(this.segments[i].x2, this.segments[i].y2, x, y, sin, cos);
        this.segments[i].x2 = rp[0];
        this.segments[i].y2 = rp[1];
      }
      if (this.segments[i].t == "H" || this.segments[i].t == "V") {
        this.segments[i].t = "L";
      }
      if (this.segments[i].t == "h" || this.segments[i].t == "v") {
        this.segments[i].t = "l";
      }
    }
    this.segments[0].px = 0;
    this.segments[0].py = 0;
  }

  formatSegment(s) {
    var seg = new Segment();
    seg.t = s.t;
    seg.x = s.t.charCodeAt(0) < 96 ? this.roundDec(s.x) : this.roundDec(s.x - s.px);
    seg.y = s.t.charCodeAt(0) < 96 ? this.roundDec(s.y) : this.roundDec(s.y - s.py);
    seg.px = this.roundDec(s.px);
    seg.py = this.roundDec(s.py);
    seg.x1 =
      s.x1 == undefined ? undefined : s.t.charCodeAt(0) < 96 ? this.roundDec(s.x1) : this.roundDec(s.x1 - s.px);
    seg.y1 =
      s.y1 == undefined ? undefined : s.t.charCodeAt(0) < 96 ? this.roundDec(s.y1) : this.roundDec(s.y1 - s.py);
    seg.x2 =
      s.x2 == undefined ? undefined : s.t.charCodeAt(0) < 96 ? this.roundDec(s.x2) : this.roundDec(s.x2 - s.px);
    seg.y2 =
      s.y2 == undefined ? undefined : s.t.charCodeAt(0) < 96 ? this.roundDec(s.y2) : this.roundDec(s.y2 - s.py);
    seg.r1 = s.r1 == undefined ? undefined : this.roundDec(s.r1);
    seg.r2 = s.r1 == undefined ? undefined : this.roundDec(s.r2);
    seg.ar = s.ar == undefined ? undefined : this.roundDec(s.ar);
    seg.af = s.af;
    seg.sf = s.sf;
    seg.info = s.info;
    if (s.t == "M") {
      seg.info += "m " + this.roundDec(s.x - s.px) + " " + this.roundDec(s.y - s.py);
    }
    if (s.t == "m") {
      seg.info += "M " + this.roundDec(s.x) + " " + this.roundDec(s.y);
    }
    return seg;
  }
  roundDec(dec,num) {
    if (dec < 0) return num;
    if (num % 1 === 0) {
      return num;
    } else if (dec == 0) {
      return Math.round(num);
    } else {
      var pow = Math.pow(10, dec);
      return Math.round(num * pow) / pow;
    }
  }
}

class Segment {
  constructor() {
    this.t = ""; // relatives are calculate via px and py
    this.x = undefined; // this is good for optimize, analyse, rotate, etc
    this.y = undefined; // bad for round, so round logic updated
    this.px = undefined;
    this.py = undefined;
    this.x1 = undefined;
    this.y1 = undefined;
    this.x2 = undefined;
    this.y2 = undefined;
    this.r1 = undefined;
    this.r2 = undefined;
    this.ar = undefined;
    this.af = undefined;
    this.sf = undefined;
    this.info = "";
    this.value = '';
  }
}

// format the segment for export
// check absolute-relative, and round decimals

function rotatePoint(px, py, ox, oy, sin, cos) {
  var x = cos * (px - ox) - sin * (py - oy) + ox;
  var y = sin * (px - ox) + cos * (py - oy) + oy;
  return [x, y];
}

function atan3(x, y) {
  var result = Math.atan2(y, x);
  if (result < 0) {
    result += 2 * Math.PI;
  }
  return result;
}


export default SVGPath;