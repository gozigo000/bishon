import { BREAK } from "./data";
import { NodeInfo } from "./OmmlConverter";
import { XElement } from "../2-lightParser/1-node/node";
import { isString } from "../../_utils/typeCheck";

export class XmlPropNode {

    private readonly text: string;
    private static readonly valTags = new Set(['m:sty', 'm:chr', 'm:pos', 'm:begChr', 'm:endChr', 'm:type']);
    /**
     * - 자식 태그 목록
     */
    private readonly innerTags: string[] = [];
    /**
     * - `key`: 자식 태그 이름
     * - `val`: 자식 태그의 `m:val` 속성 값
     */
    private readonly innerTagVals: Record<string, string | null> = {};


    constructor(xmlTag: XElement) {
        // 자기 자신의 속성 처리
        // - xmlTag에 포함된 속성은 XML 파싱할 때 처리되니 따로 처리할 필요 없을 듯
        // - 예를 들어, <m:A B="C"/> 태그에서 A 태그의 B 속성은 이미 처리됨

        // 자식 노드들의 속성 처리
        this.text = this.processChildren(xmlTag.childElems);
    }

    private processChildren(elem: XElement[]): string {
        const list: NodeInfo[] = this.generateNodesInfo(elem);
        if (list.length === 0) return '';
        let xmlStr = '';
        for (const t of list) {
            if (isString(t.result)) {
                xmlStr += t.result;
            }
        }
        return xmlStr;
    }

    /**
     * 자식 노드 리스트 처리
     * @param elems - 자식 노드들
     * @param include - 포함할 태그 목록 (선택적)
     * @returns `NodeInfo[]`
    */
    private generateNodesInfo(elems: XElement[]): NodeInfo[] {
        if (!elems) return [];
        
        const result: NodeInfo[] = [];
        for (const elem of elems) {
            const tagName = elem.tagName || '';
            const tagElm = this.processTag(elem);
            if (!tagElm) continue;

            result.push({ tag: tagName, result: tagElm });
        }
        return result;
    }

    private processTag(elem: XElement): string {
        switch (elem.tagName) {
            case 'w:b': 
            case 'w:i': 
            case 'w:bi': 
            case 'm:aln': {
                this.innerTags.push(elem.tagName);
                return '';
            }
            case 'm:brk': return this.doBrk();
            case 'm:chr':
            case 'm:pos':
            case 'm:begChr':
            case 'm:endChr':
            case 'm:type': 
            case 'm:sty': {
                return this.doCommon(elem);
            }
            default: return '';
        }
    }

    /**
     * 줄바꿈 태그 처리: <m:brk/>
     * @returns 줄바꿈 문자
     */
    private doBrk(): string {
        this.innerTagVals['m:brk'] = BREAK;
        return BREAK;
    }

    private doCommon(elem: XElement): string {
        const tagName = elem.tagName;
        if (XmlPropNode.valTags.has(tagName)) {
            this.innerTagVals[tagName] = elem.getAttrValue('m:val') ?? null;
        }
        return '';
    }

    public toString(): string {
        return this.text;
    }

    public hasInnerTag(name: string): boolean {
        return this.innerTags.includes(name);
    }
    
    /**
     * 속성 값 가져오기
     * @param xmlNode - 속성 값을 가져올 노드
     * @param name - 속성 이름
     * @returns 속성 값
     * @example
     * // XML 파일
     * <m:dPr>
     *   <m:begChr m:val="{"/>
     *  ...
     * </m:dPr>
     * // 호출
     * getAttributeValue(elm, 'm:begChr') -> '{'
     * getAttributeValue(elm, 'm:endChr') -> ''
     */
    public getAttributeValue(
        name: string
    ): string | null {
        if (name in this.innerTagVals) {
            return this.innerTagVals[name];
        }
        // return this.getAttributeValue(xmlNode, name);
        return null;
    }
} 