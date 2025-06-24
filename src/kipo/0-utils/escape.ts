import { collectWarning } from "./errorCollector";

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
