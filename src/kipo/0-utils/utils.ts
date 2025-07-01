import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { toBuffer } from "../../_utils/dataType";
import JSZip from "jszip";
import iconv from "iconv-lite";
import { collectError } from "./errorCollector";
import { collectRefs } from "./dataCollector";

export async function generateKipoFile(fileName: string, zip: JSZip): Promise<File> {
    // HACK: jszip 모듈에서 수정하지 말고 jszip 모듈을 src 폴더로 옮기기
    const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        encodeFileName: (fileName) => iconv.encode(fileName, 'cp949').toString('binary'),
        compression: 'DEFLATE',
        compressionOptions: { level: 1 } // 압축 레벨
    });

    const file = new File([zipBuffer], fileName);
    return file;
}

export const failedImg = fs.readFileSync(path.join(process.cwd(), 'public/null.jpg'));
export const getFailedImg = (): Buffer<ArrayBufferLike> => {
    const failedImg = path.join(process.cwd(), 'public/null.jpg');
    return fs.readFileSync(failedImg);
}

export async function getMammothHtml(input: FileOrBuffer): Promise<string> {
    try {
        const buffer = await toBuffer(input);
        const result = await mammoth.convertToHtml({ buffer }, {
            ignoreEmptyParagraphs: false,
            convertImage: mammoth.images.imgElement(async (image) => {
                return { src: image.contentType.split('/')[1] };
                // return image.readAsBase64String().then(function(imageBuffer) {
                //     return { src: "data:" + image.contentType + ";base64," + imageBuffer };
                // });
            }),
            styleMap: [
                "b => b",
                "i => i",
                "u => u",
                "r[style-name='Strong'] =>",
                "p[style-name='Heading 1'] => p:fresh",
                "p[style-name='Heading 2'] => p:fresh",
                "p[style-name='Heading 3'] => p:fresh",
                "p[style-name='Heading 4'] => p:fresh",
                "p[style-name='Heading 5'] => p:fresh",
                "p[style-name='Heading 6'] => p:fresh",
                "p:unordered-list(1) => p:fresh",
                "p:unordered-list(2) => p:fresh",
                "p:unordered-list(3) => p:fresh",
                "p:unordered-list(4) => p:fresh",
                "p:unordered-list(5) => p:fresh",
                "p:ordered-list(1) => p:fresh",
                "p:ordered-list(2) => p:fresh",
                "p:ordered-list(3) => p:fresh",
                "p:ordered-list(4) => p:fresh",
                "p:ordered-list(5) => p:fresh",
            ],
        });

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
