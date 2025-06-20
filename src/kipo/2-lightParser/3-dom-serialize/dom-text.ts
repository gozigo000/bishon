import { XNodeType } from "../1-node/nodeType.js";
import { XNode, isXText, isXCDATA, isXElement } from "../1-node/node.js";

/**
 * Get a node's inner text. Similar to `textContent`, 
 * but inserts newlines for `<br>` tags. 
 * Ignores comments.
 */
export function textContentBr(node: XNode | XNode[]): string {
    if (Array.isArray(node)) {
        return node.map(textContentBr).join("");
    }
    if (isXElement(node)) {
        return node.tagName === "br" ? "\n" : textContentBr(node.childNodes);
    }
    if (isXCDATA(node)) {
        return textContentBr(node.childNodes);
    }
    if (isXText(node)) {
        return node.content;
    }
    return "";
}

/**
 * Get a node's text content. Same as `textContent`
 * Ignores comments.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent}
 */
export function textContent(node: XNode | XNode[]): string {
    if (Array.isArray(node)) {
        return node.map(textContent).join("");
    }
    if (node.childNodes.length > 0) {
        return textContent(node.childNodes);
    }
    if (isXText(node)) {
        return node.content;
    }
    return "";
}

/**
 * Get a node's inner text. Same as `innerText`
 * ignoring `<script>` and `<style>` tags. 
 * Ignores comments.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/innerText}
 */
export function innerText(node: XNode | XNode[]): string {
    if (Array.isArray(node)) {
        return node.map(innerText).join("");
    }
    if (node.childNodes.length > 0 && (node.type === XNodeType.Tag || isXCDATA(node))) {
        return innerText(node.childNodes);
    }
    if (isXText(node)) {
        return node.content;
    }
    return "";
}
