import JSZip from 'jszip';
import iconv from 'iconv-lite';
import { JSDOM } from 'jsdom';
import { OoxmlConverter } from './ooxmlToHlz/OoxmlConverter';
import { getMammothHtml, toArrayBuffer } from './utils';
import { generateDiffLines } from './diff/paraDiff';

export type Img = {
    name: string;
    buffer: ArrayBuffer;
}

export async function makeHlz( 
    {wordFile, fileName}: {wordFile: File | ArrayBuffer, fileName: string}
): Promise<{file: File, report: DiffLine[] }> {
    try {
        console.debug('\n=== hlz 생성 시작 ===');

        const wordBuffer = await toArrayBuffer(wordFile);

        const wordZip = new JSZip();
        if (!wordBuffer) throw new Error('wordFile이 올바르지 않습니다.');
        const zipContent = await wordZip.loadAsync(wordBuffer);

        // document.xml 파일 찾기
        const documentXml = zipContent.file('word/document.xml');
        if (!documentXml) throw new Error('document.xml을 찾을 수 없습니다.');
        const ooxml = await documentXml.async('text');
        
        // 워드 이미지 파일 찾기
        const wordImgs = zipContent.file(/^word\/media\/image[0-9]+.*$/);
        const oImgs: Img[] = [];
        for (const wordImg of wordImgs) {
            const buffer = await wordImg.async('arraybuffer');
            oImgs.push({ name: wordImg.name || '0', buffer: buffer });
        };

        const html = await getMammothHtml(wordBuffer);
        const tables = await getHtmlTables(html);

        // ooxml 및 이미지, 테이블 처리
        const ooxmlConverter = new OoxmlConverter(ooxml, oImgs, tables);
        const { hlzXml, hImgs } = await ooxmlConverter.convert();

        // hlz 생성
        const hlzZip = new JSZip();
        hlzZip.file(fileName.replace('.docx', '.xml'), hlzXml);
        for (let i = 0; i < hImgs.length; i++) {
            hlzZip.file(hImgs[i].name, hImgs[i].buffer);
        }
        // HACK: jszip 모듈에서 수정하지 말고 jszip 모듈을 src 폴더로 옮기기
        // jszip 수정위치: ./node_modules/jszip/lib/generate/ZipFileWorker.js: line 158-159        
        const zipBuffer = await hlzZip.generateAsync({ 
            type: 'nodebuffer',
            encodeFileName: (fileName) => iconv.encode(fileName, 'cp949').toString('binary'),
            compression: 'DEFLATE',
            compressionOptions: { level: 1 } // 압축 레벨
        });

        const hlzFile = new File([zipBuffer], `${fileName.replace('.docx', '.hlz')}`);
        
        console.debug(`=== hlz 생성 완료 ===`);
        
        const diffReport = await generateDiffLines(hlzXml, html);

        return {
            file: hlzFile,
            report: diffReport
        };

    } catch (error) {
        console.error('[makeHlz] 파일 처리 중 오류 발생:', error);
        throw error;
    }
};


async function getHtmlTables(input: FileOrBuffer | Html): Promise<HTMLTableElement[]> {
    try {
        let html = (typeof input === 'string') ? input : await getMammothHtml(input);
        
        const dom = new JSDOM(html);
        const tables = dom.window.document.querySelectorAll('table');
        const tableArray: HTMLTableElement[] = [];
        tables.forEach(table => { tableArray.push(table); });
        return tableArray;
     
    } catch (error) {
        console.error("html 테이블 추출 실패:", error);
        throw error;
    }
}
