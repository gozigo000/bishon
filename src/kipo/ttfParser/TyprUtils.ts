// Typr.U - Typr utilities. Basic operations with fonts. Use it as a guide to write your own utilities.


// [Typr.U]

// pathToContext(path, ctx)
// path: path to draw
// ctx: context2d to draw the path into
// It executes each command of the path with a corresponding command of context2D: moveTo(), lineTo(), ... and fill(). 
// It does nothing else (you must call translate(), scale(), fillStyle ... manually).

// pathToSVG(path)
// Converts a path to an "SVG path string", which can be used in <path d="..." />.

// Extending Typr
// Let's implement a little function for drawing a string:
// stringToContext = function(font, str, ctx, size, color, x, y) {
//   var shape = shape(font, str);
//   var path  = shapeToPath(font, shape);
//   var scale = size / font.head.unitsPerEm;
//   ctx.translate(x,y);  
//   ctx.scale(scale,-scale);
//   ctx.fillStyle = color;
//   pathToContext(path, ctx);
//   ctx.scale(1/scale,-1/scale);  
//   ctx.translate(-x,-y);
// }


import { Font, Table, Glyf } from "./Typr";

// shapeToPath(font, shape)
// font: font object
// shape: e.g. the output of shape(...)
// returns the vector path of the outline of the glyph
export function shapeToPath(font: Font, shape: { "g": number, "cl": number, "dx": number, "dy": number, "ax": number, "ay": number }[]) {
    const tpath: { commands: string[], coords: number[] } = { commands: [], coords: [] };
    let x = 0, y = 0;

    for (let i = 0; i < shape.length; i++) {
        const it = shape[i];
        const path = glyphToPath(font, it["g"]);
        const crds = path["coords"];
        for (let j = 0; j < crds.length; j += 2) {
            tpath.coords.push(crds[j] + x + it["dx"]);
            tpath.coords.push(crds[j + 1] + y + it["dy"]);
        }
        for (let j = 0; j < path["commands"].length; j++) 
            tpath.commands.push(path["commands"][j]);

        x += it["ax"]; y += it["ay"];
    }
    return { "commands": tpath.commands, "coords": tpath.coords };
}

/**
 * Typr.js uses the following structure to represent the path: \
 * `{ commands: [CMD,CMD,CMD, ...], coords:[X,Y,X,Y, ...] }`
 * 
 * commands is an array of commands (Strings), coords is an array of coordinates (Numbers). Each command needs a specific number of coordinates. The path can be processed by passing both arrays from the left, index into coords depends on the types of previous commands.
 * - "M": (X,Y) - move the pointer to X,Y.
 * - "L": (X,Y) - line from the previous position to X,Y.
 * - "Q": (X1,Y1,X2,Y2) - quadratic bézier curve from the previous position to X2,Y2, using X1,Y1 as a control point.
 * - "C": (X1,Y1,X2,Y2,X3,Y3) - cubic bézier curve from the previous position to X3,Y3, using X1,Y1 and X2,Y2 as control points.
 * - "Z": () - draw a line to the first point to finish the outline.
 * - "#rrggbb" : () - set the current collor to RGB(rr,gg,bb) (SVG fonts use this)
 * - "X": () - fill the current path (SVG fonts use this)
 */
const P = {
    MoveTo: function (p: { commands: string[], coords: number[] }, x: number, y: number) { 
        p.commands.push("M"); 
        p.coords.push(x, y); 
    },
    LineTo: function (p: { commands: string[], coords: number[] }, x: number, y: number) { 
        p.commands.push("L"); 
        p.coords.push(x, y); 
    },
    CurveTo: function (p: { commands: string[], coords: number[] }, a: number, b: number, c: number, d: number, e: number, f: number) { 
        p.commands.push("C"); 
        p.coords.push(a, b, c, d, e, f); 
    },
    qCurveTo: function (p: { commands: string[], coords: number[] }, a: number, b: number, c: number, d: number) { 
        p.commands.push("Q"); 
        p.coords.push(a, b, c, d); 
    },
    ClosePath: function (p: { commands: string[], coords: number[] }) { 
        p.commands.push("Z"); 
    }
}

/** 
 * glyphToPath(font, gid, ignoreColor, axs)
 * @param font: font object
 * @param gid: index of the glyph, which you want to access
 * @param ignoreColor: ignore a color version of a glyph, if present
 * @param axs: axes (see above)
 * @returns the vector path of the outline of the glyph

 */
export function glyphToPath(font: Font, gid: number) {
    const path = { commands: [], coords: [] };
    if (font.glyf) { 
        _drawGlyf(gid, font, path); 
    }
    return { "commands": path.commands, "coords": path.coords };
}

function _drawGlyf(gid: number, font: Font, path: { commands: string[], coords: number[] }) {
    if (!font.glyf) throw "no glyf table";
    let gl = font.glyf[gid];

    if (gl === null) {
        font.glyf[gid] = Glyf._parseGlyf(font, gid) || {};
        gl = font.glyf[gid];
    } 

    if (gl !== null) {
        _simpleGlyph(gl, path);  // 바탕체: glyf.numberOfContours = 2 (simple glyph)
    }
}

function _simpleGlyph(gid: Table, p: { commands: string[], coords: number[] }) {
    const xs = (gid.xCoordinates as number[]);
    const ys = (gid.yCoordinates as number[]);

    for (let c = 0; c < (gid.numberOfContours as number); c++) {
        const i0 = (c === 0) ? 0 : ((gid.endPtsOfContours as number[])[c - 1] + 1);
        const il = (gid.endPtsOfContours as number[])[c];

        for (let i = i0; i <= il; i++) {
            const pr = (i === i0) ? il : (i - 1);
            const nx = (i === il) ? i0 : (i + 1);
            const onCurve = (gid.flags as number[])[i] & 1;
            const prOnCurve = (gid.flags as number[])[pr] & 1;
            const nxOnCurve = (gid.flags as number[])[nx] & 1;

            const x = xs[i], y = ys[i];

            if (i === i0) {
                if (onCurve) {
                    if (prOnCurve) P.MoveTo(p, xs[pr], ys[pr]);
                    else { P.MoveTo(p, x, y); continue;  /*  will do CurveTo at il  */ }
                }
                else {
                    if (prOnCurve) P.MoveTo(p, xs[pr], ys[pr]);
                    else P.MoveTo(p, Math.floor((xs[pr] + x) * 0.5), Math.floor((ys[pr] + y) * 0.5));
                }
            }
            if (onCurve) {
                if (prOnCurve) P.LineTo(p, x, y);
            }
            else {
                if (nxOnCurve) P.qCurveTo(p, x, y, xs[nx], ys[nx]);
                else P.qCurveTo(p, x, y, Math.floor((x + xs[nx]) * 0.5), Math.floor((y + ys[nx]) * 0.5));
            }
        }
        P.ClosePath(p);
    }
}

/** 
 * shape(font, str)
 * @param font: font object
 * @param str: standard JS string
 * @returns a shape: a geometric description of a string. The output is an array of elements below. 
 * - g: Glyph index, 
 * - cl: Cluster index , 
 * - ax, ay: Advancement of a glyph, 
 * - dx, dy: an offset from a pen, at which the glyph should be drawn.
 * The shape can have a different length, than the input string (because of 합자(ligatures), etc). The cluster index says, which part of string the glyph represents.
*/
export function shape(font: Font, str: string) {
    const gls = [];
    for (let i = 0; i < str.length; i++) {
        const char = str.codePointAt(i)!; 
        if (char > 0xffff) i++;
        gls.push(codeToGlyph(font, char));
    }
    const shape = [];
    for (let i = 0; i < gls.length; i++) {
        const gid = gls[i];
        const ax = (font.hmtx!.advanceWidth as number[])[gid];
        shape.push({ "g": gid, "cl": i, "dx": 0, "dy": 0, "ax": ax, "ay": 0 });
    }
    return shape;
}

const wha = [0x9, 0xa, 0xb, 0xc, 0xd, 0x20, 0x85, 0xa0, 0x1680, 0x180e, 0x2028, 0x2029, 0x202f, 0x2060, 0x3000, 0xfeff]; 
const whm: Record<number, number> = {};
for (let i = 0; i < wha.length; i++) whm[wha[i]] = 1;
for (let i = 0x2000; i <= 0x200d; i++) whm[i] = 1;

/**
 * codeToGlyph
 * @param font: font object
 * @param code: integer Unicode code of the character
 * @returns an integer index of the glyph, corresponding to the unicode character
 */
export function codeToGlyph(font: Font, code: number): number {
    //console.log(cmap);
    // "p3e10" for NotoEmoji-Regular.ttf

    if (font["_ctab"] === null) {
        const cmap = font.cmap!;
        let tind = -1;
         // 바탕체: "p3e1" (Unicode BMP)
        const pps = ["p3e10", "p0e4", "p3e1", "p1e0", "p0e3", "p0e1"/*,"p3e3"*/, "p3e0" /*Hebrew*/, "p3e5" /*Korean*/];
        for (let i = 0; i < pps.length; i++) {
            const id = pps[i];
            if (cmap.ids[id] !== null) { 
                tind = cmap.ids[id]; 
                break; 
            }
        }
        if (tind === -1) throw "no familiar platform and encoding!";
        font["_ctab"] = cmap!.tables[tind];
    }

    // const ctab = font["_ctab"] as Table;
    const ctab = font.cmap!.tables[0];
    const format = ctab["format"] as number;
    const startCode = ctab.startCode as number[];
    const endCode = ctab.endCode as number[];
    const idRangeOffset = ctab.idRangeOffset as number[];
    const idDelta = ctab.idDelta as number[];
    const glyphIdArray = ctab.glyphIdArray as number[];
    
    if (format !== 4) throw "unknown cmap table format " + format;
    let gid = 0;
    if (code <= endCode[endCode.length - 1]) {
        // smallest index with code <= value
        let sind = arrSearch(endCode, 1, code);
        if (code > endCode[sind]) sind++;
        if (code >= startCode[sind]) {
            let gli = 0;
            if (idRangeOffset[sind] !== 0) {
                gli = glyphIdArray[(code - startCode[sind]) + (idRangeOffset[sind] >> 1) - (idRangeOffset.length - sind)];
            }
            else {
                gli = code + idDelta[sind];
            }
            gid = (gli & 0xFFFF);
        }
    }

    const loca = font["loca"];
    // if the font claims to have a Glyph for a character, but the glyph is empty, and the character is not "white", it is a lie!
    if (gid !== 0 && loca && loca[gid] === loca[gid + 1]  // loca not present in CFF fonts
        && whm[code] === null) throw "no glyph for character: " + code;

    return gid;
}

/**
 * find the greatest index with a value <=v
 * @param arr: array of numbers
 * @param k: number of elements per group
 * @param v: value
 * @returns the greatest index with a value <=v
 */
function arrSearch(arr: number[], k: number, v: number) {
    let l = 0, r = ~~(arr.length / k);
    while (l + 1 !== r) { 
        const mid = l + ((r - l) >>> 1); 
        if (arr[mid * k] <= v) l = mid; 
        else r = mid; 
    }
    return l * k;
}
