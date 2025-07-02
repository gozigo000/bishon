import { parseXml } from '../2-lightParser/entry';
import { XElement } from '../2-lightParser/1-node/node';
import { ACCENT_DEFAULT, ACCENTS, LATEX_SYMBOLS, BAR_DEFAULT, BAR, FRACTION_DEFAULT, FRACTION_TYPES, FUNC, BREAK, LIM_FUNC, ALIGN, BIG_OPERATORS } from './data';
import { getValue, getUnicodeString, escapeLatex } from './utils';
import { collectError, collectInfo } from '../0-utils/errorCollector';
import { collectLatex } from '../0-utils/dataCollector';

type Latex = string;

/**
 * OMML 문자열을 LaTeX 문자열로 변환
 * @param omml - 변환할 OMML 문자열
 * @returns 변환된 LaTeX 문자열
 */
export function fromOmmlToLatex(omml: string): string | null {
    try {
        const root = parseXml(omml);
        
        // oMathPara 처리
        const oMathPara = root.getElemByTag('m:oMathPara');
        if (oMathPara) {
            const latexStrs: string[] = [];
            for (const oMath of oMathPara.getElemsByTag('m:oMath')) {
                const latexStr = convertOMath(oMath);
                if (!latexStr) continue;
                latexStrs.push(latexStr);
            }
            
            if (latexStrs.length === 1) {
                const latex = latexStrs[0];
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
            const latex = convertOMath(oMath);
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

/**
 * <m:oMath> 태그를 LaTeX 문자열로 변환
 */
function convertOMath(oMath: XElement): Latex {
    let latexStr = processChildren(oMath)
    latexStr = latexStr
        .replace(/(?<!\\) }/g, '}')
        // .replace(/(\\\s+)+/g, '\\ ') // 연속된 공백(`\ `) 제거
        .replace(/([^\\]) \\/g, '$1\\')
        .trim();
    return latexStr;
}

/**
 * 자식 노드들을 LaTeX 문자열로 변환
 */
function processChildren(elem: XElement): Latex {
    return elem.childElems
        .map(processTag)
        .join('');
}

/**
 * 태그별 처리
 * @returns LaTeX (해당하는 태그가 없으면 빈 문자열)
 */
function processTag(elem: XElement): Latex {
    switch (elem.tagName) {
        // 그룹 1
        case 'm:acc': return doAccent(elem);
        case 'm:bar': return doBar(elem);
        case 'm:d': return doDelim(elem);
        case 'm:eqArr': return doEqArr(elem);
        case 'm:f': return doFraction(elem);
        case 'm:func': return doFunc(elem);
        case 'm:fName': return doFnName(elem);
        case 'm:groupChr': return doGroupChr(elem);
        case 'm:limLow': return doLimLow(elem);
        case 'm:limUpp': return doLimUpp(elem);
        case 'm:lim': return doLim(elem);
        case 'm:m': return doMat(elem);
        case 'm:mr': return doMatRow(elem);
        case 'm:nary': return doNary(elem);
        case 'm:r': return doRun(elem);
        case 'm:rad': return doRadical(elem);
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
        case 'm:sSubSup':
            return processChildren(elem);
        // 기타 태그
        default:
            return '';
    }
}

/**
 * <m:acc> 액센트 태그 처리
 */
function doAccent(elem: XElement): Latex {
    const e = elem.getElemByPath('m:e');
    if (!e) return '';

    const chr = elem.getAttrByPath('m:accPr > m:chr : m:val');
    const accent = getValue(chr, ACCENT_DEFAULT, ACCENTS);
    const eTex = processChildren(e);
    return `${accent}{${eTex}}`;
}

/**
 * <m:r> 런 태그 처리
 */
function doRun(elem: XElement): Latex {
    const t = elem.getElemByPath('m:t');
    if (!t) return '';

    const text = t.textContent;
    const isSpaces = t.getAttrValue('xml:space') === 'preserve';
    
    let ret = Array.from(text).map(ch => {
        if (isSpaces && ch === ' ') {
            return '\\ ';
        }
        const uni = getUnicodeString(ch);
        return LATEX_SYMBOLS[ch] || LATEX_SYMBOLS[uni] || ch;
    }).join('');

    if (elem.hasElem('m:rPr')) {
        const regex = /(?<=^|\s)([^\s\\]+?)(?=\s|\\|$)/g;
        switch (elem.getAttrByPath('m:rPr > m:sty : m:val')) {
            case 'b': ret = ret.replace(regex, '\\textbf{$1}'); break;
            case 'i': ret = ret.replace(regex, '\\textit{$1}'); break;
            case 'bi': ret = ret.replace(regex, '\\textbf{\\textit{$1}}'); break;
        }
        if (elem.getElemByPath('m:rPr > m:aln')) {
            ret = ALIGN + ret;
        }
    }

    return ret;
}

/**
 * <m:bar> 바 태그 처리
 */
function doBar(elem: XElement): Latex {
    const e = elem.getElemByPath('m:e');
    if (!e) return '';

    const br = elem.getElemByPath('m:barPr > m:brk') ? BREAK : ''
    const val = getValue(elem.getAttrByPath('m:barPr > m:pos : m:val'), BAR_DEFAULT, BAR);
    const eTex = processChildren(e);
    return br + `${val}{${eTex}}`;
}

/**
 * <m:d>: 구분자 (괄호 등) 처리
 */
function doDelim(elem: XElement): Latex {
    const e = elem.getElemByPath('m:e');
    if (!e) return '';

    // NOTE:
    // `<m:begChr />`인 경우에는 `defaultValue` 값을 사용하고,
    // `<m:begChr m:val=""/>`인 경우에는 `.` 값을 사용함
    const br = elem.getElemByPath('m:dPr > m:brk') ? BREAK : ''
    const begChr = getValue(elem.getAttrByPath('m:dPr > m:begChr : m:val'), '(', LATEX_SYMBOLS);
    const endChr = getValue(elem.getAttrByPath('m:dPr > m:endChr : m:val'), ')', LATEX_SYMBOLS);
    const left = begChr ? escapeLatex(begChr) : '.';
    const right = endChr ? escapeLatex(endChr) : '.';
    const eTex = processChildren(e);
    return br + `\\left${left}${eTex}\\right${right}`;
}

/**
 * 아래 첨자 처리
 */
function doSub(elem: XElement): Latex {
    const val = processChildren(elem);
    return val ? `_{${val}}` : '';
}

/**
 * 위 첨자 처리
 */
function doSup(elem: XElement): Latex {
    const val = processChildren(elem);
    return val ? `^{${val}}` : '';
}

/**
 * <m:f> 분수 태그 처리
 */
function doFraction(elem: XElement): Latex {
    const type = elem.getAttrByPath('m:fPr > m:type : m:val');
    const num = elem.getElemByPath('m:num');
    const den = elem.getElemByPath('m:den');
    if (!num || !den) return '';

    const br = elem.getElemByPath('m:fPr > m:brk') ? BREAK : ''
    const fracType = getValue(type, FRACTION_DEFAULT, FRACTION_TYPES);
    const numTex = processChildren(num);
    const denTex = processChildren(den);
    return br + fracType.replace('{num}', numTex).replace('{den}', denTex);
}

/**
 * <m:func> 함수 태그 처리
 */
function doFunc(elem: XElement): Latex {
    const fnName = elem.getElemByPath('m:fName');
    const e = elem.getElemByPath('m:e');
    if (!fnName || !e) return '';

    const fnNameTex = doFnName(fnName);
    const eTex = processChildren(e);
    return fnNameTex + eTex;
}

/**
 * <m:fName> 함수 이름 태그 처리
 */
function doFnName(elem: XElement): Latex {
    const fnName = processChildren(elem);
    const cleanFnName = fnName.split('^{')[0].split('_{')[0];
    const fnSymbol = FUNC[cleanFnName];

    if (!fnSymbol) {
        collectInfo(`함수심볼목록(FUNC)에 없는 함수: '${fnName}'`);
    }
    
    return fnSymbol ? fnName.replace(cleanFnName, fnSymbol) : fnName;
}

/**
 * <m:groupChr> 그룹 문자 태그 처리
 */
function doGroupChr(elem: XElement): Latex {
    const e = elem.getElemByPath('m:e');
    if (!e) return '';

    const br = elem.getElemByPath('m:groupChrPr > m:brk') ? BREAK : ''
    const groupChr = getValue(elem.getAttrByPath('m:groupChrPr > m:chr : m:val'), '', ACCENTS);
    const eTex = processChildren(e);
    return br + `${groupChr}{${eTex}}`;
}

/**
 * <m:rad> 근호 태그 처리
 */
function doRadical(elem: XElement): Latex {
    const deg = elem.getElemByPath('m:deg');
    const e = elem.getElemByPath('m:e');
    if (!deg || !e) return '';

    const degTex = processChildren(deg);
    const eTex = processChildren(e);

    if (degTex.length > 0) {
        return `\\sqrt[${degTex}]{${eTex}}`;
    }
    return `\\sqrt{${eTex}}`;
}

/**
 * <m:eqArr> 배열 태그 처리
 */
function doEqArr(elem: XElement): Latex {
    const es = elem.getChildElemsByTag('m:e');
    const eTex = es.map(processChildren).join(BREAK);
    return `\\begin{array}{c}${eTex}\\end{array}`;
}

/**
 * <m:limLow> 하한 태그 처리
 */
function doLimLow(elem: XElement): Latex {
    const e = elem.getElemByPath('m:e');
    const lim = elem.getElemByPath('m:lim');
    if (!e || !lim) return '';

    const fnName = processChildren(e);
    const limTex = doLim(lim);
    if (LIM_FUNC[fnName]) {
        return `${LIM_FUNC[fnName]}_{${limTex}}`;
    } else {
        // latex 심볼이 없는 극한함수는 아래처럼 처리하기로 함
        return `\\underset{${limTex}}{\\mathrm{${fnName}}}`; // \\operatorname{}`; \\operatorname*{}`;
    }
}

/**
 * <m:limUpp> 상한 태그 처리
 */
function doLimUpp(elem: XElement): Latex {
    const lim = elem.getElemByPath('m:lim');
    const e = elem.getElemByPath('m:e');
    if (!lim || !e) return '';

    const limTex = doLim(lim);
    const eTex = processChildren(e);
    return `\\overset{${limTex}}{${eTex}}`;
}

/**
 * <m:lim> 극한 태그 처리
 */
function doLim(elem: XElement): Latex {
    const limTex = processChildren(elem);
    return limTex.replace('\\rightarrow', '\\to');
}

/**
 * <m:m> 행렬 태그 처리
 */
function doMat(elem: XElement): Latex {
    const mr = elem.getChildElemsByTag('m:mr');
    const rows = mr.map(m => doMatRow(m)).join(BREAK);
    return `\\begin{matrix}${rows}\\end{matrix}`;
}

/**
 * <m:mr> 행렬 행 태그 처리
 */
function doMatRow(elem: XElement): Latex {
    const es = elem.getChildElemsByTag('m:e');
    const eTex = es.map(processChildren).join(ALIGN);
    return eTex;
}

/**
 * <m:nary> n항(n-ary) 연산자 태그 처리
 */
function doNary(elem: XElement): Latex {
    const sub = elem.getElemByPath('m:sub');
    const sup = elem.getElemByPath('m:sup');
    const e = elem.getElemByPath('m:e');
    if (!e) return '';

    const bigOper = getValue(elem.getAttrByPath('m:naryPr > m:chr : m:val'), '\\int', BIG_OPERATORS);
    const subTex = sub ? doSub(sub) : '';
    const supTex = sup ? doSup(sup) : '';
    const eTex = processChildren(e);

    return bigOper + subTex + supTex + `{${eTex}}`;
}
