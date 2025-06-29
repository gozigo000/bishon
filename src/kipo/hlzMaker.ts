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
import { isDev, isTest } from '@/_utils/env';

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

        const { hlzDom, hlzImgs } = await OoxmlConverter.generateHlzXml(docxHtml, docxFile);

        const { hlzDom2, countingReport } = KipoInspector.generateReport(hlzDom);

        const diffReport = await generateDiffReport(hlzDom2, wordFile);

        const msgReport = MsgCollector.$.getMsgs();

        // hlz 생성
        const hlzZip = new JSZip();
        const baseName = getBaseName(wordFile);
        hlzZip.file(`${baseName}.xml`, hlzDom2.outerXML);
        hlzImgs.forEach(hImg => hlzZip.file(hImg.name, hImg.buffer));
        const hlzFile = await generateKipoFile(`${baseName}.hlz`, hlzZip);

        // 테스트
        if (isDev() || isTest()) {
            const ooxml = await docxFile.readFile('word/document.xml', 'text');
            collectRefs({ 'OOXML_document.xml': ooxml });
            collectRefs({ 'HTML_document.html': docxHtml.join('\n') });
            collectRefs({ 'KIPOXML_1차.xml': hlzDom.outerXML });
            collectRefs({ 'KIPOXML_2차.xml': hlzDom2.outerXML });
            const diffAfterInsp = generateDiffAfterInspection(hlzDom2, hlzDom);
            collectRefs({ 'REPORT_diffAfterInspection.json': diffAfterInsp });
            collectRefs({ 'REPORT_counting.json': countingReport });
            collectRefs({ 'REPORT_diff.json': diffReport });
            collectRefs({ 'REPORT_msg.json': msgReport });
            collectFile({ [`${baseName}.hlz`]: hlzFile });

            MsgCollector.$.logMsgs();
            DataCollector.$.saveAll(baseName);
        }

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
