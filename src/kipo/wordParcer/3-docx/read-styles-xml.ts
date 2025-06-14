import { ONode } from "../2-xmlParser/nodes";

function Styles(
    paragraphStyles: Record<string, StyleInfo>, 
    characterStyles: Record<string, StyleInfo>, 
    tableStyles: Record<string, StyleInfo>, 
    numberingStyles: Record<string, NumStyleInfo>
) {
    return {
        findParagraphStyleById: function (styleId: string): StyleInfo | undefined {
            return paragraphStyles[styleId];
        },
        findCharacterStyleById: function (styleId: string): StyleInfo | undefined {
            return characterStyles[styleId];
        },
        findTableStyleById: function (styleId: string): StyleInfo | undefined {
            return tableStyles[styleId];
        },
        findNumberingStyleById: function (styleId: string): NumStyleInfo | undefined {
            return numberingStyles[styleId];
        },
    }
}

export const defaultStyles = Styles({}, {}, {}, {});

export function readStyles(root: ONode) {
    const paragraphStyles: Record<string, StyleInfo> = {};
    const characterStyles: Record<string, StyleInfo> = {};
    const tableStyles: Record<string, StyleInfo> = {};
    const numberingStyles: Record<string, NumStyleInfo> = {};

    root.getElementsByTagName("w:style").forEach((styleElement: ONode) => {
        const style = readStyleElement(styleElement);
        switch (style.type) {
            case "numbering":
                numberingStyles[style.styleId] = readNumStyleElement(styleElement);
                break;
            case "paragraph":
                paragraphStyles[style.styleId] = style;
                break;
            case "character":
                characterStyles[style.styleId] = style;
                break;
            case "table":
                tableStyles[style.styleId] = style;
                break;
        }
    });

    return Styles(paragraphStyles, characterStyles, tableStyles, numberingStyles);
}

function readStyleElement(styleElement: ONode): StyleInfo {
    const type = styleElement.attributes["w:type"];
    const styleId = styleElement.attributes["w:styleId"];
    const name = styleElement.getFirst("w:name")?.attributes["w:val"] || null;
    return { type, styleId, name };
}

function readNumStyleElement(styleElement: ONode): NumStyleInfo {
    const numId = styleElement
        .getFirstOrEmpty("w:pPr")
        .getFirstOrEmpty("w:numPr")
        .getFirstOrEmpty("w:numId")
        .attributes["w:val"];
    return { numId };
}
