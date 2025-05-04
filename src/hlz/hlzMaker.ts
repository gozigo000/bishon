import JSZip from 'jszip';
import iconv from 'iconv-lite';
import { OoxmlConverter } from './ooxmlToHlz/OoxmlConverter';

export type Img = {
    name: string;
    buffer: ArrayBuffer;
}

export async function makeHlz( {wordFile, fileName}: {wordFile: File | ArrayBuffer, fileName: string}): Promise<File> {
    try {
        console.debug('\n=== hlz 생성 시작 ===');

        // docx 파일이면 ArrayBuffer로 변환
        const wordZip = new JSZip();
        const fileBuffer = (wordFile instanceof File) ? 
            await wordFile.arrayBuffer() : 
            wordFile;
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

        // ooxml -> hlz 변환 및 이미지 처리
        const ooxmlConverter = new OoxmlConverter(ooxml, oImgs);
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
        
        console.debug(`=== hlz 생성 완료 ===`);

        return new File([zipBuffer], `${fileName.replace('.docx', '.hlz')}`);

    } catch (error) {
        console.error('[makeHlz] 파일 처리 중 오류 발생:', error);
        throw error;
    }
};