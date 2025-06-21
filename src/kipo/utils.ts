import mammoth from "mammoth";
import { toBuffer } from "../_utils/dataType";
import JSZip from "jszip";
import iconv from "iconv-lite";
import { collectError, collectWarning } from "./errorCollector";
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

export async function getMammothHtml(input: FileOrBuffer): Promise<string> {
    try {
        const buffer = await toBuffer(input);
        var options = {
            ignoreEmptyParagraphs: false,
            convertImage: mammoth.images.imgElement(async (image) => {
                return image.readAsBase64String().then(function(imageBuffer) {
                    return {
                        src: "data:" + image.contentType + ";base64," + imageBuffer
                    };
                });
            }),
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

export function toOneLine(ml: string): string {
    ml = ml.replace(/<(b|i|u|sub|sup)>\s+<\/(b|i|u|sub|sup)>/g, '<$1>#M#A#R#K#</$2>');
    ml = ml.replace(/>\s+</g, '><').replace(/[\r\n]+/g, '');
    ml = ml.replace(/>#M#A#R#K#</g, '> <');
    return ml;
}

export function integrateRtfTags(ml: string): string {
    ml = ml.replace(/<\/b>(\s*)<b>/g, '$1');
    ml = ml.replace(/<\/i>(\s*)<i>/g, '$1');
    ml = ml.replace(/<\/u>(\s*)<u>/g, '$1');
    ml = ml.replace(/<\/sub>(\s*)<sub>/g, '$1');
    ml = ml.replace(/<\/sup>(\s*)<sup>/g, '$1');
    return ml;
}

/**
 * hlz 문자열 이스케이프 처리
 * @param str - 처리할 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeChars(str: string): string {
    // hlz에서 이스케이프가 필요한 문자들
    const CHARS: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    };
    return str.split('').map(c => CHARS[c] || c).join('');
}

/**
 * XML 태그 속성 값 문자열 이스케이프 해제
 */
export function unEscapeXmlAttr(str: string): string {
    str = str.replaceAll('&lt;', '<');
    str = str.replaceAll('&gt;', '>');
    str = str.replaceAll('&amp;', '&');
    str = str.replaceAll('&quot;', '"');
    str = str.replaceAll('&nbsp;', ' ');

    if (/&[a-z]+?;/g.test(str)) {
        const match = str.match(/&[a-z]+?;/g);
        collectWarning(`처음보는 이스케이프 등장: ${match![0]}`);
    }

    return str;
}

/**
 * XML 텍스트 문자열 이스케이프 해제
 */
export function unEscapeXmlText(str: string): string {
    str = str.replaceAll('&lt;', '<');
    str = str.replaceAll('&gt;', '>');
    str = str.replaceAll('&amp;', '&');
    str = str.replaceAll('&nbsp;', ' ');

    if (/&[a-z]+?;/g.test(str)) {
        const match = str.match(/&[a-z]+?;/g);
        collectWarning(`처음보는 이스케이프 등장: ${match![0]}`);
    }

    return str;
}

// label별 누적 시간 저장용 객체
const timeAccumulator: Record<string, number> = {};

/**
 * label별로 누적 시간 측정하는 래퍼 함수
 */
export async function measureTime<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const elapsed = end - start;

    // 누적 시간 기록
    if (!timeAccumulator[label]) timeAccumulator[label] = 0;
    timeAccumulator[label] += elapsed;

    return result;
}

/**
 * label별 누적 시간 조회 함수
 */
export function printAccTimes() {
    for (const key in timeAccumulator) {
        console.log(`${key}: ${timeAccumulator[key].toFixed(2)} ms`);
    }
}