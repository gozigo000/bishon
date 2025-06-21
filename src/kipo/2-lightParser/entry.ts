import type { XDocument, XElement } from "./1-node/node";
import { DomHandler, type DomHandlerOptions } from "./Handler";
import { Parser, type ParserOptions } from "./Parser";

// 진입점

export type Options = ParserOptions & DomHandlerOptions;

/**
 * Parses the input, returns the resulting document.
 * @param input The data that should be parsed.
 * @param options Options for the parser and DOM handler.
 */
export function parseXml(input: string, options?: Options): XDocument {
    const handler = new DomHandler(options);
    new Parser(handler, options).end(input);
    return handler.root;
}

/**
 * Creates a parser instance, with an attached DOM handler.
 * @param options Options for the parser and DOM handler.
 * @param callback A callback that will be called once parsing has been completed, with the resulting document.
 * @param elementCallback A callback that will be called every time a tag has been completed inside of the DOM.
 */
export function createDocumentStream(
    callback: (error: Error | null, document: XDocument) => void,
    elementCallback?: (elem: XElement) => void,
    options?: Options,
): Parser {
    const handler = new DomHandler(
        options,
        (error: Error | null) => callback(error, handler.root),
        elementCallback,
    );
    return new Parser(handler, options);
}
