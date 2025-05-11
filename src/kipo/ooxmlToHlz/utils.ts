// @ts-ignore mathjax 타입 정의 문제
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX();
const svg = new SVG({ fontCache: 'none' });
const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

/**
 * MathJax 라이브러리 래핑한 클래스
 * @param tex - latex 문자열
 * @returns SVG 이미지 문자열
 */
export class MathJax {
    /**
     * latex 문자열을 SVG 이미지로 변환
     * @param latex - latex 문자열
     * @returns SVG 이미지 문자열
     */
    public static async convert(latex: string): Promise<string> {
        const node = html.convert(latex, { display: true });
        const svgString = adaptor.outerHTML(node);
        // MathJax 컨테이너 태그 제거
        const svgMatch = svgString.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
        if (svgMatch) {
            return svgMatch[0];
        } else {
            throw new Error('SVG 태그를 찾을 수 없습니다.');
        }
    }
}

/**
 * 문자를 유니코드 문자열로 변환
 * - 유니코드 문자열은 4자리 또는 8자리(확장 유니코드)로 구성됨
 * @param ch - 문자
 * @returns 유니코드 문자열 w/0 접두사 (`\u`, `\U`)
 */
export function getUnicodeString(ch: string): string {
    const unicode = ch.codePointAt(0);
    if (!unicode) return '';
    if (unicode < 0x10000) {
        return `${unicode.toString(16).padStart(4, '0')}`;
    }
    else {
        return `${unicode.toString(16).padStart(8, '0')}`;
    }
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
