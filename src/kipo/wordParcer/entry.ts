import { FileHandler } from "../1-zip/zipFile";
import { readXmls } from "./3-docx/convert-to-oNode";
import { fromONodeToDocNode } from "./4-docNode/convert-to-docNode";
import { fromDocNodeToAbsTree } from "./6-absTree/convert-to-absTree";
import { getHtmlWriter } from "./7-html/html-writer";

export async function convertToHtml(docxFile: FileHandler, options?: Options): Promise<string[]> {
    // Xml -> ONode
    const { oBodyNode, docOptions } = await readXmls(docxFile);
    // ONode -> DocNode
    const docDoc = fromONodeToDocNode(oBodyNode, docOptions);
    // DocNode -> HtmlTag/AbsTree
    const astNodes = await fromDocNodeToAbsTree(docDoc, options);
    // AbsTree -> Html
    const writer = getHtmlWriter(options?.prettyPrint).writeHtml(astNodes);
    // Done
    return writer.getHtmlSegs();
}