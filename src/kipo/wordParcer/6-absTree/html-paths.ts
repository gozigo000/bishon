import { isDeepStrictEqual } from 'util'
import { AstNode } from "./astNode";
import { collectInfo } from '../../0-utils/errorCollector';

export class HtmlPath {
    private _elements: HtmlTag[];

    constructor(elements: HtmlTag[]) {
        this._elements = elements;
    }

    wrap(generateNodes: () => AstNode[]): AstNode[] {
        let nodes = generateNodes();
        this._elements.reverse().forEach(elem => {
            nodes = [new AstNode("element", elem, nodes)];
        });
        return nodes;
    }
}

export class HtmlTag {
    tagName: string;
    tagNames: Record<string, boolean> = {};
    attributes: Record<string, string>;
    fresh: boolean;
    separator: string;

    constructor(tagName: string | string[], attributes?: Record<string, string>, options?: HtmlTagOptions) {
        if (Array.isArray(tagName)) {
            this.tagName = tagName[0];
            tagName.forEach(tn => this.tagNames[tn] = true);
        } else {
            this.tagName = tagName;
            this.tagNames[tagName] = true;
        }
        this.attributes = attributes || {};
        this.fresh = options?.fresh || false;
        this.separator = options?.separator || '';
    }

    matchesElement(element: { tagName: string; attributes: Record<string, any> }): boolean {
        return this.tagNames[element.tagName] &&
            isDeepStrictEqual(this.attributes, element.attributes);
    }

    wrap(generateNodes: () => AstNode[]): AstNode[] {
        const nodes = generateNodes();
        return [new AstNode("element", this, nodes)];
    }
}

export function makeHtmlPath(elementStyles: (string | HtmlTag)[]): HtmlPath {
    return new HtmlPath(elementStyles.map(elementStyle => {
        if (typeof elementStyle === "string") {
            collectInfo(`체크 - elementStyle: ${elementStyle}`);
            return new HtmlTag(elementStyle);
        }
        return elementStyle;
    }));
}

export const emptyHtmlPath = makeHtmlPath([]);
export const ignoredHtmlPath = {
    wrap: (): AstNode[] => []
};

