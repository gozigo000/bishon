import { collectWarning } from "../../0-utils/errorCollector";

export type DocNode = 
    | DocDocument
    | DocParagraph
    | DocRun
    | DocText
    | DocTab
    | DocHyperlink
    | DocCheckbox
    | DocImage
    | DocTable
    | DocTableRow
    | DocTableCell
    | DocBreak
    | DocMath
    | DocMathPara

export class DocDocument {
    public type: DocNodeType = "document";
    constructor(
        public children: DocNode[] = []
    ) { }
}

export class DocParagraph {
    public type: DocNodeType = "paragraph";
    public styleId: string | null = null;
    public styleName: string | null = null;
    public alignment: string | null = null;
    public numbering: NumberingLevel | null = null;
    public indent: IndentProperty = null;
    public children: DocNode[] = [];

    constructor(
        children: DocNode[] = [],
        properties: ParagraphProperties
    ) {
        this.children = children;
        this.styleId = properties.styleId || null;
        this.styleName = properties.styleName || null;
        this.alignment = properties.alignment || null;
        this.numbering = properties.numbering || null;
        this.indent = {
            start: properties.indent?.start || null,
            end: properties.indent?.end || null,
            firstLine: properties.indent?.firstLine || null,
            hanging: properties.indent?.hanging || null
        }
    }
}

export class DocRun {
    public type: DocNodeType = "run";
    public styleId: string | null = null;
    public styleName: string | null = null;
    public isBold: boolean = false;
    public isUnderline: boolean = false;
    public isItalic: boolean = false;
    public isStrikethrough: boolean = false;
    public isAllCaps: boolean = false;
    public isSmallCaps: boolean = false;
    public verticalAlignment: VERTICAL_ALIGNMENT = "baseline";
    public font: string | null = null;
    public fontSize: any = null;
    public highlight: any = null;
    public children: DocNode[] = [];

    constructor(
        children: DocNode[] = [],
        properties: RunProperties
    ) {
        this.children = children;
        this.styleId = properties.styleId || null;
        this.styleName = properties.styleName || null;
        this.isBold = !!properties.isBold;
        this.isUnderline = !!properties.isUnderline;
        this.isItalic = !!properties.isItalic;
        this.isStrikethrough = !!properties.isStrikethrough;
        this.isAllCaps = !!properties.isAllCaps;
        this.isSmallCaps = !!properties.isSmallCaps;
        this.verticalAlignment = properties.verticalAlignment;
        this.font = properties.font || null;
        this.fontSize = properties.fontSize || null;
        this.highlight = properties.highlight || null;
    }
}

export class DocText {
    public type: DocNodeType = "text";
    constructor(
        public value: string = ''
    ) {}
}

export class DocTab {
    public type: DocNodeType = "tab";
}

export class DocCheckbox {
    public type: DocNodeType = "checkbox";
    constructor(
        public checked: boolean = false
    ) {}
}

export class DocHyperlink {
    public type: DocNodeType = "hyperlink";
    constructor(
        public children: DocNode[] = [],
        public href: string = '',
        public anchor: string = '',
        public targetFrame: string = ''
    ) {}
}

export class DocImage {
    public type: DocNodeType = "image";
    constructor(
        public w: string,
        public h: string,
        public contentType: string = '',
        public filePath: string = '',
    ) {}
}

export class DocTable {
    public type: DocNodeType = "table";
    public styleId: string | null = null;
    public styleName: string | null = null;
    public gridWidths: string[] = [];
    public children: DocTableRow[] = [];

    constructor(
        children: DocNode[] = [],
        properties: TableProperties
    ) {
        children.forEach(node => {
            if (isTableRow(node)) {
                this.children.push(node);
            } else {
                collectWarning(`예상치 못한 노드: 테이블 행 병합이 잘못될 수 있음: ${node.type}`);
            }
        });
        this.styleId = properties.styleId || null;
        this.styleName = properties.styleName || null;
        this.gridWidths = properties.gridWidths || [];
    }
}

export class DocTableRow {
    public type: DocNodeType = "tableRow";
    public isHeader: boolean = false;
    public children: DocTableCell[] = [];

    constructor(
        children: DocNode[] = [],
        isHeader: boolean = false
    ) {
        children.forEach(node => {
            if (isTableCell(node)) {
                this.children.push(node);
            } else {
                collectWarning(`예상치 못한 노드: 테이블 셀 병합이 잘못될 수 있음: ${node.type}`);
            }
            return isTableCell(node)
        });
        this.isHeader = isHeader;
    }
}

export class DocTableCell {
    public type: DocNodeType = "tableCell";
    public cols: number;
    public rows: number;
    public width: string;
    public vAlign: string;
    public hAlign: string;

    constructor(
        public children: DocNode[] = [],
        properties: TableCellProperties
    ) {
        properties = properties as TableCellProperties;
        this.cols = properties.cols || 1;
        this.rows = properties.rows || 1;
        this.width = properties.width || '';
        this.vAlign = properties.vAlign || '';
        this.hAlign = properties.hAlign || '';
    }
}

export class DocBreak {
    public type: DocNodeType = "break";
    constructor(
        public breakType: string = ''
    ) {}
}

export class DocMath {
    public type: DocNodeType = "math";
    constructor(
        public omml: string
    ) {}
}

export class DocMathPara {
    public type: DocNodeType = "mathPara";
    public children: DocMath[] = [];
    constructor(
        public omml: string,
        children: DocNode[] = []
    ) {
        children.forEach(node => {
            if (isMath(node)) {
                this.children.push(node);
            } else {
                collectWarning(`예상치 못한 노드: 수식이 잘못될 수 있음: ${node.type}`);
            }
        });
    }
}

// 타입 체크
export const isDoc = (node: DocNode): node is DocDocument => node.type === "document";
export const isParagraph = (node: DocNode): node is DocParagraph => node.type === "paragraph";
export const isRun = (node: DocNode): node is DocRun => node.type === "run";
export const isText = (node: DocNode): node is DocText => node.type === "text";
export const isTab = (node: DocNode): node is DocTab => node.type === "tab";
export const isCheckbox = (node: DocNode): node is DocCheckbox => node.type === "checkbox";
export const isHyperlink = (node: DocNode): node is DocHyperlink => node.type === "hyperlink";
export const isImage = (node: DocNode): node is DocImage => node.type === "image";
export const isTable = (node: DocNode): node is DocTable => node.type === "table";
export const isTableRow = (node: DocNode): node is DocTableRow => node.type === "tableRow";
export const isTableCell = (node: DocNode): node is DocTableCell => node.type === "tableCell";
export const isBreak = (node: DocNode): node is DocBreak => node.type === "break";
export const isMath = (node: DocNode): node is DocMath => node.type === "math";
export const isMathPara = (node: DocNode): node is DocMathPara => node.type === "mathPara";
