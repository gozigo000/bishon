import mammoth from "mammoth";
import { JSDOM } from 'jsdom';
import { toBuffer } from "../_utils/dataType";
import JSZip from "jszip";
import iconv from "iconv-lite";
import { collectError } from "./errorCollector";
import { collectRefs } from "./dataCollector";

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

export function makeEmptyElement(): Element {
    return new JSDOM('<empty></empty>', { contentType: 'text/xml' })
        .window.document.documentElement;
}

export async function getMammothHtml(input: FileOrBuffer): Promise<string> {
    try {
        const buffer = await toBuffer(input);
        var options = {
            ignoreEmptyParagraphs: false,
            convertImage: mammoth.images.imgElement(async (image) =>  { return { src: image.contentType } }),
        }
        const result = await mammoth.convertToHtml({ buffer: buffer }, options);

        collectRefs({ 'Html_맘모스.html': result.value });

        // 여기선 Mammoth 모듈에서 제공하는 그대로 반환하고,
        // 전부 <p> 태그로 바꾸는 건 getHtmlParas()에서 하기로 함.
        return result.value;

    } catch (error) {
        collectError('Mammoth html 변환 실패', error as Error);
        return '';
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
        collectError('Html 테이블 추출 실패', error as Error);
        return [];
    }
}

export function toOneLine(ml: string): string {
    ml = ml.replace(/<(b|i|u|sub|sup)>\s+<\/(b|i|u|sub|sup)>/g, '<$1>#M#A#R#K#</$2>');
    ml = ml.replace(/>\s+</g, '><').replace(/[\r\n]+/g, '');
    ml = ml.replace(/>#M#A#R#K#</g, '> <');
    return ml;
}

export function integrateRtfTags(ml: string): string {
    ml = ml.replaceAll('</b><b>', '');
    ml = ml.replaceAll('</i><i>', '');
    ml = ml.replaceAll('</u><u>', '');
    ml = ml.replaceAll('</sub><sub>', '');
    ml = ml.replaceAll('</sup><sup>', '');
    return ml;
}

/**
 * hlz 문자열 이스케이프 처리
 * @param str - 처리할 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeCharacters(str: string): string {
    // hlz에서 이스케이프가 필요한 문자들
    const CHARS: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    };
    return str.split('').map(c => CHARS[c] || c).join('');
}