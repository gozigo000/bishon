
export class DocxPropNode {
    private static readonly valTags = new Set(['w:vertAlign']);
    /**
     * - 자식 태그 목록
     */
    private readonly innerList: string[] = [];
    /**
     * - `key`: 자식 태그 이름
     * - `val`: 자식 태그의 `w:val` 속성 값
     */
    private readonly innerDict: Record<string, string | null> = {};


    constructor(oNode: Element) {
        // 자기 자신의 속성 처리
        // - xmlTag에 포함된 속성은 XML 파싱할 때 처리되니 따로 처리할 필요 없을 듯
        // - 예를 들어, <m:A B="C"/> 태그에서 A 태그의 B 속성은 이미 처리됨

        // 자식 노드들의 속성 처리
        for (const child of oNode.children) {
            this.processTag(child);
        }
    }

    private processTag(oNode: Element): void {
        switch (oNode.tagName) {
            case 'w:b': 
            case 'w:i': 
            case 'w:u': {
                this.innerList.push(oNode.tagName);
                return;
            }
            case 'w:vertAlign': {
                const tagName = oNode.tagName;
                if (!DocxPropNode.valTags.has(tagName)) return;
                this.innerDict[tagName] = oNode.getAttribute('w:val');
                return;
            }
            default: return;
        }
    }

    /**
     * 속성 값 가져오기
     * @example
     * // XML 파일
     * <m:dPr>
     *   <m:begChr w:val="{"/>
     *   ...
     * </m:dPr>
     * // 호출
     * elm.getAttributeValue('m:begChr') -> "{"
     * elm.getAttributeValue('m:endChr') -> ""
     */
    public getAttributeValue(attr: string): string | null {
        if (attr in this.innerDict) {
            return this.innerDict[attr];
        }
        // return this.getAttributeValue(xmlNode, attr);
        return null;
    }

    public hasAttribute(attr: string): boolean {
        if (attr in this.innerDict) {
            return true;
        }
        if (this.innerList.includes(attr)) {
            return true;
        }
        return false;
    }
} 