import { JSDOM } from 'jsdom';
import { integrateRtfTags, makeEmptyElement, toOneLine } from '../utils';
import { getKipoTagName as tag } from '../utils';
import { dlog } from '../../_utils/env';
import { collectError } from '../errorCollector';
import { escapeCharacters } from "../utils";

export async function getKipoParas(kXmlStr: KXml): Promise<Paragraph[]> {
    const kipoParas = new KipoParas(kXmlStr);
    const paras = await kipoParas.getParas();
    return paras;
}

/**
 * Kipo XML에서 Paragraphs를 추출하는 클래스
 */
class KipoParas {
    private PatentCAFDOC: Element;
    private paras: Paragraph[] = [];

    constructor(kXmlStr: string) {
        kXmlStr = toOneLine(kXmlStr);
        kXmlStr = integrateRtfTags(kXmlStr);
        
        const doc = new JSDOM(kXmlStr, { contentType: 'text/xml' }).window.document;
        this.PatentCAFDOC = doc.querySelector('PatentCAFDOC') as Element;
        if (!this.PatentCAFDOC) {
            collectError('PatentCAFDOC 태그를 찾을 수 없습니다.');
            this.PatentCAFDOC = makeEmptyElement();
        }
    }

    public async getParas(): Promise<Paragraph[]> {
        const desc = this.PatentCAFDOC.querySelector(tag('발명의 설명'));
        const claims = this.PatentCAFDOC.querySelector(tag('청구범위'));
        const abstract = this.PatentCAFDOC.querySelector(tag('요약서'));
        const drawings = this.PatentCAFDOC.querySelector(tag('도면'));
        
        if (desc) {
            this.paras.push({ content: '【발명의 설명】' });
            
            const invTitle = desc.querySelector(tag('발명의 명칭'))
            if (invTitle) {
                this.paras.push({ content: `【발명의 명칭】` });
                this.processParas(desc, tag('발명의 명칭'));
            }

            const techField = desc.querySelector(tag('기술분야'))
            this.addTitleAndParas('【기술분야】', techField);
            const backArt = desc.querySelector(tag('배경기술'))
            this.addTitleAndParas('【발명의 배경이 되는 기술】', backArt);

            const citation = desc.querySelector(tag('선행기술문헌'))
            if (citation) {
                this.paras.push({ content: '【선행기술문헌】' });
                const patCit = citation.querySelector(tag('특허문헌'))
                this.addTitleAndParas('【특허문헌】', patCit);
                const nonPatCit = citation.querySelector(tag('비특허문헌'))
                this.addTitleAndParas('【비특허문헌】', nonPatCit);
            }

            const invSummary = desc.querySelector(tag('발명의 내용'))
            if (invSummary) {
                this.paras.push({ content: '【발명의 내용】' });
                this.processParas(invSummary);
                
                const problem = invSummary.querySelector(tag('과제'))
                const solution = invSummary.querySelector(tag('수단'))
                const effect = invSummary.querySelector(tag('효과'))
                this.addTitleAndParas('【해결하고자 하는 과제】', problem);
                this.addTitleAndParas('【과제의 해결 수단】', solution);
                this.addTitleAndParas('【발명의 효과】', effect);
            }
            
            const briefDrawings = desc.querySelector(tag('도간설'))
            this.addTitleAndParas('【도면의 간단한 설명】', briefDrawings);
            const embodiments = desc.querySelector(tag('발실구내'))
            this.addTitleAndParas('【발명을 실시하기 위한 구체적인 내용】', embodiments);
            const refSigns = desc.querySelector(tag('부호의 설명'))
            this.addTitleAndParas('【부호의 설명】', refSigns);
        }
        
        if (claims) {
            this.paras.push({ content: '【청구범위】' });

            for (const claim of claims.querySelectorAll(tag('청구항'))) {
                this.paras.push({ content: `【청구항 ${claim.getAttribute('num')}】` });
                this.processParas(claim, 'claim-text');
            }
        }
        
        if (abstract) {
            this.paras.push({ content: '【요약서】' });

            const summary = abstract.querySelector(tag('요약'))
            this.addTitleAndParas('【요약】', summary);
            
            const absFig = abstract.querySelector(tag('대표도'))
            if (absFig) {
                this.paras.push({ content: '【대표도】' });
                this.paras.push({ content: `도 ${absFig.querySelector('figref')?.getAttribute('num')}` });
            }
        }

        if (drawings) {
            this.paras.push({ content: '【도면】' });
            for (const figure of drawings.querySelectorAll(tag('도'))) {
                this.paras.push({ content: `【도 ${figure.getAttribute('num')}】` });
                const imgs = figure.querySelectorAll('img')
                for (const img of imgs) {
                    this.paras.push({ 
                        content: img.outerHTML, 
                        paraHtml: img.outerHTML
                    });
                }
            }
        }

        return this.paras;
    }

    public addTitleAndParas(title: string, element: Element | null): void{
        if (element) {
            this.paras.push({ content: title });
            this.processParas(element);
        }
    }

    public processParas(kTitleNode: Element, tagName: string = ':scope > p') {
        for (const kParaNode of kTitleNode.querySelectorAll(tagName)) {
            let content = '';
            let paraHtml = '';
            for (const child of kParaNode.childNodes) {
                const name = child.nodeName;
                // ELEMENT_NODES
                if (name === 'maths') {
                    const ele = child as Element;
                    this.paras.push({ content: `【수학식 ${ele.getAttribute('num')}】` });
                    const imgs = ele.querySelectorAll('img')
                    for (const img of imgs) {
                        this.paras.push({ 
                            content: img.outerHTML, 
                            paraHtml: img.outerHTML,
                        });
                    }
                    break;
                }
                if (name === 'tables') {
                    const ele = child as Element;
                    this.paras.push({ content: `【표 ${ele.getAttribute('num')}】` });
                    const cells = ele.querySelectorAll('entry');
                    for (const cell of cells) {
                        const paras = cell.innerHTML
                            .replaceAll(/ xmlns="[^"]*"/g, '')
                            .split(/<br ?\/>/);
                        for (const para of paras) {
                            this.paras.push({
                                content: para,
                                paraHtml: para,
                            });
                        }
                    }
                    break;
                }
                if (name === 'img') {
                    const img = child as Element;
                    content += img.outerHTML;
                    paraHtml += img.outerHTML;
                }
                else if (name === 'sub' || name === 'sup' || name === 'i' || name === 'b' || name === 'u') {
                    const text = (child as Element).innerHTML || '';
                    content += `<${name}>${text}</${name}>`;
                    paraHtml += `<${name}>${text}</${name}>`;
                }
                else if (child.nodeType === 3) { // TEXT_NODE
                    const text = escapeCharacters(child.textContent || '');
                    if (!text) continue;
                    content += text;
                    paraHtml += text;
                }
                else if (name === 'br' || name === 'patcit' || name === 'nplcit') {
                    this.paras.push({ 
                        content, 
                        paraHtml, 
                    });
                    content = '';
                    paraHtml = '';
                }
            }
            this.paras.push({ content, paraHtml });
        }
    }
} 