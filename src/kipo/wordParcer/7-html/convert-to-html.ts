import { isSelfCloseTag } from "../6-absTree/astNode";
import { AstNode } from "../6-absTree/astNode";
import { HtmlWriter } from "./html-writer";

export function writeHtml(writer: HtmlWriter, nodes: AstNode[]): void {
    nodes.forEach(node => writeNode(writer, node));
}

function writeNode(writer: HtmlWriter, node: AstNode): void {
    switch (node.type) {
        case "element": return generateElemStr(writer, node);
        case "text": return generateTextStr(writer, node);
        case "forceWrite": return;
    }
}

function generateElemStr(writer: HtmlWriter, node: AstNode): void {
    const tagName = node.tag!.tagName;
    const attributes = node.tag!.attributes;

    if (isSelfCloseTag(node)) {
        writer.selfCloseTag(tagName, attributes);
    } else {
        writer.openTag(tagName, attributes);
        writeHtml(writer, node.children || []);
        writer.closeTag(tagName);
    }
}

function generateTextStr(writer: HtmlWriter, node: AstNode): void {
    if (node.type !== "text" || node.text === undefined) return;
    writer.writeText(node.text);
}

