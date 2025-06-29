import { XNode, isXText, isXCDATA, isXElem } from "../1-node/node";

/**
 * Get a node's text content. Same as `textContent`
 * Ignores comments.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent}
 */
export function textContent(node: XNode): string {
    if (isXText(node)) {
        return node.content;
    }
    let text = '';
    if (node.children.length > 0) {
        for (const child of node.children) {
            text += textContent(child);
        }        
    }
    return text;
}

/**
 * Get a node's inner text. Same as `innerText`
 * ignoring `<script>` and `<style>` tags. 
 * Ignores comments.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/innerText}
 */
export function innerText(node: XNode): string {
    if (isXText(node)) {
        return node.content;
    }
    let text = '';
    if (isXElem(node) || isXCDATA(node)) {
        for (const child of node.children) {
            text += innerText(child);
        }
    }
    return text;
}
