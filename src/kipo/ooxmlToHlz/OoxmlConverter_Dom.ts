import sharp from 'sharp';
import { MathJax } from './MathJax';
import {
    sTitlesLv1, sTitlesLv12, sTitlesLv123,
    preventTagFromParaNumRapping,
    numberingParaInsideTag,
    dividingParaByBrTag
} from "../0-data/kipoTitles";
import { PageCounter } from './pageCounter';
import { toArrayBuffer } from '@/_utils/dataType';
import { readFileSync } from 'fs';
import { collectInfo, collectError, collectWarning } from '../0-utils/errorCollector';
import { ErrorHandler } from '../0-utils/decorators/errorHandler';
import { FileHandler } from '../1-zip/zipFile';
import { parseXml } from '../2-lightParser/entry';
import { isXElem, isXText, XElement } from '../2-lightParser/1-node/node';
import { unEscapeXmlAttr, escapeXmlText } from "../0-utils/escape";

// 최대 이미지 크기
const MAX_IMAGE_WIDTH = 165; // mm
const MAX_IMAGE_HEIGHT = 165; // mm TODO: 세로 크기는 더 못 키우나? 세로로 긴 그림이 작게 나오고 있음.

/**
 * 번호 할당 함수 생성
 * @param prefix - 번호 앞에 붙는 문자
 * @param suffix - 번호 뒤에 붙는 문자
 * @param numLength - 번호 자리수
 * @returns 번호 할당 함수
 */
function makeAllocateNumber(prefix: string, numLength: number, suffix: string) {
    let count = 0;
    return function () {
        count++;
        const num = count.toString(10).padStart(numLength, '0');
        return `${prefix}${num}${suffix}`;
    };
};

/**
 * OOXML을 hlzXML로 변환하는 클래스
 */
export class OoxmlConverter {
    // [접두사 규칙] 
    // o: OOXML과 관련된 변수
    // h: hltXML과 관련된 변수
    // s: 명세서 내용과 관련된 변수
    private htmlParas: string[] = [];
    private hlzXml: string = '';
    private hlzImgs: Img[] = [];
    private docxFile: FileHandler;

    // 번호 할당 함수들
    private allocSParaNum = makeAllocateNumber('', 4, ''); // "0001"
    private allocHImgId = makeAllocateNumber('i', 4, ''); // "i0001"
    private allocHImgFileName = makeAllocateNumber('pat', 5, '.jpg'); // "pat00001.확장자"

    public static async generateHlzXml(html: string[], docxFile: FileHandler): Promise<{
        hlzXml: string,
        hlzImgs: Img[],
    }> {
        const instance = new OoxmlConverter(html, docxFile);
        await instance.convert();
        
        return {
            hlzXml: instance.hlzXml,
            hlzImgs: instance.hlzImgs,
        };
    }

    private constructor(html: string[], docxFile: FileHandler) {
        this.htmlParas = html.reverse();
        this.docxFile = docxFile;
    }

    /** OOXML을 hlzXML로 변환 */
    private async convert(): Promise<void> {
        while (true) {
            const paraHtml = this.htmlParas.pop();
            if (!paraHtml) break;

            // 표제 등 명세서 목차가 아닌 내용 건너뛰기
            const sTitle = getTitleText(paraHtml);
            if (!sTitlesLv123.has(sTitle)) continue;

            this.hlzXml += await this.doP(paraHtml);
        }
        this.hlzXml = await this.doKipoTag(this.hlzXml);
    }

    /**
     * <w:p> 문단 태그 처리
     * @note 이하에서 태그를 처리하는 모든 메소드는 "hlzXML 문자열"을 반환하도록 함.
     */
    private async doP(paraHtml: string): Promise<string> {
        // 목차 제목 처리
        const sTitle = getTitleText(paraHtml);
        switch (sTitle) {
            case '[발명의 설명]': return this.doPPP('description', sTitlesLv1);
            case '[발명의 명칭]': return this.doPPP('invention-title', sTitlesLv12);
            case '[기술분야]': return this.doPPP('technical-field', sTitlesLv12);
            case '[발명의 배경이 되는 기술]':
            case '[배경기술]': return this.doPPP('background-art', sTitlesLv12);
            case '[선행기술문헌]': return this.doPPP('citation-list', sTitlesLv12);
            case '[특허문헌]': return this.doPPP('patent-literature', sTitlesLv123); // TODO: 특허문헌 처리 추가
            case '[비특허문헌]': return this.doPPP('non-patent-literature', sTitlesLv123); // TODO: 비특허문헌 처리 추가
            case '[발명의 내용]': return this.doPPP('summary-of-invention', sTitlesLv12);
            case '[해결하고자 하는 과제]':
            case '[해결하려는 과제]':
            case '[과제]': return this.doPPP('tech-problem', sTitlesLv123);
            case '[과제의 해결 수단]':
            case '[수단]': return this.doPPP('tech-solution', sTitlesLv123);
            case '[발명의 효과]':
            case '[효과]': return this.doPPP('advantageous-effects', sTitlesLv123);
            case '[도면의 간단한 설명]':
            case '[도간설]': return this.doPPP('description-of-drawings', sTitlesLv12);
            case '[발명을 실시하기 위한 구체적인 내용]':
            case '[발실구내]': return this.doPPP('description-of-embodiments', sTitlesLv12);
            case '[부호의 설명]': return this.doPPP('reference-signs-list', sTitlesLv12);
            case '[청구범위]': return this.doPPP('claims', sTitlesLv1);
            case '[요약서]': return this.doPPP('abstract', sTitlesLv1);
            case '[요약]': return this.doPPPSummary('summary', sTitlesLv12);
            case '[대표도]': return this.doPPPAbsFigure('abstract-figure', sTitlesLv12);
            case '[도면]': return this.doPPP('drawings', sTitlesLv1);
        }
        if (/수학식 ?\w+/.test(sTitle)) return await this.doHasNumber('maths', sTitle, sTitlesLv123);
        if (/표 ?\w+/.test(sTitle)) return this.doHasNumber('tables', sTitle, sTitlesLv123);
        if (/청구항 ?\d+/.test(sTitle)) return this.doPPPClaim(sTitle, sTitlesLv123);
        if (/도 ?\w+/.test(sTitle)) return this.doHasNumber('figure', sTitle, sTitlesLv123);

        return await this.processOParaHtml(paraHtml);
    }

    private async doPPP(kTagName: string, stopAt: Set<string>): Promise<string> {
        const kContents: string[] = [];
        while (true) {
            if (this.isStopPoint(stopAt)) break;
            const paraHtml = this.htmlParas.pop();
            if (paraHtml === undefined) break;

            let content = await this.doP(paraHtml);
            if (content.trim() === '') continue;

            if (numberingParaInsideTag.has(`<${kTagName}>`) &&
                !preventTagFromParaNumRapping.has(content.match(/<.*?>/)?.[0] ?? '')
            ) {
                if (dividingParaByBrTag.has(`<${kTagName}>`)) {
                    content += await this.doPPPBr(sTitlesLv12);
                }
                content = `<p num="${this.allocSParaNum()}">${content}</p>`;
            }
            kContents.push(content);
        }
        const ret = `<${kTagName}>${kContents.join('')}</${kTagName}>`;
        return ret;
    }

    private async doPPPBr(stopAt: Set<string>): Promise<string> {
        const hContent: string[] = [];
        while (true) {
            if (this.isStopPoint(stopAt)) break;
            const paraHtml = this.htmlParas.pop();
            if (paraHtml === undefined) break;

            const val = (await this.doP(paraHtml)).trim();
            if (!val) continue;

            hContent.push(`<br/>${val}`);
        }
        return hContent.join('');
    }

    private async doHasNumber(kTagName: string, sTitle: string, stopAt: Set<string>): Promise<string> {
        let content = '';
        while (true) {
            if (this.isStopPoint(stopAt, true)) break;
            const paraHtml = this.htmlParas.pop();
            if (paraHtml === undefined) break;

            content += await this.processOParaHtml(paraHtml);
            if (content) break;
        }
        const num = sTitle.match(/\w+/)?.[0];
        content = `<${kTagName} num="${num}">${content}</${kTagName}>`;
        return content;
    }

    private async doPPPClaim(sTitle: string, stopAt: Set<string>): Promise<string> {
        const content: string[] = [];
        while (true) {
            if (this.isStopPoint(stopAt, true)) break;
            const paraHtml = this.htmlParas.pop();
            if (paraHtml === undefined) break;

            const val = (await this.processOParaHtml(paraHtml)).trim();
            if (!val) continue;

            content.push(val);
        }
        const contents = content.join('<br/>');
        const num = sTitle.match(/\d+/)?.[0];
        return `<claim num="${num}"><claim-text>${contents}</claim-text></claim>`;
    }

    private async doPPPSummary(hTitle: string, stopAt: Set<string>): Promise<string> {
        let content: string[] = [];
        while (true) {
            if (this.isStopPoint(stopAt)) break;
            const paraHtml = this.htmlParas.pop();
            if (paraHtml === undefined) break;

            const val = await this.processOParaHtml(paraHtml);
            if (val.trim() !== '') content.push(val);
        }
        const contents = content.join('<br/>');
        return `<${hTitle}><p num="0001a">${contents}</p></${hTitle}>`;
    }

    private async doPPPAbsFigure(hTitle: string, stopAt: Set<string>): Promise<string> {
        let content = '';
        while (true) {
            if (this.isStopPoint(stopAt, true)) break;
            const paraHtml = this.htmlParas.pop();
            if (paraHtml === undefined) break;

            let val = await this.processOParaHtml(paraHtml);
            const match = val.match(/\w+/g);
            if (match) {
                content = match[0];
                break;
            }
        }
        const contents = `<figref num="${content}" />`;
        return `<${hTitle}><p num="0002a">${contents}</p></${hTitle}>`;
    }

    private isStopPoint(stopAt: Set<string>, withNumTitle: boolean = false): boolean {
        const text = this.htmlParas.at(-1);
        if (!text) return false;

        const title = getTitleText(text);
        if (stopAt.has(title)) return true;

        if (withNumTitle) {
            if (/\[표 ?\w+\]/.test(title)) return true;
            if (/\[수학식 ?\w+\]/.test(title)) return true;
            if (/\[청구항 ?\w+\]/.test(title)) return true;
        }

        return false;
    }

    @ErrorHandler('문단 처리', '')
    private async processOParaHtml(paraHtml: string): Promise<string> {
        const root = parseXml(paraHtml);
        const pTag = root.childNodes[0];
        if (pTag.tagName !== 'p' || root.childNodes.length > 1) {
            collectError(`<p> 태그가 없거나, 여러 개의 문단이 있음: ${paraHtml}`);
            return '';
        }

        let content = '';
        for (const node of pTag.childNodes) {
            if (isXText(node)) {
                content += escapeXmlText(node.textContent);
                continue;
            }
            if (isXElem(node)) {
                switch (node.tagName) {
                    case 'b':
                    case 'i':
                    case 'u':
                    case 'sub':
                    case 'sup':
                        content += node.outerXML;
                        break;
                    case 'img':
                        content += await this.makeImgTagFromDocxImg(node);
                        break;
                    case 'math':
                    case 'mathPara':
                        content += await this.makeMathTagFromOmml(node);
                        break;
                    case 'table':
                        content += await this.makeTableTagFromOTbl(node);
                        break;
                    default:
                        collectWarning(`문단 처리 중 무시된 태그가 있음: <${node.tagName}>`,
                            `HTML: ${paraHtml}`);
                        break;
                }
            }
        }
        return content;
    }

    @ErrorHandler('이미지 태그 처리', '')
    private async makeImgTagFromDocxImg(img: XElement): Promise<string> {
        let w = Number(img.attrs['w']) / 36000; // 1 mm = 36,000 EMU
        let h = Number(img.attrs['h']) / 36000;
        const path = img.attrs['path'];
        if (isNaN(w) || isNaN(h) || !path) return '';

        // 이미지를 jpg로 변환
        const oImgArrBuff = await this.docxFile.readFile(path, 'arraybuffer');
        const hJpgBuff = await sharp(oImgArrBuff)
            .flatten({ background: { r: 255, g: 255, b: 255 } }) // 흰색 배경 추가
            .jpeg({ quality: 70 }) // 70% 품질로 설정
            .toBuffer();

        // jpg 이미지 크기 지정하기
        const ratio = h / w;
        if (w > MAX_IMAGE_WIDTH) {
            w = MAX_IMAGE_WIDTH;
            h = MAX_IMAGE_WIDTH * ratio;
        }
        if (h > MAX_IMAGE_HEIGHT) {
            w = MAX_IMAGE_HEIGHT / ratio;
            h = MAX_IMAGE_HEIGHT;
        }
        h = Math.round(h);
        w = Math.round(w);

        const hImgId = this.allocHImgId();
        const hImgName = this.allocHImgFileName();
        const hJpgArrBuff = await toArrayBuffer(hJpgBuff);

        this.hlzImgs.push({
            name: hImgName,
            buffer: hJpgArrBuff,
            W: w,
            H: h,
        });

        return `<img id="${hImgId}" he="${h}" wi="${w}" file="${hImgName}" img-format="jpg" />`;
    }

    @ErrorHandler('수학식 태그 처리', '')
    private async makeMathTagFromOmml(elem: XElement): Promise<string> {
        const omml = unEscapeXmlAttr(elem.attrs['omml']);
        if (!omml) return '';

        // TODO: 캐쉬 사용: 테스트 후 적용하기
        // if (latexStr in this.latexImgs) {
        //     const hImgId = this.allocHImgId();
        //     const hImgName = this.allocHImgFileName();
        //     const img = this.latexImgs[latexStr];
        //     this.hImgs.push({
        //         name: hImgName,
        //         buffer: img.buffer.slice(), // 버퍼 복사
        //         W: img.W,
        //         H: img.H,
        //     });
        //     return `<img id="${hImgId}" he="${img.H}" wi="${img.W}" file="${hImgName}" img-format="jpg" />`;
        // }

        const hJpgBuff = await MathJax.convertToJpg(omml);

        // 이미지 크기
        const hImgMetadata = await sharp(hJpgBuff).metadata(); // px
        let h = Math.round((hImgMetadata.height || 20) / 9);
        let w = Math.round((hImgMetadata.width || 50) / 9);

        const ratio = h / w;
        if (w > MAX_IMAGE_WIDTH) {
            w = MAX_IMAGE_WIDTH;
            h = MAX_IMAGE_WIDTH * ratio;
        }
        if (h > MAX_IMAGE_HEIGHT) {
            w = MAX_IMAGE_HEIGHT / ratio;
            h = MAX_IMAGE_HEIGHT;
        }
        h = Math.floor(h);
        w = Math.floor(w);

        const hImgId = this.allocHImgId();
        const hImgName = this.allocHImgFileName();
        const hJpgArrBuff = await toArrayBuffer(hJpgBuff);

        const latexImg: Img = {
            name: hImgName,
            buffer: hJpgArrBuff,
            W: w,
            H: h,
        };

        // this.latexImgs[latexStr] = latexImg; // 캐쉬 사용: 테스트 후 적용하기

        this.hlzImgs.push(latexImg);

        return `<img id="${hImgId}" he="${h}" wi="${w}" file="${hImgName}" img-format="jpg" />`;
    }

    @ErrorHandler('<w:tbl> 태그 처리', '')
    private async makeTableTagFromOTbl(oNode: XElement): Promise<string> {
        const EXPAND_RATIO = 1.35;
        const MAX_TABLE_WIDTH = 11500;

        // 그리드 너비 계산
        const gridWiths = oNode.attrs['gridWidths'].split(',').map(Number);
        if (!gridWiths) return '';
        const tableWidth = gridWiths.reduce((a, w) => a + w, 0);
        const ratio = (tableWidth * EXPAND_RATIO > MAX_TABLE_WIDTH) ?
            MAX_TABLE_WIDTH / tableWidth :
            EXPAND_RATIO;

        // <colspec ... /> 태그들 생성
        const hColspecs = gridWiths.map((gridWidth, i) => {
            const hColWidth = Math.floor(gridWidth * ratio);
            // HACK: align 속성이 항상 "justify"인지 확인해야 함.
            return `<colspec colnum="${i + 1}" align="justify" colname="col${i + 1}" colwidth="${hColWidth}" />`;
        }).join('');

        const nCols = gridWiths.length;
        const occupiedGrids: number[] = new Array(nCols + 1).fill(0);

        const hRows: string[] = [];
        let currRow = 0;
        for (const oRow of oNode.getElemsByTag('tr')) {
            currRow += 1;
            const hCells: string[] = [];
            for (const oCell of oRow.getElemsByTag('td')) {
                // 셀 문단 정렬 속성
                const _halign = oCell.attrs['halign'];
                const align = ` align="${_halign || 'justify'}"`;
                const _valign = oCell.attrs['valign'];
                const valign = _valign ? ` valign="${_valign}"` : '';

                // 셀 병합 속성
                const colspan = Number(oCell.attrs['cols']);
                const rowspan = Number(oCell.attrs['rows']);

                let currCol = 0;
                for (let k = 1; k <= nCols; k++) {
                    if (currRow === occupiedGrids[k] + 1) {
                        for (let l = 0; l < colspan; l++) {
                            occupiedGrids[k + l] += rowspan;
                        }
                        currCol = k;
                        break;
                    }
                }

                const colname = (colspan === 1) ?
                    ` colname="col${currCol}"` :
                    ` namest="col${currCol}" nameend="col${currCol + colspan - 1}"`;
                const morerows = (rowspan === 1) ?
                    `` :
                    ` morerows="${rowspan - 1}"`;

                // 셀 내 문단 노드들
                const hContent: string[] = [];
                for (const oPara of oCell.getElemsByTag('p')) {
                    const val = await this.processOParaHtml(oPara.outerXML);
                    if (val === '') continue; // HACK: 테이블에서는 빈 줄 제거하지 말까?
                    hContent.push(val);
                }
                const hContents = hContent.join('<br/>');

                hCells.push(`<entry${align}${valign}${colname}${morerows}>${hContents}</entry>`);
            };
            hRows.push(`<row>${hCells.join('')}</row>`);
        };

        const nRows = currRow;
        for (let k = 1; k <= nCols; k++) {
            if (occupiedGrids[k] === nRows) continue;
            collectWarning(`테이블 병합 처리 중 뭔가 잘못됨: ${occupiedGrids[k]} !== ${nRows}`,
                `oNode.toString(): ${oNode.outerXML}`);
            return '';
        }

        const hTbody = `<tbody>${hRows.join('')}</tbody>`;
        const hTable = `<table><tgroup xmlns="http://www.oasis-open.org/tables/exchange/1.0" cols="${nCols}">${hColspecs}${hTbody}</tgroup></table>`;
        return hTable;
    }

    private async doKipoTag(hXmlStr: string): Promise<string> {
        // <PatentCAFDOC>
        const documentId = Math.floor(Date.now() / 1000); // hlz 파일 생성한 유닉스 시간
        const PatentCAFDOC = `<PatentCAFDOC docflag="1.0" documentID="${documentId}">${hXmlStr}</PatentCAFDOC>`;
        // <KIPO>
        const keapsVersion = await this.getKeapsVersion();
        const pageCount = this.getPageCount(PatentCAFDOC);
        const specId = 'SD00000001'; // TODO: 보정하면 바뀌는지 체크
        const KIPO = `<KIPO keapsVersion="${keapsVersion}" editorKind="A" pageCount="${pageCount}" imgApply="N" specId="${specId}" xmlns="http://www.kipo.go.kr">${PatentCAFDOC}</KIPO>`;

        return `<?xml version="1.0" encoding="utf-8"?>${KIPO}`;
    }

    private async getKeapsVersion(): Promise<string> {
        let keapsVersion = '1.079'; // 기본값
        if (process.env.NODE_ENV === 'production') return keapsVersion;

        // Kipo 최신 버전 확인
        try {
            const kipoExeConfig = readFileSync('C:\\KipoEditor\\KipoEditor.exe.config', 'utf8');
            const match = kipoExeConfig.match(/<add key="keapsVersion" value="([^"]+)" \/>/);
            if (match && keapsVersion !== match[1]) {
                collectInfo(`KipoEditor 버전 갱신: ${keapsVersion} -> ${match[1]}`);
                keapsVersion = match[1];
            }
        } catch (error) {
            collectError(`keapsVersion 확인 실패`, error as Error);
        } finally {
            return keapsVersion;
        }
    }

    private getPageCount(hXml: string): number {
        try {
            return PageCounter.countPages(hXml);
        } catch (error) {
            collectError(`페이지 수 카운트 오류:`, error as Error);
            return 50;
        }
    }
}

function getTitleText(paraHtml: string): string {
    const titleMatch = paraHtml
        .replace(/<[^>]*>/g, "")
        .replace("【", "[").replace("】", "]")
        .match(/^\s*(\[[ 가-힣0-9a-zA-Z]+?\])/);
    return titleMatch ? titleMatch[1] : '';
}
