import xmldom from "@xmldom/xmldom";

export function parseFromString(xml: string): xmldom.Element {
    let error: any = null;
    const domParser = new xmldom.DOMParser({
        onError: function(level: string, message: string) {
            error = { level, message };
        }
    });
    const document = domParser.parseFromString(xml, 'text/xml');
    if (error) {
        throw new Error(error.level + ": " + error.message);
    }

    const rootElement = document.documentElement;
    if (!rootElement || rootElement.tagName === "parsererror") {
        throw new Error("XML parse error");
    }
    return rootElement;
}

export function serializeToString(element: xmldom.Node): string {
    const serializer = new xmldom.XMLSerializer();
    return serializer.serializeToString(element);
}