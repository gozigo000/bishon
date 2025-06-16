declare type Input = {
    file: File;
} | {
    path: string;
} | {
    buffer: Buffer; 
} | {
    arrayBuffer: ArrayBuffer;
}

declare type Options = {
    styleMap?: string[];
    ignoreEmptyParagraphs?: boolean;
    prettyPrint?: boolean;
}

declare type Message = {
    type: MessageType;
    message: string;
    error?: unknown;
}

declare type MessageType = 'warning' | 'error';

/**********************************************/

declare type Styles = {
    findParagraphStyleById: (id: string) => StyleInfo | undefined;
    findCharacterStyleById: (id: string) => StyleInfo | undefined;
    findTableStyleById: (id: string) => StyleInfo | undefined;
    findNumberingStyleById: (id: string) => NumStyleInfo | undefined;
}

declare type StyleInfo = {
    type: string;
    styleId: string;
    name: string | null;
}

declare type NumStyleInfo = {
    numId: string;
}

declare type NumberingLevel = {
    isOrdered: boolean;
    level: string;
    paragraphStyleId?: string;
}

declare type ONodeType = "element" | "text" | "empty";

/**********************************************/

declare type DocNodeType = 
    | "document"
    | "paragraph"
    | "run"
    | "text"
    | "tab"
    | "checkbox"
    | "hyperlink"
    | "image"
    | "table"
    | "tableRow"
    | "tableCell"
    | "break"
    | "math"
    | "mathPara"

declare type VERTICAL_ALIGNMENT = 
    | "baseline"
    | "superscript"
    | "subscript"

declare type ParagraphProperties = {
    styleId: string;
    styleName: string;
    alignment: string;
    numbering: NumberingLevel | null;
    indent: IndentProperty;
}

declare type IndentProperty = { 
    start: string | null;
    end: string | null;
    firstLine: string | null;
    hanging: string | null;
} | null;

declare type RunProperties = {
    styleId: string;
    styleName: string;
    isBold: boolean;
    isUnderline: boolean;
    isItalic: boolean;
    isStrikethrough: boolean;
    isAllCaps: boolean;
    isSmallCaps: boolean;
    verticalAlignment: VERTICAL_ALIGNMENT;
    font: string | null;
    fontSize: any;
    highlight: any;
}

declare type TableProperties = {
    styleId: string;
    styleName: string;
    gridWidths: string[];
}

declare type TableCellProperties = {
    cols: number;
    rows: number;
    width: string;
    vAlign: string;
    hAlign: string;
}

declare type HtmlTagOptions = {
    fresh?: boolean;
    separator?: string;
}
