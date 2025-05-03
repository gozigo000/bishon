import { JSDOM } from 'jsdom';
import { batangche_width_pt } from '../ttfParser/batangche_width_pt';

// NOTE: 폰트 사이즈 구하기
// 바탕체 unitsPerEm = 1024
// 바탕체 fintSize = 12 pt
// 바탕체 advanceWidth = 1024(한글 등), 512(영어 등) FUnits(font design units)
// 한글 문자 너비: (1024 * 12) / 1024 = 12 pt
// 영어 문자 너비: (512 * 12) / 1024 = 6 pt
// pt -> mm로 변환: 1 pt = 254 / 720 mm
// mm -> pt로 변환: 1 mm = 720 / 254 pt

// pt 단위
const BASE_FONT_SIZE = 12; // 미정 (가로/세로 길이 동일함)

const BASE_LINE_GAP = BASE_FONT_SIZE * 144/80; // 미정 (스크린샷 기준: 144/80)
const BASE_LINE_HEIGHT = BASE_FONT_SIZE + BASE_LINE_GAP;

const PAGE_WIDTH = 467;
const PAGE_HEIGHT = BASE_FONT_SIZE * 20 + BASE_LINE_GAP * 21; // 미정

export const INDENT_SIZE = 41; // 미정

const IMG_WIDTH_TO_PT = 2.9 // 720 / 254 = 2.83464566929; // 미정
const IMG_HEIGHT_TO_PT = 2.9 // 720 / 254 = 2.83464566929; // 미정
const SUB_SUP_CHAR_WIDTH_TO_PT = 23 / 36; // 미정 (예외: 스페이스바는 너비 유지)


export type Line = {
    width: number;
    height: number;
    content: string;
}

/**
 * hlz 파일의 페이지 수를 계산하는 클래스
 */
export class PageCounter {
    private PatentCAFDOC: Element;
    private lines: Line[] = [];
    private absXLineH = BASE_LINE_HEIGHT;
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
        // <description>
        this.moveDown({ width: -1, height: BASE_LINE_HEIGHT, content: '=== [발명의 설명] ===' });
        // <invention-title>
        this.moveDown({ width: -2, height: BASE_LINE_HEIGHT, content: '=== [발명의 명칭] ===' });
        this.processPara(descNode.children[0]);
        // <technical-field>
        this.moveDown({ width: -2, height: BASE_LINE_HEIGHT, content: '=== [기술분야] ===' });
        this.processParas(descNode.children[1]);
        // <background-art>
        this.moveDown({ width: -2, height: BASE_LINE_HEIGHT, content: '=== [배경이 되는 기술] ===' });
        this.processParas(descNode.children[2]);
        // <summary>
        this.moveDown({ width: -2, height: BASE_LINE_HEIGHT, content: '=== [발명의 내용] ===' });
        this.moveDown({ width: -3, height: BASE_LINE_HEIGHT, content: '=== [과제] ===' });
        this.processParas(descNode.children[3].children[0]);
        this.moveDown({ width: -3, height: BASE_LINE_HEIGHT, content: '=== [방법] ===' });
        this.processParas(descNode.children[3].children[1]);
        this.moveDown({ width: -3, height: BASE_LINE_HEIGHT, content: '=== [효과] ===' });
        this.processParas(descNode.children[3].children[2]);
        // <description-of-drawings>
        this.moveDown({ width: -1, height: BASE_LINE_HEIGHT, content: '=== [도면의 간단한 설명] ===' });
        this.processParas(descNode.children[4]);
        // <description-of-embodiments>
        this.moveDown({ width: -1, height: BASE_LINE_HEIGHT, content: '=== [발명을 실시하기 위한 구체적인 내용] ===' });
        this.processParas(descNode.children[5]);

        return this.countPages();
    }

    public precessClaims(hNode: Element): number {
        // <claims>
        this.moveDown({ width: -1, height: BASE_LINE_HEIGHT, content: '=== [청구범위] ===' });
        for (const claimNode of hNode.getElementsByTagName('claim')) {
            this.moveDown({ width: -2, height: BASE_LINE_HEIGHT, content: '=== [청구항] ===' });
            this.processParas(claimNode, 'claim-text');
        }
        return this.countPages();
    }

    public precessAbstract(hNode: Element): number {
        // <abstract>
        this.moveDown({ width: -1, height: BASE_LINE_HEIGHT, content: '=== [요약서] ===' });
        this.moveDown({ width: -2, height: BASE_LINE_HEIGHT, content: '=== [요약] ===' });
        this.processParas(hNode.getElementsByTagName('summary')[0]);
        this.moveDown({ width: -2, height: BASE_LINE_HEIGHT, content: '=== [대표도] ===' });
        this.moveDown({ width: -3, height: BASE_LINE_HEIGHT, content: '도 #' });
        return this.countPages();
    }
    
    public precessDrawings(hNode: Element): number {
        // <drawings>
        this.moveDown({ width: -1, height: BASE_LINE_HEIGHT, content: '=== [도면] ===' });
        for (const figure of hNode.getElementsByTagName('figure')) {
            const [imgW, imgH] = this.getImgSize(figure.getElementsByTagName('img')[0]);
            // 제목과 이미지가 한 페이지에 나오므로 하나로 묶어서 처리함.
            const figH = BASE_LINE_HEIGHT + imgH;
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
                    this.absXLineH = Math.max(this.absXLineH, imgH + BASE_LINE_GAP);
                } else {
                    // 현재 줄에 이미지 추가
                    const prevLine = this.lines.pop();
                    if (!prevLine) throw new Error('에러 at processParagraph(): prevLine is undefined');
                    const prevAbsX = prevLine.width;
                    const prevLineHeight = prevLine.height;
                    
                    this.absX = prevAbsX + imgW;
                    this.absXLineH = Math.max(this.absXLineH, prevLineHeight, imgH + BASE_LINE_GAP);
                }
            }
            else if (child.nodeName === 'sub' || child.nodeName === 'sup') {
                const text = child.textContent || '';
                const prevLine = this.lines.pop();
                if (!prevLine) throw new Error('에러 at processParagraph(): prevLine is undefined');
                const prevAbsX = prevLine.width;
                const prevLineHeight = prevLine.height;
                
                const subSuplines = PageCounter.countLines(text, 0);
                this.absX = prevAbsX;
                for (const line of subSuplines) {
                    this.absX += (line.width || 0) * SUB_SUP_CHAR_WIDTH_TO_PT;
                }
                this.absXLineH = prevLineHeight;
            }
            else if (child.nodeName === 'maths') {
                const element = child as Element;
                this.moveDown({ width: -3, height: BASE_LINE_HEIGHT, content: '=== [수학식] ===' });
                const [imgW, imgH] = this.getImgSize(element.getElementsByTagName('img')[0]);
                const lineH = imgH + BASE_LINE_GAP;
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
                const lines = PageCounter.countLines(text, this.absX);
                if (!lines) continue;
                for (const line of lines) {
                    if (line.height < this.absXLineH) {
                        line.height = this.absXLineH;
                        this.absXLineH = BASE_LINE_HEIGHT
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
                lines.push({width: prevX, height: BASE_LINE_HEIGHT, content: text});
            } else {
                lines.push({width: prevX, height: BASE_LINE_HEIGHT, content: ''}); // MEMO: 이전 줄 끝나는 위치가 페이지 너비를 넘거나, 이전 줄에 한 글자 추가하면 바로 페이지 넘어가는 케이스
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
            lines.push({width: prevX, height: BASE_LINE_HEIGHT, content: text});
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