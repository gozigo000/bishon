import type { XNode } from "../1-node/node";
import { compareRelativePos, RelPos } from "./tree-utils";

/**
 * 노드 배열에서 다른 노드에 포함된 노드를 제거
 * - if `A ∪ B = A`, then `B` 제거
 * - if `A ≡ B`, then `B` 제거
 * @param nodes 필터링할 노드 배열
 * @returns 필터링된 노드 배열
 */
export function removeSubsets(nodes: XNode[]): XNode[] {
    let idx = nodes.length;
    // Check if each node (or one of its ancestors) is already contained in the array.
    while (--idx >= 0) {
        const node = nodes[idx];
        // Remove the node if it is not unique.
        // We are going through the array from the end, so we only
        // have to check nodes that preceed the node under consideration in the array.
        if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
            nodes.splice(idx, 1);
            continue;
        }

        for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
            if (nodes.includes(ancestor)) {
                nodes.splice(idx, 1);
                break;
            }
        }
    }

    return nodes;
}

/**
 * Sort an array of nodes based on their relative position in the document,
 * removing any duplicate nodes. If the array contains nodes that do not belong
 * to the same document, sort order is unspecified.
 *
 * @param nodes Array of DOM nodes.
 * @returns Collection of unique nodes, sorted in document order.
 */
export function uniqueSort<T extends XNode>(nodes: T[]): T[] {
    nodes = nodes.filter(
        (node, i, arr) => !arr.includes(node, i + 1)
    );

    nodes.sort((a, b) => {
        const relative = compareRelativePos(a, b);
        if (relative === RelPos.A_PRECEDES_B) {
            return -1;
        } else if (relative === RelPos.B_PRECEDES_A) {
            return 1;
        }
        return 0;
    });

    return nodes;
}
