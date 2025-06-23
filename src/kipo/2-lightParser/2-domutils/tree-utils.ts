import { isXCDATA, isXComment, isXDirective, isXDocu, isXElem, isXText, XDocument, XElement, XText, type XNode } from "../1-node/node";
import { findAll } from "./search";
import { removeNode } from "./manipulate";

/**
 * DOM Tree에서 노드 레벨
 */
export function getNodeLevel(node: XNode): number {
    let i = 0;
    let curr: XNode | null = node;
    while (curr) {
        curr = curr.parent;
        i++;
    }
    return i;
}

/**
 * 깊이 우선 순회하며 각 노드에 apply 함수 적용
 * @note 순회 중 트리 구조가 바뀌면 안됨
 * @param apply 각 노드에 적용할 함수
 */
export function forEachNode(
    node: XNode,
    apply: (node: XNode) => void,
): void {
    apply(node);
    node.childNodes.forEach(child => forEachNode(child, apply));
}

/**
 * XML 파일에서 줄바꿈 때문에 생기는 텍스트 노드들 제거
 */
export function removeNewlineTextNodes(root: XNode): void {
    const voidNodes = findAll(root, 
        node => isXText(node) && /^\s*\n\s*$/.test(node.content), 
        true
    )
    voidNodes.forEach(node => removeNode(node));

    // 줄바꿈 문자 제거 (<invention-title> 태그 때문에 필요함)
    forEachNode(root, (node) => {
        if (isXText(node)) node.content = node.content.replaceAll('\n', '')
    })
}

/**
 * @category Helpers
 * @see {@link http://dom.spec.whatwg.org/#dom-node-comparedocumentposition}
 */
export const enum RelPos {
    EQUAL = 'Equal', // 추가
    DISCONNECTED = 'Disconnected',
    A_PRECEDE_B = 'A-precede-B',
    B_PRECEDE_A = 'B-precede-A',
    A_CONTAINS_B = 'A-contains-B',
    B_CONTAINS_A = 'B-contains-A',
}
export const enum RelPosFlag {
    EQUAL = 1, // 추가
    DISCONNECTED = 2,
    A_PRECEDE_B = 4,
    B_PRECEDE_A = 8,
    A_CONTAINS_B = 16,
    B_CONTAINS_A = 32,
}

/**
 * Compare the position of one node against another node in any other document.
 *
 * Document order:
 * > There is an ordering, document order, defined on all the nodes in the
 * > document corresponding to the order in which the first character of the
 * > XML representation of each node occurs in the XML representation of the
 * > document after expansion of general entities. Thus, the document element
 * > node will be the first node. Element nodes occur before their children.
 * > Thus, document order orders element nodes in order of the occurrence of
 * > their start-tag in the XML (after expansion of entities). The attribute
 * > nodes of an element occur after the element and before its children. The
 * > relative order of attribute nodes is implementation-dependent.
 *
 * Source:
 * http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
 *
 * @note 하나의 상태만 반환하도록 수정함. 원래는 비트마스크 반환했음.
 * @param nodeA The first node to use in the comparison
 * @param nodeB The second node to use in the comparison
 * @returns the input nodes' relative position ({@link RelPos}).
 *
 * See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
 * a description of these values.
 */
export function compareRelativePos(nodeA: XNode, nodeB: XNode): RelPos {
    if (nodeA === nodeB) {
        return RelPos.EQUAL;
    }

    // A, B 및 각각의 조상들 저장
    const acensA: XNode[] = [];
    const acensB: XNode[] = [];

    let currA: XNode | null = nodeA;
    while (currA) {
        acensA.unshift(currA);
        currA = currA.parent;
    }
    let currB: XNode | null = nodeB;
    while (currB) {
        acensB.unshift(currB);
        currB = currB.parent;
    }

    // 가장 가까운 공통 조상 찾기
    const maxIdx = Math.min(acensA.length, acensB.length);
    let idx = 0;
    while (idx < maxIdx) {
        if (acensA[idx] !== acensB[idx]) break;
        idx++;
    }

    if (idx === 0) {
        // 공통 조상이 없는 경우
        return RelPos.DISCONNECTED;
    }

    const sharedAcendant = acensA[idx - 1];
    if (sharedAcendant === nodeA) {
        return RelPos.A_CONTAINS_B;
    }
    if (sharedAcendant === nodeB) {
        return RelPos.B_CONTAINS_A;
    }

    const branchs = sharedAcendant.childNodes;
    const branchA = acensA[idx];
    const branchB = acensB[idx];
    if (branchs.indexOf(branchA) < branchs.indexOf(branchB)) {
        return RelPos.A_PRECEDE_B;
    } else {
        return RelPos.B_PRECEDE_A;
    }
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

    if ((isXComment(node1) && isXComment(node2)) ||
        (isXCDATA(node1) && isXCDATA(node2)) ||
        (isXDirective(node1) && isXDirective(node2))) {
        throw new Error('Not implemented');
    }

    throw new Error('노드 비교 시 예상치 못한 케이스 발생');
}

/**
 * Clone a node
 * @param isRecursive Clone child nodes as well.
 * @returns A clone of the node.
 */
export function cloneNode<T extends XNode>(node: T, isRecursive: boolean): T {
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
