import mammoth from "mammoth";
import { JSDOM } from 'jsdom';
import { toBuffer } from "../_utils/dataType";
import JSZip from "jszip";
import iconv from "iconv-lite";
import { kipoTagName } from "./data";

export async function generateKipoFile(fileName: string, zip: JSZip): Promise<File> {
    // HACK: jszip 모듈에서 수정하지 말고 jszip 모듈을 src 폴더로 옮기기
    // jszip 수정위치: ./node_modules/jszip/lib/generate/ZipFileWorker.js: line 158-159
    const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        encodeFileName: (fileName) => iconv.encode(fileName, 'cp949').toString('binary'),
        compression: 'DEFLATE',
        compressionOptions: { level: 1 } // 압축 레벨
    });

    const file = new File([zipBuffer], fileName);
    return file;
}

export async function getMammothHtml(input: FileOrBuffer): Promise<string> {
    try {
        const buffer = await toBuffer(input);
        var options = {
            ignoreEmptyParagraphs: false,
            convertImage: mammoth.images.imgElement(async (image) =>  { return { src: image.contentType } }),
        }
        const result = await mammoth.convertToHtml({ buffer: buffer }, options);
        let html = result.value;
        html = html.replace(/<h[0-9]+>([\s\S]*?)<\/h[0-9]+>/g, `<p>$1</p>`);
        html = html.replace(/<a id=".*?">/g, '');
        return html;

    } catch (error) {
        console.error("html 변환 실패:", error);
        throw error;
    }
}

export async function getHtmlTables(input: FileOrBuffer | Html): Promise<HTMLTableElement[]> {
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

// TODO: pageCounter에도 적용하기
export function toOneLine(ml: string): string {
    // TODO: <b>사과</b> <i>나무</i> 이런 경우에는 붙으면 안되는데...
    return ml.replace(/>\s+</g, '><').replace(/[\r\n]+/g, '');
}

export function getKipoTagName(kTag: string): string {
    try {
        if (kipoTagName.hasOwnProperty(kTag)) return kipoTagName[kTag];
        else throw new Error(`한글 태그 이름이 잘못 입력되었습니다. (kTag: ${kTag})\n`);
    } catch (e) {
        console.error(e);
        return '';
    }
}