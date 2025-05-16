// @ts-ignore mathjax 타입 정의 문제
import { mathjax } from 'mathjax';

/**
 * MathJax 라이브러리 래핑한 클래스
 * @param tex - latex 문자열
 * @returns SVG 이미지 문자열
 */
export class MathJax {
    private static mathJax: mathjax.MathJax | null = null;
    /**
     * latex 문자열을 SVG 이미지로 변환
     * @param latex - latex 문자열
     * @returns SVG 이미지 문자열
     */
    public static async convert(latex: string): Promise<string> {
        // mathjax 초기화
        if (!this.mathJax) {
            this.mathJax = await require('mathjax').init({
                loader: { load: ['input/tex', 'output/svg'] }
            });
        }
        // 수식 변환
        const svg = await this.mathJax.tex2svg(latex, { display: true });
        const svgStr = this.mathJax.startup.adaptor.innerHTML(svg);
        return svgStr;
    }
}
