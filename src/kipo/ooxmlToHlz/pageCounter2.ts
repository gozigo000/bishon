import { JSDOM } from 'jsdom';
import { batangche_width_pt } from '../ttfParser/batangche_width_pt';
import { toOneLine } from '../utils';
import { getKipoTagName as tag } from '../utils';
import { dlog } from '../../_utils/env';


export async function getTotalPages(kXmlStr: KXml): Promise<number> {
    const pageCounter = new PageCounter(kXmlStr);
    const totalPages = await pageCounter.getTotalPages();
    return 0;
}

// NOTE: 폰트 사이즈 구하기
// 한글 문자 너비: 12 pt
// 영어 문자 너비: 6 pt
// pt -> mm: 1 pt = 254/720 mm
// mm -> pt: 1 mm = 720/254 pt

// pt 단위
const FONT_SIZE = 12; // pt = 4mm
const LINE_GAP = 9.6; // pt
const LINE_HEIGHT = 21.6; // pt

const PAGE_WIDTH = 495; // pt = 165mm (210 - 25 - 20)㎜
const PAGE_HEIGHT = 711; // pt = 237mm (297 - 40 - 20)㎜

export const INDENT_SIZE = 40; // 공백 8자 크기

const IMG_WIDTH_TO_PT = 2.9 // 720 / 254 = 2.83464566929; // 미정
const IMG_HEIGHT_TO_PT = 2.9 // 720 / 254 = 2.83464566929; // 미정
const SUB_SUP_CHAR_WIDTH_TO_PT = 23 / 36; // 미정 (예외: 스페이스바는 너비 유지)

export type Line = {
    width: number;
    height: number;
    content: string;
}


class PageCounter {
    private PatentCAFDOC: Element;
    private Paras: Paragraph[] = [];

    constructor(kXmlStr: string) {
        kXmlStr = toOneLine(kXmlStr);
        
        const dom = new JSDOM(kXmlStr, { contentType: 'text/xml' });
        const xml = dom.window.document.documentElement; // <KIPO>, <PatentCAFDOC>
        this.PatentCAFDOC = xml.querySelector('PatentCAFDOC') as Element;
    }

    public async getTotalPages(): Promise<Paragraph[]> {
        const desc = this.PatentCAFDOC.querySelector(tag('발명의 설명'));
        const claims = this.PatentCAFDOC.querySelector(tag('청구범위'));
        const abstract = this.PatentCAFDOC.querySelector(tag('요약서'));
        const drawings = this.PatentCAFDOC.querySelector(tag('도면'));
        
        if (desc) {
            this.addPara({ content: '【발명의 설명】' });
            
            const invTitle = desc.querySelector(tag('발명의 명칭'))
            this.addTitleAndParas('【발명의 명칭】', invTitle);
            const techField = desc.querySelector(tag('기술분야'))
            this.addTitleAndParas('【기술분야】', techField);
            const backArt = desc.querySelector(tag('배경기술'))
            this.addTitleAndParas('【배경기술】', backArt);

            const citation = desc.querySelector(tag('선행기술문헌'))
            if (citation) {
                this.addPara({ content: '【선행기술문헌】' });
                const patCit = citation.querySelector(tag('특허문헌'))
                this.addTitleAndParas('【특허문헌】', patCit);
                const nonPatCit = citation.querySelector(tag('비특허문헌'))
                this.addTitleAndParas('【비특허문헌】', nonPatCit);
            }

            const invSummary = desc.querySelector(tag('발명의 내용'))
            if (invSummary) {
                this.addPara({ content: '【발명의 내용】' });
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
        }
        
        if (claims) {
            this.addPara({ content: '【청구범위】' });

            for (const claim of claims.querySelectorAll(tag('청구항'))) {
                this.addPara({ content: `【청구항 ${claim.getAttribute('num')}】` });
                this.processParas(claim, 'claim-text');
            }
        }
        
        if (abstract) {
            this.addPara({ content: '【요약서】' });

            const summary = abstract.querySelector(tag('요약'))
            this.addTitleAndParas('【요약】', summary);
            
            const absFig = abstract.querySelector(tag('대표도'))
            if (absFig) {
                this.addPara({ content: '【대표도】' });
                this.addPara({ content: `도 ${absFig.querySelector('figref')?.getAttribute('num')}` });
            }
        }

        if (drawings) {
            this.addPara({ content: '【도면】' });
            for (const figure of drawings.querySelectorAll(tag('도'))) {
                this.addPara({ content: `【도 ${figure.getAttribute('num')}】` });
                // const [imgW, imgH] = this.getImgSizePt(figure.querySelectorAll('img')[0]);
                // this.addLine({ content: `<이미지 w=${imgW} h=${imgH}/>` });
                this.addPara({ content: `[img]` });
            }
        }

        return this.Paras;
    }

    public addTitleAndParas(title: string, element: Element | null): void{
        if (element) {
            this.addPara({ content: title });
            this.processParas(element);
        }
    }

    public processParas(kTitleNode: Element, tagName: string = ':scope > p') {
        for (const kParaNode of kTitleNode.querySelectorAll(tagName)) {
            let content = '';
            for (const child of kParaNode.childNodes) {
                const name = child.nodeName;
                // ELEMENT_NODES
                if (name === 'maths') {
                    const ele = child as Element;
                    this.addPara({ content: `【수학식 ${ele.getAttribute('num')}】` });
                    // const [imgW, imgH] = this.getImgSizePt(ele.getElementsByTagName('img')[0]);
                    // this.addLine({ content: `<이미지 w=${imgW} h=${imgH}/>` });
                    this.addPara({ content: `[img]` });
                    break;
                }
                if (name === 'table') {
                    const ele = child as Element;
                    this.addPara({ content: `【표 ${ele.getAttribute('num')}】` });
                    this.addPara({ content: `[table]` });
                    break;
                }
                if (name === 'img') {
                    // const [imgW, imgH] = this.getImgSizePt(child as Element);
                    // content += `<이미지 w=${imgW} h=${imgH}"/>`;
                    content += `[img]`;
                }
                else if (name === 'sub' || name === 'sup' || name === 'i' || name === 'b' || name === 'u') {
                    const text = (child as Element).innerHTML || '';
                    content += `<${name}>${text}</${name}>`;
                }
                else if (child.nodeType === 3) { // TEXT_NODE
                    const text = child.textContent || '';
                    if (!text) continue;
                    content += text;
                }
                else if (name === 'br' || name === 'patcit' || name === 'nplcit') {
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
/**
 * hlz 파일의 페이지 수를 계산하는 클래스
 */
export class OldPageCounter {
    private PatentCAFDOC: Element;
    private lines: Line[] = [];
    private absXLineH = LINE_HEIGHT;
    // 현재 캐롯의 절대 위치
    private absY = 0;
    private absX = 0;

    // 결과 확인용 변수들
    public pages = {
        description: 0,
        claims: 0,
        abstract: 0,
        drawings: 0,
    };
    public pageNumInSpec = {
        description: 0,
        claims: 0,
        abstract: 0,
        drawings: 0,
    };
    public totalPages = 0;
    public totalLines: Line[] = [];
    public outputStr = '';


    /**
     * 생성자
     * @param hXmlStr 
     */
    constructor(hXmlStr: string) {
        const dom = new JSDOM(hXmlStr, { contentType: 'text/xml' });
        const KIPO = dom.window.document.documentElement; // <KIPO>, <PatentCAFDOC>
        this.PatentCAFDOC = (KIPO.tagName === 'KIPO')? KIPO.children[0] : KIPO; // <PatentCAFDOC>
    }

    public async getTotalPages(): Promise<number> {
        this.pages.description = this.precessDescription(this.PatentCAFDOC.children[0]); // <description>
        this.pages.claims = this.precessClaims(this.PatentCAFDOC.children[1]); // <claims>
        this.pages.abstract = this.precessAbstract(this.PatentCAFDOC.children[2]); // <abstract>
        this.pages.drawings = this.precessDrawings(this.PatentCAFDOC.children[3]); // <drawings>

        this.pageNumInSpec.description = this.pages.description;
        this.pageNumInSpec.claims = this.pageNumInSpec.description + this.pages.claims;
        this.pageNumInSpec.abstract = this.pageNumInSpec.claims + this.pages.abstract;
        this.pageNumInSpec.drawings = this.pageNumInSpec.abstract + this.pages.drawings;

        this.totalPages = this.pageNumInSpec.drawings;
        return this.totalPages;
    }

    public precessDescription(descNode: Element): number {
        this.moveDown({ content: '=== [발명의 설명] ===' , width: -1, height: LINE_HEIGHT});

        this.moveDown({ content: '=== [발명의 명칭] ===' , width: -2, height: LINE_HEIGHT});
        this.processPara(descNode.children[0]);
        this.moveDown({ content: '=== [기술분야] ===' , width: -2, height: LINE_HEIGHT});
        this.processParas(descNode.children[1]);
        this.moveDown({ content: '=== [배경기술] ===' , width: -2, height: LINE_HEIGHT});
        this.processParas(descNode.children[2]);

        this.moveDown({ content: '=== [발명의 내용] ===' , width: -2, height: LINE_HEIGHT});
        this.moveDown({ content: '=== [과제] ===' , width: -3, height: LINE_HEIGHT});
        this.processParas(descNode.children[3].children[0]);
        this.moveDown({ content: '=== [방법] ===' , width: -3, height: LINE_HEIGHT});
        this.processParas(descNode.children[3].children[1]);
        this.moveDown({ content: '=== [효과] ===' , width: -3, height: LINE_HEIGHT});
        this.processParas(descNode.children[3].children[2]);

        this.moveDown({ content: '=== [도간설] ===' , width: -1, height: LINE_HEIGHT});
        this.processParas(descNode.children[4]);
        this.moveDown({ content: '=== [발실구내] ===' , width: -1, height: LINE_HEIGHT});
        this.processParas(descNode.children[5]);

        return this.countPages();
    }

    public precessClaims(hNode: Element): number {
        this.moveDown({ content: '=== [청구범위] ===' , width: -1, height: LINE_HEIGHT});
        for (const claimNode of hNode.getElementsByTagName('claim')) {
            this.moveDown({ content: '=== [청구항] ===' , width: -2, height: LINE_HEIGHT});
            this.processParas(claimNode, 'claim-text');
        }
        return this.countPages();
    }

    public precessAbstract(hNode: Element): number {
        this.moveDown({ content: '=== [요약서] ===' , width: -1, height: LINE_HEIGHT});
        this.moveDown({ content: '=== [요약] ===' , width: -2, height: LINE_HEIGHT});
        this.processParas(hNode.getElementsByTagName('summary')[0]);
        this.moveDown({ content: '=== [대표도] ===' , width: -2, height: LINE_HEIGHT});
        this.moveDown({ content: '도 #' , width: -3, height: LINE_HEIGHT});
        return this.countPages();
    }
    
    public precessDrawings(hNode: Element): number {
        this.moveDown({ content: '=== [도면] ===' , width: -1, height: LINE_HEIGHT});
        for (const figure of hNode.getElementsByTagName('figure')) {
            const [imgW, imgH] = this.getImgSize(figure.getElementsByTagName('img')[0]);
            // 제목과 이미지가 한 페이지에 나오므로 하나로 묶어서 처리함.
            const figH = LINE_HEIGHT + imgH;
            this.moveDown({ width: imgW, height: figH, content: `[도 #]+[이미지] w=${imgW} h=${imgH}` });
        }
        return this.countPages();
    }

    public processParas(partNode: Element, tagName: string = 'p') {
        const paraNodes = partNode.getElementsByTagName(tagName);
        for (const paraNode of paraNodes) {
            this.processPara(paraNode);
        }
    }

    public processPara(hParaNode: Element) {
        this.absX = INDENT_SIZE;
        for (const child of hParaNode.childNodes) {
            // ELEMENT_NODES
            if (child.nodeName === 'br') {
                this.absX = INDENT_SIZE;
                // NOTE: XML 파서는 `AA<br/>BB`를 세 개의 노드로 각각 파싱함.
            }
            else if (child.nodeName === 'img') {
                const [imgW, imgH] = this.getImgSize(child as Element);
                // 이미지가 현재 줄에 들어갈 수 있는지 확인
                if (this.absX + imgW > PAGE_WIDTH) {
                    // 다음 줄에 이미지 추가
                    this.absX = imgW;
                    this.absXLineH = Math.max(this.absXLineH, imgH + LINE_GAP);
                } else {
                    // 현재 줄에 이미지 추가
                    const prevLine = this.lines.pop();
                    if (!prevLine) throw new Error('에러 at processParagraph(): prevLine is undefined');
                    const prevAbsX = prevLine.width;
                    const prevLineHeight = prevLine.height;
                    
                    this.absX = prevAbsX + imgW;
                    this.absXLineH = Math.max(this.absXLineH, prevLineHeight, imgH + LINE_GAP);
                }
            }
            else if (child.nodeName === 'sub' || child.nodeName === 'sup') {
                const text = child.textContent || '';
                const prevLine = this.lines.pop();
                if (!prevLine) throw new Error('에러 at processParagraph(): prevLine is undefined');
                const prevAbsX = prevLine.width;
                const prevLineHeight = prevLine.height;
                
                const subSuplines = OldPageCounter.countLines(text, 0);
                this.absX = prevAbsX;
                for (const line of subSuplines) {
                    this.absX += (line.width || 0) * SUB_SUP_CHAR_WIDTH_TO_PT;
                }
                this.absXLineH = prevLineHeight;
            }
            else if (child.nodeName === 'maths') {
                const element = child as Element;
                this.moveDown({ content: '=== [수학식] ===' , width: -3, height: LINE_HEIGHT});
                const [imgW, imgH] = this.getImgSize(element.getElementsByTagName('img')[0]);
                const lineH = imgH + LINE_GAP;
                this.moveDown({ width: imgW, height: lineH, content: `[수학식 이미지] w=${imgW} h=${imgH}, lineH=${lineH}` });
                return;
            }
            else if (child.nodeName === 'table') {
                return; // TODO: [표] 처리하기
            }
            // TEXT_NODE
            else if (child.nodeType === 3) {
                const text = child.textContent;
                if (!text) continue;
                const lines = OldPageCounter.countLines(text, this.absX);
                if (!lines) continue;
                for (const line of lines) {
                    if (line.height < this.absXLineH) {
                        line.height = this.absXLineH;
                        this.absXLineH = LINE_HEIGHT
                    }
                    this.moveDown(line);
                    this.absX = line.width;
                }
            }
        }
    }

    // 한 줄 추가
    public moveDown({ width, height, content }: Line) {
        if (!width || !height) throw new Error('에러 at moveRight(): width or height is undefined');
        this.absY += height;
        this.lines.push({ width, height, content });
    }

    // 이미지 너비/높이 얻기
    public getImgSize(element: Element): [number, number] {
        const imgW_mm = Number(element.getAttribute('wi')) || 0;
        const imgH_mm = Number(element.getAttribute('he')) || 0;
        const imgW_pt = Math.floor(imgW_mm * IMG_WIDTH_TO_PT);
        const imgH_pt = Math.floor(imgH_mm * IMG_HEIGHT_TO_PT);
        return [imgW_pt, imgH_pt];
    }

    // NOTE: 영어, 숫자는 단어 잘리지 않음.
    // 영어/숫자는 문단 폭을 넘어가면 전부가 다음 줄로 이동함.
    // "영어/숫자+한글" 조합은 한글에서 잘릴 수 있음.
    public static countLines(hText: string, absX: number): Line[] {
        const lines: Line[] = [];
        let prevX = absX;
        let text = "";
        let currentWord = "";
        let isEnglishOrNumber = false;

        const addLine = () => {
            if (text) {
                lines.push({width: prevX, height: LINE_HEIGHT, content: text});
            } else {
                lines.push({width: prevX, height: LINE_HEIGHT, content: ''}); // MEMO: 이전 줄 끝나는 위치가 페이지 너비를 넘거나, 이전 줄에 한 글자 추가하면 바로 페이지 넘어가는 케이스
            }
            text = "";
            prevX = 0;
        };

        const addWord = (word: string, wordWidth: number) => {
            if (prevX + wordWidth > PAGE_WIDTH) {
                addLine();
                text = word;
                prevX = wordWidth;
            } else {
                text += word;
                prevX += wordWidth;
            }
        };

        for (let i = 0; i < hText.length; i++) {
            const ch = hText[i];
            const chW = batangche_width_pt[ch as keyof typeof batangche_width_pt];
            
            // 영어/숫자 문자인지 확인
            const isCurrentCharEnglishOrNumber = /[a-zA-Z0-9()-]/.test(ch);
            
            // 공백 문자 처리
            if (ch === ' ') {
                if (currentWord) {
                    const wordWidth = currentWord.split('').reduce((sum, c) => sum + batangche_width_pt[c as keyof typeof batangche_width_pt], 0);
                    addWord(currentWord, wordWidth);
                    currentWord = "";
                }
                // 줄바꿈이 필요하지 않은 경우에만 공백 추가
                if (prevX + chW <= PAGE_WIDTH) {
                    text += ch;
                    prevX += chW;
                }
                continue;
            }
            
            // 문자 타입이 바뀌었을 때 (영어/숫자 <-> 한글)
            if (isCurrentCharEnglishOrNumber !== isEnglishOrNumber && currentWord) {
                const wordWidth = currentWord.split('').reduce((sum, c) => sum + batangche_width_pt[c as keyof typeof batangche_width_pt], 0);
                addWord(currentWord, wordWidth);
                currentWord = "";
            }
            
            isEnglishOrNumber = isCurrentCharEnglishOrNumber;
            
            // 영어/숫자는 단어로 모으기
            if (isEnglishOrNumber) {
                currentWord += ch;
            }
            // 한글은 즉시 처리
            else {
                if (prevX + chW > PAGE_WIDTH) {
                    addLine();
                }
                text += ch;
                prevX += chW;
            }
        }
        
        // 남은 단어 처리
        if (currentWord) {
            const wordWidth = currentWord.split('').reduce((sum, c) => sum + batangche_width_pt[c as keyof typeof batangche_width_pt], 0);
            addWord(currentWord, wordWidth);
        }
        
        // 남은 텍스트 처리
        if (text) {
            lines.push({width: prevX, height: LINE_HEIGHT, content: text});
        }
        return lines;
    }

    public countPages(): number {
        // 페이지 수 계산
        let pages = 1;
        let currLineNum = 0;
        let contentH = 0;
        for (let i = 0; i < this.lines.length; i++) {
            contentH += this.lines[i].height;
            currLineNum += 1;
            if (contentH > PAGE_HEIGHT) {
                pages += 1;
                currLineNum = 1;
                contentH = this.lines[i].height;
            }
            this.totalLines.push(this.lines[i]);
        }

        // 디버깅: 결과 확인용 코드
        const output: string[] = [];
        this.lines.forEach(({ width, height, content }) => {
            width = Number(width.toString().padStart(3));
            height = Number(height.toString().padStart(4));
            // output.push(`${content}\n`);
            output.push(`w: ${width}, h: ${height} -- ${content}\n`);
        });
        this.outputStr += output.join('');
        
        this.lines = []; // 초기화
        return pages;
    }
} 