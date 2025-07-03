import { AstNode } from "../6-absTree/astNode";
import { writeHtml } from "./convert-to-html";

export interface HtmlWriter {
    openTag: (tagName: string, attributes: Record<string, string>) => void;
    closeTag: () => void;
    selfCloseTag: (tagName: string, attributes: Record<string, string>) => void;
    writeText: (text: string) => void;
    writeHtml: (nodes: AstNode[]) => this;
    getHtmlSegs: () => string[];
    toString: () => string;
}

type WriterOptions = {
    prettyPrint?: boolean;
    ignoreEmptyParagraphs?: boolean;
}

export function getHtmlWriter(opts: WriterOptions = {}): HtmlWriter {
    return opts.prettyPrint ? new PrettyWriter(opts) : new SimpleWriter(opts);
}

class SimpleWriter implements HtmlWriter {
    private htmlSeg: string = '';
    private htmlSegs: string[] = [];
    private isInTable: number = 0;
    private openTagStack: string[] = [];
    private ignoreEmptyParagraphs: boolean;

    constructor(opts: WriterOptions) {
        this.ignoreEmptyParagraphs = opts.ignoreEmptyParagraphs || false;
    }

    public openTag(tagName: string, attributes: Record<string, string>): void {
        const attrs = this.makeAttrsStr(attributes);
        this.htmlSeg += `<${tagName}${attrs}>`;
        if (tagName === 'table') this.isInTable++;
        this.openTagStack.push(tagName);
    }

    public writeText(text: string): void {
        this.htmlSeg += escapeHtmlText(text);
    }

    private divisionElems: Set<string> = new Set([
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ]);

    public closeTag(): void {
        const tagName = this.openTagStack.pop();
        if (!tagName) return;

        this.htmlSeg += `</${tagName}>`;
        if (tagName === 'table') this.isInTable--;

        if (this.divisionElems.has(tagName) &&
            this.isInTable === 0
        ) {
            if (!this.ignoreEmptyParagraphs ||
                !/^<p>\s*<\/p>$/.test(this.htmlSeg)
            ) {
                this.htmlSegs.push(this.htmlSeg);
            }
            this.htmlSeg = '';
        }
    }

    public selfCloseTag(tagName: string, attributes: Record<string, string>): void {
        if (tagName === 'br') {
            // br 태그로 구분된 문장은 서로 다른 문단으로 처리
            this.closeTag();
            this.openTag('p', {});
            return;
        }
        const attrsStr = this.makeAttrsStr(attributes);
        const tag = `<${tagName}${attrsStr} />`;
        this.htmlSeg += tag;
    }

    private makeAttrsStr(attributes: Record<string, string>): string {
        return Object.entries(attributes)
            .map(([key, value]) => ` ${key}="${escapeHtmlAttr(value)}"`)
            .join("");
    }

    public writeHtml(nodes: AstNode[]): this {
        writeHtml(this, nodes);
        return this;
    }

    public getHtmlSegs(): string[] {
        return this.htmlSegs;
    }

    public toString(): string {
        return this.htmlSegs.join("");
    }
}

const indentElems: Set<string> = new Set(["div", "p", "ul", "li"]);

class PrettyWriter implements HtmlWriter {
    private indentLevel = 0;
    private indent = "  ";
    private stack: string[] = [];
    private start = true;
    private inText = false;
    private writer: HtmlWriter;

    constructor(opts: WriterOptions) {
        this.writer = new SimpleWriter(opts);
    }

    public openTag(tagName: string, attributes: Record<string, string>): void {
        if (indentElems.has(tagName)) {
            this.addIndent();
        }
        this.stack.push(tagName);
        this.writer.openTag(tagName, attributes);
        if (indentElems.has(tagName)) {
            this.indentLevel++;
        }
        this.start = false;
    }

    public closeTag(): void {
        const tagName = this.stack.pop();
        if (!tagName) return;

        if (indentElems.has(tagName)) {
            this.indentLevel--;
            this.addIndent();
        }
        this.writer.closeTag();
    }

    public writeText(text: string): void {
        this.startText();
        const indentedText = text.replace(/\n/g, "\n" + this.indent);
        this.writer.writeText(indentedText);
    }

    public selfCloseTag(tagName: string, attributes: Record<string, string>): void {
        this.addIndent();
        this.writer.selfCloseTag(tagName, attributes);
    }

    private startText(): void {
        if (!this.inText) {
            this.addIndent();
            this.inText = true;
        }
    }

    private addIndent(): void {
        this.inText = false;
        if (!this.start && this.isInIndentElem()) {
            this.writer.getHtmlSegs().push("\n");
            this.writer.getHtmlSegs().push(this.indent.repeat(this.indentLevel));
        }
    }

    private isInIndentElem(): boolean {
        return this.stack.length === 0 || indentElems.has(this.stack[this.stack.length - 1]);
    }

    public writeHtml(nodes: AstNode[]): this {
        this.writer.writeHtml(nodes);
        return this;
    }

    public getHtmlSegs(): string[] {
        return this.writer.getHtmlSegs();
    }

    public toString(): string {
        return this.writer.toString();
    }
}

function escapeHtmlText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlAttr(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
