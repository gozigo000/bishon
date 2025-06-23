import type { XNode, XParentNode } from "../1-node/node";

/**
 * Append a child to a node's childNodes.
 * @note `child`는 원래 위치하던 DOM에서 제거된 후에 삽입됨
 */
export function appendChild(node: XParentNode, child: XNode): void {
    removeNode(child);

    child.nextSibling = null;
    child.parent = node;

    if (node.childNodes.push(child) > 1) {
        const sibling = node.childNodes[node.childNodes.length - 2];
        sibling.nextSibling = child;
        child.prevSibling = sibling;
    } else {
        child.prevSibling = null;
    }
}

/**
 * Prepend a child to a node's childNodes.
 * @note `child`는 원래 위치하던 DOM에서 제거된 후에 삽입됨
 */
export function prependChild(node: XParentNode, child: XNode): void {
    removeNode(child);

    child.parent = node;
    child.prevSibling = null;

    if (node.childNodes.unshift(child) !== 1) {
        const sibling = node.childNodes[1];
        sibling.prevSibling = child;
        child.nextSibling = sibling;
    } else {
        child.nextSibling = null;
    }
}

/** Append a sibling after another */
export function appendSibling(node: XNode, sibling: XNode): void {
    removeNode(sibling);

    const parent = node.parent;
    const currNext = node.nextSibling;

    sibling.parent = parent;
    sibling.nextSibling = currNext;
    sibling.prevSibling = node;
    node.nextSibling = sibling;

    if (currNext) {
        currNext.prevSibling = sibling;
        if (parent) {
            const siblings = parent.childNodes;
            siblings.splice(siblings.lastIndexOf(currNext), 0, sibling);
        }
    } else if (parent) {
        parent.childNodes.push(sibling);
    }
}

/** Prepend a sibling before another */
export function prependSibling(node: XNode, sibling: XNode): void {
    removeNode(sibling);

    const parent = node.parent;
    if (parent) {
        const siblings = parent.childNodes;
        siblings.splice(siblings.indexOf(node), 0, sibling);
    }

    if (node.prevSibling) {
        node.prevSibling.nextSibling = sibling;
    }

    sibling.parent = parent;
    sibling.prevSibling = node.prevSibling;
    sibling.nextSibling = node;
    node.prevSibling = sibling;
}

/**
 * Remove a node from the DOM
 */
export function removeNode(node: XNode): void {
    if (node.prevSibling) node.prevSibling.nextSibling = node.nextSibling;
    if (node.nextSibling) node.nextSibling.prevSibling = node.prevSibling;

    if (node.parent) {
        const childs = node.parent.childNodes;
        const childsIdx = childs.lastIndexOf(node);
        if (childsIdx >= 0) {
            childs.splice(childsIdx, 1);
        }
    }

    node.nextSibling = null;
    node.prevSibling = null;
    node.parent = null;
}

/**
 * Replace a node in the DOM
 * @param oldNode The node to be replaced
 * @param newNode The node to be added
 */
export function replaceNode(oldNode: XNode, newNode: XNode): void {
    const prevS = oldNode.prevSibling;
    newNode.prevSibling = prevS;
    if (prevS) {
        prevS.nextSibling = newNode;
    }

    const nextS = oldNode.nextSibling;
    newNode.nextSibling = nextS;
    if (nextS) {
        nextS.prevSibling = newNode;
    }

    const parent = oldNode.parent;
    newNode.parent = parent;
    if (parent) {
        const childs = parent.childNodes;
        childs[childs.lastIndexOf(oldNode)] = newNode;
        oldNode.parent = null;
    }
}
