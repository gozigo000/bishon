import { parseFromString, serializeToString } from "./xmldom";
import { ONode } from "./nodes";
import xmldom from "@xmldom/xmldom";

/** 
 * xmlStr 문자열을 파싱하여 ONode 객체로 변환
 */
export function generateONode(xml: string): ONode {
    const rootElement = parseFromString(xml);
    return convertXmlNode(rootElement) as ONode;
}

function convertXmlNode(node: xmldom.Node): ONode | undefined {
    switch (node.nodeType) {
        case xmldom.Node.ELEMENT_NODE:
            return convertXmlElement(node as xmldom.Element);
        case xmldom.Node.TEXT_NODE:
            return new ONode('', node.nodeValue ?? "");
        default:
            return undefined;
    }
}

function convertXmlElement(elem: xmldom.Element): ONode {
    const convertedName: string = convertLocalName(elem);

    const convertedAttributes: Record<string, string> = {};
    Array.from(elem.attributes).forEach((attr: xmldom.Attr) => {
        convertedAttributes[convertLocalName(attr)] = attr.value;
    });
    
    const convertedChildren: ONode[] = [];
    Array.from(elem.childNodes).forEach((child: xmldom.Node) => {
        const convertedNode = convertXmlNode(child);
        if (convertedNode) {
            convertedChildren.push(convertedNode);
        }
    });
    const ooxml = serializeToString(elem); // OOXML 추가
    return new ONode(convertedName, convertedAttributes, convertedChildren, ooxml);
}

function convertLocalName(elem: xmldom.Element | xmldom.Attr): string {
    if (!elem.localName) return '';
    if (elem.namespaceURI) {
        const nsPrefix = xmlNamespaceMap[elem.namespaceURI];
        const prefix = nsPrefix ? `${nsPrefix}:` : `{${elem.namespaceURI}}`;
        return prefix + elem.localName;
    }
    return elem.localName;
}

const xmlNamespaceMap: Record<string, string> = {
    // OMML
    "http://schemas.openxmlformats.org/officeDocument/2006/math": "m",

    // Transitional format
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r",
    "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp",
    "http://schemas.openxmlformats.org/drawingml/2006/main": "a",
    "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic",

    // Strict format
    "http://purl.oclc.org/ooxml/wordprocessingml/main": "w",
    "http://purl.oclc.org/ooxml/officeDocument/relationships": "r",
    "http://purl.oclc.org/ooxml/drawingml/wordprocessingDrawing": "wp",
    "http://purl.oclc.org/ooxml/drawingml/main": "a",
    "http://purl.oclc.org/ooxml/drawingml/picture": "pic",

    // Common
    "http://schemas.openxmlformats.org/package/2006/content-types": "content-types",
    "http://schemas.openxmlformats.org/package/2006/relationships": "relationships",
    "http://schemas.openxmlformats.org/markup-compatibility/2006": "mc",
    "urn:schemas-microsoft-com:vml": "v",
    "urn:schemas-microsoft-com:office:word": "office-word",

    // [MS-DOCX]: Word Extensions to the Office Open XML (.docx) File Format
    // https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/b839fe1f-e1ca-4fa6-8c26-5954d0abbccd
    "http://schemas.microsoft.com/office/word/2010/wordml": "wordml"
};