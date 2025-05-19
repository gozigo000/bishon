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
