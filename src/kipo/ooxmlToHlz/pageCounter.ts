import * as cheerio from 'cheerio';
import { BATANGCHE_WIDTH_PT } from '../ttfParser/batangche_width_pt';
import { KipoParas } from '../diff/kipoParas';
import { collectLine } from '../dataCollector';
import { dlog } from '../../_utils/env';

// NOTE: 폰트 사이즈
// 한글 문자 너비: 12 pt
// 영어 문자 너비: 6 pt
// pt -> mm: 1 pt = 254/720 mm
// mm -> pt: 1 mm = 720/254 pt

// pt 단위
const FONT_SIZE = 12; // pt = 4mm (고정)
const LINE_GAP = 21.6; // pt (고정)
const BASE_LINE_HEIGHT = FONT_SIZE + LINE_GAP; // pt (고정)

const INDENT_SIZE = 41; // pt (메뉴얼: 너비 공백 8자)

const PAGE_WIDTH = 467.9; // pt (메뉴얼: 너비 495pt = 165mm)
const PAGE_HEIGHT = FONT_SIZE * 20 + LINE_GAP * 21; // pt (-LINE_GAP < adjust < +FONT_SIZE+1) (메뉴얼: 높이 711pt = 237mm)

const IMG_WIDTH_TO_PT = 2.9 // pt
const IMG_HEIGHT_TO_PT = 2.9 // pt
const SUB_WIDTH_RATIO = 23 / 36; // pt (예외: 스페이스바는 너비 유지)

declare type Cube = {
    ch: string
    W: number;
    H: number;
}

/**
 * hlz 파일의 페이지 수를 계산하는 클래스
 */
export class PageCounter {
    private static instances: Map<KipoXml, PageCounter> = new Map();
    private discParas: Paragraph[] = [];
    private claimParas: Paragraph[] = [];
    private abstractParas: Paragraph[] = [];
    private drawingParas: Paragraph[] = [];
    public specPages = 0;

    public static async getPages(hXml: string): Promise<number> {
        if (!PageCounter.instances.has(hXml)) {
            const paras = await KipoParas.getParas(hXml);
            PageCounter.instances.set(hXml, new PageCounter(paras));
        }
        return PageCounter.instances.get(hXml)!.specPages;
    }

    private constructor(paras: Paragraph[]) {
        let discIdx = 0;
        let claimIdx;
        let abstractIdx;
        let drawingIdx;
        for (const [idx, para] of paras.entries()) {
            if (para.content === '【발명의 설명】') discIdx = idx;
            if (para.content === '【청구범위】') claimIdx = idx;
            if (para.content === '【요약서】') abstractIdx = idx;
            if (para.content === '【도면】') drawingIdx = idx;
        }
        this.discParas = paras.slice(discIdx, claimIdx ?? abstractIdx ?? drawingIdx);
        this.claimParas = claimIdx ? paras.slice(claimIdx, abstractIdx ?? drawingIdx) : [];
        this.abstractParas = paras.slice(abstractIdx, drawingIdx);
        this.drawingParas = drawingIdx ? paras.slice(drawingIdx) : [];

        this.calculateSpecPages();
    }

    public calculateSpecPages() {
        this.precessSection(this.discParas);
        this.precessSection(this.claimParas);
        this.precessSection(this.abstractParas);
        this.precessSection(this.drawingParas, true);
    }

    public precessSection(paras: Paragraph[], isDrawings: boolean = false): number {
        const totalLines: Line[] = [];
        for (const para of paras) {
            const cubes = this.makeCubeList(para);
            const lines = this.makeLineList(cubes);
            totalLines.push(...lines);
        };

        if (isDrawings && totalLines.length > 0) {
            const lines: Line[] = totalLines.splice(1);
            for (let i = 0; i < lines.length; i += 2) {
                totalLines.push({
                    W: lines[i].W,
                    H: lines[i].H + lines[i + 1].H,
                    lineText: `${lines[i].lineText} ${lines[i + 1].lineText}`
                });
            }
        }

        return this.countPages(totalLines);
    }

    public makeCubeList(para: Paragraph) {
        const content = `<div>${para.content}</div>`;
        const $ = cheerio.load(content, {
            xml: {
                decodeEntities: false,
                withStartIndices: true,
                withEndIndices: true,
            },
        });
        
        const cubes: Cube[] = [];
        for (const child of $('div').contents()) {
            const type = child.type;
            if (type === 'text') {
                const text = child.data.split('');
                for (const ch of text) {
                    const chW = BATANGCHE_WIDTH_PT[ch];
                    cubes.push({ ch: ch, H: BASE_LINE_HEIGHT, W: chW });
                }
                continue;
            }
            if (type === 'tag') {
                const tagName = child.tagName;
                if (tagName === 'img') {
                    const imgW_mm = Number(child.attribs.wi);
                    const imgH_mm = Number(child.attribs.he);
                    const imgW = imgW_mm * IMG_WIDTH_TO_PT;
                    const imgH = imgH_mm * IMG_HEIGHT_TO_PT;
                    cubes.push({ ch: `<img/>`, H: imgH + LINE_GAP, W: imgW });
                    continue;
                }
                if (tagName === 'sub' || tagName === 'sup') {
                    const text = content
                        .slice(child.startIndex! + 5, child.endIndex! - 5)
                        .split('');
                    for (const ch of text) {
                        const chW = BATANGCHE_WIDTH_PT[ch];
                        if (ch === ' ') {
                            cubes.push({ ch: ch, H: BASE_LINE_HEIGHT, W: chW });
                        } else {
                            cubes.push({ ch: ch, H: BASE_LINE_HEIGHT, W: chW * SUB_WIDTH_RATIO });
                        }
                    }
                    continue;
                }
                if (tagName === 'table') {
                    // TODO: [표] 처리하기
                    // row의 셀 중에서 가장 셀의 높이가 가장 높은 셀의 높이를 찾아서 추가
                    // row 당 width는 페이지 최대 폭으로 설정해서 한 줄에 하나만 들어가도록 하기
                }
            }
        }
        return cubes;
    }

    // NOTE: 영어/숫자는 단어 잘리지 않음.
    // 영어/숫자는 문단 폭을 넘어가면 전부 다음 줄로 이동.
    // 영어/숫자 전체가 한 줄을 넘어가면 단어가 잘림.
    // "영어/숫자+한글" 조합은 한글에서 잘릴 수 있음.
    // stickyChars: 알파벳/숫자/이미지 + `~!@#$%^&*()-_=+[]{}\|;:'",<.>/?
    // danglingChars: (한글 뒤에) .,!?:;>)}]`~%^
    public makeLineList(cubes: Cube[]): Line[] {
        const lines: Line[] = [];
        let currText = "";
        let currWidth = INDENT_SIZE;
        let currHeight = BASE_LINE_HEIGHT;
        let currStickyCubes: Cube[] = [];
        let isPrevCharSticky = false;
        let prevCube: Cube | null = null;

        if (cubes.length === 1) {
            // 이미지 하나만 있는 경우 이미지가 크면 줄바꿈으로 처리할 수 있어서 바로 처리
            lines.push({ W: cubes[0].W, H: cubes[0].H, lineText: cubes[0].ch });
            return lines;
        }

        const clearStickyCubes = (cubes: Cube[]) => {
            const word = cubes.reduce((acc, c) => acc + c.ch, '');
            const wordWidth = cubes.reduce((sum, c) => sum + c.W, 0);
            const wordHeight = cubes.reduce((max, c) => Math.max(max, c.H), 0);
            if (currWidth + wordWidth > PAGE_WIDTH) {
                lines.push({ W: currWidth, H: currHeight, lineText: currText });
                currText = word;
                currWidth = wordWidth;
                currHeight = Math.max(BASE_LINE_HEIGHT, wordHeight);
            } else {
                currText += word;
                currWidth += wordWidth;
                currHeight = Math.max(currHeight, wordHeight);
            }
            currStickyCubes = [];
        };

        for (const cube of cubes) {
            const ch = cube.ch;
            const chW = cube.W;

            const isCurrCharSticky = /[a-zA-Z0-9]/.test(ch)
                || /[~!@#$%\^&*()_=+\[\]{}\\\|;:'",<.>\/\?-]/.test(ch)
                || /<img [^>]*>/.test(ch);

            const isCurrCharDangling = /[.,!?:;>)}\]`~%\^]/.test(ch)

            // 공백 문자 처리
            if (ch === ' ') {
                if (currStickyCubes.length > 0) clearStickyCubes(currStickyCubes);
                if (currWidth + chW > PAGE_WIDTH) continue; // 줄바꿈이 필요한 경우 공백 스킵
                currText += ch;
                currWidth += chW;
                continue;
            }

            // 문자 타입이 바뀌었을 때 (Sticky <-> UnSticky)
            if (isCurrCharSticky !== isPrevCharSticky && currStickyCubes) {
                clearStickyCubes(currStickyCubes);
            }

            if (!isCurrCharSticky) {
                // UnSticky는 바로 처리
                if (currWidth + chW > PAGE_WIDTH) {
                    lines.push({ W: currWidth, H: currHeight, lineText: currText });
                    currText = ch;
                    currWidth = chW;
                    currHeight = BASE_LINE_HEIGHT;
                } else {
                    currText += ch;
                    currWidth += chW;
                }
            } else if (isCurrCharDangling && prevCube && /[가-힣]/.test(prevCube.ch)) {
                if (currWidth + chW > PAGE_WIDTH) {
                    lines.push({ W: currWidth - prevCube.W, H: currHeight, lineText: currText.slice(0, -1) });
                    currText = prevCube.ch + ch;
                    currWidth = prevCube.W + chW;
                    currHeight = BASE_LINE_HEIGHT;
                } else {
                    currText += ch;
                    currWidth += chW;
                }
            } else {
                // Sticky는 모아서 처리
                currStickyCubes.push(cube);
            }

            prevCube = cube;
            isPrevCharSticky = isCurrCharSticky;
        }

        // 남은 Sticky 처리
        if (currStickyCubes) {
            clearStickyCubes(currStickyCubes);
        }

        // 남은 UnSticky 처리
        if (currText) {
            lines.push({ W: currWidth, H: currHeight, lineText: currText });
        }

        return lines;
    }

    public countPages(lines: Line[]): number {
        this.specPages += 1;
        let currH = 0;
        for (const ln of lines) {
            currH += ln.H;
            if (currH > PAGE_HEIGHT) {
                this.specPages += 1;
                currH = ln.H;
            }
            collectLine({...ln, pageNum: this.specPages});
        }

        return this.specPages;
    }
} 