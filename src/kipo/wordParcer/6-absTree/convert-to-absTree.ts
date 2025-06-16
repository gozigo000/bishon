import {
    DocDocument, DocNode, DocParagraph, DocRun,
    DocCheckbox, DocImage, DocTable, DocTableRow,
    DocTableCell, DocBreak, DocMath, DocMathPara,
    isDoc, isParagraph, isRun, isText, isTab, isCheckbox,
    isImage, isTable, isBreak, isMath, isMathPara
} from "../4-docNode/docNodes.js";
import { parseStyle, StyleMapping } from "./style-reader.js";
import { emptyHtmlPath, HtmlTag, HtmlPath } from "./html-paths.js";
import { AstNode } from "./astNode.js";
import { simplify } from "./simplify.js";
import { collectWarning } from "../../errorCollector.js";
import { defaultStyleMap } from "../5-styles/default-style-map.js";

type HtmlOptions = {
    styleMap: StyleMapping[];
    ignoreEmptyParagraphs?: boolean;
}

let options: HtmlOptions = { styleMap: [] };

export async function fromDocNodeToAbsTree(docDoc: DocDocument, opts?: Options): Promise<AstNode[]> {
    const styleMap = (opts?.styleMap || defaultStyleMap);
    const parsedStyleMap = styleMap.map(str => parseStyle(str)).filter(s => !!s);

    options = {
        styleMap: parsedStyleMap,
        ignoreEmptyParagraphs: opts?.ignoreEmptyParagraphs
    };

    const ast = convertNode(docDoc);
    const simplifiedAst = simplify(ast);
    return simplifiedAst;
}

function convertNode(elem: DocNode): AstNode[] {
    if (isDoc(elem)) return elem.children.map(elem => convertNode(elem)).flat();
    if (isParagraph(elem)) return convertParagraph(elem);
    if (isRun(elem)) return convertRun(elem);
    if (isText(elem)) return [new AstNode("text", elem.value)];
    if (isTab(elem)) return [new AstNode("text", "\t")];
    if (isCheckbox(elem)) return convertCheckbox(elem);
    if (isImage(elem)) return convertImage(elem);
    if (isTable(elem)) return convertTable(elem);
    if (isBreak(elem)) return convertBreak(elem);
    if (isMath(elem)) return convertMath(elem);
    if (isMathPara(elem)) return convertMathPara(elem);
    return [];
}

function convertParagraph(elem: DocParagraph): AstNode[] {
    const style = findStyle(elem);
    if (!style && elem.styleId && 
        !['Normal (Web)', '바탕글'].includes(elem.styleName || '-')
    ) {
        collectWarning(`인식할 수 없는 paragraph style: '${elem.styleName}' (Style ID: ${elem.styleId})`);
    }
    const htmlPath = (style) ?
        style.to :
        new HtmlPath([new HtmlTag("p", {}, { fresh: true })]);

    return htmlPath.wrap(() => {
        const content = elem.children.map(elem => convertNode(elem)).flat();
        if (options.ignoreEmptyParagraphs) {
            return content;
        }
        return [new AstNode("forceWrite")].concat(content);
    });
}

function convertRun(elem: DocRun): AstNode[] {
    const paths: HtmlPath[] = [];
    if (elem.highlight !== null) {
        const path = findHtmlPath({ type: "highlight", color: elem.highlight });
        if (path) paths.push(path);
    }
    if (elem.isSmallCaps) {
        paths.push(findHtmlPathForRunProperty("smallCaps"));
    }
    if (elem.isAllCaps) {
        paths.push(findHtmlPathForRunProperty("allCaps"));
    }
    if (elem.isStrikethrough) {
        paths.push(findHtmlPathForRunProperty("strikethrough", "strike"));
    }
    if (elem.isItalic) {
        paths.push(findHtmlPathForRunProperty("italic", "i"));
    }
    if (elem.isUnderline) {
        paths.push(findHtmlPathForRunProperty("underline", "u"));
    }
    if (elem.isBold) {
        paths.push(findHtmlPathForRunProperty("bold", "b"));
    }
    if (elem.verticalAlignment === "subscript") {
        paths.push(new HtmlTag("sub") as any as HtmlPath);
    }
    if (elem.verticalAlignment === "superscript") {
        paths.push(new HtmlTag("sup") as any as HtmlPath);
    }
    const style = findStyle(elem);
    if (!style && elem.styleId) {
        collectWarning(`인식할 수 없는 run style: '${elem.styleName}' (Style ID: ${elem.styleId})`);
    }
    const stylePath = style ? style.to : emptyHtmlPath;
    paths.push(stylePath);

    let nodes = () => elem.children.map(elem => convertNode(elem)).flat();
    paths.forEach(path => {
        nodes = path.wrap.bind(path, nodes);
    });

    return nodes();
}

function findHtmlPathForRunProperty(elemType: string, defaultTagName?: string): HtmlPath {
    const path = findHtmlPath({ type: elemType });
    if (path) {
        return path;
    }
    if (defaultTagName) {
        return new HtmlTag(defaultTagName) as any as HtmlPath;
    }
    return emptyHtmlPath;
}

function convertCheckbox(elem: DocCheckbox): AstNode[] {
    const attributes: Record<string, string> = { type: "checkbox" };
    if (elem.checked) attributes["checked"] = "checked";
    return [new AstNode("element", new HtmlTag("input", attributes, { fresh: true }), [])];
}

function convertImage(node: DocImage): AstNode[] {
    const imgAttrs = {
        w: node.w, // 이미지 너비 속성 추가
        h: node.h, // 이미지 높이 속성 추가
        format: node.contentType,
        path: node.filePath // 이미지 경로 속성 추가
    };
    return [new AstNode("element", new HtmlTag("img", imgAttrs, { fresh: true }), [])];
}

function convertTable(elem: DocTable): AstNode[] {
    const gridWidths = elem.gridWidths.toString();
    const tablePath = new HtmlPath([
        new HtmlTag("p", {}, { fresh: true }), // <p> 태그로 <table> 태그 감싸기
        new HtmlTag("table", { gridWidths }, { fresh: true })
    ]);
    const withChildren = findHtmlPath(elem, tablePath)!
        .wrap(() => convertTableChildren(elem));
    return [new AstNode("forceWrite")].concat(withChildren);
}

function convertTableChildren(elem: DocTable): AstNode[] {
    let bodyIndex = elem.children.findIndex(
        child => child.type !== "tableRow" || !child.isHeader
    );
    if (bodyIndex === -1) {
        bodyIndex = elem.children.length || 0;
    }

    if (bodyIndex === 0) {
        return elem.children.map(elem => convertTableRow(elem, false));
    } else {
        const headRows = elem.children.slice(0, bodyIndex).map(elem => convertTableRow(elem, true));
        const bodyRows = elem.children.slice(bodyIndex).map(elem => convertTableRow(elem, false));
        return [
            new AstNode("element", new HtmlTag("thead", {}, { fresh: true }), headRows),
            new AstNode("element", new HtmlTag("tbody", {}, { fresh: true }), bodyRows)
        ];
    }
}

function convertTableRow(elem: DocTableRow, isTableHeader: boolean): AstNode {
    const children = elem.children.map(elem => convertTableCell(elem, isTableHeader));
    return new AstNode(
        "element",
        new HtmlTag("tr", {}, { fresh: true }),
        [new AstNode("forceWrite")].concat(children)
    );
}

function convertTableCell(elem: DocTableCell, isTableHeader: boolean): AstNode {
    const tagName = isTableHeader ? "th" : "td";
    const children = elem.children.map(elem => convertNode(elem)).flat();
    const attributes: Record<string, string> = {};
    attributes.cols = elem.cols.toString();
    attributes.rows = elem.rows.toString();
    attributes.wi = elem.width;
    if (elem.vAlign) attributes.valign = elem.vAlign;
    if (elem.hAlign) attributes.halign = elem.hAlign;

    return new AstNode(
        "element",
        new HtmlTag(tagName, attributes, { fresh: true }),
        [new AstNode("forceWrite")].concat(children)
    );
}

function convertBreak(elem: DocBreak): AstNode[] {
    const style = findStyle(elem);
    const htmlPath = style ? style.to :
        (elem.breakType === "line") ?
            new HtmlPath([new HtmlTag("br", {}, { fresh: true })]) :
            emptyHtmlPath;
    return htmlPath.wrap(() => []);
}

function convertMath(elem: DocMath): AstNode[] {
    return [new AstNode("element", new HtmlTag("math", { omml: elem.omml }), [])];
}

function convertMathPara(elem: DocMathPara): AstNode[] {
    const mathPath = new HtmlPath([new HtmlTag("mathPara", { omml: elem.omml }, { fresh: true })]);
    const withChildren = mathPath
        .wrap(() => elem.children.map(elem => convertMath(elem)[0]));
    return [new AstNode("forceWrite")].concat(withChildren);
}

function findHtmlPath(elem: DocNode | any, defaultPath?: HtmlPath): HtmlPath | undefined {
    const style = findStyle(elem);
    return style ? style.to : defaultPath;
}

function findStyle(elem: DocNode): StyleMapping | undefined {
    for (const style of options.styleMap) {
        if (style.from.matches(elem)) {
            return style;
        }
    }
    return undefined;
}
