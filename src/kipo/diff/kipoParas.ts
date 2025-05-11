import { JSDOM } from 'jsdom';
import { toOneLine } from '../utils';


const IMG_WIDTH_TO_PT = 2.9 // 720 / 254 = 2.83464566929; // 미정
const IMG_HEIGHT_TO_PT = 2.9 // 720 / 254 = 2.83464566929; // 미정


export async function getKipoParas(kXmlStr: KXml): Promise<Paragraph[]> {
    const kipoParas = new KipoParas(kXmlStr);
    const kXmlParas = await kipoParas.getParas();
    return kXmlParas;
}

/**
 * Kipo XML에서 Paragraphs를 추출하는 클래스
 */
class KipoParas {
    private PatentCAFDOC: Element;
    private Paras: Paragraph[] = [];

    constructor(kXmlStr: string) {
        // 모든 줄바꿈 제거
        kXmlStr = toOneLine(kXmlStr);
        
        const dom = new JSDOM(kXmlStr, { contentType: 'text/xml' });
        const KIPO = dom.window.document.documentElement; // <KIPO>, <PatentCAFDOC>
        this.PatentCAFDOC = (KIPO.tagName === 'KIPO') ? KIPO.children[0] : KIPO; // <PatentCAFDOC>
    }

    public async getParas(): Promise<Paragraph[]> {
        this.precessDescription(this.PatentCAFDOC.children[0]); // <description>
        this.precessClaims(this.PatentCAFDOC.children[1]); // <claims>
        this.precessAbstract(this.PatentCAFDOC.children[2]); // <abstract>
        this.precessDrawings(this.PatentCAFDOC.children[3]); // <drawings>

        return this.Paras;
    }

    public precessDescription(descNode: Element) {
        // <description>
        this.addPara({ content: '【발명의 설명】' });
        // <invention-title>
        this.addPara({ content: '【발명의 명칭】' });
        this.addPara({ content: descNode.children[0].textContent || '' });
        // <technical-field>
        this.addPara({ content: '【기술분야】' });
        this.processParas(descNode.children[1]);
        // <background-art>
        this.addPara({ content: '【발명의 배경이 되는 기술】' });
        this.processParas(descNode.children[2]);
        // <summary>
        this.addPara({ content: '【발명의 내용】' });
        this.addPara({ content: '【해결하고자 하는 과제】' });
        this.processParas(descNode.children[3].children[0]);
        this.addPara({ content: '【과제의 해결 수단】' });
        this.processParas(descNode.children[3].children[1]);
        this.addPara({ content: '【발명의 효과】' });
        this.processParas(descNode.children[3].children[2]);
        // <description-of-drawings>
        this.addPara({ content: '【도면의 간단한 설명】' });
        this.processParas(descNode.children[4]);
        // <description-of-embodiments>
        this.addPara({ content: '【발명을 실시하기 위한 구체적인 내용】' });
        this.processParas(descNode.children[5]);
    }

    public precessClaims(hNode: Element) {
        // <claims>
        this.addPara({ content: '【청구범위】' });
        for (const claimNode of hNode.getElementsByTagName('claim')) {
            this.addPara({ content: `【청구항 ${claimNode.getAttribute('num')}】` });
            this.processParas(claimNode, 'claim-text');
        }
    }

    public precessAbstract(hNode: Element) {
        // <abstract>
        this.addPara({ content: '【요약서】' });
        this.addPara({ content: '【요약】' });
        this.processParas(hNode.getElementsByTagName('summary')[0]);
        this.addPara({ content: '【대표도】' });
        this.addPara({ content: `도 ${hNode.getElementsByTagName('figref')[0].getAttribute('num')}` });
    }

    public precessDrawings(hNode: Element) {
        // <drawings>
        this.addPara({ content: '【도면】' });
        for (const figure of hNode.getElementsByTagName('figure')) {
            this.addPara({ content: `【도 ${figure.getAttribute('num')}】` });
            const [imgW, imgH] = this.getImgSizePt(figure.getElementsByTagName('img')[0]);
            // this.addLine({ content: `<이미지 w=${imgW} h=${imgH}/>` });
            this.addPara({ content: `[이미지]` });
        }
    }

    public processParas(kTitleNode: Element, tagName: string = 'p') {
        for (const kParaNode of kTitleNode.getElementsByTagName(tagName)) {
            let content = '';
            for (const child of kParaNode.childNodes) {
                const nodeName = child.nodeName;
                // ELEMENT_NODES
                if (nodeName === 'maths') {
                    const ele = child as Element;
                    this.addPara({ content: `【수학식 ${ele.getAttribute('num')}】` });
                    const [imgW, imgH] = this.getImgSizePt(ele.getElementsByTagName('img')[0]);
                    // this.addLine({ content: `<이미지 w=${imgW} h=${imgH}/>` });
                    this.addPara({ content: `[이미지]` });
                    break;
                }
                if (nodeName === 'table') {
                    const ele = child as Element;
                    this.addPara({ content: `【표 ${ele.getAttribute('num')}】` });
                    this.addPara({ content: `(표)` });
                    break;
                }
                else if (nodeName === 'img') {
                    const [imgW, imgH] = this.getImgSizePt(child as Element);
                    // content += `<이미지 w=${imgW} h=${imgH}"/>`;
                    content += `[이미지]`;
                }
                else if (nodeName === 'sub' || nodeName === 'sup' ||
                    nodeName === 'i' || nodeName === 'b' || nodeName === 'u'
                ) {
                    const text = (child as Element).innerHTML || '';
                    content += `<${nodeName}>${text}</${nodeName}>`;
                }
                else if (child.nodeType === 3) { // TEXT_NODE
                    const text = child.textContent || '';
                    if (!text) continue;
                    content += text;
                }
                else if (nodeName === 'br') {
                    this.addPara({ content });
                    content = '';
                }
            }
            this.addPara({ content });
        }
    }

    // 한 줄 추가
    public addPara(line: Paragraph) {
        this.Paras.push(line);
    }

    // 이미지 너비/높이 얻기
    public getImgSizePt(element: Element): [number, number] {
        const imgW_mm = Number(element.getAttribute('wi')) || 0;
        const imgH_mm = Number(element.getAttribute('he')) || 0;
        const imgW_pt = Math.floor(imgW_mm * IMG_WIDTH_TO_PT);
        const imgH_pt = Math.floor(imgH_mm * IMG_HEIGHT_TO_PT);
        return [imgW_pt, imgH_pt];
    }
} 