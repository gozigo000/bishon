import { escapeChars } from "../utils";
import { KipoStructure } from '../kipoParcer/KipoStructure';
import { PartFlag } from '../data';
import { XNode } from '../2-lightParser/1-node/node';

/**
 * Kipo XML에서 Paragraphs를 추출하는 클래스
 */
export class KipoParas {
    private kipo: KipoStructure;
    private paras: string[] = [];
    private static instances: Map<KipoXml, KipoParas> = new Map();

    public static getParas(kxml: KipoXml): string[] {
        if (!KipoParas.instances.has(kxml)) {
            const kipoParas = new KipoParas(kxml);
            KipoParas.instances.set(kxml, kipoParas);
            return kipoParas.getParas();
        }
        const kipoParas = KipoParas.instances.get(kxml)!;
        if (kipoParas.paras.length === 0) {
            return kipoParas.getParas();
        }
        return kipoParas.paras;
    }

    private constructor(kXmlStr: KipoXml) {
        this.kipo = KipoStructure.getStructure(kXmlStr);
    }

    private getParas(): string[] {

        if (this.kipo.hasPart(PartFlag.발명의설명)) {
            this.paras.push('【발명의 설명】');

            const invTitle = this.kipo.getPart(PartFlag.발명의명칭);
            if (invTitle) {
                this.paras.push(`【발명의 명칭】`);
                this.processParas(invTitle.childNodes);
            }

            const techField = this.kipo.getPart(PartFlag.기술분야);
            if (techField) {
                this.paras.push('【기술분야】');
                this.processParas(techField.childNodes);
            }

            const backArt = this.kipo.getPart(PartFlag.배경기술);
            if (backArt) {
                this.paras.push('【발명의 배경이 되는 기술】');
                this.processParas(backArt.childNodes);
            }

            if (this.kipo.hasPart(PartFlag.선행기술문헌)) {
                this.paras.push('【선행기술문헌】');
                const patcit = this.kipo.getPart(PartFlag.특허문헌);
                if (patcit) {
                    this.paras.push('【특허문헌】');
                    this.processParas(patcit.childNodes);
                }
                const nonPatCit = this.kipo.getPart(PartFlag.비특허문헌);
                if (nonPatCit) {
                    this.paras.push('【비특허문헌】');
                    this.processParas(nonPatCit.childNodes);
                }
            }

            const invSummary = this.kipo.getPart(PartFlag.발명의내용);
            if (invSummary) {
                this.paras.push('【발명의 내용】');
                this.processParas(invSummary.childNodes);

                const problem = this.kipo.getPart(PartFlag.과제);
                if (problem) {
                    this.paras.push('【해결하고자 하는 과제】');
                    this.processParas(problem.childNodes);
                }
                const solution = this.kipo.getPart(PartFlag.수단);
                if (solution) {
                    this.paras.push('【과제의 해결 수단】');
                    this.processParas(solution.childNodes);
                }
                const effect = this.kipo.getPart(PartFlag.효과);
                if (effect) {
                    this.paras.push('【발명의 효과】');
                    this.processParas(effect.childNodes);
                }
            }

            const briefDrawings = this.kipo.getPart(PartFlag.도간설);
            if (briefDrawings) {
                this.paras.push('【도면의 간단한 설명】');
                this.processParas(briefDrawings.childNodes);
            }
            const descOfEmbodiments = this.kipo.getPart(PartFlag.발실구내);
            if (descOfEmbodiments) {
                this.paras.push('【발명을 실시하기 위한 구체적인 내용】');
                this.processParas(descOfEmbodiments.childNodes);
            }
            const refSignsList = this.kipo.getPart(PartFlag.부호의설명);
            if (refSignsList) {
                this.paras.push('【부호의 설명】');
                this.processParas(refSignsList.childNodes);
            }
        }

        const claims = this.kipo.getParts(PartFlag.청구항);
        if (claims.length > 0) {
            this.paras.push('【청구범위】');
            for (const claim of claims) {
                this.paras.push(`【청구항 ${claim.getAttrValue('num')}】`);
                this.processParas(claim.getElemByTag('claim-text')!.childNodes);
            }
        }

        if (this.kipo.hasPart(PartFlag.요약서)) {
            this.paras.push('【요약서】');

            const summary = this.kipo.getPart(PartFlag.요약);
            if (summary) {
                this.paras.push('【요약】');
                this.processParas(summary.childNodes);
            }

            const absFig = this.kipo.getPart(PartFlag.대표도)
            if (absFig) {
                this.paras.push('【대표도】');
                const absFigNum = absFig
                    ?.getElemByTag('figref')
                    ?.getAttrValue('num');
                this.paras.push(`도 ${absFigNum}`);
            }
        }

        if (this.kipo.hasPart(PartFlag.도면)) {
            this.paras.push('【도면】');
            for (const figure of this.kipo.getParts(PartFlag.도)) {
                this.paras.push(`【도 ${figure.getAttrValue('num')}】`);
                for (const img of figure.getAllElemsByTag('img')) {
                    this.paras.push(img.outerXML);
                }
            }
        }

        return this.paras;
    }

    private processParas(kTitleNode: XNode[]) {
        let content = '';
        for (const node of kTitleNode) {
            const tag = node.tagName;
            if (tag === 'p') {
                this.processParas(node.childNodes);
            }
            else if (tag === 'maths') {
                this.paras.push(`【수학식 ${node.getAttrValue('num')}】`);
                const imgs = node.getAllElemsByTag('img');
                for (const img of imgs) {
                    this.paras.push(img.outerXML);
                }
            }
            else if (tag === 'tables') {
                this.paras.push(`【표 ${node.getAttrValue('num')}】`);
                const cells = node.getAllElemsByTag('entry');
                // TODO: 페이지 카운트 위한 표 내용 처리 필요
                for (const cell of cells) {
                    const paras = cell.innerXML
                        .replaceAll(/ xmlns="[^"]*"/g, '')
                        .split(/<br ?\/>/);
                    this.paras.push(...paras);
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
                this.paras.push(content);
                content = '';
            }
        }
        if (content === '') return;
        this.paras.push(content);
    }
} 