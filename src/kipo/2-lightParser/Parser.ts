import { DomHandler } from "./Handler";
import { fromCodePoint } from "./4-entities/decode-codepoint";
import Tokenizer from "./Tokenizer";
import { decodeXML } from "./4-entities/decode";

const formTags = new Set([
    "input",
    "option",
    "optgroup",
    "select",
    "button",
    "datalist",
    "textarea",
]);
const pTag = new Set(["p"]);
const tableSectionTags = new Set(["thead", "tbody"]);
const ddtTags = new Set(["dd", "dt"]);
const rtpTags = new Set(["rt", "rp"]);

const openImpliesClose = new Map<string, Set<string>>([
    ["tr", new Set(["tr", "th", "td"])],
    ["th", new Set(["th"])],
    ["td", new Set(["thead", "th", "td"])],
    ["body", new Set(["head", "link", "script"])],
    ["li", new Set(["li"])],
    ["p", pTag],
    ["h1", pTag],
    ["h2", pTag],
    ["h3", pTag],
    ["h4", pTag],
    ["h5", pTag],
    ["h6", pTag],
    ["select", formTags],
    ["input", formTags],
    ["output", formTags],
    ["button", formTags],
    ["datalist", formTags],
    ["textarea", formTags],
    ["option", new Set(["option"])],
    ["optgroup", new Set(["optgroup", "option"])],
    ["dd", ddtTags],
    ["dt", ddtTags],
    ["address", pTag],
    ["article", pTag],
    ["aside", pTag],
    ["blockquote", pTag],
    ["details", pTag],
    ["div", pTag],
    ["dl", pTag],
    ["fieldset", pTag],
    ["figcaption", pTag],
    ["figure", pTag],
    ["footer", pTag],
    ["form", pTag],
    ["header", pTag],
    ["hr", pTag],
    ["main", pTag],
    ["nav", pTag],
    ["ol", pTag],
    ["pre", pTag],
    ["section", pTag],
    ["table", pTag],
    ["ul", pTag],
    ["rt", rtpTags],
    ["rp", rtpTags],
    ["tbody", tableSectionTags],
    ["tfoot", tableSectionTags],
]);

// 자식 노드를 가지면 안되는 태그들
const voidElements = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);

const foreignContextElements = new Set(["math", "svg"]);

export type ParserOptions = {
    /**
     * Indicates whether special tags (`<script>`, `<style>`, and `<title>`) should get special treatment
     * and if "empty" tags (eg. `<br>`) can have children.
     * If `false`, the content of special tags will be text only.
     * For feeds and other XML content (documents that don't consist of HTML), set this to `true`.
     * @default false
     */
    xmlMode?: boolean;
    /**
     * If `true`: 태그명을 모두 소문자로 변환
     * @default false
     */
    isLowerCaseTagName?: boolean;
    /**
     * If `true`, 속성명을 모두 소문자로 변환 (파싱 속도에 큰 영향을 줌)
     * @default false
     */
    isLowerCaseAttributeName?: boolean;
    /**
     * If true, CDATA sections will be recognized as text.
     * NOTE: If xmlMode is `true` then CDATA sections will always be recognized as text.
     * @default false
     */
    recognizeCDATA?: boolean;
}

const reNameEnd = /\s|\//;

export class Parser {
    /** The start index of the last event. */
    public startIdx = 0;
    /** The end index of the last event. */
    public endIdx = 0;
    /** Store the start index of the current open tag, \
     * so we can update the start index for attributes. */
    private openTagStart = 0;

    private tagName = "";
    private attrName = "";
    private attrValue = "";
    private attrs: null | { [key: string]: string } = null;
    private readonly stack: string[] = [];
    private readonly domHandler: DomHandler;
    private readonly isLowerCaseTagName: boolean;
    private readonly isLowerCaseAttrName: boolean;
    private readonly isRecognizeCDATA: boolean;
    private readonly tokenizer: Tokenizer;

    private readonly buffers: string[] = [];
    private bufferOffset = 0;
    /** The index of the last written buffer. Used when resuming after a `pause()` */
    private writeIdx = 0;
    /** Indicates whether the parser has finished running / `.end` has been called */
    private ended = false;

    constructor(domHandler: DomHandler, options: ParserOptions = {}) {
        this.domHandler = domHandler;
        this.isLowerCaseTagName = options.isLowerCaseTagName ?? false;
        this.isLowerCaseAttrName = options.isLowerCaseAttributeName ?? false;
        this.isRecognizeCDATA = options.recognizeCDATA ?? false
        this.tokenizer = new Tokenizer(this);
    }

    // Tokenizer event handlers

    /** @internal */
    onText(start: number, endIdx: number): void {
        const data = this.getSlice(start, endIdx);
        this.endIdx = endIdx - 1;
        this.domHandler.onText(data);
        this.startIdx = endIdx;
    }

    /** @internal */
    onTextEntity(cp: number, endIdx: number): void {
        this.endIdx = endIdx - 1;
        this.domHandler.onText(fromCodePoint(cp));
        this.startIdx = endIdx;
    }

    /** @internal */
    onOpenTagName(start: number, endIdx: number): void {
        this.endIdx = endIdx;

        let name = this.getSlice(start, endIdx);

        if (this.isLowerCaseTagName) {
            name = name.toLowerCase();
        }

        this.emitOpenTag(name);
    }

    private emitOpenTag(name: string) {
        this.openTagStart = this.startIdx;
        this.tagName = name;

        if (!voidElements.has(name)) {
            this.stack.unshift(name);
        }
        this.attrs = {};
    }

    /** @internal */
    onOpenTagEnd(endIdx: number): void {
        this.endIdx = endIdx;
        this.endOpenTag();

        // Set `startIndex` for next node
        this.startIdx = endIdx + 1;
    }

    private endOpenTag() {
        this.startIdx = this.openTagStart;
        if (this.attrs) {
            this.domHandler.onOpenTag(this.tagName, this.attrs);
            this.attrs = null;
        }
        if (voidElements.has(this.tagName)) {
            this.domHandler.onCloseTag();
        }
        this.tagName = "";
    }

    /** @internal */
    onCloseTag(start: number, endIdx: number): void {
        this.endIdx = endIdx;

        let name = this.getSlice(start, endIdx);

        if (this.isLowerCaseTagName) {
            name = name.toLowerCase();
        }

        if (!voidElements.has(name)) {
            const pos = this.stack.indexOf(name);
            if (pos !== -1) {
                for (let idx = 0; idx <= pos; idx++) {
                    this.stack.shift()!;
                    // We know the stack has sufficient elements.
                    this.domHandler.onCloseTag();
                }
            }
        } else if (name === "br") {
            // We can't use `emitOpenTag` for implicit open, as `br` would be implicitly closed.
            this.domHandler.onOpenTag("br", {});
            this.domHandler.onCloseTag();
        }

        // Set `startIndex` for next node
        this.startIdx = endIdx + 1;
    }

    /** @internal */
    onSelfClosingTag(endIdx: number): void {
        this.endIdx = endIdx;
        this.closeCurrentTag();
        // Set `startIndex` for next node
        this.startIdx = endIdx + 1;
    }

    private closeCurrentTag() {
        const name = this.tagName;
        this.endOpenTag();

        // Self-closing tags will be on the top of the stack
        if (this.stack[0] === name) {
            // If the opening tag isn't implied, the closing tag has to be implied.
            this.domHandler.onCloseTag();
            this.stack.shift();
        }
    }

    /** @internal */
    onAttrName(start: number, endIdx: number): void {
        this.startIdx = start;
        const name = this.getSlice(start, endIdx);

        this.attrName = this.isLowerCaseAttrName
            ? name.toLowerCase()
            : name;
    }

    /** @internal */
    onAttrData(start: number, endIdx: number): void {
        this.attrValue += decodeXML(this.getSlice(start, endIdx));
    }

    /** @internal */
    onAttrEntity(cp: number): void {
        this.attrValue += fromCodePoint(cp);
    }

    /** @internal */
    onAttrEnd(endIdx: number): void {
        this.endIdx = endIdx;
        if (this.attrs && !Object.prototype.hasOwnProperty.call(this.attrs, this.attrName)) {
            this.attrs[this.attrName] = this.attrValue;
        }
        this.attrValue = "";
    }

    /** @internal */
    onDeclaration(start: number, endIdx: number): void {
        this.endIdx = endIdx;
        const value = this.getSlice(start, endIdx);

        if (this.domHandler.onProcessingInstruction) {
            const name = this.getInstructionName(value);
            this.domHandler.onProcessingInstruction(`!${name}`, `!${value}`);
        }
        // Set `startIndex` for next node
        this.startIdx = endIdx + 1;
    }

    /** @internal */
    onProcessingInstruction(start: number, endIdx: number): void {
        this.endIdx = endIdx;
        const value = this.getSlice(start, endIdx);

        if (this.domHandler.onProcessingInstruction) {
            const name = this.getInstructionName(value);
            this.domHandler.onProcessingInstruction(`?${name}`, `?${value}`);
        }
        // Set `startIndex` for next node
        this.startIdx = endIdx + 1;
    }

    private getInstructionName(value: string) {
        const idx = value.search(reNameEnd);
        let name = idx < 0 ? value : value.slice(0, idx);

        if (this.isLowerCaseTagName) {
            name = name.toLowerCase();
        }

        return name;
    }

    /** @internal */
    onComment(start: number, endIdx: number, offset: number): void {
        this.endIdx = endIdx;

        this.domHandler.onComment(this.getSlice(start, endIdx - offset));
        this.domHandler.onCommentEnd();
        // Set `startIndex` for next node
        this.startIdx = endIdx + 1;
    }

    /** @internal */
    onCdata(start: number, endIdx: number, offset: number): void {
        this.endIdx = endIdx;
        const value = this.getSlice(start, endIdx - offset);

        if (this.isRecognizeCDATA) {
            this.domHandler.onCdataStart();
            this.domHandler.onText(value);
            this.domHandler.onCdataEnd();
        } else {
            this.domHandler.onComment(`[CDATA[${value}]]`);
            this.domHandler.onCommentEnd();
        }
        // Set `startIndex` for next node
        this.startIdx = endIdx + 1;
    }

    /** @internal */
    onEnd(): void {
        if (this.domHandler.onCloseTag) {
            // Set the end index for all remaining tags
            this.endIdx = this.startIdx;
            for (let idx = 0; idx < this.stack.length; idx++) {
                this.domHandler.onCloseTag();
            }
        }
        this.domHandler.onEnd();
    }

    /**
     * Resets the parser, then parses a complete document and
     * pushes it to the handler.
     * @param data Document to parse.
     */
    public parseComplete(data: string): void {
        this.resetParser();
        this.end(data);
    }

    /**
     * Resets the parser to a blank state, ready to parse a new XML document
     */
    public resetParser(): void {
        this.domHandler.onReset();
        this.tokenizer.reset();
        this.tagName = "";
        this.attrName = "";
        this.attrs = null;
        this.stack.length = 0;
        this.startIdx = 0;
        this.endIdx = 0;
        this.buffers.length = 0;
        this.bufferOffset = 0;
        this.writeIdx = 0;
        this.ended = false;
    }

    /**
     * Parses the end of the buffer and clears the stack, calls onend.
     * @param chunk Optional final chunk to parse.
     */
    public end(chunk?: string): void {
        if (this.ended) {
            this.domHandler.onError(new Error(".end() after done!"));
            return;
        }

        if (chunk) this.write(chunk);
        this.ended = true;
        this.tokenizer.end();
    }

    private getSlice(start: number, end: number) {
        while (start - this.bufferOffset >= this.buffers[0].length) {
            this.shiftBuffer();
        }

        let slice = this.buffers[0].slice(
            start - this.bufferOffset,
            end - this.bufferOffset,
        );

        while (end - this.bufferOffset > this.buffers[0].length) {
            this.shiftBuffer();
            slice += this.buffers[0].slice(0, end - this.bufferOffset);
        }

        return slice;
    }

    private shiftBuffer(): void {
        this.bufferOffset += this.buffers[0].length;
        this.writeIdx--;
        this.buffers.shift();
    }

    /**
     * Parses a chunk of data and calls the corresponding callbacks.
     * @param chunk Chunk to parse.
     */
    public write(chunk: string): void {
        if (this.ended) {
            this.domHandler.onError(new Error(".write() after done!"));
            return;
        }

        this.buffers.push(chunk);
        if (this.tokenizer.isRunning) {
            this.tokenizer.write(chunk);
            this.writeIdx++;
        }
    }

    /**
     * The parser won't emit events until `resume` is called.
     */
    public pauseParsing(): void {
        this.tokenizer.pause();
    }

    /**
     * Resumes parsing after `pauseParsing` was called.
     */
    public resumeParsing(): void {
        this.tokenizer.resume();

        while (this.tokenizer.isRunning &&
            this.writeIdx < this.buffers.length
        ) {
            this.tokenizer.write(this.buffers[this.writeIdx++]);
        }

        if (this.ended) this.tokenizer.end();
    }
}
