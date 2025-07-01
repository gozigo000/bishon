import { BREAK } from "./data";
import { XElement } from "../2-lightParser/1-node/node";

const valTags = new Set(['m:sty', 'm:chr', 'm:pos', 'm:begChr', 'm:endChr', 'm:type']);

export class PropNode {
    public text: string = '';
    /**
     * - 자식 태그 목록
     */
    private tags: Set<string> = new Set();
    /**
     * - `key`: 자식 태그 이름
     * - `val`: 자식 태그의 `m:val` 속성 값
     */
    private tagVals: Record<string, string | null> = {};

    constructor(elem: XElement) {
        // 자기 자신의 속성 처리
        // - xmlTag에 포함된 속성은 XML 파싱할 때 처리되니 따로 처리할 필요 없을 듯
        // - 예를 들어, <m:A B="C"/> 태그에서 A 태그의 B 속성은 이미 처리됨

        // 자식 노드들의 속성 처리
        for (const child of elem.childElems) {
            this.processTag(child);
        }
    }

    private processTag(elem: XElement) {
        switch (elem.tagName) {
            case 'w:b':
            case 'w:i':
            case 'w:bi':
            case 'm:aln':
                this.tags.add(elem.tagName);
                break;
            case 'm:chr':
            case 'm:pos':
            case 'm:begChr':
            case 'm:endChr':
            case 'm:type':
            case 'm:sty':
                if (valTags.has(elem.tagName)) {
                    this.tagVals[elem.tagName] = elem.getAttrValue('m:val') ?? null;
                }
                break;
            case 'm:brk':
                this.tagVals['m:brk'] = BREAK;
                this.text += BREAK;
                break;
            default:
                break;
        }
    }

    public hasTag(name: string): boolean {
        return this.tags.has(name);
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
    public getAttributeValue(name: string): string | null {
        if (name in this.tagVals) {
            return this.tagVals[name];
        }
        // return this.getAttributeValue(xmlNode, name);
        return null;
    }
} 