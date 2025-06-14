import { ONode } from "../2-xmlParser/nodes.js";
import { generateONode } from "../2-xmlParser/parser.js";

export async function readDocumentXml(docxZip: Zip, path: string): Promise<ONode> {
    if (!docxZip.exists(path)) throw new Error("Could not find the document.xml");

    const xml = await docxZip.readFile(path, "utf-8") as string;
    const stripped = xml.replace(/^\uFEFF/g, ''); // 유니코드 바이트 순서 마커(Utf8Bom) 제거

    const oRoot = generateONode(stripped);
    return collapseAlternateContent(oRoot)[0] as ONode;
}
 
function collapseAlternateContent(node: ONode): ONode[] {
    if (node.name === "mc:AlternateContent") {
        const fallback = node.getFirst("mc:Fallback");
        return fallback && fallback.children ? fallback.children : [];
    }
    node.children = node.children.map(collapseAlternateContent).flat();
    return [node];
}
