
export class ONode {
    type: ONodeType;
    name: string = '';
    attributes: Record<string, string> = {};
    children: ONode[] = [];
    ooxml: string = '';
    text: string = '';

    constructor(name?: string, attributes?: string)
    constructor(name?: string, attributes?: Record<string, string>, children?: ONode[], ooxml?: string)
    constructor(name?: string, attributes?: string | Record<string, string>, children?: ONode[], ooxml?: string) {
        if (typeof attributes === "string") {
            this.type = "text";
            this.text = attributes || '';
        } else {
            this.type = name ? "element" : "empty";
            this.name = name || ''; // ooxml 태그명
            this.attributes = attributes || {};
            this.children = children || [];
            this.ooxml = ooxml || '';
        }
    }

    /** 태그명이 name인 자식 요소 중 첫번째 요소 반환 */
    getFirst(name: string): ONode | undefined {
        return this.children
            .filter(child => child instanceof ONode)
            .find(child => child.name === name);
    }

    /** 태그명이 name인 자식 요소 중 첫번째 요소 반환, 없으면 emptyONode 반환 */
    getFirstOrEmpty(name: string): ONode {
        return this.getFirst(name) || emptyONode;
    }

    /** 태그명이 name인 자식 요소 모두 반환 (recursive) */
    getElementsByTagName(name: string): ONode[] {
        const elems: ONode[] = [];
        for (const child of this.children) {
            if (child.name === name) {
                elems.push(child);
            }
            elems.push(...child.getElementsByTagName(name));
        }
        return elems;
    }

    /** 텍스트 반환 */
    getText(): string {
        if (this.children.length === 0) {
            return "";
        } else if (this.children.length !== 1 || this.children[0].type !== "text") {
            throw new Error("Not implemented");
        }
        return this.children[0].text;
    }
}

export const emptyONode = new ONode();
