import { ONode } from "../2-xmlParser/nodes";
import { generateONode } from "../2-xmlParser/parser";
import { FileHandler } from "../../1-zip/zipFile";
import { collectWarning } from "../../0-utils/errorCollector";

export async function readDocxXml(docxZip: FileHandler, path: string): Promise<ONode> {
    if (!docxZip.exists(path)) {
        collectWarning(`The xml file is not found: ${path}`);
        return new ONode();
    }

    const xml = await docxZip.readFile(path, "utf-8");
    const stripped = xml.replace(/^\uFEFF/g, ''); // 유니코드 바이트 순서 마커(Utf8Bom) 제거

    const oRoot = generateONode(stripped);
    return collapseAlternateContent(oRoot)[0];
}
 
function collapseAlternateContent(node: ONode): ONode[] {
    if (node.name === "mc:AlternateContent") {
        const fallback = node.getFirst("mc:Fallback");
        return fallback && fallback.children ? fallback.children : [];
    }
    node.children = node.children.map(collapseAlternateContent).flat();
    return [node];
}
