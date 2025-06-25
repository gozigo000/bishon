import xmldom from "@xmldom/xmldom";
import { collectError } from "@/kipo/0-utils/errorCollector";

export function parseFromString(xml: string): xmldom.Element {
    let errMsg: string = '';
    const domParser = new xmldom.DOMParser({
        onError: (level: string, message: string) => {
            errMsg = `@xmldom 파싱 중 오류 발생: ${level}: ${message}`;
        }
    });
    try {
        const document = domParser.parseFromString(xml, 'text/xml');
        const rootElem = document.documentElement;
        if (!rootElem || rootElem.tagName === "parsererror") {
            throw new Error("XML 파싱 에러");
        }
        return rootElem;
    } catch (error: any) {
        collectError(errMsg, error);
        return emptyFailElem;
    }
}

const emptyFailElem = (() => {
    return new xmldom.DOMParser()
        .parseFromString(`<div>Word 파싱 실패</div>`, 'text/xml')
        .documentElement!;
})();

export function serializeToString(element: xmldom.Node): string {
    const serializer = new xmldom.XMLSerializer();
    return serializer.serializeToString(element);
}