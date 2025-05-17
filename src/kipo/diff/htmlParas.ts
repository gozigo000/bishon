import { JSDOM } from "jsdom";
import { getMammothHtml } from "../utils";


export async function getHtmlParas(input: FileOrBuffer | Html): Promise<Paragraph[]> {
    try {
        let html = (typeof input === 'string') ? input : await getMammothHtml(input);
        html = html.replace(/<h[0-9]+>([\s\S]*?)<\/h[0-9]+>/g, `<p>$1</p>`);
        html = html.replace(/<a.*?>([\s\S]*?)<\/a>/g, `$1`); // 이것 때문에 괄호 안 내용이 사라졌던 것
        html = html.replace(/<table>([\s\S]*?)<\/table>/g, `$1`);
        html = html.replace(/<tr>([\s\S]*?)<\/tr>/g, `$1`);
        html = html.replace(/<td>([\s\S]*?)<\/td>/g, `$1`);
        html = html.replace(/<ol>([\s\S]*?)<\/ol>/g, `$1`);
        html = html.replace(/<ul>([\s\S]*?)<\/ul>/g, `$1`);
        html = html.replace(/<li>([\s\S]*?)<\/li>/g, `<p>$1</p>`);
        html = html.replace(/<img [\s\S]*?\/>/g, ``); // 이미지 태그 전부 제거
        html = html.replace(/<strong>([\s\S]*?)<\/strong>/g, `<b>$1</b>`);
        
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