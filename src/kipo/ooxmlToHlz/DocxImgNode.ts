/**
 * docx 내 이미지 태그 (<w:drawing>, <w:pict>)
 * @note 
 * <w:drawing> 태그는 <w:r> 태그 내에만 위치함.
 * - 17.3.3.9 drawing (DrawingML Object)
 * - 20.4.2.8 inline (Inline DrawingML Object)
 * @note 
 * 각 노드는 동일한 종류의 자식 태그를 가지지 않는다고 가정함. \
 * 예를 들어, <w:p> 태그 같은 경우 여러 개의 <w:r> 태그를 가지는데, \
 * 이 경우 각각의 <w:r> 태그 내 <w:rPr> 태그들은 하나만 반영됨. \
 * 따라서, 동일한 종류의 자식 태그를 갖지 않는 노드만 여기서 처리해야 \
 * 부작용이 없을 듯 함.
 */
export class DocxImgNode {
    private static readonly valTags = new Set(['wp:extent']);
    /**
     * 자신의 속성들
     */
    private readonly props: Record<string, string> = {};
    /**
     * `key`: 자식 태그 이름 \
     * `val`: 자식 태그
     */
    private readonly children: Record<string, DocxImgNode> = {};


    constructor(oNode: Element) {
        // 자기 자신의 속성 처리
        for (const attr of oNode.attributes) {
            const name = attr.name;
            const value = attr.value;
            // 길이 단위를 EMU에서 mm로 변환 (1 EMU = 1 / 36000 mm)
            if (name === 'cx' || name === 'cy') {
                const num = Number(value) / 36000;
                this.props[name] = Math.floor(num).toString();
                continue;
            }
            // 길이 단위를 pt에서 mm로 변환 (1 pt = 254 / 720 mm)
            if (name === 'style') {
                if (value.includes('width:')) {
                    const val = Number(value.split('width:')[1].split('pt')[0]);
                    const width = val * 254 / 720;
                    this.props['style-width'] = Math.floor(width).toString();
                }
                if (value.includes('height:')) {
                    const val = Number(value.split('height:')[1].split('pt')[0]);
                    const height = val * 254 / 720;
                    this.props['style-height'] = Math.floor(height).toString();
                }
                continue;
            }
            this.props[name] = value;
        }
        // 자식 노드들의 속성 처리
        for (const child of oNode.children) {
            const childNode = new DocxImgNode(child);
            this.children[child.tagName] = childNode;
        }
    }

    /**
     * 자식 노드 존재 여부 확인
     * @param attr 자식 노드 이름
     */
    public hasChild(attr: string): boolean {
        if (attr in this.children) {
            return true;
        }
        return false;
    }

    /**
     * 자손 노드 존재 여부 확인
     * @param attr 자손 노드 이름
     */
    public hasChildInFamily(attr: string): boolean {
        if (this.hasChild(attr)) {
            return true;
        }
        for (const child of Object.values(this.children)) {
            if (child.hasChildInFamily(attr)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 자기에게 속성이 존재하는지 확인
     * @param attr 속성 이름
     */
    public hasAttribute(attr: string): boolean {
        if (attr in this.props) {
            return true;
        }
        return false;
    }

    /**
     * 자기 자신 또는 자식 노드들에 속성이 존재하는지 확인
     * @param attr 속성 이름
     */
    public hasAttributeInFamily(attr: string): boolean {
        if (this.hasAttribute(attr)) {
            return true;
        }
        for (const child of Object.values(this.children)) {
            if (child.hasAttributeInFamily(attr)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 자기에 존재하는 속성의 속성성 값 가져오기
     */
    public getAttributeValue(attr: string): string | undefined {
        if (this.hasAttribute(attr)) {
            return this.props[attr];
        }
        return undefined;
    }

    /**
     * 자기 자신 또는 자식 노드들에 존재하는 속성의 속성 값 가져오기
     * @example
     * // XML 파일
     * <m:dPr>
     *   <m:begChr w:val="{"/>
     *   ...
     * </m:dPr>
     * // 호출
     * dPr.getAttributeValueInFamily('w:val') -> "{"
     */
    public getAttributeValueInFamily(attr: string): string | undefined {
        if (this.hasAttribute(attr)) {
            return this.props[attr];
        }
        for (const child of Object.values(this.children)) {
            const val = child.getAttributeValueInFamily(attr);
            if (val) {
                return val;
            }
        }
        return undefined;
    }
} 