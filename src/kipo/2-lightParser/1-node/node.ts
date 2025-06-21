import { XNodeType } from "./nodeType.js";
import { cloneNode, isEqualNode, removeNode, replaceNode } from "../2-domutils/node-utils.js";
import { renderNode, renderNodes, SerializerOptions } from "../3-dom-serialize/dom-stringfier.js";

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

    parent: XParentNode | null = null; // `null` if node is a root node
    prevSibling: XNode | null = null;
    nextSibling: XNode | null = null;

    /** Only `XDocument`, `XElement`, `XCDATA` nodes can have children. */
    childNodes: XNode[] = [];

    /** Only `XText`, `XComment`, `XProcessingInstruction` nodes can have data. */
    content: string = '';

    /**
     * @returns `childNode` or `null` if there is no child node at `idx`.
     */
    childNode(idx: number): XNode | null {
        return this.childNodes.at(idx) ?? null;
    }

    get childElems(): XElement[] {
        return this.childNodes.filter(node => isXElement(node));
    }

    get innerText(): string {
        if (isXText(this)) {
            return unEscapeXmlText(this.content);
        }
        let text = '';
        for (const child of this.childNodes) {
            text += child.innerText;
        }
        return text;
    }

    /**
     * @returns next `element sibling` or `null` if there is no next element sibling.
     */
    getNextElemSibling(): XElement | null {
        let next = this.nextSibling;
        while (next !== null && !isXElement(next)) {
            next = next.nextSibling;
        }
        return next;
    }

    /**
     * @returns previous `element sibling` or `null` if there is no previous element sibling.
     */
    getPrevElemSibling(): XElement | null {
        let prev = this.prevSibling;
        while (prev !== null && !isXElement(prev)) {
            prev = prev.prevSibling;
        }
        return prev;
    }

    /**
    * @returns 자기 자신을 포함한 형제 노드 배열
    */
    getSiblings<T extends XNodeBase>(this: T): T[] {
        // First, attempts to get the children through the node's parent.
        const parent = this.parent;
        if (parent !== null) {
            return parent.childNodes as T[];
        }
        // Second, if we don't have a parent (the node is a root node), 
        // we walk the node's `prevSibling` & `nextSibling` to get all siblings.
        const siblings: T[] = [this];
        let prev = this.prevSibling;
        let next = this.nextSibling;
        while (prev !== null) {
            siblings.unshift(prev as T);
            prev = prev.prevSibling;
        }
        while (next !== null) {
            siblings.push(next as T);
            next = next.nextSibling;
        }
        return siblings;
    }

    /**
     * Search a node or an array of nodes for nodes passing a test function.
     * @param test Function to test.
     * @param isRecursive Also consider child nodes (default: `false`)
     * @returns All nodes passing `test`.
     */
    findAll(test: (node: XNode) => boolean, isRecursive: boolean = false): XNode[] {
        const result: XNode[] = [];
        // Stack of the arrays we are looking at.
        const nodeStack: XNode[][] = [this.childNodes];
        // Stack of the indices within the arrays.
        const idxStack: number[] = [0];

        while (true) {
            // First, check if the current array has elements to test.
            if (idxStack[0] >= nodeStack[0].length) {
                // If we have no more arrays to test, we are done.
                if (idxStack.length === 1) {
                    return result;
                }
                // Otherwise, remove the current array from the stack.
                nodeStack.shift();
                idxStack.shift();
                // Loop back to the start to continue with the next array.
                continue;
            }

            const node = nodeStack[0][idxStack[0]++];
            if (test(node)) {
                result.push(node);
            }

            if (isRecursive && node.childNodes.length > 0) {
                // Add the children to the stack. We are DFS, 
                // so this is the next array we look at.
                nodeStack.unshift(node.childNodes);
                idxStack.unshift(0);
            }
        }
    }

    /**
     * 태그명으로 노드 검색
     * @param isRecursive 후손 노드까지 검색할지 여부 (default: `false`)
     */
    getElemsByTagName(tagName: string, isRecursive: boolean = false): XElement[] {
        return this.findAll(
            node => isXTag(node) && node.tagName === tagName, isRecursive
        ) as XElement[];
    }

    /**
     * Finds "first" node that passes a test.
     * @param test Function to test.
     * @param isRecursive Also consider child nodes (default: `false`)
     * @returns The first node that passes `test` or `null` if no node passes.
     */
    findOne(test: (node: XNode) => boolean, isRecursive = false): XNode | null {
        const nodesToTest = this.childNodes;
        for (let i = 0; i < nodesToTest.length; i++) {
            const node = nodesToTest[i];
            if (test(node)) {
                return node;
            }
            if (isRecursive && node.childNodes.length > 0) {
                const found = node.findOne(test, true);
                if (found) return found;
            }
        }
        return null;
    }

    /**
    * 태그명이 일치하는 첫번째 노드 검색
    * @param isRecursive 후손 노드까지 검색할지 여부 (default: `false`)
    */
    getElemByTagName(tagName: string, isRecursive = false): XElement | null {
        return this.findOne(
            node => isXTag(node) && node.tagName === tagName, isRecursive
        ) as XElement | null;
    }

    /**
     * Checks if childNodes contains at least one node passing a test.
     * @param test Function to test.
     * @param isRecursive Also consider child nodes (default: `false`)
     * @returns Whether this node contains at least one child node passing the test.
    */
    hasOne(test: (node: XNode) => boolean, isRecursive = false): boolean {
        return this.childNodes.some(node => {
            if (test(node)) {
                return true;
            }
            if (isRecursive && node.childNodes.length > 0) {
                return node.hasOne(test, true)
            }
            return false;
        })
    }

    /**
     * Append a child to a node's childNodes.
     * @note `child`는 원래 위치하던 DOM에서 제거된 후에 삽입됨
     * @param child The node to be added as a child.
     */
    appendChild(child: XNode): void {
        removeNode(child);

        child.nextSibling = null;
        child.parent = this as XParentNode;

        if (this.childNodes.push(child) > 1) {
            const sibling = this.childNodes[this.childNodes.length - 2];
            sibling.nextSibling = child;
            child.prevSibling = sibling;
        } else {
            child.prevSibling = null;
        }
    }

    /**
     * Prepend a child to a node's childNodes.
     * @note `child`는 원래 위치하던 DOM에서 제거된 후에 삽입됨
     * @param child The node to be added as a child.
     */
    prependChild(child: XNode): void {
        removeNode(child);

        child.parent = this as XParentNode;
        child.prevSibling = null;

        if (this.childNodes.unshift(child) !== 1) {
            const sibling = this.childNodes[1];
            sibling.prevSibling = child;
            child.nextSibling = sibling;
        } else {
            child.nextSibling = null;
        }
    }

    /** Append a sibling after another */
    appendSibling(node: XNode): void {
        removeNode(node);

        const parent = this.parent;
        const currNext = this.nextSibling;

        node.parent = parent;
        node.nextSibling = currNext;
        node.prevSibling = this as XNode;
        this.nextSibling = node;

        if (currNext) {
            currNext.prevSibling = node;
            if (parent) {
                const siblings = parent.childNodes;
                siblings.splice(siblings.lastIndexOf(currNext), 0, node);
            }
        } else if (parent) {
            parent.childNodes.push(node);
        }
    }

    /** Prepend a sibling before another */
    prependSibling(node: XNode): void {
        removeNode(node);

        const parent = this.parent;
        if (parent) {
            const siblings = parent.childNodes;
            siblings.splice(siblings.indexOf(this as XNode), 0, node);
        }

        if (this.prevSibling) {
            this.prevSibling.nextSibling = node;
        }

        node.parent = parent;
        node.prevSibling = this.prevSibling;
        node.nextSibling = this as XNode;
        this.prevSibling = node;
    }

    /** Remove a node from the DOM */
    removeFromDOM(): void {
        removeNode(this as XNode);
    }

    /** Replace a node in the DOM */
    replaceTo(newNode: XNode): void {
        replaceNode(this as XNode, newNode);
    }

    isEqualWith(node: XNode): boolean {
        return isEqualNode(this as XNode, node);
    }

    /**
     * @param isRecursive 자식 노드도 재귀적으로 복사할지 여부 (default: `false`)
     * @returns 복사된 노드
     */
    cloneNode<T extends XNodeBase>(this: T, isRecursive = false): T {
        return cloneNode(this, isRecursive);
    }

    get outerXML(): string {
        return renderNode(this as XNode);
    }

    get innerXML(): string {
        return renderNodes(this.childNodes as XNode[]);
    }

    get innerText(): string {
        return innerText(this as XNode);
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
}

export class XText extends XNodeWithData {
    type: XNodeType.Text = XNodeType.Text;
}

export class XComment extends XNodeWithData {
    type: XNodeType.Comment = XNodeType.Comment;
}

/** Processing instructions, including doc types */
export class XProcessingInstruction extends XNodeWithData {
    readonly type = XNodeType.Directive;
    name: string;
    constructor(name: string, data: string) {
        super(data);
        this.name = name;
    }
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
    type: XNodeType.CDATA = XNodeType.CDATA;
}

/** The root node of the document */
export class XDocument extends XNodeWithChildren {
    type: XNodeType.Root = XNodeType.Root;
}

/** An element within the DOM */
export class XElement extends XNodeWithChildren {
    type: XNodeType.Tag | XNodeType.Script | XNodeType.Style;
    tagName: string;
    attrs: Record<string, string>;

    constructor(
        tagName: string,
        attribs: Record<string, string>,
        children: XNode[] = [],
    ) {
        super(children);
        this.tagName = tagName;
        this.attrs = attribs;
        this.type = XNodeType.Tag;
        if (tagName === "style") this.type = XNodeType.Style;
        if (tagName === "script") this.type = XNodeType.Script;
    }

    hasAttribute(attrName: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.attrs, attrName) &&
            this.attrs[attrName] !== undefined;
    }

    getAttributeValue(attrName: string): string | undefined {
        return this.attrs[attrName];
    }

    getAttributeArray(): Attribute[] {
        return Object.entries(this.attrs).map(([name, value]) => ({ name, value }));
    }
}

// 노드 타입 체크
export function isXCDATA(node: XNodeBase): node is XCDATA { return node.type === XNodeType.CDATA; }
export function isXComment(node: XNodeBase): node is XComment { return node.type === XNodeType.Comment; }
export function isXDirective(node: XNodeBase): node is XProcessingInstruction { return node.type === XNodeType.Directive; }
export function isXDocument(node: XNodeBase): node is XDocument { return node.type === XNodeType.Root; }
export function isXTag(node: XNodeBase): node is XElement { return node.type === XNodeType.Tag; }
export function isXText(node: XNodeBase): node is XText { return node.type === XNodeType.Text; }
export function isXElement(node: XNodeBase): node is XElement {
    return (
        node.type === XNodeType.Tag ||
        node.type === XNodeType.Script ||
        node.type === XNodeType.Style
    );
}
