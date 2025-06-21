import { escapeAttribute, escapeText } from "../0-utils/escape.js";
import { XNodeType } from "../1-node/nodeType.js";
import type { XNode, XElement, XText } from "../1-node/node.js";

export interface SerializerOptions {
    /**
     * Print self-closing tags for tags without contents. If `xmlMode` is set, this will apply to all tags.
     * Otherwise, only tags that are defined as self-closing in the HTML specification will be printed as such.
     * @default xmlMode
     * @example With <code>selfClosingTags: false</code>: <code>&lt;foo&gt;&lt;/foo&gt;&lt;br&gt;&lt;/br&gt;</code>
     * @example With <code>xmlMode: true</code> and <code>selfClosingTags: true</code>: <code>&lt;foo/&gt;&lt;br/&gt;</code>
     * @example With <code>xmlMode: false</code> and <code>selfClosingTags: true</code>: <code>&lt;foo&gt;&lt;/foo&gt;&lt;br /&gt;</code>
     */
    selfClosingTags?: boolean;
}

export function renderNodes(nodes: XNode[], options?: SerializerOptions): string {
    return nodes
        .map(node => renderNode(node, options))
        .join('');
}

export function renderNode(node: XNode, options?: SerializerOptions): string {
    switch (node.type) {
        case XNodeType.Root:
            return renderNodes(node.childNodes, options);
        case XNodeType.Element:
            return renderTag(node, options);
        case XNodeType.Text:
            return renderText(node);
        // @ts-expect-error We don't use `Doctype` yet
        case XNodeType.Doctype:
        case XNodeType.Directive:
            return `<${node.content}>`;
        case XNodeType.CDATA:
            return `<![CDATA[${node.childNodes[0].content}]]>`;
        case XNodeType.Comment:
            return '';
    }
}

const selfClosingTags = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);

function renderTag(elem: XElement, opts?: SerializerOptions) {
    let tag = `<${elem.tagName}`;
    const attribs = formatAttributes(elem.attrs);
    if (attribs) tag += ` ${attribs}`;

    if (selfClosingTags.has(elem.tagName) && elem.childNodes.length === 0) {
        if (elem.tagName === 'br') {
            tag += "/>";
        } else {
            tag += " />";
        }
    } else {
        tag += ">"; // 추가
        if (elem.childNodes.length > 0) {
            tag += renderNodes(elem.childNodes, opts);
        }

        if (!selfClosingTags.has(elem.tagName)) {
            tag += `</${elem.tagName}>`;
        }
    }

    return tag;
}

function formatAttributes(attrs: Record<string, string | null> | undefined) {
    if (!attrs) return;
    return Object.keys(attrs)
        .filter(key => attrs[key])
        .map(key => `${key}="${escapeAttribute(attrs[key]!)}"`)
        .join(" ");
}

function renderText(elem: XText) {
    let data = elem.content || "";
    data = escapeText(data)
    return data;
}
