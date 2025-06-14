import path from "path";
import { dirname } from "path";
import { ONode } from "../2-xmlParser/nodes.js";
import { readDocumentXml } from "./read-document-xml.js";
import { readRelationships, defaultRelationships, Relationships } from "./read-relationships.js";
import { readContentTypes, defaultContentTypes, ContentTypes } from "./read-content-types.js";
import { Numberings, readNumbering, defaultNumbering } from "./read-numbering.js";
import { readStyles, defaultStyles } from "./read-styles-xml.js";
import { ImgFiles } from "./imgFiles.js";
import { docOptions } from "../4-docNode/convert-to-docNode.js";

type XmlPaths = {
    documentXmlPath: string;  // 기본: word/document.xml
    numberingXmlPath: string; // 기본: word/numbering.xml
    stylesXmlPath: string;    // 기본: word/styles.xml
    relationshipsXmlPath: string; // 기본: word/_rels/document.xml.rels
};

export async function readXmls(docxFile: Zip, input: Input): Promise<{ oBodyNode: ONode, docOptions: docOptions }> {
    const wordXmlPaths = await findPartPaths(docxFile)

    const imgFiles = "path" in input ? new ImgFiles(dirname(input.path)) : new ImgFiles(null);
    const contentTypes = await readContentTypesXml(docxFile);
    const styles = await readStylesXml(docxFile, wordXmlPaths.stylesXmlPath);
    const numbering = await readNumberingXml(docxFile, wordXmlPaths.numberingXmlPath, styles);
    const relationships = await readRelationshipsXml(docxFile, wordXmlPaths.relationshipsXmlPath);

    const docOptions = { docxFile, imgFiles, contentTypes, styles, numbering, relationships };

    // XML -> ONode
    const oRoot = await readDocumentXml(docxFile, 'word/document.xml');
    const oBodyNode = oRoot.getFirst("w:body");
    if (!oBodyNode) throw new Error("Could not find the body element: docx file?");
    return { oBodyNode, docOptions };
}

/* 이하는 모두 준비단계 코드 */

/**
 * docx 구성하는 파일들의 경로 찾기
 */
async function findPartPaths(docxFile: Zip): Promise<XmlPaths> {
    const packageRelationships = await readRelationshipsXml(docxFile, "_rels/.rels");
    const documentXmlPath = findPartPath({
        docxFile: docxFile,
        relationships: packageRelationships,
        relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
        basePath: "",
        fallbackPath: "word/document.xml"
    });

    if (!docxFile.exists(documentXmlPath)) {
        throw new Error("Could not find main document. Are you sure this is a .docx file?");
    }

    const relationshipsXmlPath = relationshipsFilename(documentXmlPath);

    const documentRelationships = await readRelationshipsXml(docxFile, relationshipsXmlPath);
    function findPartRelatedToMainDocument(name: string) {
        return findPartPath({
            docxFile: docxFile,
            relationships: documentRelationships,
            relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/" + name,
            basePath: path.dirname(documentXmlPath),
            fallbackPath: "word/" + name + ".xml"
        });
    }

    return {
        documentXmlPath: documentXmlPath,
        numberingXmlPath: findPartRelatedToMainDocument("numbering"),
        stylesXmlPath: findPartRelatedToMainDocument("styles"),
        relationshipsXmlPath: relationshipsXmlPath
    };
}

function relationshipsFilename(filename: string): string {
    return path.posix.join(path.dirname(filename), "_rels", `${path.basename(filename)}.rels`);
}

function findPartPath(options: any): string {
    const docxFile = options.docxFile;
    const relationships = options.relationships;
    const relationshipType = options.relationshipType;
    const basePath = options.basePath;
    const fallbackPath = options.fallbackPath;

    const targets = relationships.findTargetsByType(relationshipType);
    const normalisedTargets = targets.map((target: string) => {
        return stripPrefix(path.posix.join(basePath, target), "/");
    });
    const validTargets = normalisedTargets.filter((target: string) => {
        return docxFile.exists(target);
    });
    if (validTargets.length === 0) {
        return fallbackPath;
    } else {
        return validTargets[0];
    }
}

function stripPrefix(value: string, prefix: string): string {
    if (value.substring(0, prefix.length) === prefix) {
        return value.substring(prefix.length);
    }
    return value;
}

async function readContentTypesXml(docxFile: Zip): Promise<ContentTypes> {
    const elem = await readDocumentXml(docxFile, "[Content_Types].xml");
    return elem ? readContentTypes(elem) : defaultContentTypes;
}

async function readStylesXml(docxFile: Zip, path: string): Promise<Styles> {
    const elem = await readDocumentXml(docxFile, path);
    return elem ? readStyles(elem) : defaultStyles;
}

async function readNumberingXml(docxFile: Zip, path: string, styles: any): Promise<Numberings> {
    const elem = await readDocumentXml(docxFile, path);
    return elem ? readNumbering(elem, { styles }) : defaultNumbering;
}

async function readRelationshipsXml(docxFile: Zip, path: string): Promise<Relationships> {
    const elem = await readDocumentXml(docxFile, path);
    return elem ? readRelationships(elem) : defaultRelationships;
}