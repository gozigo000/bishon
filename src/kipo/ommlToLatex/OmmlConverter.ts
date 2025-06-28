import { parseXml } from '../2-lightParser/entry';
import { XElement } from '../2-lightParser/1-node/node';
import { ACCENT_DEFAULT, ACCENTS, LATEX_SYMBOLS, BAR_DEFAULT, BAR, FRACTION_DEFAULT, FRACTION_TYPES, FUNC, BREAK, LIM_FUNC, LIM_UPP, ALIGN, BIG_OPERATORS } from './data';
import { getValue, format, getUnicodeString, escapeLatex, isComplexEquation } from './utils';
import { XmlPropNode } from './XmlPropNode';
import { collectError, collectWarning } from '../0-utils/errorCollector';
import { collectLatex } from '../0-utils/dataCollector';
import { isString } from '../0-utils/typeCheck';

/**
 * OMML 문자열을 LaTeX 문자열로 변환
 * @param omml - 변환할 OMML 문자열
 * @returns 변환된 LaTeX 문자열
 */
export function makeLatexFromOmml(omml: string): string | null {
    try {
        const root = parseXml(omml);
        
        // oMathPara 처리
        const oMathPara = root.getElemByTag('m:oMathPara');
        if (oMathPara) {
            const latexStrs: string[] = [];
            for (const oMath of oMathPara.getElemsByTag('m:oMath')) {
                const latexStr = convertMoMath(oMath);
                if (!latexStr) continue;
                latexStrs.push(latexStr);
            }
            
            if (latexStrs.length === 1) {
                const latex = latexStrs[0].trim();
                collectLatex({ latex, omml });
                return latex;
            }
            if (latexStrs.length > 1) {
                const latex = `\\begin{align}${latexStrs.join(BREAK)}\\end{align}`;
                collectLatex({ latex, omml });
                return latex;
            }
        }

        // oMath 처리
        const oMath = root.getElemByTag('m:oMath');
        if (oMath) {
            const latexStr = convertMoMath(oMath);
            const latex = latexStr.trim();
            collectLatex({ latex, omml });
            return latex;
        }

        collectError('<m:oMath> 또는 <m:oMathPara> 노드가 없습니다.');
        return null;
    } catch (error) {
        collectError('OMML > LaTeX 변환 실패', error as Error, omml);
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
function convertMoMath(oMath: XElement): string {
    // ommlStr = ommlStr
    //     .replaceAll(' ', ' ')
    //     .replaceAll('＝', '=')
    let latexStr = processChildren(oMath.childElems)
    latexStr = latexStr
        .replace(/(?<!\\) }/g, '}')
        .replace(/(\\\s+)+/g, '\\ ') // 연속된 공백(`\ `) 제거
        .replace(/([^\\]) \\/g, '$1\\')
    return latexStr;
}

/**
 * 자식 노드들을 처리하고 결과를 LaTeX 문자열로 반환
 * @param elems - 자식 XML 노드들
 * @param include - 포함할 태그 목록 (선택적)
 * @returns LaTeX 문자열
 */
function processChildren(elems: XElement[], include?: Set<string>): string {
    const nodesInfo = generateNodesInfo(elems, include);
    if (nodesInfo.length === 0) return '';

    let latexStr = '';
    for (const info of nodesInfo) {
        if (isString(info.result)) {
            latexStr += info.result;
        }
    }
    return latexStr;
}

/**
 * 자식 노드들을 {태그명: 처리결과} 형태의 딕셔너리로 처리
 * @param elems - 자식 노드들
 * @param include - 포함할 태그 목록 (선택적)
 * @returns 태그별 처리된 노드 딕셔너리
 */
function processChildrenForDict(elems: XElement[], include?: Set<string>): Record<string, string | XmlPropNode> {
    const nodesInfo = generateNodesInfo(elems, include);
    const latexChars: Record<string, string | XmlPropNode> = {};
    for (const info of nodesInfo) {
        latexChars[info.tag] = info.result;
    }
    return latexChars;
}

/**
 * 자식 노드 리스트 처리
 * @param elems - 자식 노드들
 * @param include - 포함할 태그 목록 (선택적)
 * @returns `{태그명: 처리결과}[]`
 */
function generateNodesInfo(elems: XElement[], include?: Set<string>): NodeInfo[] {
    const nodesInfo: NodeInfo[] = [];
    for (const elem of elems) {
        const tagName = elem.tagName || '';
        if (include && !include.has(tagName)) continue;

        let result: string | XmlPropNode = processTag(elem);
        if (tagName.endsWith('Pr')) {
            result = new XmlPropNode(elem);
        }
        if (!result) continue;

        nodesInfo.push({ tag: tagName, result: result });
    }
    return nodesInfo;
}

/**
 * 태그별 처리
 * @returns LaTeX 문자열 (@exception 해당하는 노드가 없으면 빈 문자열)
 */
function processTag(elem: XElement): string {
    switch (elem.tagName) {
        // 그룹 1
        case 'm:acc': return doAcc(elem);
        case 'm:bar': return doBar(elem);
        case 'm:d': return doD(elem);
        case 'm:eqArr': return doEqArr(elem);
        case 'm:f': return doF(elem);
        case 'm:fName': return doFName(elem);
        case 'm:func': return doFunc(elem);
        case 'm:groupChr': return doGroupChr(elem);
        case 'm:limLow': return doLimLow(elem);
        case 'm:limUpp': return doLimUpp(elem);
        case 'm:lim': return doLim(elem);
        case 'm:m': return doM(elem);
        case 'm:mr': return doMr(elem);
        case 'm:nary': return doNary(elem);
        case 'm:r': return doR(elem);
        case 'm:rad': return doRad(elem);
        case 'm:sub': return doSub(elem);
        case 'm:sup': return doSup(elem);
        // 그룹 2 - 기존 패키지에서 directTags라고 이름 붙였던 것
        case 'm:box':
        case 'm:den':
        case 'm:deg':
        case 'm:e':
        case 'm:num':
        case 'm:sSub':
        case 'm:sSup':
        case 'm:sSubSup': {
            return processChildren(elem.childElems);
        }
        // 기타 태그
        default: return '';
    }
}

/**
 * 액센트 처리
 * @returns LaTeX 문자열
 */
function doAcc(elem: XElement): string {
    const children = processChildrenForDict(elem.childElems);
    const pr = children['m:accPr'];
    if (isString(pr)) return '';
    const accent = getValue(pr.getAttributeValue('m:chr'), ACCENT_DEFAULT, ACCENTS);
    return format(accent, children['m:e']);
}

/**
 * Run: 런 처리
 * @returns LaTeX 문자열
 */
function doR(elem: XElement): string {
    const tNode = elem.getElemByTag('m:t');
    if (!tNode) return '';

    const text = tNode.textContent;
    const isSpaces = tNode.getAttrValue('xml:space') === 'preserve';
    let result = Array.from(text).map(ch => {
        if (isSpaces && ch === ' ') {
            return '\\ ';
        }
        const uni = getUnicodeString(ch);
        return LATEX_SYMBOLS[ch] || LATEX_SYMBOLS[uni] || ch;
    }).join('');

    const children = processChildrenForDict(elem.childElems);
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
 * @returns LaTeX 문자열
 */
function doBar(elem: XElement): string {
    const children = processChildrenForDict(elem.childElems);
    const pr = children['m:barPr'];
    if (isString(pr)) return '';
    const latexStr = getValue(pr.getAttributeValue('m:pos'), BAR_DEFAULT, BAR);
    return pr + format(latexStr, children['m:e']);
}

/**
 * Delimiter: 구분자 (괄호 등) 처리
 * @returns LaTeX 문자열
 */
function doD(elem: XElement): string {
    const children = processChildrenForDict(elem.childElems);

    // HACK: <m:dPr> 태그 처리하는 부분이 구현되어 있지 않음.
    // 이로 인해 결과물에 'undefined' 문자열이 포함되고 있음.
    // 우선은 리턴 값에 'pr + ' 대신 (pr ? pr : '') + 를 사용하여 해결함.
    // - OOXML 문서: 22.1.2.31 dPr (Delimiter Properties)
    const dPr = children['m:dPr'];
    if (isString(dPr)) return '';

    // NOTE: `nullVal` vs `defaultValue`
    // `<m:begChr />`인 경우에는 `defaultValue` 값을 사용하고,
    // `<m:begChr m:val=""/>`인 경우에는 `nullVal` 값을 사용함
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
 * @returns LaTeX 문자열
 */
function doSub(elem: XElement): string {
    const val = processChildren(elem.childElems);
    return val ? `_{${val}}` : '';
}

/**
 * 위 첨자 처리
 * @returns LaTeX 문자열
 */
function doSup(elem: XElement): string {
    const val = processChildren(elem.childElems);
    return val ? `^{${val}}` : '';
}

/**
 * 분수 처리
 * @returns LaTeX 문자열
 */
function doF(elem: XElement): string {
    const children = processChildrenForDict(elem.childElems);

    // HACK: <m:fPr> 태그 처리하는 부분이 구현되어 있지 않음.
    // 이로 인해 결과물에 'undefined' 문자열이 포함되고 있음.
    // 우선은 리턴 값에 'pr + ' 대신 (pr ? pr : '') + 를 사용하여 해결함.
    // doD() 메서드도 동일한 문제점을 가짐.
    // - OOXML 문서: 22.1.2.38 fPr (Fraction Properties)
    const pr = children['m:fPr'];
    if (isString(pr)) return '';
    const frac = getValue(pr.getAttributeValue('m:type'), FRACTION_DEFAULT, FRACTION_TYPES);
    return (pr ? pr : '') + format(frac, children['m:num'], children['m:den']);
}

/**
 * 함수 처리
 * @returns LaTeX 문자열
 */
function doFunc(elem: XElement): string {
    const children = processChildrenForDict(elem.childElems);
    const fnName = children['m:fName'];
    const e = children['m:e'];
    if (!isString(fnName) || !isString(e)) return '';
    return fnName + e;
}

/**
 * 함수 이름 처리
 * @returns LaTeX 문자열
 */
function doFName(elem: XElement): string {
    let fnName: string = '';
    let isR: boolean = false;
    for (const info of generateNodesInfo(elem.childElems)) {
        const res = info.result;
        if (isString(res)) {
            if (info.tag === 'm:r') isR = true;
            fnName += res;
        }
    }
    const cleanFnName = fnName.split('^{')[0].split('_{')[0];
    const fnSymbol = FUNC[cleanFnName];
    if (isR && !fnSymbol) {
        collectWarning(`함수목록(FUNC)에 없는 함수입니다: '${fnName}'`);
    }
    return fnSymbol ? fnName.replace(cleanFnName, fnSymbol) : fnName;
}

/**
 * 그룹 문자 처리
 * @returns LaTeX 문자열
 */
function doGroupChr(elem: XElement): string {
    const children = processChildrenForDict(elem.childElems);
    const pr = children['m:groupChrPr'];
    if (isString(pr)) return '';
    const chr = getValue(pr.getAttributeValue('m:chr'));
    return pr + format(chr, children['m:e']);
}

/**
 * 근호 처리
 * @returns LaTeX 문자열
 */
function doRad(elem: XElement): string {
    const children = processChildrenForDict(elem.childElems);
    if (children['m:deg'] && isString(children['m:deg']) && children['m:deg'].length > 0) {
        return `\\sqrt[${children['m:deg']}]{${children['m:e']}}`;
    }
    return `\\sqrt{${children['m:e']}}`;
}

/**
 * 배열 처리
 * @returns LaTeX 문자열
 */
function doEqArr(elem: XElement): string {
    const include = new Set(['m:e']);
    const text = generateNodesInfo(elem.childElems, include)
        .map(t => t.result)
        .join(BREAK);
    return `\\begin{array}{c}${text}\\end{array}`;
}

/**
 * 하한 처리
 * @returns LaTeX 문자열
 */
function doLimLow(elem: XElement): string {
    const include = new Set(['m:e', 'm:lim']);
    const children = processChildrenForDict(elem.childElems, include);
    const funcName = children['m:e'];
    if (!isString(funcName) || !LIM_FUNC[funcName]) {
        collectError(`지원되지 않는 극한함수(limit function)입니다: '${funcName}'!`);
        return `${funcName}_{${children['m:lim']}}`;
    }
    return format(LIM_FUNC[funcName], children['m:lim']);
}

/**
 * 상한 처리
 * @returns LaTeX 문자열
 */
function doLimUpp(elem: XElement): string {
    const include = new Set(['m:e', 'm:lim']);
    const children = processChildrenForDict(elem.childElems, include);
    return format(LIM_UPP, children['m:lim'], children['m:e']);
}

/**
 * 극한 처리
 * @returns LaTeX 문자열
 */
function doLim(elem: XElement): string {
    return processChildren(elem.childElems).replace('\\rightarrow', '\\to');
}

/**
 * 행렬 처리
 * @returns LaTeX 문자열
 */
function doM(elem: XElement): string {
    const rows = generateNodesInfo(elem.childElems)
        .filter(info => info.tag === 'm:mr')
        .map(info => info.result)
        .join(BREAK);
    return `\\begin{matrix}${rows}\\end{matrix}`;
}

/**
 * 행렬 행 처리
 * @returns LaTeX 문자열
 */
function doMr(elem: XElement): string {
    const include = new Set(['m:e']);
    return generateNodesInfo(elem.childElems, include)
        .map(t => t.result)
        .join(ALIGN);
}

/**
 * n항 연산자 처리
 * @returns LaTeX 문자열
 */
function doNary(elem: XElement): string {
    const res: string[] = [];
    let bigOper = '';

    for (const info of generateNodesInfo(elem.childElems)) {
        if (info.tag === 'm:naryPr') {
            if (isString(info.result)) continue;
            bigOper = getValue(info.result.getAttributeValue('m:chr'), null, BIG_OPERATORS);
            if (!bigOper) {
                bigOper = '\\int';
            }
        } else if (info.tag === 'm:e' && isString(info.result) && isComplexEquation(info.result)) {
            res.push(`{${info.result}}`);
        } else if (isString(info.result)) {
            res.push(info.result);
        }
    }

    const val = res.join('');
    if (!val.startsWith('_') && !val.startsWith('^')) {
        bigOper += ' ';
    }

    return bigOper + val;
}
