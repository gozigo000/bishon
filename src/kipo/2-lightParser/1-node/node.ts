import { XNodeType } from "./nodeType";
import { appendChild, appendSibling, prependChild, prependSibling, removeNode } from "../2-domutils/manipulate";
import { findAll, findOne, getNextElemSibling, getPrevElemSibling, getSiblings, hasOne } from "../2-domutils/search";
import { textContent } from "../3-dom-serialize/dom-text";
import { renderNode, renderNodes } from "../3-dom-serialize/dom-stringfier";
import { KipoTag, KipoTagName } from "../../0-data/kipoTitles";

/** 태그 속성 */
type Attribute = { name: string; value: string; }

/** 자식 노드를 가질 수 있는 노드 */
export type XParentNode =
    | XDocument
    | XElement
    | XCDATA

/** 자식 노드가 될 수 있는 노드 */
export type XNode =
    | XDocument // `Document` is also used for document fragments, and can be a child node.
    | XElement
    | XCDATA
    | XText
    | XComment
    | XProcessingInstruction

/**
 * This object will be used as the prototype for Nodes 
 * when creating a DOM-Level-1-compliant structure.

 * ```text
 * XNodeBase
 *  ㄴ XNodeWithData
 *      ㄴ XText
 *      ㄴ XComment
 *      ㄴ XProcessingInstruction
 *  ㄴ XNodeWithChildren (XParentNode)
 *      ㄴ XDocument
 *      ㄴ XElement
 *      ㄴ XCDATA
 * ```
 */
export abstract class XNodeBase {
    /** Node type */
    abstract readonly type: XNodeType;
    /** `null` if node is a root node */
    parent: XNode | null = null;

    /** Only `XElement` nodes have a tag name. */
    tagName: string = '';
    /** Only `XElement` nodes can have attributes. */
    attrs: Record<string, string> = {};

    hasAttr(attrName: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.attrs, attrName) &&
            this.attrs[attrName] !== undefined;
    }
    getAttrValue(attrName: string): string | undefined {
        return this.attrs[attrName];
    }
    getAttrArray(): Attribute[] {
        return Object.entries(this.attrs).map(([name, value]) => ({ name, value }));
    }

    /** Only `XDocument`, `XElement`, `XCDATA` nodes can have children. */
    childNodes: XNode[] = [];

    get childElems(): XElement[] {
        return this.childNodes.filter(node => isXElem(node));
    }

    get childTexts(): XText[] {
        return this.childNodes.filter(node => isXText(node));
    }

    /** 자식노드 or `null` */
    getChildNodeAt(idx: number): XNode | null {
        return this.childNodes.at(idx) ?? null;
    }

    /** 태그명이 일치하는 '후손' 노드가 있는지 확인 */
    hasElem(tagName: string): boolean {
        tagName = tagName.replace(/^<|>$/g, '');
        return hasOne(this as XNode, node => isXElem(node) && node.tagName === tagName, true);
    }

    /** 태그명이 일치하는 '첫번째' 후손 노드 or `null` */
    getElemByTag(tagName: string): XElement | null {
        tagName = tagName.replace(/^<|>$/g, '');
        return findOne(this as XNode, node => isXElem(node) && node.tagName === tagName, true) as XElement | null;
    }

    /** 태그명이 일치하는 모든 '후손' 노드 배열 */
    getElemsByTag(tagName: string): XElement[] {
        tagName = tagName.replace(/^<|>$/g, '');
        return findAll(this as XNode, node => isXElem(node) && node.tagName === tagName, true) as XElement[];
    }

    /** 태그명이 일치하는 '첫번째' 자식 노드 or `null` */
    getChildElemByTag(tagName: string): XElement | null {
        tagName = tagName.replace(/^<|>$/g, '');
        return findOne(this as XNode, node => isXElem(node) && node.tagName === tagName, false) as XElement | null;
    }

    /** 태그명이 일치하는 모든 자식 노드 배열 */
    getChildElemsByTag(tagName: string): XElement[] {
        tagName = tagName.replace(/^<|>$/g, '');
        return findAll(this as XNode, node => isXElem(node) && node.tagName === tagName, false) as XElement[];
    }

    /** `XNodeType`이 일치하는 모든 '후손' 노드 배열 */
    getNodesByType(type: XNodeType): XNode[] {
        return findAll(this as XNode, node => node.type === type, true)
    }

    /** `XNodeType`이 일치하는 '첫번째' 후손 노드 or `null` */
    getNodeByType(type: XNodeType): XNode | null {
        return findOne(this as XNode, node => node.type === type, true)
    }

    /** 태그명이 일치하는 '후손' KIPO 노드가 있는지 확인 */
    hasKipoElem(tag: KipoTag): boolean {
        const tagName = KipoTagName[tag];
        return hasOne(this as XNode, node => isXElem(node) && node.tagName === tagName, true);
    }

    /** 태그명이 일치하는 모든 '후손' KIPO 노드 배열 */
    getKipoElems(tag: KipoTag): XElement[] {
        const tagName = KipoTagName[tag];
        return findAll(this as XNode, node => isXElem(node) && node.tagName === tagName, true) as XElement[];
    }

    /** 태그명이 일치하는 '첫번째' 후손 KIPO 노드 or `null` */
    getKipoElem(tag: KipoTag): XElement | null {
        const tagName = KipoTagName[tag];
        return findOne(this as XNode, node => isXElem(node) && node.tagName === tagName, true) as XElement | null;
    }

    /** 자기 자신을 포함한 모든 `XElement`에 대해서 {@link callback} 수행 */
    forEachElem(callback: (elem: XElement) => void): void {
        if (this.type === XNodeType.Element) {
            callback(this as XElement);
            return;
        }
        this.childNodes.forEach(node => {
            node.forEachElem(callback);
        });
    }
    
    /** 자기 자신을 포함한 모든 `XText`에 대해서 {@link callback} 수행 */
    forEachXText(callback: (content: string) => string): void {
        if (this.type === XNodeType.Text) {
            this.content = callback(this.content);
            return;
        }
        this.childNodes.forEach(node => {
            node.forEachXText(callback);
        });
    }

    /** 연속된 XText 노드들을 하나로 병합 */
    mergeTextNodes(): void {
        if (this.type === XNodeType.Text) {
            while (this.nextSibling?.type === XNodeType.Text) {
                const next = this.nextSibling;
                this.content += next.content;
                removeNode(next);
            }
            return;
        }
        this.childNodes.forEach(node => {
            node.mergeTextNodes();
        });
    }

    /**
     * 자식 노드들 뒤에 추가
     * @note `child`는 원래 위치하던 DOM에서 제거된 후에 삽입됨
     */
    appendChild(child: XNode): void {
        appendChild(this as XParentNode, child);
    }

    /**
     * 자식 노드들 앞에 추가
     * @note `child`는 원래 위치하던 DOM에서 제거된 후에 삽입됨
     */
    prependChild(child: XNode): void {
        prependChild(this as XParentNode, child);
    }

    prevSibling: XNode | null = null;
    nextSibling: XNode | null = null;

    get nextElemSibling(): XElement | null {
        return getNextElemSibling(this as XNode);
    }
    get prevElemSibling(): XElement | null {
        return getPrevElemSibling(this as XNode);
    }

    /** 자기 자신을 포함한 형제 노드 배열 반환 */
    getSiblings(): XNode[] {
        return getSiblings(this as XNode);
    }

    /** 
     * 자기 뒤에 형제 노드 추가
     * @note `node`는 원래 위치하던 DOM에서 제거된 후에 삽입됨
     */
    appendSibling(node: XNode): void {
        appendSibling(this as XNode, node);
    }

    /** 
     * 자기 앞에 형제 노드 추가 
     * @note `node`는 원래 위치하던 DOM에서 제거된 후에 삽입됨
     */
    prependSibling(node: XNode): void {
        prependSibling(this as XNode, node);
    }

    /** 
     * Only `XText`, `XComment`, `XProcessingInstruction` nodes can have data. 
     * @internal
     */
    content: string = '';

    get outerXML(): string {
        return renderNode(this as XNode);
    }
    
    get innerXML(): string {
        return renderNodes(this.childNodes);
    }

    get textContent(): string {
        return textContent(this as XNode);
    }
}

/**
 * A node that contains some data.
 */
export abstract class XNodeWithData extends XNodeBase {
    /** 
     * @param content The data of the node ( =`nodeValue` in [DOM spec](https://dom.spec.whatwg.org))
     */
    constructor(content: string) {
        super();
        this.content = content;
    }
    override hasAttr(_: string): boolean { return false; }
    override getAttrValue(_: string): string | undefined { return undefined; }
    override getAttrArray(): Attribute[] { return []; }
    override get childElems(): XElement[] { return []; }
    override get childTexts(): XText[] { return []; }
    override getChildNodeAt(_: number): XNode | null { return null; }
    override hasElem(_: string): boolean { return false; }
    override getElemByTag(_: string): XElement | null { return null; }
    override getElemsByTag(_: string): XElement[] { return []; }
    override getChildElemByTag(_: string): XElement | null { return null; }
    override getChildElemsByTag(_: string): XElement[] { return []; }
    override getNodesByType(_: XNodeType): XNode[] { return []; }
    override getNodeByType(_: XNodeType): XNode | null { return null; }
    override hasKipoElem(_: KipoTag): boolean { return false; }
    override getKipoElems(_: KipoTag): XElement[] { return []; }
    override getKipoElem(_: KipoTag): XElement | null { return null; }
    override forEachElem(_: (_: XElement) => void): void { return; }
    override appendChild(_: XNode): void { return; }
    override prependChild(_: XNode): void { return; }
}

export class XText extends XNodeWithData {
    readonly type = XNodeType.Text;
}

export class XComment extends XNodeWithData {
    readonly type = XNodeType.Comment;
}

export class XProcessingInstruction extends XNodeWithData {
    readonly type = XNodeType.Directive;
    /** Processing instructions, including doc types */
    constructor(public name: string, content: string) { super(content); }
}

/**
 * A node that can have children.
 */
export abstract class XNodeWithChildren extends XNodeBase {
    constructor(children: XNode[]) {
        super();
        this.childNodes = children;
    }
}

export class XCDATA extends XNodeWithChildren {
    readonly type = XNodeType.CDATA;
}

/** The root node of the document */
export class XDocument extends XNodeWithChildren {
    readonly type = XNodeType.Root;
}

/** An element node within the DOM */
export class XElement extends XNodeWithChildren {
    readonly type = XNodeType.Element;
    constructor(
        tagName: string,
        attrs: Record<string, string>,
        children: XNode[] = [],
    ) {
        super(children);
        this.tagName = tagName;
        this.attrs = attrs;
    }
}

// 노드 타입 체크
export function isXCDATA(node: XNode): node is XCDATA { return node.type === XNodeType.CDATA; }
export function isXComment(node: XNode): node is XComment { return node.type === XNodeType.Comment; }
export function isXDirective(node: XNode): node is XProcessingInstruction { return node.type === XNodeType.Directive; }
export function isXDocu(node: XNode): node is XDocument { return node.type === XNodeType.Root; }
export function isXText(node: XNode): node is XText { return node.type === XNodeType.Text; }
export function isXElem(node: XNode): node is XElement { return node.type === XNodeType.Element; }
