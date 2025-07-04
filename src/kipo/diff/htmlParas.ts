import { getMammothHtml } from "../0-utils/utils";
import { collectRefs } from "../0-utils/dataCollector";
import { parseXml } from "../2-lightParser/entry";
import { removeSubsets } from "../2-lightParser/2-domutils/array-utils";
import { isString } from "../../_utils/typeCheck";

export async function getHtmlParasForDiff(input: FileOrBuffer | Html): Promise<string[]> {
    try {
        let html = isString(input) ? input : await getMammothHtml(input);
        html = html.replace(/<a.*?>([\s\S]*?)<\/a>/g, `$1`); // 이것 때문에 괄호 안 내용이 사라졌던 것
        html = html.replace(/<table>([\s\S]*?)<\/table>/g, `$1`);
        html = html.replace(/<tr>([\s\S]*?)<\/tr>/g, `$1`);
        html = html.replace(/<td>([\s\S]*?)<\/td>/g, `$1`);
        html = html.replace(/<img [\s\S]*?\/>/g, ``); // 이미지 태그 전부 제거

        collectRefs({ 'Html_심플맘모스_Diff용.html': html });
        
        const dom = parseXml(html);
        const pTags = dom.getElemsByTag('<p>');
        removeSubsets(pTags);
        const paras = pTags.map(e => e.innerXML);

        return paras;
     
    } catch (err) {
        console.error("변환 실패:", err);
        return [];
    }
}