import {
    type XNode,
    isXCDATA, isXComment, isXDirective, isXDocu, isXElem, isXText,
    XDocument, XElement, XText
} from "../1-node/node.js";

/**
 * Clone a node
 * @param isRecursive Clone child nodes as well.
 * @returns A clone of the node.
 */
export function cloneNode<T extends XNode>(node: T, isRecursive = false): T {
    let result: XNode;

    if (isXText(node)) {
        result = new XText(node.content);
    } else if (isXElem(node)) {
        const children = isRecursive ? cloneChildNodes(node.childNodes) : [];
        const clone = new XElement(node.tagName, { ...node.attrs }, children);
        children.forEach(child => child.parent = clone);
        result = clone;
    } else if (isXDocu(node)) {
        const children = isRecursive ? cloneChildNodes(node.childNodes) : [];
        const clone = new XDocument(children);
        children.forEach(child => child.parent = clone);
        result = clone;
    // } else if (isXCDATA(node)) {
    //     const children = isRecursive ? cloneChildNodes(node.childNodes) : [];
    //     const clone = new XCDATA(children);
    //     children.forEach(child => child.parent = clone);
    //     result = clone;
    // } else if (isXDirective(node)) {
    //     const instruction = new XProcessingInstruction(node.name, node.content);
    //     result = instruction;
    } else {
        throw new Error(`Not implemented yet: ${node.type}`);
    }

    return result as T;
}

function cloneChildNodes(childs: XNode[]): XNode[] {
    const children = childs.map(child => cloneNode(child, true));
    for (let i = 1; i < children.length; i++) {
        children[i].prevSibling = children[i - 1];
        children[i - 1].nextSibling = children[i];
    }
    return children;
}

export function isEqualNode(node1: XNode, node2: XNode): boolean {
    if (node1.type !== node2.type) {
        return false;
    }
    if (isXText(node1) && isXText(node2)) {
        return node1.content === node2.content;
    }
    if (isXDocu(node1) && isXDocu(node2)) {
        if (node1.childNodes.length !== node2.childNodes.length) {
            return false;
        }
        for (let i = 0; i < node1.childNodes.length; i++) {
            if (!isEqualNode(node1.childNodes[i], node2.childNodes[i])) {
                return false;
            }
        }
        return true;
    }
    if (isXElem(node1) && isXElem(node2)) {
        if (node1.type !== node2.type) return false;
        if (node1.tagName !== node2.tagName) return false;
        if (Object.keys(node1.attrs).length !== Object.keys(node2.attrs).length) {
            return false;
        }
        for (const [key, value] of Object.entries(node1.attrs)) {
            if (node2.attrs[key] !== value) {
                return false;
            }
        }
        if (node1.childNodes.length !== node2.childNodes.length) {
            return false;
        }
        for (let i = 0; i < node1.childNodes.length; i++) {
            if (!isEqualNode(node1.childNodes[i], node2.childNodes[i])) {
                return false;
            }
        }
        return true;
    }

    if (
        (isXComment(node1) && isXComment(node2)) ||
        (isXCDATA(node1) && isXCDATA(node2)) ||
        (isXDirective(node1) && isXDirective(node2))
    ) {
        throw new Error('Not implemented');
    }

    throw new Error('노드 비교 시 예상치 못한 케이스 발생');
}
