import { JSDOM } from "jsdom";
import { getMammothHtml } from "../utils";


export async function getHtmlParas(input: FileOrBuffer | Html): Promise<Paragraph[]> {
    try {
        let html = (typeof input === 'string') ? input : await getMammothHtml(input);
        
        const dom = new JSDOM(html);
        // <html><head></head><body>
        const body = dom.window.document.getElementsByTagName('body')[0];
        const elements = body.children;
        const paras: Paragraph[] = [];
        for (const element of elements) {
            paras.push({ content: element.innerHTML });
        }
        return paras;
     
    } catch (err) {
        console.error("변환 실패:", err);
        return [];
    }
}