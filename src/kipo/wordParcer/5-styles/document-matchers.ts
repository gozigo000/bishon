import { DocNode, DocParagraph } from "../4-docNode/docNodes.js";

export interface MatcherOptions {
    styleId?: string;
    styleName?: { operator: (a: string, b: string) => boolean; operand: string };
    list?: { levelIndex: number; isOrdered: boolean };
}

export class Matcher {
    private _elementType: string;
    private _styleId?: string;
    private _styleName?: { operator: (a: string, b: string) => boolean; operand: string };
    private _listIndex?: number;
    private _listIsOrdered?: boolean;
    private _breakType?: string;

    constructor(elementType: string, options: MatcherOptions = {}) {
        this._elementType = elementType;
        this._styleId = options.styleId;
        this._styleName = options.styleName;
        if (options.list) {
            this._listIndex = options.list.levelIndex;
            this._listIsOrdered = options.list.isOrdered;
        }
    }

    matches(element: DocNode): boolean {
        function isListElement(element: DocParagraph, levelIndex: number, isOrdered: boolean): boolean {
            if (element.numbering) {
                console.debug(`체크 - element.numbering: ${element.numbering}`);
            }
            return Number(element.numbering?.level) === levelIndex &&
                element.numbering?.isOrdered === isOrdered;
        }
        return element.type === this._elementType &&
            (this._styleId === undefined || (element as any).styleId === this._styleId) &&
            (this._styleName === undefined || (!!(element as any).styleName && 
                this._styleName.operator(this._styleName.operand, (element as any).styleName))) &&
            (this._listIndex === undefined || 
                isListElement((element as any), this._listIndex, this._listIsOrdered ?? false)) &&
            (this._breakType === undefined || this._breakType === (element as any).breakType);
    }
}

export class HighlightMatcher {
    private _color?: string;
    constructor(options: { color?: string } = {}) {
        this._color = options.color;
    }
    matches(element: any): boolean {
        return element.type === "highlight" &&
            (this._color === undefined || element.color === this._color);
    }
}

export class BreakMatcher {
    private _breakType?: string;
    constructor(options: { breakType?: string } = {}) {
        this._breakType = options.breakType;
    }
    matches(element: any): boolean {
        return element.type === "break" &&
            (this._breakType === undefined || element.breakType === this._breakType);
    }
}

export function isEqualTo(value: string) {
    return {
        operand: value,
        operator: (s1: string, s2: string): boolean => s1.toUpperCase() === s2.toUpperCase()
    };
}

export function startsWith(value: string) {
    return {
        operand: value,
        operator: (s1: string, s2: string): boolean => s2.toUpperCase().startsWith(s1.toUpperCase())
    };
}
