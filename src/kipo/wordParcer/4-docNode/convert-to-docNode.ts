import dingbatToUnicode from "dingbat-to-unicode";
import { ONode, emptyONode } from "../2-xmlParser/nodes";
import { Relationships } from "../3-docx/read-relationships";
import { Numberings } from "../3-docx/read-numbering";
import { ContentTypes } from "../3-docx/read-content-types";
import {
    DocDocument, DocParagraph, DocRun,
    DocText, DocTab, DocHyperlink, DocCheckbox,
    DocImage, DocTable, DocTableRow, DocTableCell,
    DocBreak, DocMath, DocMathPara
} from "./docNodes";
import * as uris from "./uris";
import { Result } from "./results";
import { collectInfo, collectWarning } from "../../0-utils/errorCollector";

interface TableCellWithVMerge extends DocTableCell {
    _vMerge?: boolean | null; // RowSpan 계산을 위해 사용
}

export type docOptions = {
    contentTypes: ContentTypes;
    styles: Styles;
    numbering: Numberings;
    relationships: Relationships;
}

type ComplexField = {
    type: string;
    fldChar?: ONode;
    options?: { href?: string; anchor?: string; targetFrame?: string };
    checked?: boolean;
}

const complexFieldStack: ComplexField[] = [];
let currentInstrText: string[] = [];
// When a paragraph is marked as deleted, its contents should be combined
// with the following paragraph. See 17.13.5.15 del (Deleted Paragraph) of
// ECMA-376 4th edition Part 1.
let deletedParagraphContents: ONode[] = [];

let styles: Styles;
let numberings: Numberings;
let contentTypes: ContentTypes;
let relationships: Relationships;

export function fromONodeToDocNode(bodyElem: ONode, options: docOptions) {
    styles = options.styles;
    numberings = options.numbering;
    contentTypes = options.contentTypes;
    relationships = options.relationships;

    const readResult = readONodes(bodyElem.children);
    return new DocDocument(readResult.value);
}

function readONodes(elems: ONode[]): Result {
    const results = elems.map(elem => readONode(elem));
    return Result.combineResults(results);
}

function readONode(elem: ONode): Result {
    if (elem.type !== "element") return new Result();
    switch (elem.name) {
        case "w:p": return readParagraph(elem);
        case "w:r": return readRun(elem);
        case "w:fldChar": return readFldChar(elem);
        case "w:instrText": return readInstrText(elem);
        case "w:t": return readText(elem);
        case "w:tab": return readTab();
        case "w:noBreakHyphen": return readNoBreakHyphen();
        case "w:softHyphen": return readSoftHyphen();
        case "w:sym": return readSymbol(elem);
        case "w:hyperlink": return readHyperlink(elem);
        case "w:tbl": return readTable(elem);
        case "w:tr": return readTableRow(elem);
        case "w:tc": return readTableCell(elem);
        case "w:br": return readBreak(elem);
        case "mc:AlternateContent": return readONodes(elem.getFirst("mc:Fallback")?.children ?? []);
        case "w:sdt": return readSdt(elem);
        case "w:ins": return readONodes(elem.children);
        case "w:object": return readONodes(elem.children);
        case "w:smartTag": return readONodes(elem.children);
        case "w:drawing": return readONodes(elem.children);
        case "w:pict": return readONodes(elem.children);
        case "v:roundrect": return readONodes(elem.children);
        case "v:shape": return readShape(elem);
        case "v:textbox": return readONodes(elem.children);
        case "w:txbxContent": return readONodes(elem.children);
        case "wp:inline": return readDrawingElem(elem);
        case "wp:anchor": return readDrawingElem(elem);
        case "v:group": return readONodes(elem.children);
        case "v:rect": return readONodes(elem.children);
        case "m:oMath": return readOMath(elem);
        case "m:oMathPara": return readOMathPara(elem);
        default: {
            if (ignoredElements.has(elem.name)) break;
            collectWarning(`고려되지 않은 요소가 있음: ${elem.name}`);
        }
    }
    return new Result();
}

/**
 * 문단(Paragraph) 파싱
 */
function readParagraph(elem: ONode): Result {
    const paraPropsElem = elem.getFirstOrEmpty("w:pPr");

    const isDeleted = !!paraPropsElem
        .getFirstOrEmpty("w:rPr")
        .getFirst("w:del");

    if (isDeleted) {
        elem.children.forEach(child => deletedParagraphContents.push(child));
        return new Result();
    }

    let children = elem.children;
    if (deletedParagraphContents.length > 0) {
        children = [...deletedParagraphContents, ...children];
        deletedParagraphContents = [];
    }

    const paraProps = readParagraphProperties(paraPropsElem);
    const childrenResult = readONodes(children);

    // 값이 모두 있을 때만 Paragraph 생성
    const paragraph = new DocParagraph(childrenResult.value, paraProps);
    return new Result([paragraph]);
}

function readParagraphProperties(elem: ONode): ParagraphProperties {
    const style = readStyle(elem, "w:pStyle", "Paragraph", styles!.findParagraphStyleById)
    const paragraphProperties = {
        styleId: style.styleId,
        styleName: style.name,
        alignment: elem.getFirstOrEmpty("w:jc").attributes["w:val"],
        numbering: readNumberingProperties(style.styleId, elem.getFirstOrEmpty("w:numPr")),
        indent: readParagraphIndent(elem.getFirstOrEmpty("w:ind"))
    }
    return paragraphProperties;
}

function readNumberingProperties(styleId: string, elem: ONode): NumberingLevel | null {
    const level = elem.getFirstOrEmpty("w:ilvl").attributes["w:val"];
    const numId = elem.getFirstOrEmpty("w:numId").attributes["w:val"];
    if (level !== undefined && numId !== undefined) {
        return numberings.findLevel(numId, level);
    }

    if (!styleId) return null;
    const numberingLevel = numberings.findLevelByParagraphStyleId(styleId);
    return numberingLevel;
}

function readParagraphIndent(elem: ONode): IndentProperty {
    return {
        start: elem.attributes["w:start"] || elem.attributes["w:left"],
        end: elem.attributes["w:end"] || elem.attributes["w:right"],
        firstLine: elem.attributes["w:firstLine"],
        hanging: elem.attributes["w:hanging"]
    };
}

/**
 * 런(Run) 파싱
 */
function readRun(elem: ONode): Result {
    const runProps = readRunProperties(elem.getFirstOrEmpty("w:rPr"));
    const childrenResult = readONodes(elem.children);
    let children = childrenResult.value;
    const hyperlinkOptions = currentHyperlinkOptions();
    if (hyperlinkOptions !== null) {
        const { href, anchor, targetFrame } = hyperlinkOptions;
        children = [new DocHyperlink(children, href, anchor, targetFrame)];
    }

    if (runProps && children) {
        const run = new DocRun(children, runProps);
        return new Result([run]);
    } else {
        return new Result();
    }
}

function readRunProperties(elem: ONode): RunProperties {
    const style = readStyle(elem, "w:rStyle", "Run", styles!.findCharacterStyleById);
    const fontSizeString = elem.getFirstOrEmpty("w:sz").attributes["w:val"];
    // w:sz는 half-point 단위이므로 2로 나눔
    const fontSize = /^[0-9]+$/.test(fontSizeString) ? parseInt(fontSizeString, 10) / 2 : null;
    const runProperties: RunProperties = {
        styleId: style.styleId,
        styleName: style.name,
        verticalAlignment: elem.getFirstOrEmpty("w:vertAlign").attributes["w:val"] as VERTICAL_ALIGNMENT,
        font: elem.getFirstOrEmpty("w:rFonts").attributes["w:ascii"],
        fontSize: fontSize,
        isBold: readBooleanElement(elem.getFirst("w:b") ?? null),
        isUnderline: readUnderline(elem.getFirst("w:u") ?? null),
        isItalic: readBooleanElement(elem.getFirst("w:i") ?? null),
        isStrikethrough: readBooleanElement(elem.getFirst("w:strike") ?? null),
        isAllCaps: readBooleanElement(elem.getFirst("w:caps") ?? null),
        isSmallCaps: readBooleanElement(elem.getFirst("w:smallCaps") ?? null),
        highlight: readHighlightValue(elem.getFirstOrEmpty("w:highlight").attributes["w:val"])
    };
    return runProperties;
}

function readBooleanElement(element: ONode | null): boolean {
    if (!element) return false;
    const value = element.attributes["w:val"];
    return value !== "false" && value !== "0";
}

function readUnderline(element: ONode | null): boolean {
    if (!element) return false;
    const value = element.attributes["w:val"];
    return value !== undefined && value !== "false" && value !== "0" && value !== "none";
}

function readHighlightValue(value: string | null): string | null {
    if (!value || value === "none") return null;
    return value;
}

function currentHyperlinkOptions(): { href?: string; anchor?: string; targetFrame?: string } | null {
    const topHyperlink = complexFieldStack
        .filter(complexField => complexField.type === "hyperlink")
        .at(-1);
    return topHyperlink && topHyperlink.options ? topHyperlink.options : null;
}

function readText(element: ONode): Result {
    const value = element.getText();
    return new Result(new DocText(value));
}

function readTab(): Result {
    return new Result(new DocTab());
}

function readNoBreakHyphen(): Result {
    return new Result(new DocText("\u2011"));
}

function readSoftHyphen(): Result {
    return new Result(new DocText("\u00AD"));
}

function readHyperlink(elem: ONode): Result {
    const relationshipId = elem.attributes["r:id"];
    const anchor = elem.attributes["w:anchor"];
    const readResult = readONodes(elem.children);

    let nodes = readResult.value;
    function createHyperlink(options: { href?: string; anchor?: string; }): DocHyperlink {
        const href = options.href;
        const anchor = options.anchor;
        const targetFrame = elem.attributes["w:tgtFrame"] || '';
        return new DocHyperlink(readResult.value, href, anchor, targetFrame);
    }
    if (relationshipId) {
        let href = relationships.findTargetByRelationshipId(relationshipId);
        if (anchor) {
            href = uris.replaceFragment(href, anchor);
        }
        nodes = [createHyperlink({ href })];
    } else if (anchor) {
        nodes = [createHyperlink({ anchor })];
    }

    return new Result(nodes, readResult.extra);
}

function readBreak(elem: ONode): Result {
    const breakType = elem.attributes["w:type"];
    if (breakType == null || breakType === "textWrapping") {
        return new Result(new DocBreak("line"));
    }
    if (breakType === "page") {
        return new Result(new DocBreak("page"));
    }
    if (breakType === "column") {
        return new Result(new DocBreak("column"));
    }
    collectWarning(`지원되지 않는 break 타입: ${breakType}`);
    return new Result();
}

function readSdt(elem: ONode): Result {
    const checkbox = elem
        .getFirstOrEmpty("w:sdtPr")
        .getFirst("wordml:checkbox");

    if (checkbox) {
        const checkedElement = checkbox.getFirst("wordml:checked");
        const value = checkedElement?.attributes["wordml:val"]
        const isChecked = value !== undefined && value !== "false" && value !== "0";
        return new Result(new DocCheckbox(isChecked));
    }
    return readONodes(elem.getFirstOrEmpty("w:sdtContent").children);
}

function readFldChar(elem: ONode): Result {
    const type = elem.attributes["w:fldCharType"];
    if (type === "begin") {
        complexFieldStack.push({ type: "begin", fldChar: elem });
        currentInstrText = [];
    } else if (type === "end") {
        let complexFieldEnd = complexFieldStack.pop();
        if (complexFieldEnd && complexFieldEnd.type === "begin") {
            complexFieldEnd = parseCurrentInstrText(complexFieldEnd);
        }
        if (complexFieldEnd && complexFieldEnd.type === "checkbox") {
            return new Result(new DocCheckbox(complexFieldEnd.checked));
        }
    } else if (type === "separate") {
        const complexFieldSeparate = complexFieldStack.pop();
        const complexField = parseCurrentInstrText(complexFieldSeparate!);
        complexFieldStack.push(complexField);
    }
    return new Result();
}

function parseCurrentInstrText(complexField: ComplexField): ComplexField {
    const instrText = currentInstrText.join('');

    const externalLinkResult = /\s*HYPERLINK "(.*)"/.exec(instrText);
    if (externalLinkResult) {
        return { type: "hyperlink", options: { href: externalLinkResult[1] } };
    }

    const internalLinkResult = /\s*HYPERLINK\s+\\l\s+"(.*)"/.exec(instrText);
    if (internalLinkResult) {
        return { type: "hyperlink", options: { anchor: internalLinkResult[1] } };
    }

    const checkboxResult = /\s*FORMCHECKBOX\s*/.exec(instrText);
    if (checkboxResult) {
        const fldChar = complexField.type === "begin" ? complexField.fldChar! : emptyONode;
        const checkboxElement = fldChar
            .getFirstOrEmpty("w:ffData")
            .getFirstOrEmpty("w:checkBox");
        const checkedElement = checkboxElement.getFirst("w:checked");
        const checked = checkedElement == null ?
            readBooleanElement(checkboxElement.getFirst("w:default")!) :
            readBooleanElement(checkedElement);
        return { type: "checkbox", checked: checked };
    }

    return { type: "unknown" };
}

function readInstrText(element: ONode): Result {
    currentInstrText.push(element.text);
    return new Result();
}

function readSymbol(element: ONode): Result {
    // See 17.3.3.30 sym (Symbol Character) of ECMA-376 4th edition Part 1
    const font = element.attributes["w:font"];
    const char = element.attributes["w:char"];
    let unicodeChar = dingbatToUnicode.hex(font, char);
    if (unicodeChar == null && /^F0..$/.test(char)) {
        unicodeChar = dingbatToUnicode.hex(font, char.substring(2));
    }

    if (unicodeChar == null) {
        collectWarning(`지원되지 않는 문자를 가진 w:sym 요소가 무시됨: char '${char}' in font '${font}'`);
        return new Result();
    } else {
        const value = unicodeChar.string;
        collectInfo(`체크 - readSymbol: ${value}`)
        return new Result(new DocText(value));
    }
}

/**
 * 테이블 파싱
 */
function readTable(elem: ONode): Result {
    const tableProps = readTableProperties(elem);

    const rowResults = readONodes(elem.children);
    const rows = calculateRowSpans(rowResults.value as DocTableRow[]);

    return new Result(new DocTable(rows, tableProps));
}

function readTableProperties(elem: ONode): TableProperties {
    const style = readStyle(elem.getFirstOrEmpty("w:tblPr"), "w:tblStyle", "Table", styles!.findTableStyleById);

    const gridWidths = elem.getFirstOrEmpty("w:tblGrid")
        .children.map(child => (child as ONode).attributes["w:w"])

    const tableProperties: TableProperties = {
        styleId: style.styleId,
        styleName: style.name,
        gridWidths: gridWidths
    };
    return tableProperties;
}

function readTableRow(elem: ONode): Result {
    const readResult = readONodes(elem.children);

    const properties = elem.getFirstOrEmpty("w:trPr");
    const isHeader = !!properties.getFirst("w:tblHeader");
    const tableRow = new DocTableRow(readResult.value, isHeader);

    return new Result(tableRow, readResult.extra);
}

function readTableCell(elem: ONode): Result {
    const readResult = readONodes(elem.children);
    const properties = elem.getFirstOrEmpty("w:tcPr");
    const gridSpan = properties.getFirstOrEmpty("w:gridSpan").attributes["w:val"];
    const cellProperties = {
        cols: gridSpan ? parseInt(gridSpan, 10) : 1,
        rows: 1,
        width: properties.getFirstOrEmpty("w:tcW").attributes["w:w"],
        vAlign: properties.getFirstOrEmpty("w:vAlign").attributes["w:val"],
        hAlign: elem.getFirstOrEmpty("w:p").getFirstOrEmpty("w:pPr").getFirstOrEmpty("w:jc").attributes["w:val"],
    }
    const cell = new DocTableCell(readResult.value, cellProperties);
    (cell as TableCellWithVMerge)._vMerge = readVMerge(properties);

    return new Result(cell, readResult.extra);
}

function readVMerge(properties: ONode): boolean | null {
    const element = properties.getFirst("w:vMerge");
    if (element) {
        const val = element.attributes["w:val"];
        return val === "continue" || !val;
    } else {
        return null;
    }
}

function calculateRowSpans(rows: DocTableRow[]): DocTableRow[] {
    const columns: Record<number, TableCellWithVMerge> = {};
    rows.forEach(row => {
        let idx = 0;
        row.children.forEach((cell: TableCellWithVMerge) => {
            if (cell._vMerge && columns[idx]) {
                columns[idx].rows++;
            } else {
                columns[idx] = cell;
                cell._vMerge = false;
            }
            idx += cell.cols;
        });
    });

    rows.forEach(row => {
        row.children = row.children.filter((cell: TableCellWithVMerge) => !cell._vMerge);
    });

    return rows;
}

/**
 * Drawing(이미지 등) 파싱
 */
function readDrawingElem(elem: ONode): Result {
    const blips = elem
        // .getElementsByTagName("a:graphic")
        // .getElementsByTagName("a:graphicData")
        // .getElementsByTagName("pic:pic")
        // .getElementsByTagName("pic:blipFill")
        .getElementsByTagName("a:blip");

    return Result.combineResults(blips.map(blip => readBlip(elem, blip)));
}

function readBlip(element: ONode, blip: ONode): Result {
    const { cx, cy } = element.getFirst("wp:extent")!.attributes; // 이미지 사이즈 ★
    const blipImageFilePath = findBlipImageFilePath(blip);
    if (blipImageFilePath.length > 0) {
        return readImage(blipImageFilePath, cx, cy);
    }
    return new Result();
}

function findBlipImageFilePath(blip: ONode): string {
    const embeddedRelationshipId = blip.attributes["r:embed"];
    if (embeddedRelationshipId) {
        return uris.uriToZipEntryName(
            "word", relationships.findTargetByRelationshipId(embeddedRelationshipId)
        );
    }
    const linkRelationshipId = blip.attributes["r:link"];
    if (linkRelationshipId) {
        const imagePath = relationships.findTargetByRelationshipId(linkRelationshipId);
        collectWarning(`외부 파일은 처리되지 않습니다: ${imagePath}`)
    }
    collectWarning("a:blip 요소의 rId에 대응하는 이미지 파일을 찾을 수 없습니다");
    return '';
}

function readShape(element: ONode): Result {
    const style = element.attributes['style'].split(';'); // 이미지 사이즈 ★
    const width = style.find(s => s.startsWith('width:'))?.replace('width:', '');
    const height = style.find(s => s.startsWith('height:'))?.replace('height:', '');
    if (!width || !height) {
        collectWarning("이미지 사이즈를 읽을 수 없습니다");
        return new Result();
    }
    const w = Number(width.replace('pt', '')) * 12700; // 1pt = 12700 EMU
    const h = Number(height.replace('pt', '')) * 12700; // 1pt = 12700 EMU

    const relationshipId = element.getFirstOrEmpty("v:imagedata").attributes['r:id'];
    if (!relationshipId) {
        collectWarning("v:imagedata 요소에 relationship ID가 없으므로 무시됨");
        return new Result();
    }
    const shapeImageFilePath = uris.uriToZipEntryName(
        "word", relationships.findTargetByRelationshipId(relationshipId)
    );
    return readImage(shapeImageFilePath, w.toString(), h.toString());
}

function readImage(imageFilePath: string, w: string, h: string): Result {
    const contentType = contentTypes.findContentType(imageFilePath);
    if (!supportedImageTypes.has(contentType)) {
        collectWarning(`웹 브라우저에서 표시되지 않을 수 있음 (이미지 타입: ${contentType})`);
    }
    return new Result(new DocImage(w, h, contentType, imageFilePath));
}

function readOMath(elem: ONode): Result {
    return new Result(new DocMath(elem.ooxml));
}

function readOMathPara(elem: ONode): Result {
    const children = readONodes(elem.children).value;
    return new Result(new DocMathPara(elem.ooxml, children));
}

/**
 * 스타일 파싱 (공통)
 */
function readStyle(
    elem: ONode,
    styleTagName: string,
    styleType: string,
    findStyleById: (id: string) => StyleInfo | undefined
): { styleId: string, name: string } {
    const styleElement = elem.getFirst(styleTagName);
    let styleId: string = '';
    let name: string = '';
    if (styleElement) {
        styleId = styleElement.attributes["w:val"] ?? '';
        if (styleId) {
            const style = findStyleById(styleId);
            if (!style) collectWarning(`'${styleType}'의 스타일 ID '${styleId}'가 문서에 정의되어 있지 않음`);
            name = style?.name ?? '';
        }
    }
    return { styleId: styleId, name: name };
}

const supportedImageTypes = new Set([
    "image/png",
    "image/gif",
    "image/jpg",
    "image/jpeg",
    "image/svg+xml",
    "image/tif",
    "image/tiff"
]);

const ignoredElements = new Set([
    "m:oMathParaPr",
    "office-word:wrap",
    "v:shadow",
    "v:shapetype",
    "w:annotationRef",
    "w:bookmarkStart",
    "w:bookmarkEnd",
    "w:sectPr",
    "w:proofErr",
    "w:lastRenderedPageBreak",
    "w:commentRangeStart",
    "w:commentRangeEnd",
    "w:del",
    "w:footnoteRef",
    "w:endnoteRef",
    "w:pPr",
    "w:rPr",
    "w:tblPr",
    "w:tblGrid",
    "w:trPr",
    "w:tcPr",
    "w:tblPrEx"
]);
