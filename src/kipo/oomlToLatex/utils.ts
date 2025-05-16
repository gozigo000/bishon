import { ESCAPING_CHARS, BACKSLASH, ACCENTS } from "./data";

/**
 * 문자를 유니코드 문자열로 변환
 * - 유니코드 문자열은 4자리 또는 8자리(확장 유니코드)로 구성됨
 * - `\u` 또는 `\U`는 붙이지 않음
 * @param ch - 문자
 * @returns 유니코드 문자열
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
 * LaTeX 문자열 이스케이프 처리
 * @param str - 처리할 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeLatex(str: string): string {
    let last = '\0';
    const sb: string[] = [];
    str = str.replace(/\\\\/g, '\\');
    
    for (const c of str) {
        if (ESCAPING_CHARS.includes(c) && last !== BACKSLASH[0]) {
            sb.push(BACKSLASH + c);
        } else {
            sb.push(c);
        }
        last = c;
    }

    return sb.join('');
}

/**
 * 문자열 포맷팅
 * @param str - 포맷 문자열
 * @param args - 포맷 인자들
 * @returns 포맷된 문자열
 */
export function format(str: string, ...args: unknown[]): string {
    return str.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] !== 'undefined' ? String(args[number]) : match;
    });
}

/**
 * 복잡한 수식인지 확인
 * @param e - 확인할 수식 문자열
 * @returns 복잡한 수식이면 true
 */
export function isComplexEquation(e: string): boolean {
    return e.length > 2 && (e.includes('+') || e.includes('-') || e.includes('\\'));
}

/**
 * 키에 해당하는 값을 가져옴
 * @param key - 찾을 키
 * @param defaultValue - 기본값
 * @param values - 값이 저장된 딕셔너리
 * @returns 찾은 값 또는 기본값
 */
export function getValue(
    key: string | null, 
    defaultValue: string | null = null, 
    values: Record<string, string> = ACCENTS
): string {
    if (key === null) return defaultValue || '';
    if (key in values) return values[key];
    const unicode = getUnicodeString(key);
    return values[unicode] || key;
}

