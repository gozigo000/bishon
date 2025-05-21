import { KipoTagName as Tag } from '../data';
import { escapeCharacters } from "../utils";
import { KipoStructure, SpecPart as Part } from '../kipoParcer/KipoStructure';
import { dlog } from '../../_utils/env';

/**
 * Kipo XML에서 Paragraphs를 추출하는 클래스
 */
export class KipoParas {
    private kipo: KipoStructure;
    private paras: Paragraph[] = [];
    private static instances: Map<KipoXml, KipoParas> = new Map();

    public static async getParas(kxml: KipoXml): Promise<Paragraph[]> {
        if (!KipoParas.instances.has(kxml)) {
            const kipoParas = new KipoParas(kxml);
            KipoParas.instances.set(kxml, kipoParas);
            return await kipoParas.getParas();
        }
        const kipoParas = KipoParas.instances.get(kxml)!;
        if (kipoParas.paras.length === 0) {
            return await kipoParas.getParas();
        }
        return kipoParas.paras;
    }

    private constructor(kXmlStr: KipoXml) {
        this.kipo = KipoStructure.getStructure(kXmlStr);
    }

    public async getParas(): Promise<Paragraph[]> {

        if (this.kipo.hasElem(Part.발명의설명)) {
            this.paras.push({ content: '【발명의 설명】' });
            
            if (this.kipo.hasElem(Part.발명의명칭)) {
                this.paras.push({ content: `【발명의 명칭】` });
                this.processParas(this.kipo.getElem(Part.발명의설명), Tag['발명의 명칭']);
            }

            if (this.kipo.hasElem(Part.기술분야)) {
                this.paras.push({ content: '【기술분야】' });
                this.processParas(this.kipo.getElem(Part.기술분야));
            }

            if (this.kipo.hasElem(Part.배경기술)) {
                this.paras.push({ content: '【발명의 배경이 되는 기술】' });
                this.processParas(this.kipo.getElem(Part.배경기술));
            }

            if (this.kipo.hasElem(Part.선행기술문헌)) {
                this.paras.push({ content: '【선행기술문헌】' });
                this.paras.push({ content: '【특허문헌】' });
                this.processParas(this.kipo.getElem(Part.특허문헌));
                this.paras.push({ content: '【비특허문헌】' });
                this.processParas(this.kipo.getElem(Part.비특허문헌));
            }

            if (this.kipo.hasElem(Part.발명의내용)) {
                this.paras.push({ content: '【발명의 내용】' });
                this.processParas(this.kipo.getElem(Part.발명의내용));
                
                this.paras.push({ content: '【해결하고자 하는 과제】' });
                this.processParas(this.kipo.getElem(Part.과제));
                this.paras.push({ content: '【과제의 해결 수단】' });
                this.processParas(this.kipo.getElem(Part.수단));
                this.paras.push({ content: '【발명의 효과】' });
                this.processParas(this.kipo.getElem(Part.효과));
            }
            
            if (this.kipo.hasElem(Part.도간설)) {
                this.paras.push({ content: '【도면의 간단한 설명】' });
                this.processParas(this.kipo.getElem(Part.도간설));
            }
            if (this.kipo.hasElem(Part.발실구내)) {
                this.paras.push({ content: '【발명을 실시하기 위한 구체적인 내용】' });
                this.processParas(this.kipo.getElem(Part.발실구내));
            }
            if (this.kipo.hasElem(Part.부호의설명)) {
                this.paras.push({ content: '【부호의 설명】' });
                this.processParas(this.kipo.getElem(Part.부호의설명));
            }
        }
        
        if (this.kipo.hasElem(Part.청구범위)) {
            this.paras.push({ content: '【청구범위】' });
            for (const claim of this.kipo.getElems(Part.청구항)) {
                this.paras.push({ content: `【청구항 ${claim.getAttribute('num')}】` });
                this.processParas(claim, 'claim-text');
            }
        }
        
        if (this.kipo.hasElem(Part.요약서)) {
            this.paras.push({ content: '【요약서】' });

            if (this.kipo.hasElem(Part.요약)) {
                this.paras.push({ content: '【요약】' });
                this.processParas(this.kipo.getElem(Part.요약));
            }
            
            if (this.kipo.hasElem(Part.대표도)) {
                this.paras.push({ content: '【대표도】' });
                const absFig = this.kipo.getElem(Part.대표도)
                    .querySelector('figref')?.getAttribute('num')
                this.paras.push({ content: `도 ${absFig}` });
            }
        }

        if (this.kipo.hasElem(Part.도면)) {
            this.paras.push({ content: '【도면】' });
            for (const figure of this.kipo.getElems(Part.도)) {
                this.paras.push({ content: `【도 ${figure.getAttribute('num')}】` });
                for (const img of figure.querySelectorAll('img')) {
                    this.paras.push({ 
                        content: img.outerHTML, 
                        paraHtml: img.outerHTML
                    });
                }
            }
        }

        return this.paras;
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
                    const text = (child as Element).outerHTML || '';
                    content += text;
                    paraHtml += text;
                }
                else if (child.nodeType === 3) { // TEXT_NODE
                    const text = escapeCharacters(child.textContent || '');
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