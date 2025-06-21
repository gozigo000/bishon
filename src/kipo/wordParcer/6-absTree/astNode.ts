import { HtmlTag } from "./html-paths";

export type AstNodeType = 'element' | 'text' | 'forceWrite';

export class AstNode {
    type: AstNodeType;
    tag?: HtmlTag;
    children?: AstNode[];
    text?: string;

    constructor(type: AstNodeType);
    constructor(type: AstNodeType, value: string);
    constructor(type: AstNodeType, tag: HtmlTag | string, children: AstNode[]);
    constructor(type: AstNodeType, valOrTag?: string | HtmlTag, children?: AstNode[]) {
        this.type = type;
        if (type === 'element') {
            this.tag = valOrTag as HtmlTag;
            this.children = children;
        } else if (type === 'text') {
            this.text = valOrTag as string;
        }
    }
}

const selfClosingTags: Set<string> = new Set([
    'br', 'hr', 'img', 'input', 'math'
]);

export function isSelfCloseTag(node: AstNode): boolean {
    return (node.children?.length === 0) && 
        selfClosingTags.has(node.tag!.tagName);
}

