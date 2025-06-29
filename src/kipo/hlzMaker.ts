import JSZip from 'jszip';
import { OoxmlConverter } from './ooxmlToHlz/OoxmlConverter';
import { generateKipoFile } from './0-utils/utils';
import { KipoInspector } from './kipoInspection/kipoInspector';
import { generateDiffAfterInspection, generateDiffReport } from './diff/paraDiff';
import { getBaseName } from '@/_utils/file';
import { collectError, MsgCollector } from './0-utils/errorCollector';
import { collectRefs, collectFile, DataCollector } from './0-utils/dataCollector';
import { convertToHtml } from './wordParcer/entry';
import { openFile } from './1-zip/zipFile';

type HlzFileEtc = {
    hlzFile: File | null,
    hlzImgs: Img[],
    countingReport: CountingReport,
    diffReport: DiffReport,
    msgReport: MsgReport,
}

export async function makeHlz(wordFile: File): Promise<HlzFileEtc> {
    try {
        const docxFile = await openFile({ file: wordFile });

        const docxHtml = await convertToHtml(docxFile, { ignoreEmptyParagraphs: true });
        collectRefs({ 'HTML_document.html': docxHtml.join('\n') });

        // document.xml 파일 찾기
        const ooxml = await docxFile.readFile('word/document.xml', 'text');
        collectRefs({ 'Xml_document.xml': ooxml });

        // hlz 구성물 생성
        const { hlzDom, hlzImgs } = await OoxmlConverter.generateHlzXml(docxHtml, docxFile);
        collectRefs({ 'Xml_1차.xml': hlzDom.outerXML });

        const { xDoc: hlzDom2, countingReport } = KipoInspector.generateReport(hlzDom);
        collectRefs({ 'Xml_2차.xml': hlzDom2.outerXML });
        // collectRefs({ 'Rpt_countingReport.json': countingReport });

        const diffAfterInsp = generateDiffAfterInspection(hlzDom2, hlzDom);
        collectRefs({ 'Rpt_diffAfterInspection.json': diffAfterInsp });

        // hlz 생성
        const hlzZip = new JSZip();
        const baseName = getBaseName(wordFile);
        hlzZip.file(`${baseName}.xml`, hlzDom2.outerXML);
        hlzImgs.forEach(hImg => hlzZip.file(hImg.name, hImg.buffer));
        const hlzFile = await generateKipoFile(`${baseName}.hlz`, hlzZip);
        collectFile({ [`${baseName}.hlz`]: hlzFile });

        const diffReport = await generateDiffReport(hlzDom2, wordFile);
        collectRefs({ 'Rpt_diffReport.json': diffReport });
        
        const msgReport = MsgCollector.$.getMsgs();
        // collectRefs({ 'Rpt_msgReport.json': msgReport });

        MsgCollector.$.logMsgs();

        // 테스트 관련
        DataCollector.$.savePages(baseName);
        DataCollector.$.saveRefs(baseName);
        DataCollector.$.saveFiles(baseName);
        DataCollector.$.saveLatex(baseName);

        return {
            hlzFile,
            hlzImgs,
            countingReport,
            diffReport,
            msgReport,
        };

    } catch (error) {
        console.debug('error', error);
        collectError('Hlz 파일 생성 중 오류 발생', error as Error);
        return {
            hlzFile: null,
            hlzImgs: [],
            countingReport: [],
            diffReport: [],
            msgReport: MsgCollector.$.getMsgs(),
        };
    } finally {
        MsgCollector.$.clearMsgs();
        DataCollector.$.clearAll();
    }
};
