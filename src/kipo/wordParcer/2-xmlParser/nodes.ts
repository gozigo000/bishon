import { collectWarning } from "@/kipo/0-utils/errorCollector";

export class ONode {
    type: ONodeType;
    name: string = '';
    attributes: Record<string, string> = {};
    children: ONode[] = [];
    ooxml: string = '';
    text: string = '';

    constructor(name?: string, text?: string)
    constructor(name?: string, attributes?: Record<string, string>, children?: ONode[], ooxml?: string)
    constructor(name?: string, attrOrText?: string | Record<string, string>, children?: ONode[], ooxml?: string) {
        if (typeof attrOrText === "string") {
            this.type = "text";
            this.text = attrOrText || '';
        } else {
            this.type = name ? "element" : "empty";
            this.name = name || ''; // ooxml 태그명
            this.attributes = attrOrText || {};
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
            collectWarning("(Not implemented) 트리 구조에 오류가 있을 수도 있음");
            return ""
        }
        return this.children[0].text;
    }
}

export const emptyONode = new ONode();
