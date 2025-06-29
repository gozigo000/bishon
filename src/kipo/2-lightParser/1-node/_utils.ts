import { type XNode } from "./node";

/** 콘솔에 XDom 트리 구조 출력 */
export function printTree(root: XNode, textLimit: number = 35) {
    function getShortContent(node: XNode): string {
        if (node.content.length > textLimit) {
            return `"${node.content.slice(0, textLimit)}..."`;
        } else {
            return `"${node.content}"`;
        }
    }
    function toText(node: XNode, depth: number): string {
        let text = '   '.repeat(depth);
        text += `${node.type} :${depth}: `
        text += node.type === 'elem' ? `<${node.tagName}>\n` :
            node.type === 'text' ? `${getShortContent(node)}\n` :
                `\n`;
        for (const child of node.children) {
            text += toText(child, depth + 1)
        }
        return text;
    }
    const text = toText(root, 0);
    console.log(text)
}