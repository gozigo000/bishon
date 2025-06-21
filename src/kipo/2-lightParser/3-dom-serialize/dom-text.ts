import { unEscapeXmlText } from "../../utils.js";
import { XNode, isXText, isXCDATA, isXElem } from "../1-node/node.js";

/**
 * Get a node's text content. Same as `textContent`
 * Ignores comments.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent}
 */
export function textContent(node: XNode): string {
    if (isXText(node)) {
        return unEscapeXmlText(node.content);
    }
    let text = '';
    if (node.childNodes.length > 0) {
        for (const child of node.childNodes) {
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
        return unEscapeXmlText(node.content);
    }
    let text = '';
    if (isXElem(node) || isXCDATA(node)) {
        for (const child of node.childNodes) {
            text += innerText(child);
        }
    }
    return text;
}
