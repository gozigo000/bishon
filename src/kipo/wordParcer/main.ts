import { openZip } from "./1-zip/zip.js";
import { readXmls } from "./3-docx/convert-to-oNode.js";
import { fromONodeToDocNode } from "./4-docNode/convert-to-docNode.js";
import { fromDocNodeToAbsTree } from "./6-absTree/convert-to-absTree.js";
import { getHtmlWriter } from "./7-html/html-writer.js";
import { Msgs } from "./message.js";

export async function convertToHtml(input: Input, options?: Options): Promise<Output> {
    const docxFile = await openZip(input);
    // Xml -> ONode
    const { oBodyNode, docOptions } = await readXmls(docxFile, input);
    // ONode -> DocNode
    const docDoc = fromONodeToDocNode(oBodyNode, docOptions);
    // DocNode -> HtmlTag/AbsTree
    const astNodes = await fromDocNodeToAbsTree(docDoc, options);
    // AbsTree -> Html
    const writer = getHtmlWriter(options?.prettyPrint).writeHtml(astNodes);
    // Done
    return {
        html: writer.getHtmlSegs(),
        messages: Msgs.getCombinedMsgs()
    };
}