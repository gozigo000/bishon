import JSZip from 'jszip';
import iconv from 'iconv-lite';
import mammoth from 'mammoth';
import { JSDOM } from 'jsdom';
import { OoxmlConverter } from './ooxmlToHlz/OoxmlConverter';

export type Img = {
    name: string;
    buffer: ArrayBuffer;
}

export async function makeHlz( {wordFile, fileName}: {wordFile: File | ArrayBuffer, fileName: string}): Promise<{file: File, report: {kind?: string, pos1?: string, pos2?: string, msg: string}[] }> {
    try {
        console.debug('\n=== hlz 생성 시작 ===');

        // docx 파일이면 ArrayBuffer로 변환
        const wordZip = new JSZip();
        const fileBuffer = (wordFile instanceof File) ? 
            await wordFile.arrayBuffer() : 
            wordFile;
        if (!fileBuffer) throw new Error('wordFile이 올바르지 않습니다.');
        const zipContent = await wordZip.loadAsync(fileBuffer);

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

        const buffer = Buffer.from(fileBuffer);
        const tables = await getHtmlTables(buffer);

        // ooxml 및 이미지, 테이블 처리
        const ooxmlConverter = new OoxmlConverter(ooxml, oImgs, tables);
        const { hlzXml, hImgs } = await ooxmlConverter.convert();
        const report = [{kind: '미구현', msg: '미구현'}]

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
        
        console.debug(`=== hlz 생성 완료 ===`);

        return {
            file: new File([zipBuffer], `${fileName.replace('.docx', '.hlz')}`),
            report: report
        };

    } catch (error) {
        console.error('[makeHlz] 파일 처리 중 오류 발생:', error);
        throw error;
    }
};

async function getHtmlTables(arrayBuffer: Buffer): Promise<HTMLTableElement[]> {
    try {
        if (!arrayBuffer) {
            throw new Error("arrayBuffer가 필요합니다!");
        }
        var options = {
            ignoreEmptyParagraphs: false,
            convertImage: mammoth.images.imgElement(async (image) =>  { return { src: image.contentType } }),
            styleMap: [ "b => b", "i => i", "u => u" ]
        };
        const result = await mammoth.convertToHtml({ buffer: arrayBuffer }, options);
        let html = result.value.replace(/<h[0-9]+>([\s\S]*?)<\/h[0-9]+>/g, `<p>$1</p>`);
        html = html.replace(/<a id=".*?">/g, '');

        const dom = new JSDOM(html);
        const tables = dom.window.document.querySelectorAll('table');
        const tableArray: HTMLTableElement[] = [];
        tables.forEach(table => { tableArray.push(table); });
        return tableArray;
     
    } catch (err) {
        console.error("변환 실패:", err);
        return [];
    }
}
