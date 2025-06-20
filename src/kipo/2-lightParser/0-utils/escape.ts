/**
 * Encodes all characters that have to be escaped in HTML attributes,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 * @param data String to escape.
 */
export function escapeAttribute(data: string): string {
    return getEscaper(
        /["&\u00A0]/g,
        new Map([
            [34, "&quot;"],
            [38, "&amp;"],
            [160, "&nbsp;"],
        ]),
    )(data);
}

/**
 * Encodes all characters that have to be escaped in HTML text,
 * following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
 * @param data String to escape.
 */
export function escapeText(data: string): string {
    return getEscaper(
        /[&<>\u00A0]/g,
        new Map([
            [38, "&amp;"],
            [60, "&lt;"],
            [62, "&gt;"],
            [160, "&nbsp;"],
        ]),
    )(data);
}

/**
 * Creates a function that escapes all characters matched by the given regular
 * expression using the given map of characters to escape to their entities.
 *
 * @param regex Regular expression to match characters to escape.
 * @param map Map of characters to escape to their entities.
 *
 * @returns Function that escapes all characters matched by the given regular
 * expression using the given map of characters to escape to their entities.
 */
function getEscaper(regex: RegExp, map: Map<number, string>): (data: string) => string {
    return function escape(data: string): string {
        let match;
        let lastIdx = 0;
        let result = "";

        while ((match = regex.exec(data))) {
            if (lastIdx !== match.index) {
                result += data.substring(lastIdx, match.index);
            }

            // We know that this character will be in the map.
            result += map.get(match[0].charCodeAt(0))!;

            // Every match will be of length 1
            lastIdx = match.index + 1;
        }

        return result + data.substring(lastIdx);
    };
}