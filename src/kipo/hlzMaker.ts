import JSZip from 'jszip';
import { OoxmlConverter } from './ooxmlToHlz/OoxmlConverter';
import { getMammothHtml, generateKipoFile } from './0-utils/utils';
import { toArrayBuffer } from "@/_utils/dataType";
import { KipoInspector } from './kipoInspection/kipoInspector';
import { generateDiffAfterInspection, generateDiffReport } from './diff/paraDiff';
import { getBaseName } from '@/_utils/file';
import { collectError, ErrorCollector } from './0-utils/errorCollector';
import { collectRefs, collectFile, DataCollector } from './0-utils/dataCollector';
import { convertToHtml } from './wordParcer/entry';
import { openFile } from './1-zip/zipFile';
import { parseXml } from './2-lightParser/entry';

export async function makeHlz(wordFile: File)
: Promise<[
    File | null,
    CountingReport,
    InspectionReport,
    DiffReport,
    Img[],
] | null> {
    try {
        log('=== hlz 생성 시작 ===');

        const docxFile = await openFile({ file: wordFile });

        const docxHtml = await convertToHtml(docxFile, {
            ignoreEmptyParagraphs: false,
        });

        // document.xml 파일 찾기
        const ooxml = await docxFile.readFile('word/document.xml', 'text');
        collectRefs({
            'Xml_document.xml': ooxml,
        });

        // hlz 구성물 생성
        const { hlzXml, hImgs } = await OoxmlConverter.generateHlzXml(docxHtml, docxFile);

        const hlzDom = parseXml(hlzXml);
        const { xDoc: hlzDom2, inspectionReport, countingReport } = KipoInspector.generateReport(hlzDom);
        generateDiffAfterInspection(hlzDom2.outerXML, hlzXml);

        // hlz 생성
        const hlzZip = new JSZip();
        const baseName = getBaseName(wordFile);
        hlzZip.file(`${baseName}.xml`, hlzDom2.outerXML);
        hImgs.forEach(hImg => hlzZip.file(hImg.name, hImg.buffer));
        const hlzFile = await generateKipoFile(`${baseName}.hlz`, hlzZip);

        collectFile({
            [`${baseName}.hlz`]: hlzFile,
        });

        log(`=== hlz 생성 완료 ===`);

        const wordArrBuff = await toArrayBuffer(wordFile);
        const html = await getMammothHtml(wordArrBuff);
        const diffReport = await generateDiffReport(hlzDom2.outerXML, html); // TODO: XDom 사용하기

        // 테스트 관련
        DataCollector.$.savePages(baseName);
        DataCollector.$.saveRefs(baseName);
        DataCollector.$.saveFiles(baseName);
        DataCollector.$.saveLatex(baseName);
        ErrorCollector.$.logErrors();

        return [
            hlzFile,
            countingReport,
            inspectionReport,
            diffReport,
            hImgs,
        ];

    } catch (error) {
        collectError('Hlz 파일 생성 중 오류 발생', error as Error);
        return null;
    }
};
