import lop from "lop";
import {
    Matcher, BreakMatcher, HighlightMatcher,
    isEqualTo, startsWith, MatcherOptions
} from "../5-styles/document-matchers.js";
import { tokenise } from "../5-styles/tokeniser.js";
import {
    HtmlPath, HtmlTag, emptyHtmlPath,
    makeHtmlPath, ignoredHtmlPath
} from "./html-paths.js";
import { collectWarning } from "../../errorCollector.js";

export type StyleMapping = {
    from: Matcher;
    to: HtmlPath;
}

function parseString(rule: any, str: string): StyleMapping | null {
    const tokens = tokenise(str);
    const parseResult = lop.Parser().parseTokens(rule, tokens);
    if (parseResult.isSuccess()) {
        return parseResult.value();
    } else {
        function describeFailure(input: string, parseResult: any) {
            return "Did not understand this style mapping, so ignored it: " + input + "\n" +
                parseResult.errors().map(describeError).join("\n");
        }
        function describeError(error: any) {
            return "Error was at character number " + error.characterNumber() + ": " +
                "Expected " + error.expected + " but got " + error.actual;
        }
        collectWarning(describeFailure(str, parseResult));
        return null;
    }
}

export function parseStyle(str: string): StyleMapping | null {
    return parseString(createStyleRule(), str);
}

function createStyleRule(): StyleMapping {
    return lop.rules.sequence(
        lop.rules.sequence.capture(documentMatcherRule()),
        lop.rules.tokenOfType("whitespace"),
        lop.rules.tokenOfType("arrow"),
        lop.rules.sequence.capture(lop.rules.optional(lop.rules.sequence(
            lop.rules.tokenOfType("whitespace"),
            lop.rules.sequence.capture(htmlPathRule())
        ).head())),
        lop.rules.tokenOfType("end")
    ).map((documentMatcher: Matcher, htmlPath: any) => {
        return {
            from: documentMatcher,
            to: htmlPath.valueOrElse(emptyHtmlPath)
        };
    });
}

export function parseDocumentMatcher(str: string): StyleMapping | null {
    log(`체크 - parseString(documentMatcherRule(), str):\n${parseString(documentMatcherRule(), str)}`)
    return parseString(documentMatcherRule(), str);
}

function documentMatcherRule(): any {
    var sequence = lop.rules.sequence;

    function identifierToConstant(identifier: string, constant: any) {
        return lop.rules.then(
            lop.rules.token("identifier", identifier),
            () => constant
        );
    };

    var paragraphRule = identifierToConstant("p", (opts: MatcherOptions) => new Matcher("paragraph", opts));
    var runRule = identifierToConstant("r", (opts: MatcherOptions) => new Matcher("run", opts));

    var elementTypeRule = lop.rules.firstOf("p or r or table",
        paragraphRule,
        runRule
    );

    var styleIdRule = lop.rules.sequence(
        lop.rules.tokenOfType("dot"),
        lop.rules.sequence.cut(),
        lop.rules.sequence.capture(identifierRule)
    ).map((styleId: string) => { return { styleId } });

    var styleNameMatcherRule = lop.rules.firstOf("style name matcher",
        lop.rules.then(
            lop.rules.sequence(
                lop.rules.tokenOfType("equals"),
                lop.rules.sequence.cut(),
                lop.rules.sequence.capture(stringRule)
            ).head(),
            (styleName: string) => ({ styleName: isEqualTo(styleName) })
        ),
        lop.rules.then(
            lop.rules.sequence(
                lop.rules.tokenOfType("startsWith"),
                lop.rules.sequence.cut(),
                lop.rules.sequence.capture(stringRule)
            ).head(),
            (styleName: string) => ({ styleName: startsWith(styleName) })
        )
    );

    var styleNameRule = lop.rules.sequence(
        lop.rules.tokenOfType("open-square-bracket"),
        lop.rules.sequence.cut(),
        lop.rules.token("identifier", "style-name"),
        lop.rules.sequence.capture(styleNameMatcherRule),
        lop.rules.tokenOfType("close-square-bracket")
    ).head();

    var listTypeRule = lop.rules.firstOf("list type",
        identifierToConstant("ordered-list", { isOrdered: true }),
        identifierToConstant("unordered-list", { isOrdered: false })
    );

    var listRule = sequence(
        lop.rules.tokenOfType("colon"),
        sequence.capture(listTypeRule),
        sequence.cut(),
        lop.rules.tokenOfType("open-paren"),
        sequence.capture(integerRule),
        lop.rules.tokenOfType("close-paren")
    ).map((listType: any, levelNumber: any) => {
        return {
            list: {
                isOrdered: listType.isOrdered,
                levelIndex: levelNumber - 1
            }
        };
    });

    function createMatcherSuffixesRule(rules: any[]): any {
        var matcherSuffix = lop.rules.firstOf.apply(
            lop.rules.firstOf,
            ["matcher suffix"].concat(rules)
        );
        var matcherSuffixes = lop.rules.zeroOrMore(matcherSuffix);
        return lop.rules.then(matcherSuffixes, (suffixes: any[]) => {
            var matcherOptions: any = {};
            suffixes.forEach((suffix: any) => {
                matcherOptions = { ...matcherOptions, ...suffix };
            });
            return matcherOptions;
        });
    }

    var paragraphOrRun = sequence(
        sequence.capture(elementTypeRule),
        sequence.capture(createMatcherSuffixesRule([
            styleIdRule,
            styleNameRule,
            listRule
        ]))
    ).map((createMatcher: any, matcherOptions: any) => createMatcher(matcherOptions));

    var table = sequence(
        lop.rules.token("identifier", "table"),
        sequence.capture(createMatcherSuffixesRule([
            styleIdRule,
            styleNameRule
        ]))
    ).map((options: any) => new Matcher("table", options));

    var bold = identifierToConstant("b", new Matcher("bold"));
    var italic = identifierToConstant("i", new Matcher("italic"));
    var underline = identifierToConstant("u", new Matcher("underline"));
    var strikethrough = identifierToConstant("strike", new Matcher("strikethrough"));
    var allCaps = identifierToConstant("all-caps", new Matcher("allCaps"));
    var smallCaps = identifierToConstant("small-caps", new Matcher("smallCaps"));

    var highlight = sequence(
        lop.rules.token("identifier", "highlight"),
        lop.rules.sequence.capture(lop.rules.optional(lop.rules.sequence(
            lop.rules.tokenOfType("open-square-bracket"),
            lop.rules.sequence.cut(),
            lop.rules.token("identifier", "color"),
            lop.rules.tokenOfType("equals"),
            lop.rules.sequence.capture(stringRule),
            lop.rules.tokenOfType("close-square-bracket")
        ).head()))
    ).map(function (color: any) {
        return new HighlightMatcher({ color: color.valueOrElse(undefined) });
    });

    var breakMatcher = sequence(
        lop.rules.token("identifier", "br"),
        sequence.cut(),
        lop.rules.tokenOfType("open-square-bracket"),
        lop.rules.token("identifier", "type"),
        lop.rules.tokenOfType("equals"),
        sequence.capture(stringRule),
        lop.rules.tokenOfType("close-square-bracket")
    ).map((breakType: string) => {
        switch (breakType) {
            case "line":
                return new BreakMatcher({ breakType: "line" });
            case "page":
                return new BreakMatcher({ breakType: "page" });
            case "column":
                return new BreakMatcher({ breakType: "column" });
            default:
            // TODO: handle unknown document matchers
        }
    });

    return lop.rules.firstOf("element type",
        paragraphOrRun,
        table,
        bold,
        italic,
        underline,
        strikethrough,
        allCaps,
        smallCaps,
        highlight,
        breakMatcher
    );
}

export function parseHtmlPath(str: string): HtmlPath | null {
    log(`체크 - parseString(htmlPathRule(), str):\n${parseString(htmlPathRule(), str)}`)
    return parseString(htmlPathRule(), str) as HtmlPath | null;
}

function htmlPathRule(): any {
    var capture = lop.rules.sequence.capture;
    var whitespaceRule = lop.rules.tokenOfType("whitespace");
    var freshRule = lop.rules.then(
        lop.rules.optional(lop.rules.sequence(
            lop.rules.tokenOfType("colon"),
            lop.rules.token("identifier", "fresh")
        )),
        function (option: any) {
            return option.map(() => true).valueOrElse(false);
        }
    );

    var separatorRule = lop.rules.then(
        lop.rules.optional(lop.rules.sequence(
            lop.rules.tokenOfType("colon"),
            lop.rules.token("identifier", "separator"),
            lop.rules.tokenOfType("open-paren"),
            capture(stringRule),
            lop.rules.tokenOfType("close-paren")
        ).head()),
        function (option: any) {
            return option.valueOrElse("");
        }
    );

    var tagNamesRule = lop.rules.oneOrMoreWithSeparator(
        identifierRule,
        lop.rules.tokenOfType("choice")
    );

    var styleElementRule = lop.rules.sequence(
        capture(tagNamesRule),
        capture(lop.rules.zeroOrMore(attributeOrClassRule)),
        capture(freshRule),
        capture(separatorRule)
    ).map((tagName: string, attrList: Record<string, string>[], fresh: boolean, separator: string) => {
        const attributes: Record<string, string> = {};
        attrList.forEach(attr => {
            if (attr.append && attributes[attr.name]) {
                attributes[attr.name] += " " + attr.value;
            } else {
                attributes[attr.name] = attr.value;
            }
        });

        const options: HtmlTagOptions = {};
        if (fresh) options.fresh = true;
        if (separator) options.separator = separator;
        // tagName, attributes, options 예시
        // [ 'h1' ] {} { fresh: true }
        // [ 'h2' ] {} { fresh: true }
        // [ 'h3' ] {} { fresh: true }
        // [ 'h4' ] {} { fresh: true }
        // [ 'h5' ] {} { fresh: true }
        // [ 'h6' ] {} { fresh: true }
        // [ 'p' ] {} { fresh: true }
        // [ 'strong' ] {} {}
        // [ 'li' ] {} {}
        // [ 'li' ] {} { fresh: true }
        // [ 'ol' ] {} {}
        // [ 'ul' ] {} {}
        // [ 'ul', 'ol' ] {} {}
        return new HtmlTag(tagName, attributes, options);
    });

    return lop.rules.firstOf("html path",
        lop.rules.then(lop.rules.tokenOfType("bang"), () => ignoredHtmlPath),
        lop.rules.then(
            lop.rules.zeroOrMoreWithSeparator(
                styleElementRule,
                lop.rules.sequence(
                    whitespaceRule,
                    lop.rules.tokenOfType("gt"),
                    whitespaceRule
                )
            ),
            makeHtmlPath
        )
    );
}

const identifierRule = lop.rules.then(
    lop.rules.tokenOfType("identifier"),
    decodeEscapeSequences
);
const integerRule = lop.rules.tokenOfType("integer");
const stringRule = lop.rules.then(
    lop.rules.tokenOfType("string"),
    decodeEscapeSequences
);

function decodeEscapeSequences(value: string): string {
    const escapeSequences: Record<string, string> = {
        "n": "\n",
        "r": "\r",
        "t": "\t"
    };
    return value.replace(/\\(.)/g, (_: string, code: string) => {
        return escapeSequences[code] || code;
    });
}

const attributeRule = lop.rules.sequence(
    lop.rules.tokenOfType("open-square-bracket"),
    lop.rules.sequence.cut(),
    lop.rules.sequence.capture(identifierRule),
    lop.rules.tokenOfType("equals"),
    lop.rules.sequence.capture(stringRule),
    lop.rules.tokenOfType("close-square-bracket")
).map((name: string, value: string) => ({ name, value, append: false }));

const classRule = lop.rules.sequence(
    lop.rules.tokenOfType("dot"),
    lop.rules.sequence.cut(),
    lop.rules.sequence.capture(identifierRule)
).map((className: string) => ({ name: "class", value: className, append: true }));

const attributeOrClassRule = lop.rules.firstOf(
    "attribute or class",
    attributeRule,
    classRule
);
