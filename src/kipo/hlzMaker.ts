import JSZip from 'jszip';
import { OoxmlConverter } from './ooxmlToHlz/OoxmlConverter';
import { getHtmlTables, getMammothHtml, generateKipoFile } from './utils';
import { toArrayBuffer } from "@/_utils/dataType";
import { generateSpecInspectionResult } from './kipoInspection/kipoInspector';
import { generateDiffLines } from './diff/paraDiff';
import { getBaseName } from '@/_utils/file';
import { dlog } from '@/_utils/env';

export type Img = {
    name: string;
    buffer: ArrayBuffer;
}

export async function makeHlz(wordFile: File)
: Promise<[
    File | null, 
    CountingReport, 
    InspectionReport, 
    DiffReport
]> {
    try {
        dlog('\n=== hlz 생성 시작 ===');

        const wordBuffer = await toArrayBuffer(wordFile);

        const wordZip = new JSZip();
        if (!wordBuffer) throw new Error('wordFile이 올바르지 않습니다.');
        const zipContent = await wordZip.loadAsync(wordBuffer);

        // document.xml 파일 찾기
        const documentXml = zipContent.file('word/document.xml');
        if (!documentXml) throw new Error('document.xml을 찾을 수 없습니다.');
        const ooxml = await documentXml.async('text');
        
        // 워드 이미지 파일 찾기
        const oImgs: Img[] = [];
        const wordImgs = zipContent.file(/^word\/media\/image[0-9]+.*$/);
        for (const wordImg of wordImgs) {
            const buffer = await wordImg.async('arraybuffer');
            oImgs.push({ name: wordImg.name || '0', buffer: buffer });
        };

        const html = await getMammothHtml(wordBuffer);
        const tables = await getHtmlTables(html);

        // hlz 구성물 생성
        const ooxmlConverter = new OoxmlConverter(ooxml, oImgs, tables); // TODO: helper 함수로 빼기
        const { hlzXml, hImgs } = await ooxmlConverter.convert();
        
        const [finalXml, inspectionReport, countingReport] = generateSpecInspectionResult(hlzXml);

        if (inspectionReport.find(r => r.process === 'STOP')) {
            return [
                null, 
                countingReport,
                inspectionReport,
                [],
            ];
        }
        const diffReport = await generateDiffLines(finalXml, html);

        // hlz 생성
        const hlzZip = new JSZip();
        const baseName = getBaseName(wordFile);
        hlzZip.file(`${baseName}.xml`, finalXml);
        hImgs.forEach(hImg => hlzZip.file(hImg.name, hImg.buffer));
        const hlzFile = await generateKipoFile(`${baseName}.hlz`, hlzZip);
        
        dlog(`=== hlz 생성 완료 ===`);
        
        return [
            hlzFile, 
            countingReport,
            inspectionReport,
            diffReport,
        ];

    } catch (error) {
        console.error('[makeHlz] 파일 처리 중 오류 발생:', error);
        throw error;
    }
};
