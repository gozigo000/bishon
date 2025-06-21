import { XNodeType } from "./nodeType";
import { findAll, findOne, getNextElemSibling, getPrevElemSibling, getSiblings, hasOne } from "../2-domutils/search";
import { cloneNode, isEqualNode } from "../2-domutils/node-utils";
import { appendChild, appendSibling, prependChild, prependSibling, removeNode, replaceNode } from "../2-domutils/manipulate";
import { renderNode, renderNodes } from "../3-dom-serialize/dom-stringfier";
import { innerText } from "../3-dom-serialize/dom-text";

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

    /** Only `XElement` nodes have a tag name. */
    tagName: string = '';

    /** Only `XElement` nodes can have attributes. */
    attrs: Record<string, string> = {};
    
    hasAttr(attrName: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.attrs, attrName) &&
            this.attrs[attrName] !== undefined;
    }

    getAttrValue(attrName: string): string | undefined {
        const value = this.attrs[attrName];
        return value;
    }

    getAttrArray(): Attribute[] {
        return Object.entries(this.attrs).map(([name, value]) => ({ name, value }));
    }

    parent: XNode | null = null; // `null` if node is a root node
    prevSibling: XNode | null = null;
    nextSibling: XNode | null = null;

    /** Only `XDocument`, `XElement`, `XCDATA` nodes can have children. */
    childNodes: XNode[] = [];

    get childElems(): XElement[] {
        return this.childNodes.filter(node => isXElem(node));
    }

    get childTexts(): XText[] {
        return this.childNodes.filter(node => isXText(node));
    }

    /** Only `XText`, `XComment`, `XProcessingInstruction` nodes can have data. */
    content: string = '';

    get outerXML(): string {
        return renderNode(this as XNode);
    }

    get innerXML(): string {
        return renderNodes(this.childNodes);
    }

    get innerText(): string {
        return innerText(this as XNode);
    }

    /**
     * @returns `childNode` or `null` if there is no child node at `idx`.
     */
    getChildNodeAt(idx: number): XNode | null {
        return this.childNodes.at(idx) ?? null;
    }

    /**
     * @returns next `element sibling` or `null` if there is no next element sibling.
     */
    getNextElemSibling(): XElement | null {
        return getNextElemSibling(this as XNode);
    }

    /**
     * @returns previous `element sibling` or `null` if there is no previous element sibling.
     */
    getPrevElemSibling(): XElement | null {
        return getPrevElemSibling(this as XNode);
    }

    /**
    * @returns 자기 자신을 포함한 형제 노드 배열
    */
    getSiblings(): XNode[] {
        return getSiblings(this as XNode);
    }

    /**
     * 태그명으로 자식 노드 검색
     * @param isRecursive 후손 노드까지 검색할지 여부 (default: `false`)
     */
    getElemsByTagName(tagName: string, isRecursive: boolean = false): XElement[] {
        return findAll(this as XNode, node => isXElem(node) && node.tagName === tagName, isRecursive) as XElement[];
    }

    /**
    * 태그명이 일치하는 첫번째 노드 검색
    * @param isRecursive 후손 노드까지 검색할지 여부 (default: `false`)
    */
    getElemByTagName(tagName: string, isRecursive = false): XElement | null {
        return findOne(this as XNode, node => isXElem(node) && node.tagName === tagName, isRecursive) as XElement | null;
    }

    /**
     * test 함수를 만족하는 자식 노드가 있는지 확인
     * @param test Function to test.
     * @param isRecursive Also consider child nodes (default: `false`)
    */
    hasOne(test: (node: XNode) => boolean, isRecursive = false): boolean {
        return hasOne(this as XNode, test, isRecursive);
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

    /** 자기 뒤에 형제 노드로 추가 */
    appendSibling(node: XNode): void {
        appendSibling(this as XNode, node);
    }

    /** 자기 앞에 형제 노드로 추가 */
    prependSibling(node: XNode): void {
        prependSibling(this as XNode, node);
    }

    /** 자기를 DOM에서 제거 */
    removeFromDOM(): void {
        removeNode(this as XNode);
    }

    /** 자기를 새로운 노드로 교체 */
    replaceTo(newNode: XNode): void {
        replaceNode(this as XNode, newNode);
    }

    /** 자기와 다른 노드가 같은지 확인 */
    isEqualWith(node: XNode): boolean {
        return isEqualNode(this as XNode, node);
    }

    /** 자기를 복사 */
    cloneNode(isRecursive = false): XNode {
        return cloneNode(this as XNode, isRecursive);
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
    override getElemsByTagName(_: string, __: boolean = false): XElement[] { return []; }
    override getElemByTagName(_: string, __: boolean = false): XElement | null { return null; }
    override hasOne(_: (node: XNode) => boolean, __: boolean = false): boolean { return false; }
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
