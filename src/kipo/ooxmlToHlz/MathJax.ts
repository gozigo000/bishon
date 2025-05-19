// mathjax docs: https://docs.mathjax.org/en/latest/server/start.html
// mathjax nodejs 예시: https://github.com/mathjax/MathJax-demos-node#MathJax-demos-node

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { collectError } from '../errorCollector';
import { dlog } from '@/_utils/env';

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
 * MathJax 라이브러리 래핑한 클래스
 */
export class MathJax {
    /**
     * latex 문자열을 SVG 이미지 문자열로 변환
     */
    public static async convert(latex: string): Promise<string | null> {
        try {
            const node = html.convert(latex, { 
                display: true // 수식 표시 모드 (true: 블록, false: 인라인)
            });
            const svgString = adaptor.innerHTML(node);
            // svg 저장
            // const fs = require('fs');
            // fs.writeFileSync(`mathjax-${MathJax.cnt}.svg`, svgString);
            // MathJax.cnt++;
            
            return svgString;
        } catch (error) {
            collectError(`latex > svg 변환 실패`, error as Error,
                `latex 문자열: ${latex}\n mathjax 변환 사이트: https://thomasahle.com/latex2png/`);
            return null;
        }
    }
}
