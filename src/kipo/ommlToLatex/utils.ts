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
 * LaTeX에서 이스케이프 처리하는 문자들
 */
const ESCAPING_CHARS = ['{', '}', '_', '^', '#', '&', '$', '%', '~'];
/**
 * LaTeX 문자열 이스케이프 처리
 */
export function escapeLatex(str: string): string {
    str = str.replace(/\\\\/g, '\\');
    const sb: string[] = [];
    let last = '\0';
    for (const c of str) {
        if (ESCAPING_CHARS.includes(c) && last !== '\\') {
            sb.push('\\' + c);
        } else {
            sb.push(c);
        }
        last = c;
    }

    return sb.join('');
}

/**
 * 키에 해당하는 값을 가져옴
 * @param key - 찾을 키
 * @param defaultValue - 기본값
 * @param values - 값이 저장된 딕셔너리
 * @returns 찾은 값 또는 기본값
 */
export function getValue(
    key: string | undefined, 
    defaultValue: string, 
    values: Record<string, string>
): string {
    if (key === undefined) return defaultValue;
    if (key === '') return '';
    const unicode = getUnicodeString(key);
    return values[key] || values[unicode] || key;
}
