import { XElement, isXElem, XNode } from "../1-node/node";

/**
 * Search a node or an array of nodes for nodes passing a test function.
 * @param test Function to test.
 * @param isRecursive Also consider child nodes (default: `false`)
 * @returns All nodes passing `test`.
 */
export function findAll(
    nodes: XNode,
    test: (node: XNode) => boolean,
    isRecursive: boolean = false,
): XNode[] {
    const result: XNode[] = [];
    // Stack of the arrays we are looking at.
    const nodeStack: XNode[][] = [nodes.childNodes];
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
 * Finds "first" node that passes a test.
 * @param test Function to test.
 * @param isRecursive Also consider child nodes (default: `false`)
 * @returns The first node that passes `test` or `null` if no node passes.
 */
export function findOne(node: XNode, test: (node: XNode) => boolean, isRecursive = false): XNode | null {
    const nodesToTest = node.childNodes;
    for (let i = 0; i < nodesToTest.length; i++) {
        const node = nodesToTest[i];
        if (test(node)) {
            return node;
        }
        if (isRecursive && node.childNodes.length > 0) {
            const found = findOne(node, test, true);
            if (found) return found;
        }
    }
    return null;
}

/**
 * test 함수를 만족하는 노드가 있는지 확인
 * @param test Function to test.
 * @param isRecursive Also consider child nodes (default: `false`)
 * @returns Whether this node contains at least one child node passing the test.
*/
export function hasOne(node: XNode, test: (node: XNode) => boolean, isRecursive = false): boolean {
    return node.childNodes.some(node => {
        if (test(node)) {
            return true;
        }
        if (isRecursive && node.childNodes.length > 0) {
            return hasOne(node, test, true)
        }
        return false;
    })
}

/**
 * @returns next `element sibling` or `null` if there is no next element sibling.
 */
export function getNextElemSibling(node: XNode): XElement | null {
    let next = node.nextSibling;
    while (next !== null && !isXElem(next)) {
        next = next.nextSibling;
    }
    return next;
}

/**
 * @returns previous `element sibling` or `null` if there is no previous element sibling.
 */
export function getPrevElemSibling(node: XNode): XElement | null {
    let prev = node.prevSibling;
    while (prev !== null && !isXElem(prev)) {
        prev = prev.prevSibling;
    }
    return prev;
}

/**
* @returns 자기 자신을 포함한 형제 노드 배열
*/
export function getSiblings<T extends XNode>(node: T): T[] {
    // First, attempts to get the children through the node's parent.
    const parent = node.parent;
    if (parent !== null) {
        return parent.childNodes as T[];
    }
    // Second, if we don't have a parent (the node is a root node), 
    // we walk the node's `prevSibling` & `nextSibling` to get all siblings.
    const siblings: T[] = [node];
    let prev = node.prevSibling;
    let next = node.nextSibling;
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