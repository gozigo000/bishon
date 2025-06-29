import { escapeAttribute, escapeText } from "../../0-utils/escape2/escape";
import { XNodeType } from "../1-node/nodeType";
import type { XNode, XElement, XText } from "../1-node/node";
import { collectWarning } from "@/kipo/0-utils/errorCollector";

export interface SerializerOptions {
    /**
     * Print self-closing tags for tags without contents.
     * If `xmlMode` is set, this will apply to all tags.
     * Otherwise, only tags that are defined as self-closing
     * in the HTML specification will be printed as such.
     * @default xmlMode
     * @example With `selfClosingTags: false`: <foo></foo><br></br>
     * @example With `xmlMode: true` and `selfClosingTags: true`: <foo/><br/>
     * @example With `xmlMode: false` and `selfClosingTags: true`: <foo></foo><br />
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
            return renderNodes(node.children, options);
        case XNodeType.Element:
            return renderTag(node, options);
        case XNodeType.Text:
            return renderText(node);
        // @ts-expect-error We don't use `Doctype` yet
        case XNodeType.Doctype:
        case XNodeType.Directive:
            return `<${node.content}>`;
        case XNodeType.CDATA:
            return `<![CDATA[${node.children[0].content}]]>`;
        case XNodeType.Comment:
            return '';
    }
}

const selfClosingTags = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "figref", // 추가
    "colspec", // 추가
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

    if (selfClosingTags.has(elem.tagName)) {
        if (elem.children.length > 0) {
            collectWarning('inner/outerXML 생성하는 중에 자식이 있는 \
                self-closing tag를 발견함: XML 생성이 잘못되었을 수 있음',
                `tagName: ${elem.tagName}, childNodes: ${elem.children.map(node => node.type)}`)
        }
        if (elem.tagName === 'br') {
            tag += "/>";
        } else {
            tag += " />";
        }
    } else {
        tag += ">"; // 추가
        if (elem.children.length > 0) {
            tag += renderNodes(elem.children, opts);
        }
        tag += `</${elem.tagName}>`;
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
