import { escapeChars } from "../utils";
import { XNode } from '../2-lightParser/1-node/node';
import { parseXml } from "../2-lightParser/entry";

/**
 * Kipo XML에서 Paragraphs를 추출하는 클래스
 */
export function getKipoParas(kXml: KipoXml): string[] {
    const paras: string[] = [];
    const xDoc = parseXml(kXml);

    if (xDoc.hasKipoElem('<발명의설명>')) {
        paras.push('【발명의 설명】');

        const invTitle = xDoc.getKipoElem('<발명의명칭>');
        if (invTitle) {
            paras.push(`【발명의 명칭】`);
            paras.push(...processParas(invTitle.childNodes));
        }

        const techField = xDoc.getKipoElem('<기술분야>');
        if (techField) {
            paras.push('【기술분야】');
            paras.push(...processParas(techField.childNodes));
        }

        const backArt = xDoc.getKipoElem('<배경기술>');
        if (backArt) {
            paras.push('【발명의 배경이 되는 기술】');
            paras.push(...processParas(backArt.childNodes));
        }

        if (xDoc.hasKipoElem('<선행기술문헌>')) {
            paras.push('【선행기술문헌】');
            const patcit = xDoc.getKipoElem('<특허문헌>');
            if (patcit) {
                paras.push('【특허문헌】');
                paras.push(...processParas(patcit.childNodes));
            }
            const nonPatCit = xDoc.getKipoElem('<비특허문헌>');
            if (nonPatCit) {
                paras.push('【비특허문헌】');
                paras.push(...processParas(nonPatCit.childNodes));
            }
        }

        const invSummary = xDoc.getKipoElem('<발명의내용>');
        if (invSummary) {
            paras.push('【발명의 내용】');
            paras.push(...processParas(invSummary.childNodes));

            const problem = xDoc.getKipoElem('<과제>');
            if (problem) {
                paras.push('【해결하고자 하는 과제】');
                paras.push(...processParas(problem.childNodes));
            }
            const solution = xDoc.getKipoElem('<수단>');
            if (solution) {
                paras.push('【과제의 해결 수단】');
                paras.push(...processParas(solution.childNodes));
            }
            const effect = xDoc.getKipoElem('<효과>');
            if (effect) {
                paras.push('【발명의 효과】');
                paras.push(...processParas(effect.childNodes));
            }
        }

        const briefDrawings = xDoc.getKipoElem('<도간설>');
        if (briefDrawings) {
            paras.push('【도면의 간단한 설명】');
            paras.push(...processParas(briefDrawings.childNodes));
        }
        const descOfEmbodiments = xDoc.getKipoElem('<발실구내>');
        if (descOfEmbodiments) {
            paras.push('【발명을 실시하기 위한 구체적인 내용】');
            paras.push(...processParas(descOfEmbodiments.childNodes));
        }
        const refSignsList = xDoc.getKipoElem('<부호의설명>');
        if (refSignsList) {
            paras.push('【부호의 설명】');
            paras.push(...processParas(refSignsList.childNodes));
        }
    }

    const claims = xDoc.getKipoElems('<청구항>');
    if (claims.length > 0) {
        paras.push('【청구범위】');
        for (const claim of claims) {
            paras.push(`【청구항 ${claim.getAttrValue('num')}】`);
            paras.push(...processParas(claim.getElemByTag('claim-text')!.childNodes));
        }
    }

    if (xDoc.hasKipoElem('<요약서>')) {
        paras.push('【요약서】');

        const summary = xDoc.getKipoElem('<요약>');
        if (summary) {
            paras.push('【요약】');
            paras.push(...processParas(summary.childNodes));
        }

        const absFig = xDoc.getKipoElem('<대표도>');
        if (absFig) {
            paras.push('【대표도】');
            const absFigNum = absFig
                ?.getElemByTag('figref')
                ?.getAttrValue('num');
            paras.push(`도 ${absFigNum}`);
        }
    }

    if (xDoc.hasKipoElem('<도면>')) {
        paras.push('【도면】');
        for (const figure of xDoc.getKipoElems('<도>')) {
            paras.push(`【도 ${figure.getAttrValue('num')}】`);
            for (const img of figure.getAllElemsByTag('<img>')) {
                paras.push(img.outerXML);
            }
        }
    }

    return paras.map(para => para.replaceAll('\n', ''))
}

function processParas(kTitleNode: XNode[]): string[] {
    const paras: string[] = [];
    let content = '';
    for (const node of kTitleNode) {
        const tag = node.tagName;
        if (tag === 'p') {
            paras.push(...processParas(node.childNodes));
        }
        else if (tag === 'maths') {
            paras.push(`【수학식 ${node.getAttrValue('num')}】`);
            const imgs = node.getAllElemsByTag('<img>');
            for (const img of imgs) {
                paras.push(img.outerXML);
            }
        }
        else if (tag === 'tables') {
            paras.push(`【표 ${node.getAttrValue('num')}】`);
            const cells = node.getAllElemsByTag('<entry>');
            // TODO: 페이지 카운트 위한 표 내용 처리 필요
            for (const cell of cells) {
                const cellParas = cell.innerXML
                    .replaceAll(/ xmlns="[^"]*"/g, '') // TODO: 필요 없는지 체크
                    .split(/<br ?\/>/);
                paras.push(...cellParas);
            }
        }
        else if (tag === 'img') {
            content += node.outerXML;
        }
        else if (tag === 'sub' || tag === 'sup' || tag === 'i' || tag === 'b' || tag === 'u') {
            content += node.outerXML;
        }
        else if (node.type === 'text') {
            content += escapeChars(node.textContent);
        }
        else if (tag === 'br' || tag === 'patcit' || tag === 'nplcit') {
            paras.push(content);
            content = '';
        }
    }

    if (content !== '') {
        paras.push(content);
    }
    return paras;
}