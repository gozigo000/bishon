import { escapeLatex, format, getUnicodeString, getValue, isComplexEquation } from "./utils";
import { POS_DEFAULT, ALN, BRK, ch2Latex, CHR, CHR_DEFAULT, F, F_DEFAULT, FUNC, FUNC_PLACE, LIM_FUNC, LIM_TO, LIM_UPP, M, OMML_NS, RAD, RAD_DEFAULT, D_DEFAULT, T, D, SUP, SUB, ARR, CHR_BO } from "./data";
import { XmlPropNode } from "./XmlPropNode";

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
export function convertMoMath(oMath: Element): string {
    const latexStr = processChildren(oMath.children)
        .replace(/ }/g, '}')
        .replace(/(\\\s+)+/g, '\\ ')
        .replace(/([^\\]) \\/g, '$1\\');
    return latexStr;
}

/**
 * 자식 노드들을 처리하고 결과를 LaTeX 문자열로 반환
 * @param xmlNodes - 자식 XML 노드들
 * @param include - 포함할 태그 목록 (선택적)
 * @returns LaTeX 문자열
 */
export function processChildren(xmlNodes: HTMLCollection, include?: Set<string>): string {
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
    const latexStr = getValue(pr.getAttributeValue('m:chr'), CHR_DEFAULT['ACC_VAL'], CHR);
    return format(latexStr, children['m:e']);
}

/**
 * Run: 런 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doR(xmlNode: Element): string {
    const tNode = xmlNode.getElementsByTagName('m:t')[0] || null;
    if (!tNode) return '';

    const isSpaces = tNode.getAttribute('xml:space') === 'preserve';
    const chars = Array.from(tNode.textContent || '');
    let result = chars.map(ch => {
        if (isSpaces && ch === ' ') {
            return '\\ ';
        }
        const uni = getUnicodeString(ch);
        return T[uni] || ch;
    }).join('');

    // 볼드체, 이텔릭체 처리
    const children = processChildrenForDict(xmlNode.children)
    const mrPr = children['m:rPr'];
    if (mrPr instanceof XmlPropNode) {
        const regex = /(?<=^|\s)([^\s\\]+?)(?=\s|\\|$)/g;
        switch (mrPr.getAttributeValue('m:sty')) {
            case 'b': result = result.replace(regex, '\\textbf{$1}'); break;
            case 'i': result = result.replace(regex, '\\textit{$1}'); break;
            case 'bi': result = result.replace(regex, '\\textbf{\\textit{$1}}'); break;
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
    const latexStr = getValue(pr.getAttributeValue('m:pos'), POS_DEFAULT['BAR_VAL'], ch2Latex);
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

    const nullVal = D_DEFAULT['null'];
    const begChr = getValue(dPr.getAttributeValue('m:begChr'), D_DEFAULT['left'], T);
    const endChr = getValue(dPr.getAttributeValue('m:endChr'), D_DEFAULT['right'], T);
    const left = begChr ? escapeLatex(begChr) : nullVal;
    const right = endChr ? escapeLatex(endChr) : nullVal;
    const text = children['m:e'];
    // HACK: 아래와 같은 형태로 보기 쉽게 바꿀까?
    // return pr + `\\left${left}${text}\\right${right}`;
    return (dPr ? dPr : '') + format(D, left, text, right);
}

/**
 * 아래 첨자 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doSub(xmlNode: Element): string {
    const val = processChildren(xmlNode.children);
    return val ? format(SUB, val) : '';
}

/**
 * 위 첨자 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doSup(xmlNode: Element): string {
    const val = processChildren(xmlNode.children);
    return val ? format(SUP, val) : '';
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
    const frac = getValue(pr.getAttributeValue('m:type'), F_DEFAULT, F);
    return (pr ? pr : '') + format(frac, children['m:num'], children['m:den']);
}

/**
 * 함수 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doFunc(xmlNode: Element): string {
    const children = processChildrenForDict(xmlNode.children);
    const funcName = children['m:fName'];
    const e = children['m:e'];
    if (typeof funcName !== 'string' || typeof e !== 'string') return '';
    return funcName.replace(FUNC_PLACE, e);
}

/**
 * 함수 이름 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 * @throws Error - 지원하지 않는 함수인 경우
 */
function doFName(xmlNode: Element): string {
    const latexFuncNames: string[] = [];
    for (const info of generateNodesInfo(xmlNode.children)) {
        const fkey = info.result;
        if (info.tag === 'm:r') {
            if (typeof fkey === 'string' && FUNC[fkey]) {
                latexFuncNames.push(FUNC[fkey]);
            } else {
                throw new Error(`Not supported func '${fkey}'!`);
            }
        } else if (typeof fkey === 'string') {
            latexFuncNames.push(fkey);
        }
    }
    const funcNames = latexFuncNames.join('');
    return funcNames.includes(FUNC_PLACE) ? funcNames : funcNames + FUNC_PLACE;
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
        return format(RAD, children['m:deg'], children['m:e']);
    }
    return format(RAD_DEFAULT, children['m:e']);
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
        .join(BRK);
    return format(ARR, text);
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
        throw new Error(`Not supported lim function: '${funcName}'!`);
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
    return processChildren(xmlNode.children).replace(LIM_TO[0], LIM_TO[1]);
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
    return format(M, rows.join(BRK));
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
        .join(ALN);
}

/**
 * n항 연산자 처리
 * @param xmlNode - XML 노드
 * @returns LaTeX 문자열
 */
function doNary(xmlNode: Element): string {
    const res: string[] = [];
    let bo = '';

    for (const info of generateNodesInfo(xmlNode.children)) {
        if (info.tag === 'm:naryPr') {
            if (typeof info.result === 'string') continue;
            bo = getValue(info.result.getAttributeValue('m:chr'), null, CHR_BO);
            if (!bo) {
                bo = '\\int';
            }
        } else if (info.tag === 'm:e' && typeof info.result === 'string' && isComplexEquation(info.result)) {
            res.push(`{${info.result}}`);
        } else if (typeof info.result === 'string') {
            res.push(info.result);
        }
    }

    const val = res.join('');
    if (!val.startsWith('_') && !val.startsWith('^')) {
        bo += ' ';
    }

    return bo + val;
}
