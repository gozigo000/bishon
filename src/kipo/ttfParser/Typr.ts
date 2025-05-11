
export type Table = Record<string, number | number[]>;
type Tables = { tables: Table[], ids: Record<string, number>, offset: number };

export class Font {
    _data: Uint8Array<ArrayBufferLike>;
    _index: number;
    _offset: number;
    // Required Tables - TTF outlines are used in an OpenType font, the following tables are required for the font to function correctly:
    head: Table | null = null; // Font header
    cmap: Tables | null = null; // Character to glyph mapping
    hhea: Table | null = null; // Horizontal header
    maxp: Table | null = null; // Maximum profile
    hmtx: Table | null = null; // Horizontal metrics
    name: Table | null = null; // Naming table
    OS2: Table | null = null; // OS/2 and Windows specific metrics
    post: Table | null = null; // PostScript information
    // Tables Related to TTF Outlines
    loca: number[] | null = null; // Index to location - The table stores an array of offsets to the locations of glyph descriptions in the 'glyf' table,
    glyf: Table[] | null = null; // Glyph data
    // Advanced Typographic Tables - Several optional tables support advanced typographic functions:
    GSUB: Table | null = null; // Glyph substitution data
    
    // TyprUtils에서 사용하는 변수
    _ctab: Table | null = null;

    constructor(data: Uint8Array<ArrayBufferLike>) {
        this._data = data;
        this._index = 0;
        this._offset = 0;
    }
}

/**
 * main parser, parses the raw data, generates the font object.
 * The font object has a set of tables, each table has its own structure.
 * @example
 * ```js
 * const font = Typr.parse(buffer);
 * console.log(font);
 * ```
 */
export class Typr {

    static parse(buff: Uint8Array): Font {
        const data = new Uint8Array(buff);
        const fnt = this.readFont(data);
        return fnt;
    }

    private static readFont(data: Uint8Array) {
        // Font Table Names
        const tableNames: string[] = ["head", "cmap", "maxp", "loca", "glyf", "hhea", "hmtx", "name", "OS/2", "post", "GSUB"];

        const obj: Font = new Font(data);
        tableNames.forEach(tableName => {
            const [offset, length] = Typr.findTable(data, tableName, 0) || [null, null];
            if (!offset) return;
            switch (tableName) {
                case "head": { obj.head = Head.parseTable(data, offset, length, obj); break; }
                case "cmap": { obj.cmap = Cmap.parseTable(data, offset, length, obj); break; }
                case "hhea": { obj.hhea = Hhea.parseTable(data, offset, length, obj); break; }
                case "maxp": { obj.maxp = Maxp.parseTable(data, offset, length, obj); break; }
                case "loca": { obj.loca = Loca.parseTable(data, offset, length, obj); break; }
                case "hmtx": { obj.hmtx = Hmtx.parseTable(data, offset, length, obj); break; }
                // case "name": obj.name = ; break;
                case "OS/2": obj.OS2 = OS2.parseTable(data, offset, length, obj); break;
                // case "post": obj.post = ; break;
                case "glyf": { obj.glyf = Glyf.parseTable(data, offset, length, obj); break; }
                // case "GSUB": obj.GSUB = ; break;
            }
        });
        return obj;
    }

    public static findTable(data: Uint8Array, tableName: string, foff: number): [number, number] | null {
        const numTables = B.readUshort(data, foff + 4);
        let offset = foff + 12;
        for (let i = 0; i < numTables; i++) {
            const tag = B.readASCII(data, offset, 4);   
            /* const checkSum = */ B.readUint(data, offset + 4); // 필요 없는 변수
            const toffset = B.readUint(data, offset + 8);
            const length = B.readUint(data, offset + 12);
            if (tag === tableName) return [toffset, length];
            offset += 16;
        }
        return null;
    }

}

// 테이블 파서들

export class Head {
    static parseTable(data: Uint8Array, offset: number, _: number, __: Font): Table {
        const obj: Table = {};
        obj["tableVersion"] = B.readFixed(data, offset); offset += 4; // 필요 없는 변수
        obj["fontRevision"] = B.readFixed(data, offset); offset += 4;
        obj["checkSumAdjustment"] = B.readUint(data, offset); offset += 4; // 필요 없는 변수
        obj["magicNumber"] = B.readUint(data, offset); offset += 4; // 필요 없는 변수
        obj["flags"] = B.readUshort(data, offset); offset += 2;
        obj["unitsPerEm"] = B.readUshort(data, offset); offset += 2; // (바탕체) unitsPerEm: 1024 
        obj["created"] = B.readUint64(data, offset); offset += 8;
        obj["modified"] = B.readUint64(data, offset); offset += 8;
        obj["xMin"] = B.readShort(data, offset); offset += 2;
        obj["yMin"] = B.readShort(data, offset); offset += 2;
        obj["xMax"] = B.readShort(data, offset); offset += 2;
        obj["yMax"] = B.readShort(data, offset); offset += 2;
        obj["macStyle"] = B.readUshort(data, offset); offset += 2;
        obj["lowestRecPPEM"] = B.readUshort(data, offset); offset += 2;
        obj["fontDirectionHint"] = B.readShort(data, offset); offset += 2;
        obj["indexToLocFormat"] = B.readShort(data, offset); offset += 2;
        obj["glyphDataFormat"] = B.readShort(data, offset); offset += 2;
        return obj;
    }
}
    
export class Cmap {
    static parseTable(data: Uint8Array, offset: number, length: number, __: Font): Tables {
        const obj: Tables = { tables: [], ids: {}, offset: offset };
        data = new Uint8Array(data.buffer, offset, length);
        offset = 0;

        /* const version = */ B.readUshort(data, offset); offset += 2; // 바탕체: 0
        const numTables = B.readUshort(data, offset); offset += 2; // 바탕체: 1

        const offs = [];
        for (let _ = 0; _ < numTables; _++) {
            const platformID = B.readUshort(data, offset); offset += 2; // 바탕체: 3 (Windows)
            const encodingID = B.readUshort(data, offset); offset += 2; // 바탕체: 1 (Unicode 1.1 semantics — deprecated)
            const subtableOffset = B.readUint(data, offset); offset += 4; // 바탕체: 12
            const id = "p" + platformID + "e" + encodingID; // 바탕체: "p3e1" (Unicode BMP)
            // Fonts that support only Unicode BMP characters (U+0000 to U+FFFF) on the Windows 
            // platform must use encoding 1 with a format 4 subtable. This encoding must not be 
            // used to support Unicode supplementary-plane characters.

            let tind = offs.indexOf(subtableOffset); // 바탕체: -1  
            if (tind === -1) {
                tind = obj.tables.length;
                const subTable: Table = {};
                offs.push(subtableOffset);
                subTable["format"] = B.readUshort(data, subtableOffset); // 바탕체: 4
                const format = subTable["format"];
                if (format === 4) obj.tables.push(Cmap.parse4(data, subtableOffset, subTable));
                else console.log("unknown format: " + format, platformID, encodingID, subtableOffset);
            }
            if (obj.ids[id] !== null) console.log("multiple tables for one platform+encoding: " + id);
            obj.ids[id] = tind;
        }
        return obj;
    }

    static parse4(data: Uint8Array, offset: number, subTable: Table) {
        const offset0 = offset;
        // Format number is set to 4.
        /* format */ offset += 2;
        // This is the length in bytes of the subtable.
        const length = B.readUshort(data, offset); offset += 2;
        /* const language */ offset += 2;
        // 2 × segCount.
        const segCountX2 = B.readUshort(data, offset); offset += 2;
        const segCount = segCountX2 >>> 1;
        // (2**floor(lg(segCount))) * 2
        subTable.searchRange = B.readUshort(data, offset); offset += 2;
        // floor(lg(segCount))
        subTable.entrySelector = B.readUshort(data, offset); offset += 2;
        // (segCount * 2) - searchRange
        subTable.rangeShift = B.readUshort(data, offset); offset += 2;
        // End character code for each segment, last = 0xFFFF.
        subTable.endCode = B.readUshorts(data, offset, segCount); offset += segCount * 2;
        // reservedPad: Set to 0.
        offset += 2;
        // Start character code for each segment.
        subTable.startCode = B.readUshorts(data, offset, segCount); offset += segCount * 2;
        // Delta for all character codes in segment.
        subTable.idDelta = []; // HACK: B.readUshorts()로 바꿀 수 있을 듯
        for (let i = 0; i < segCount; i++) { 
            subTable.idDelta.push(B.readShort(data, offset)); offset += 2; 
        }
        // Offsets into glyphIdArray or 0
        subTable.idRangeOffset = B.readUshorts(data, offset, segCount); offset += segCount * 2;
        // Glyph index array (arbitrary length)
        subTable.glyphIdArray = B.readUshorts(data, offset, ((offset0 + length) - offset) >> 1);  //offset += segCount*2;
        
        return subTable;
    }
}

export class Maxp {
    static parseTable(data: Uint8Array, offset: number, _: number, __: Font): Table {
        const obj: Table = {};
        obj["Version16Dot16"] = B.readUint(data, offset); offset += 4; // 바탕체: 버전 1.0
        obj["numGlyphs"] = B.readUshort(data, offset); offset += 2;
        obj["maxPoints"] = B.readUshort(data, offset);  offset += 2;
        obj["maxContours"] = B.readUshort(data, offset);  offset += 2;
        obj["maxCompositePoints"] = B.readUshort(data, offset);  offset += 2;
        obj["maxCompositeContours"] = B.readUshort(data, offset);  offset += 2;
        obj["maxZones"] = B.readUshort(data, offset);  offset += 2;
        obj["maxTwilightPoints"] = B.readUshort(data, offset);  offset += 2;
        obj["maxStorage"] = B.readUshort(data, offset);  offset += 2;
        obj["maxFunctionDefs"] = B.readUshort(data, offset);  offset += 2;
        obj["maxInstructionDefs"] = B.readUshort(data, offset);  offset += 2;
        obj["maxStackElements"] = B.readUshort(data, offset);  offset += 2;
        obj["maxSizeOfInstructions"] = B.readUshort(data, offset);  offset += 2;
        obj["maxComponentElements"] = B.readUshort(data, offset);  offset += 2;
        obj["maxComponentDepth"] = B.readUshort(data, offset);  offset += 2;
        return obj;
    }
};

export class Hhea {
    static parseTable(data: Uint8Array, offset: number, _: number, __: Font): Table {
        const obj: Table = {};
        obj["tableVersion"] = B.readFixed(data, offset); offset += 4;
        const keys = ["ascender", "descender", "lineGap",
            "advanceWidthMax", "minLeftSideBearing", "minRightSideBearing", "xMaxExtent",
            "caretSlopeRise", "caretSlopeRun", "caretOffset",
            "res0", "res1", "res2", "res3",
            "metricDataFormat", "numberOfHMetrics"];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const read = (key === "advanceWidthMax" || key === "numberOfHMetrics") ? B.readUshort : B.readShort;
            obj[key] = read(data, offset + i * 2);
        }
        return obj;
    }
}

export class Loca {
    static parseTable(data: Uint8Array, offset: number, _: number, font: Font): number[] {
        if (!font["maxp"]) throw new Error("maxp table is not found");
        if (typeof font["maxp"]["numGlyphs"] !== "number") throw new Error("numGlyphs is not found");

        const obj: number[] = [];
        const len = font["maxp"]["numGlyphs"] + 1;
        for (let i = 0; i < len; i++) {
            obj.push(B.readUint(data, offset + (i << 2)));
        }
        return obj;
    }
};

export class Hmtx {
    static parseTable(data: Uint8Array, offset: number, _: number, font: Font): Table {
        const advanceWidth = [];
        const leftSideBearing = [];

        if (!font["maxp"]) throw new Error("maxp table is not found");
        if (!font["hhea"]) throw new Error("hhea table is not found");
        const nG = font["maxp"]["numGlyphs"] as number;
        const nH = font["hhea"]["numberOfHMetrics"] as number;
        let aw = 0;
        let lsb = 0;
        let i = 0;
        while (i < nH) { 
            aw = B.readUshort(data, offset + (i << 2)); 
            lsb = B.readShort(data, offset + (i << 2) + 2); 
            advanceWidth.push(aw); 
            leftSideBearing.push(lsb); 
            i++; 
        }
        while (i < nG) { 
            advanceWidth.push(aw); 
            leftSideBearing.push(lsb); 
            i++; 
        }
        return { advanceWidth: advanceWidth, leftSideBearing: leftSideBearing };
    }
};

export class Glyf {
    static parseTable(_: Uint8Array, __: number, ___: number, font: Font): Table[] {
        if (!font["maxp"]) throw new Error("maxp table is not found");

        const obj: Table[] = [];
        const ng = font["maxp"]["numGlyphs"];
        if (typeof ng !== "number") return obj;
        for (let g = 0; g < ng; g++) {
            const glyf = Glyf._parseGlyf(font, g);
            obj.push(glyf || {});
        }
        return obj;
    }

    static _parseGlyf(font: Font, g: number) {
        const data = font._data;
        const loca = font.loca;
        // if (!loca) return null;
        if (!loca) throw new Error("loca table is not found");
        if (loca[g] === loca[g + 1]) return null;
        // if (loca[g] !== loca[g + 1]) throw new Error("loca table is found - g: " + g);

        let [offset, ] = Typr.findTable(data, "glyf", font["_offset"]) || [null, null];
        if (!offset) return null;
        offset = offset + loca[g];

        const glyf: Table = {};
        glyf.numberOfContours = B.readShort(data, offset); offset += 2; // 바탕체: 2 (simple glyph)
        glyf.xMin = B.readShort(data, offset); offset += 2;
        glyf.yMin = B.readShort(data, offset); offset += 2;
        glyf.xMax = B.readShort(data, offset); offset += 2;
        glyf.yMax = B.readShort(data, offset); offset += 2
        if (glyf.xMin >= glyf.xMax || glyf.yMin >= glyf.yMax) return null;
        
        return glyf;
    }
}

export class OS2 {
    static parseTable(data: Uint8Array, offset: number, _: number, __: Font): Table {
        const ver = B.readUshort(data, offset); offset += 2;
        const obj = {};
        if (ver === 0) OS2.version0(data, offset, obj);
        else if (ver === 1) OS2.version1(data, offset, obj);
        else if (ver === 2 || ver === 3 || ver === 4) OS2.version2(data, offset, obj);
        else if (ver === 5) OS2.version5(data, offset, obj);
        else throw "unknown OS/2 table version: " + ver;
        return obj;
    }

    static version0(data: Uint8Array, offset: number, obj: Table) {
        obj["xAvgCharWidth"] = B.readShort(data, offset); offset += 2;
        obj["usWeightClass"] = B.readUshort(data, offset); offset += 2;
        obj["usWidthClass"] = B.readUshort(data, offset); offset += 2;
        obj["fsType"] = B.readUshort(data, offset); offset += 2;
        obj["ySubscriptXSize"] = B.readShort(data, offset); offset += 2;
        obj["ySubscriptYSize"] = B.readShort(data, offset); offset += 2;
        obj["ySubscriptXOffset"] = B.readShort(data, offset); offset += 2;
        obj["ySubscriptYOffset"] = B.readShort(data, offset); offset += 2;
        obj["ySuperscriptXSize"] = B.readShort(data, offset); offset += 2;
        obj["ySuperscriptYSize"] = B.readShort(data, offset); offset += 2;
        obj["ySuperscriptXOffset"] = B.readShort(data, offset); offset += 2;
        obj["ySuperscriptYOffset"] = B.readShort(data, offset); offset += 2;
        obj["yStrikeoutSize"] = B.readShort(data, offset); offset += 2;
        obj["yStrikeoutPosition"] = B.readShort(data, offset); offset += 2;
        obj["sFamilyClass"] = B.readShort(data, offset); offset += 2;
        obj["panose"] = B.readBytes(data, offset, 10); offset += 10;
        obj["ulUnicodeRange1"] = B.readUint(data, offset); offset += 4;
        obj["ulUnicodeRange2"] = B.readUint(data, offset); offset += 4;
        obj["ulUnicodeRange3"] = B.readUint(data, offset); offset += 4;
        obj["ulUnicodeRange4"] = B.readUint(data, offset); offset += 4;
        /* obj["achVendID"] = */ B.readASCII(data, offset, 4); offset += 4;
        obj["fsSelection"] = B.readUshort(data, offset); offset += 2;
        obj["usFirstCharIndex"] = B.readUshort(data, offset); offset += 2;
        obj["usLastCharIndex"] = B.readUshort(data, offset); offset += 2;
        obj["sTypoAscender"] = B.readShort(data, offset); offset += 2;
        obj["sTypoDescender"] = B.readShort(data, offset); offset += 2;
        obj["sTypoLineGap"] = B.readShort(data, offset); offset += 2;
        obj["usWinAscent"] = B.readUshort(data, offset); offset += 2;
        obj["usWinDescent"] = B.readUshort(data, offset); offset += 2;
        return offset;
    }

    static version1(data: Uint8Array, offset: number, obj: Table) {
        offset = OS2.version0(data, offset, obj);
        obj["ulCodePageRange1"] = B.readUint(data, offset); offset += 4;
        obj["ulCodePageRange2"] = B.readUint(data, offset); offset += 4;
        return offset;
    }

    static version2(data: Uint8Array, offset: number, obj: Table) {
        offset = OS2.version1(data, offset, obj);
        obj["sxHeight"] = B.readShort(data, offset); offset += 2;
        obj["sCapHeight"] = B.readShort(data, offset); offset += 2;
        obj["usDefault"] = B.readUshort(data, offset); offset += 2;
        obj["usBreak"] = B.readUshort(data, offset); offset += 2;
        obj["usMaxContext"] = B.readUshort(data, offset); offset += 2;
        return offset;
    }

    static version5(data: Uint8Array, offset: number, obj: Table) {
        offset = OS2.version2(data, offset, obj);
        obj["usLowerOpticalPointSize"] = B.readUshort(data, offset); offset += 2;
        obj["usUpperOpticalPointSize"] = B.readUshort(data, offset); offset += 2;
        return offset;
    }
}


/* ------------------------------------------------------------ */
// 1746 -> 878 -> 734


// T.name = {
//     parseTable: function (data, offset, length) {
//         const B = Typr.B;
//         const obj = {};
//         const format = B.readUshort(data, offset); offset += 2;
//         const count = B.readUshort(data, offset); offset += 2;
//         const stringOffset = B.readUshort(data, offset); offset += 2;

//         const ooo = offset - 6 + stringOffset;
//         //console.log(format,count);

//         const names = [
//             "copyright",
//             "fontFamily",
//             "fontSubfamily",
//             "ID",
//             "fullName",
//             "version",
//             "postScriptName",
//             "trademark",
//             "manufacturer",
//             "designer",
//             "description",
//             "urlVendor",
//             "urlDesigner",
//             "licence",
//             "licenceURL",
//             "---",
//             "typoFamilyName",
//             "typoSubfamilyName",
//             "compatibleFull",
//             "sampleText",
//             "postScriptCID",
//             "wwsFamilyName",
//             "wwsSubfamilyName",
//             "lightPalette",
//             "darkPalette"
//         ];

//         const rU = B.readUshort;

//         for (const i = 0; i < count; i++) {
//             const platformID = rU(data, offset); offset += 2;
//             const encodingID = rU(data, offset); offset += 2;
//             const languageID = rU(data, offset); offset += 2;
//             const nameID = rU(data, offset); offset += 2;
//             const slen = rU(data, offset); offset += 2;
//             const noffset = rU(data, offset); offset += 2;
//             //console.log(platformID, encodingID, languageID.toString(16), nameID, length, noffset);


//             const soff = ooo + noffset;
//             const str;
//             if (false) { }
//             else if (platformID === 0) str = B.readUnicode(data, soff, slen / 2);
//             else if (platformID === 3 && encodingID === 0) str = B.readUnicode(data, soff, slen / 2);
//             else if (platformID === 1 && encodingID === 25) str = B.readUnicode(data, soff, slen / 2);
//             else if (encodingID === 0) str = B.readASCII(data, soff, slen);
//             else if (encodingID === 1) str = B.readUnicode(data, soff, slen / 2);
//             else if (encodingID === 3) str = B.readUnicode(data, soff, slen / 2);
//             else if (encodingID === 4) str = B.readUnicode(data, soff, slen / 2);
//             else if (encodingID === 5) str = B.readUnicode(data, soff, slen / 2);
//             else if (encodingID === 10) str = B.readUnicode(data, soff, slen / 2);

//             else if (platformID === 1) { str = B.readASCII(data, soff, slen); console.log("reading unknown MAC encoding " + encodingID + " as ASCII") }
//             else {
//      ("unknown encoding " + encodingID + ", platformID: " + platformID);
//                 str = B.readASCII(data, soff, slen);
//             }

//             const tid = "p" + platformID + "," + (languageID).toString(16);//Typr._platforms[platformID];
//             if (obj[tid] === null) obj[tid] = {};
//             const name = names[nameID]; if (name === null) name = "_" + nameID;
//             obj[tid][name] = str;
//             obj[tid]["_lang"] = languageID;
//             //console.log(tid, obj[tid]);
//         }
//         /*
//         if(format === 1)
//         {
//             const langTagCount = B.readUshort(data, offset);  offset += 2;
//             for(const i=0; i<langTagCount; i++)
//             {
//                 const length  = B.readUshort(data, offset);  offset += 2;
//                 const noffset = B.readUshort(data, offset);  offset += 2;
//             }
//         }
//         */
//         const out = T.name.selectOne(obj), ff = "fontFamily";
//         if (out[ff] === null) for (const p in obj) if (obj[p][ff] !== null) out[ff] = obj[p][ff];
//         return out;
//     }
//     selectOne: function (obj) {
//         //console.log(obj);
//         const psn = "postScriptName";

//         for (const p in obj) if (obj[p][psn] !== null && obj[p]["_lang"] === 0x0409) return obj[p];        // United States
//         for (const p in obj) if (obj[p][psn] !== null && obj[p]["_lang"] === 0x0000) return obj[p];        // Universal
//         for (const p in obj) if (obj[p][psn] !== null && obj[p]["_lang"] === 0x0c0c) return obj[p];        // Canada
//         for (const p in obj) if (obj[p][psn] !== null) return obj[p];

//         const out;
//         for (const p in obj) { out = obj[p]; break; }
//         console.log("returning name table with languageID " + out._lang);
//         if (out[psn] === null && out["ID"] !== null) out[psn] = out["ID"];
//         return out;
//     }
// }

// T.post = {
//     parseTable: function (data, offset, length) {
//         const obj = {};
//         obj["version"] = B.readFixed(data, offset); offset += 4;
//         obj["italicAngle"] = B.readFixed(data, offset); offset += 4;
//         obj["underlinePosition"] = B.readShort(data, offset); offset += 2;
//         obj["underlineThickness"] = B.readShort(data, offset); offset += 2;
//         return obj;
//     }
// };

// T.GSUB = {
//     parseTable: function (data, offset, length, obj) {
//         //console.log(obj.name.ID);
//         const B = Typr.B, rU = B.readUshort, rI = B.readUint;

//         const off = offset;
//         const maj = rU(data, off); off += 2;
//         const min = rU(data, off); off += 2;
//         const slO = rU(data, off); off += 2;
//         const flO = rU(data, off); off += 2;
//         const llO = rU(data, off); off += 2;
//         //console.log(maj,min,slO,flO,llO);

//         off = offset + flO;

//         const fmap = {};
//         const cnt = rU(data, off); off += 2;
//         for (const i = 0; i < cnt; i++) {
//             const tag = B.readASCII(data, off, 4); off += 4;
//             const fof = rU(data, off); off += 2;
//             fmap[tag] = true;
//         }
//         //console.log(fmap);
//         return fmap;
//     }
// };


const B = {
    t: function () {
        const ab = new ArrayBuffer(8);
        return {
            buff: ab,
            int8: new Int8Array(ab),
            uint8: new Uint8Array(ab),
            int16: new Int16Array(ab),
            uint16: new Uint16Array(ab),
            int32: new Int32Array(ab),
            uint32: new Uint32Array(ab)
        }
    }(),

    readShort: function (buff: Uint8Array, p: number) {
        // if(p>=buff.length) throw "error";
        const a = B.t.uint16;
        a[0] = (buff[p] << 8) | buff[p + 1];
        return B.t.int16[0];
    },
    readUshort: function (buff: Uint8Array, p: number) {
        // if(p>=buff.length) throw "error";
        return (buff[p] << 8) | buff[p + 1];
    },
    readUshorts: function (buff: Uint8Array, p: number, len: number) {
        const arr = [];
        for (let i = 0; i < len; i++) {
            const v = B.readUshort(buff, p + i * 2);  // if(v==932) console.log(p+i*2);
            arr.push(v);
        }
        return arr;
    },
    writeUshort: function (buff: Uint8Array, p: number, n: number) {
        buff[p] = (n >> 8) & 255; buff[p + 1] = n & 255;
    },

    readFixed: function (data: Uint8Array, o: number) {
        return ((data[o] << 8) | data[o + 1]) + (((data[o + 2] << 8) | data[o + 3]) / (256 * 256 + 4));
    },
    readF2dot14: function (data: Uint8Array, o: number) {
        const num = B.readShort(data, o);
        return num / 16384;
    },

    readInt: function (buff: Uint8Array, p: number) {
        const a = B.t.uint8;
        a[0] = buff[p + 3];
        a[1] = buff[p + 2];
        a[2] = buff[p + 1];
        a[3] = buff[p];
        return B.t.int32[0];
    },
    readInt8: function (buff: Uint8Array, p: number) {
        const a = B.t.uint8;
        a[0] = buff[p];
        return B.t.int8[0];
    },

    readUint: function (buff: Uint8Array, p: number) {
        const a = B.t.uint8;
        a[3] = buff[p]; a[2] = buff[p + 1]; a[1] = buff[p + 2]; a[0] = buff[p + 3];
        return B.t.uint32[0];
    },
    writeUint: function (buff: Uint8Array, p: number, n: number) {
        buff[p] = (n >> 24) & 255; buff[p + 1] = (n >> 16) & 255; buff[p + 2] = (n >> 8) & 255; buff[p + 3] = (n >> 0) & 255;
    },
    readUint64: function (buff: Uint8Array, p: number) {
        return (B.readUint(buff, p) * (0xffffffff + 1)) + B.readUint(buff, p + 4);
    },

    readASCII: function (buff: Uint8Array, p: number, l: number) {
        // l: length in Characters (not Bytes)
        let s = "";
        for (let i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
        return s;
    },
    readASCIIArray: function (buff: Uint8Array, p: number, l: number) {
        // l : length in Characters (not Bytes)
        const s = [];
        for (let i = 0; i < l; i++)
            s.push(String.fromCharCode(buff[p + i]));
        return s;
    },
    writeASCII: function (buff: Uint8Array, p: number, s: string) {
        // l: length in Characters (not Bytes)
        for (let i = 0; i < s.length; i++)
            buff[p + i] = s.charCodeAt(i);
    },
    
    readUnicode: function (buff: Uint8Array, p: number, l: number) {
        let s = "";
        for (let i = 0; i < l; i++) {
            const c = (buff[p++] << 8) | buff[p++];
            s += String.fromCharCode(c);
        }
        return s;
    },
    // _tdec: window["TextDecoder"] ? new window["TextDecoder"]() : null, // 브라우저 환경에서만 사용
    _tdec: typeof TextDecoder !== 'undefined' ? new TextDecoder() : null,
    readUTF8: function (buff: Uint8Array, p: number, l: number) {
        const tdec = B._tdec;
        if (tdec && p === 0 && l === buff.length) return tdec["decode"](buff);
        return B.readASCII(buff, p, l);
    },

    readBytes: function (buff: Uint8Array, p: number, l: number) {
        // if(p>=buff.length) throw "error";
        const arr = [];
        for (let i = 0; i < l; i++) arr.push(buff[p + i]);
        return arr;
    },
};