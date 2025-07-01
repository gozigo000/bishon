// mathjax docs: https://docs.mathjax.org/en/latest/server/start.html
// mathjax nodejs 예시: https://github.com/mathjax/MathJax-demos-node#MathJax-demos-node

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import sharp from 'sharp';
import { collectError } from '../0-utils/errorCollector';
import { collectLatex } from '../0-utils/dataCollector';
import { fromOmmlToLatex } from '../ommlToLatex/OmmlConverter';
import { failedImg } from '../0-utils/utils';

/**
 * omml 문자열을 JPG 버퍼로 변환
 */
export default async function convertToJpg(ooxml: string): Promise<Buffer<ArrayBufferLike>> {
    const latex = fromOmmlToLatex(ooxml);
    if (!latex) return failedImg;

    const svg = await fromLatexToSvg(latex);
    if (!svg) return failedImg;

    const jpg = await fromSvgToJpg(svg);
    if (!jpg) return failedImg;

    return jpg;
}

// MathJax 초기화
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({
    packages: AllPackages,
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
});
const svg = new SVG({});
const html = mathjax.document('', {
    InputJax: tex,
    OutputJax: svg
});

/**
 * MathJax 래퍼
 */
export async function fromLatexToSvg(latex: string): Promise<string | null> {
    try {
        const node = html.convert(latex, {
            display: true // 수식 표시 모드 (true: 블록, false: 인라인)
        });
        const svg = adaptor.innerHTML(node);
        collectLatex({ latex, svg });
        return svg;

    } catch (error) {
        collectError(`latex > svg 변환 실패`, error as Error,
            `latex 문자열: ${latex}\n mathjax 변환 사이트: https://thomasahle.com/latex2png/`);
        return null;
    }
}

export async function fromSvgToJpg(svgStr: string): Promise<Buffer<ArrayBufferLike> | null> {
    try {
        const svgBuffer = Buffer.from(svgStr);

        // 원본 이미지 크기 가져오기
        const svgMetadata = await sharp(svgBuffer).metadata();
        const svgWidth = svgMetadata.width || 1;

        // SVG를 JPG로 변환
        const jpgBuffer = await sharp(svgBuffer)
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .resize({
                width: svgWidth * 3, // 크기 3배
                fit: 'contain', // 원본 비율 유지
            })
            .extend({
                bottom: 5,
                left: 2,
                right: 2,
                background: { r: 255, g: 255, b: 255 }
            })
            .jpeg({ quality: 80 }) // 80% 품질로 설정
            .toBuffer();

        return jpgBuffer;

    } catch (error) {
        collectError(`svg > jpg 변환 실패`, error as Error);
        return null;
    }
}
