import { JSDOM } from 'jsdom';
import { OMML_NS, ACCENT_DEFAULT, ACCENTS, LATEX_SYMBOLS, BAR_DEFAULT, BAR, FRACTION_DEFAULT, FRACTION_TYPES, FUNC, BREAK, LIM_FUNC, LIM_UPP, ALIGN, BIG_OPERATORS } from './data';
import { getValue, format, getUnicodeString, escapeLatex, isComplexEquation } from './utils';
import { XmlPropNode } from './XmlPropNode';
import { dlog } from '@/_utils/env';

/**
 * OMML XML 문자열을 LaTeX 문자열로 변환
 * @param oomlStr - 변환할 OOML XML 문자열
 * @returns 변환된 LaTeX 문자열
 */
export function makeLatexFromOoml(oomlStr: string): string | null {
    try {
        const dom = new JSDOM(oomlStr, { contentType: 'text/xml' });
        const ooml = dom.window.document.documentElement;

        // oMathPara 처리
        const oMathPara = (ooml.tagName === 'm:oMathPara') ? ooml 
            : ooml.getElementsByTagName('m:oMathPara')[0];
        if (oMathPara) {
            const latexStrs: string[] = [];
            for (const oMath of oMathPara.getElementsByTagName('m:oMath')) {
                const latexStr = convertMoMath(oMath);
                if (!latexStr) continue;
                latexStrs.push(latexStr);
            }
            
            if (latexStrs.length === 1) {
                return latexStrs[0].trim();
            }
            if (latexStrs.length > 1) {
                dlog(latexStrs);
                dlog(`\\begin{align}${latexStrs.join(BREAK)}\\end{align}`);
                return `\\begin{align}${latexStrs.join(BREAK)}\\end{align}`;
            }
        }

        // oMath 처리
        const oMath = (ooml.tagName === 'm:oMath') ? ooml
            : ooml.getElementsByTagName('m:oMath')[0];
        if (oMath) {
            const latexStr = convertMoMath(oMath);
            return latexStr.trim();
        }

        console.warn('oMath -> LaTeX 변환 실패: <m:oMath> 또는 <m:oMathPara> 노드가 없습니다.');
        return null;
    } catch (error) {
        console.warn('oMath -> LaTeX 변환 실패:', error);
        return null;
    }
} 

export interface NodeInfo {
    tag: string;
    /**
     * - `string`: LaTeX 문자열로 변환된 노드
     * - `XmlPropNode`: 속성 노드
     */
    result: string | XmlPropNode;
}

/**
 * <m:oMath> 태그를 LaTeX 문자열로 변환
 * @param oMath - XML 노드
 * @returns LaTeX 문자열
 */
function convertMoMath(oMath: Element): string {
    // oomlStr = oomlStr
    //     .replaceAll(' ', ' ')
    //     .replaceAll('＝', '=')
    let latexStr = processChildren(oMath.children)
    latexStr = latexStr
        .replace(/(?<!\\) }/g, '}')
        .replace(/(\\\s+)+/g, '\\ ') // 연속된 공백(`\ `) 제거
        .replace(/([^\\]) \\/g, '$1\\')
    return latexStr;
}

/**
 * 자식 노드들을 처리하고 결과를 LaTeX 문자열로 반환
 * @param xmlNodes - 자식 XML 노드들
 * @param include - 포함할 태그 목록 (선택적)
 * @returns LaTeX 문자열
 */
function processChildren(xmlNodes: HTMLCollection, include?: Set<string>): string {
    const nodesInfo = generateNodesInfo(xmlNodes, include);
    if (nodesInfo.length === 0) return '';

    let latexStr = '';
    for (const info of nodesInfo) {
        if (typeof info.result === 'string') {
            latexStr += info.result;
        }
    }
    return latexStr;
}

/**
 * 자식 노드들을 {태그명: 처리결과} 형태의 딕셔너리로 처리
 * @param xmlNodes - 자식 노드들
 * @param include - 포함할 태그 목록 (선택적)
 * @returns 태그별 처리된 노드 딕셔너리
 */
function processChildrenForDict(xmlNodes: HTMLCollection, include?: Set<string>): Record<string, string | XmlPropNode> {
    const nodesInfo = generateNodesInfo(xmlNodes, include);
    const latexChars: Record<string, string | XmlPropNode> = {};
    for (const info of nodesInfo) {
        latexChars[info.tag] = info.result;
    }
    return latexChars;
}

/**
 * 자식 노드 리스트 처리
 * @param xmlNodes - 자식 노드들
 * @param include - 포함할 태그 목록 (선택적)
 * @returns `{태그명: 처리결과}[]`
 */
function generateNodesInfo(xmlNodes: HTMLCollection, include?: Set<string>): NodeInfo[] {
    const nodesInfo: NodeInfo[] = [];

    if (!xmlNodes) return nodesInfo;

    for (const xmlNode of xmlNodes) {
        if (!xmlNode.namespaceURI?.includes(OMML_NS)) continue;

        const tagName = xmlNode.tagName || '';
        if (include && !include.has(tagName)) continue;

        let result: string | XmlPropNode = processTag(xmlNode);
        if (tagName.endsWith('Pr')) {
            result = new XmlPropNode(xmlNode);
        }
        if (!result) continue;

        nodesInfo.push({ tag: tagName, result: result });
    }
    return nodesInfo;
}

/**
 * 태그에 따른 처리 메서드를 호출
 * @param tagName - 처리할 태그 이름
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열 (@exception 해당하는 노드가 없으면 빈 문자열)
 */
function processTag(xmlNode: Element): string {
    switch (xmlNode.tagName) {
        // 그룹 1
        case 'm:acc': return doAcc(xmlNode);
        case 'm:bar': return doBar(xmlNode);
        case 'm:d': return doD(xmlNode);
        case 'm:eqArr': return doEqArr(xmlNode);
        case 'm:f': return doF(xmlNode);
        case 'm:fName': return doFName(xmlNode);
        case 'm:func': return doFunc(xmlNode);
        case 'm:groupChr': return doGroupChr(xmlNode);
        case 'm:limLow': return doLimLow(xmlNode);
        case 'm:limUpp': return doLimUpp(xmlNode);
        case 'm:lim': return doLim(xmlNode);
        case 'm:m': return doM(xmlNode);
        case 'm:mr': return doMr(xmlNode);
        case 'm:nary': return doNary(xmlNode);
        case 'm:r': return doR(xmlNode);
        case 'm:rad': return doRad(xmlNode);
        case 'm:sub': return doSub(xmlNode);
        case 'm:sup': return doSup(xmlNode);
        // 그룹 2 - 기존 패키지에서 directTags라고 이름 붙였던 것
        case 'm:box':
        case 'm:den':
        case 'm:deg':
        case 'm:e':
        case 'm:num':
        case 'm:sSub':
        case 'm:sSup':
        case 'm:sSubSup': {
            return processChildren(xmlNode.children);
        }
        // 기타 태그
        default: return '';
    }
}

/**
 * 액센트 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doAcc(xmlNode: Element): string {
    const children = processChildrenForDict(xmlNode.children);
    const pr = children['m:accPr'];
    if (typeof pr === 'string') return '';
    const accent = getValue(pr.getAttributeValue('m:chr'), ACCENT_DEFAULT, ACCENTS);
    return format(accent, children['m:e']);
}

/**
 * Run: 런 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doR(xmlNode: Element): string {
    const tNode = xmlNode.getElementsByTagName('m:t')[0] || null;
    if (!tNode) return '';

    const text = (tNode.textContent || '');
    const isSpaces = tNode.getAttribute('xml:space') === 'preserve';
    let result = Array.from(text).map(ch => {
        if (isSpaces && ch === ' ') {
            return '\\ ';
        }
        const uni = getUnicodeString(ch);
        return LATEX_SYMBOLS[ch] || LATEX_SYMBOLS[uni] || ch;
    }).join('');

    const children = processChildrenForDict(xmlNode.children);
    const mrPr = children['m:rPr'];
    if (mrPr instanceof XmlPropNode) {
        const regex = /(?<=^|\s)([^\s\\]+?)(?=\s|\\|$)/g;
        switch (mrPr.getAttributeValue('m:sty')) {
            case 'b': result = result.replace(regex, '\\textbf{$1}'); break;
            case 'i': result = result.replace(regex, '\\textit{$1}'); break;
            case 'bi': result = result.replace(regex, '\\textbf{\\textit{$1}}'); break;
        }
        if (mrPr.hasInnerTag('m:aln')) {
            result = ALIGN + result;
        }
    }

    return result;
}

/**
 * 바 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doBar(xmlNode: Element): string {
    const children = processChildrenForDict(xmlNode.children);
    const pr = children['m:barPr'];
    if (typeof pr === 'string') return '';
    const latexStr = getValue(pr.getAttributeValue('m:pos'), BAR_DEFAULT, BAR);
    return pr + format(latexStr, children['m:e']);
}

/**
 * Delimiter: 구분자 (괄호 등) 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doD(xmlNode: Element): string {
    const children = processChildrenForDict(xmlNode.children);

    // HACK: <m:dPr> 태그 처리하는 부분이 구현되어 있지 않음.
    // 이로 인해 결과물에 'undefined' 문자열이 포함되고 있음.
    // 우선은 리턴 값에 'pr + ' 대신 (pr ? pr : '') + 를 사용하여 해결함.
    // - OOXML 문서: 22.1.2.31 dPr (Delimiter Properties)
    const dPr = children['m:dPr'];
    if (typeof dPr === 'string') return '';

    const nullVal = '.';
    const begChr = getValue(dPr.getAttributeValue('m:begChr'), '(', LATEX_SYMBOLS);
    const endChr = getValue(dPr.getAttributeValue('m:endChr'), ')', LATEX_SYMBOLS);
    const left = begChr ? escapeLatex(begChr) : nullVal;
    const right = endChr ? escapeLatex(endChr) : nullVal;
    const text = children['m:e'];

    return (dPr ? dPr : '') + `\\left${left}${text}\\right${right}`;
}

/**
 * 아래 첨자 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doSub(xmlNode: Element): string {
    const val = processChildren(xmlNode.children);
    return val ? `_{${val}}` : '';
}

/**
 * 위 첨자 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doSup(xmlNode: Element): string {
    const val = processChildren(xmlNode.children);
    return val ? `^{${val}}` : '';
}

/**
 * 분수 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doF(xmlNode: Element): string {
    const children = processChildrenForDict(xmlNode.children);

    // HACK: <m:fPr> 태그 처리하는 부분이 구현되어 있지 않음.
    // 이로 인해 결과물에 'undefined' 문자열이 포함되고 있음.
    // 우선은 리턴 값에 'pr + ' 대신 (pr ? pr : '') + 를 사용하여 해결함.
    // doD() 메서드도 동일한 문제점을 가짐.
    // - OOXML 문서: 22.1.2.38 fPr (Fraction Properties)
    const pr = children['m:fPr'];
    if (typeof pr === 'string') return '';
    const frac = getValue(pr.getAttributeValue('m:type'), FRACTION_DEFAULT, FRACTION_TYPES);
    return (pr ? pr : '') + format(frac, children['m:num'], children['m:den']);
}

/**
 * 함수 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doFunc(xmlNode: Element): string {
    const children = processChildrenForDict(xmlNode.children);
    const fnName = children['m:fName'];
    const e = children['m:e'];
    if (typeof fnName !== 'string' || typeof e !== 'string') return '';
    return fnName + e;
}

/**
 * 함수 이름 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 * @throws Error - 지원하지 않는 함수인 경우
 */
function doFName(xmlNode: Element): string {
    let fnName: string = '';
    let isR: boolean = false;
    for (const info of generateNodesInfo(xmlNode.children)) {
        const res = info.result;
        if (typeof res === 'string') {
            if (info.tag === 'm:r') isR = true;
            fnName += res;
        }
    }
    const cleanFnName = fnName.split('^{')[0].split('_{')[0];
    const fnSymbol = FUNC[cleanFnName];
    if (isR && !fnSymbol) {
        console.warn(`함수목록(FUNC)에 없는 함수입니다: '${fnName}'`);
    }
    return fnSymbol ? fnName.replace(cleanFnName, fnSymbol) : fnName;
}
/**
 * 그룹 문자 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doGroupChr(xmlNode: Element): string {
    const children = processChildrenForDict(xmlNode.children);
    const pr = children['m:groupChrPr'];
    if (typeof pr === 'string') return '';
    const chr = getValue(pr.getAttributeValue('m:chr'));
    return pr + format(chr, children['m:e']);
}

/**
 * 근호 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doRad(xmlNode: Element): string {
    const children = processChildrenForDict(xmlNode.children);
    if (children['m:deg'] && typeof children['m:deg'] === 'string' && children['m:deg'].length > 0) {
        return `\\sqrt[${children['m:deg']}]{${children['m:e']}}`;
    }
    return `\\sqrt{${children['m:e']}}`;
}

/**
 * 배열 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doEqArr(xmlNode: Element): string {
    const include = new Set(['m:e']);
    const text = generateNodesInfo(xmlNode.children, include)
        .map(t => t.result)
        .join(BREAK);
    return `\\begin{array}{c}${text}\\end{array}`;
}

/**
 * 하한 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 * @throws Error - 지원하지 않는 함수인 경우
 */
function doLimLow(xmlNode: Element): string {
    const include = new Set(['m:e', 'm:lim']);
    const children = processChildrenForDict(xmlNode.children, include);
    const funcName = children['m:e'];
    if (typeof funcName !== 'string' || !LIM_FUNC[funcName]) {
        throw new Error(`지원되지 않는 극한함수(limit function)입니다: '${funcName}'!`);
    }
    return format(LIM_FUNC[funcName], children['m:lim']);
}

/**
 * 상한 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doLimUpp(xmlNode: Element): string {
    const include = new Set(['m:e', 'm:lim']);
    const children = processChildrenForDict(xmlNode.children, include);
    return format(LIM_UPP, children['m:lim'], children['m:e']);
}

/**
 * 극한 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doLim(xmlNode: Element): string {
    return processChildren(xmlNode.children).replace('\\rightarrow', '\\to');
}

/**
 * 행렬 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doM(xmlNode: Element): string {
    const rows = generateNodesInfo(xmlNode.children)
        .filter(info => info.tag === 'm:mr')
        .map(info => info.result);
    return `\\begin{matrix}${rows.join(BREAK)}\\end{matrix}`;
}

/**
 * 행렬 행 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doMr(xmlNode: Element): string {
    const include = new Set(['m:e']);
    return generateNodesInfo(xmlNode.children, include)
        .map(t => t.result)
        .join(ALIGN);
}

/**
 * n항 연산자 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doNary(xmlNode: Element): string {
    const res: string[] = [];
    let bigOper = '';

    for (const info of generateNodesInfo(xmlNode.children)) {
        if (info.tag === 'm:naryPr') {
            if (typeof info.result === 'string') continue;
            bigOper = getValue(info.result.getAttributeValue('m:chr'), null, BIG_OPERATORS);
            if (!bigOper) {
                bigOper = '\\int';
            }
        } else if (info.tag === 'm:e' && typeof info.result === 'string' && isComplexEquation(info.result)) {
            res.push(`{${info.result}}`);
        } else if (typeof info.result === 'string') {
            res.push(info.result);
        }
    }

    const val = res.join('');
    if (!val.startsWith('_') && !val.startsWith('^')) {
        bigOper += ' ';
    }

    return bigOper + val;
}

