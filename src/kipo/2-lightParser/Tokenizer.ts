import { EntityDecoder } from "../0-utils/escape2/decode";
import { xmlDecodeTree } from "../0-utils/escape2/decode-data-xml";
import type { Parser } from "./Parser";

const enum CharCode {
    Tab = 0x9, // "\t"
    NewLine = 0xa, // "\n"
    FormFeed = 0xc, // "\f"
    CarriageReturn = 0xd, // "\r"
    Space = 0x20, // " "
    ExclamationMark = 0x21, // "!"
    SingleQuote = 0x27, // "'"
    DoubleQuote = 0x22, // '"'
    Dash = 0x2d, // "-"
    Slash = 0x2f, // "/"
    Lt = 0x3c, // "<"
    Eq = 0x3d, // "="
    Gt = 0x3e, // ">"
    QuestionMark = 0x3f, // "?"
    OpeningSquareBracket = 0x5b, // "["
}

/** The states the tokenizer can be in. */
const enum State {
    Text = 1,
    BeforeTagName, // After <
    InTagName,
    InSelfClosingTag,
    BeforeClosingTagName,
    InClosingTagName,
    AfterClosingTagName,

    /* 속성 */
    BeforeAttributeName,
    InAttributeName,
    AfterAttributeName,
    BeforeAttributeValue,
    InAttributeValueDq, // "
    InAttributeValueSq, // '
    InAttributeValueNq,

    /* Declarations */
    BeforeDeclaration, // !
    InDeclaration,

    /* Processing instructions */
    InProcessingInstruction, // ?

    /* Comments & CDATA */
    BeforeComment,
    CDATASequence,
    InSpecialComment,
    InCommentLike,

    /* Special tags */
    BeforeSpecialS, // Decide if we deal with `<script` or `<style`
    BeforeSpecialT, // Decide if we deal with `<title` or `<textarea`
    SpecialStartSequence,
    InSpecialTag,

    InEntity,
}

function isWhitespace(c: number): boolean {
    return (
        c === CharCode.Space ||
        c === CharCode.NewLine ||
        c === CharCode.Tab ||
        c === CharCode.FormFeed ||
        c === CharCode.CarriageReturn
    );
}

function isEndOfTagSection(c: number): boolean {
    return (
        c === CharCode.Slash || 
        c === CharCode.Gt || 
        isWhitespace(c)
    );
}

/**
 * HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name. \
 * XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar). \
 * We allow anything that wouldn't end the tag.
 */
function isTagStartChar(c: number) {
    return (
        c !== CharCode.Slash &&
        c !== CharCode.Gt &&
        !isWhitespace(c)
    );
}

export enum QuoteType {
    NoValue = 0,
    Unquoted = 1,
    Single = 2,
    Double = 3,
}

/**
 * Sequences used to match longer strings. \
 * We don't have `Script`, `Style`, or `Title` here. \
 * Instead, we re-use the End sequences with an increased offset.
 */
const EndSequences = {
    Cdata: new Uint8Array([0x43, 0x44, 0x41, 0x54, 0x41, 0x5b]), // CDATA[
    CdataEnd: new Uint8Array([0x5d, 0x5d, 0x3e]), // ]]>
    CommentEnd: new Uint8Array([0x2d, 0x2d, 0x3e]), // `-->`
    ScriptEnd: new Uint8Array([0x3c, 0x2f, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74]), // `</script`
    StyleEnd: new Uint8Array([0x3c, 0x2f, 0x73, 0x74, 0x79, 0x6c, 0x65]), // `</style`
    TitleEnd: new Uint8Array([0x3c, 0x2f, 0x74, 0x69, 0x74, 0x6c, 0x65]), // `</title`
    TextareaEnd: new Uint8Array([0x3c, 0x2f, 0x74, 0x65, 0x78, 0x74, 0x61, 0x72, 0x65, 0x61]), // `</textarea`
    XmpEnd: new Uint8Array([0x3c, 0x2f, 0x78, 0x6d, 0x70]), // `</xmp`
};

export default class Tokenizer {
    /** The current state the tokenizer is in. */
    private state = State.Text;
    /** The read buffer. */
    private buffer = "";
    /** The offset of the current buffer. */
    private offset = 0;
    /** The index within the buffer that we are currently looking at. */
    private idx = 0;
    /** The beginning of the section that is currently being read. */
    private sectionStart = 0;
    /** The start of the last entity. */
    private entityStart = 0;
    /** Some behavior, eg. when decoding entities, is done while we are in another state. 
     * This keeps track of the other state type. */
    private baseState = State.Text;
    /** For special parsing behavior inside of script and style tags. */
    private isSpecial = false;
    /** Indicates whether the tokenizer has been paused. */
    public isRunning = true;

    private readonly parser: Parser;
    private readonly entityDecoder: EntityDecoder;

    constructor(parser: Parser) {
        this.parser = parser;
        this.entityDecoder = new EntityDecoder(
            xmlDecodeTree,
            (cp, consumed) => this.emitCodePoint(cp, consumed),
        );
    }

    public reset(): void {
        this.state = State.Text;
        this.buffer = "";
        this.sectionStart = 0;
        this.idx = 0;
        this.baseState = State.Text;
        this.currentSequence = undefined!;
        this.isRunning = true;
        this.offset = 0;
    }

    public end(): void {
        if (this.isRunning) this.finish();
    }

    private finish() {
        if (this.state === State.InEntity) {
            this.entityDecoder.end();
            this.state = this.baseState;
        }
        this.handleTrailingData();
        this.parser.onEnd();
    }

    /** Handle any trailing data. */
    private handleTrailingData() {
        const endIdx = this.buffer.length + this.offset;

        // If there is no remaining data, we are done.
        if (this.sectionStart >= endIdx) return;

        if (this.state === State.InCommentLike) {
            if (this.currentSequence === EndSequences.CdataEnd) {
                this.parser.onCdata(this.sectionStart, endIdx, 0);
            } else {
                this.parser.onComment(this.sectionStart, endIdx, 0);
            }
        } else if (
            this.state === State.InTagName ||
            this.state === State.BeforeAttributeName ||
            this.state === State.BeforeAttributeValue ||
            this.state === State.AfterAttributeName ||
            this.state === State.InAttributeName ||
            this.state === State.InAttributeValueSq ||
            this.state === State.InAttributeValueDq ||
            this.state === State.InAttributeValueNq ||
            this.state === State.InClosingTagName
        ) {
            // If we are currently in an opening or closing tag, us not calling 
            // the respective callback signals that the tag should be ignored.
        } else {
            this.parser.onText(this.sectionStart, endIdx);
        }
    }

    public write(chunk: string): void {
        this.offset += this.buffer.length;
        this.buffer = chunk;
        this.parse();
    }

    public pause(): void {
        this.isRunning = false;
    }

    public resume(): void {
        this.isRunning = true;
        if (this.idx < this.buffer.length + this.offset) {
            this.parse();
        }
    }

    /**
     * Iterates through the buffer, calling the function corresponding to the current state. \
     * States that are more likely to be hit are higher up, as a performance improvement.
     */
    private parse() {
        while (
            this.isRunning && 
            this.idx < this.buffer.length + this.offset
        ) {
            const cc = this.buffer.charCodeAt(this.idx - this.offset);
            switch (this.state) {
                case State.Text:
                    this.stateText(cc); break;
                case State.SpecialStartSequence:
                    this.stateSpecialStartSequence(cc); break;
                case State.InSpecialTag:
                    this.stateInSpecialTag(cc); break;
                case State.CDATASequence:
                    this.stateCDATASequence(cc); break;
                case State.InAttributeValueDq:
                    this.stateInAttributeValueDoubleQuotes(cc); break;
                case State.InAttributeName:
                    this.stateInAttributeName(cc); break;
                case State.InCommentLike:
                    this.stateInCommentLike(cc); break;
                case State.InSpecialComment:
                    this.stateInSpecialComment(cc); break;
                case State.BeforeAttributeName:
                    this.stateBeforeAttributeName(cc); break;
                case State.InTagName:
                    this.stateInTagName(cc); break;
                case State.InClosingTagName:
                    this.stateInClosingTagName(cc); break;
                case State.BeforeTagName:
                    this.stateBeforeTagName(cc); break;
                case State.AfterAttributeName:
                    this.stateAfterAttributeName(cc); break;
                case State.InAttributeValueSq:
                    this.stateInAttributeValueSingleQuotes(cc); break;
                case State.BeforeAttributeValue:
                    this.stateBeforeAttributeValue(cc); break;
                case State.BeforeClosingTagName:
                    this.stateBeforeClosingTagName(cc); break;
                case State.AfterClosingTagName:
                    this.stateAfterClosingTagName(cc); break;
                case State.BeforeSpecialS:
                    this.stateBeforeSpecialS(cc); break;
                case State.BeforeSpecialT:
                    this.stateBeforeSpecialT(cc); break;
                case State.InAttributeValueNq:
                    this.stateInAttributeValueNoQuotes(cc); break;
                case State.InSelfClosingTag:
                    this.stateInSelfClosingTag(cc); break;
                case State.InDeclaration:
                    this.stateInDeclaration(cc); break;
                case State.BeforeDeclaration:
                    this.stateBeforeDeclaration(cc); break;
                case State.BeforeComment:
                    this.stateBeforeComment(cc); break;
                case State.InProcessingInstruction:
                    this.stateInProcessingInstruction(cc); break;
                case State.InEntity:
                    this.stateInEntity(); break;
            }
            this.idx++;
        }
        this.cleanUp();
    }

    private stateText(c: number): void {
        if (c === CharCode.Lt || this.jumpTo(CharCode.Lt)) {
            if (this.idx > this.sectionStart) {
                this.parser.onText(this.sectionStart, this.idx);
            }
            this.state = State.BeforeTagName;
            this.sectionStart = this.idx;
        }
    }

    private currentSequence: Uint8Array = undefined!;
    private sequenceIdx = 0;
    private stateSpecialStartSequence(c: number): void {
        const isEnd = (this.sequenceIdx === this.currentSequence.length);
        const isMatch = isEnd
            ? // If we are at the end of the sequence, make sure the tag name has ended
              isEndOfTagSection(c)
            : // Otherwise, do a case-insensitive comparison
              (c | 0x20) === this.currentSequence[this.sequenceIdx];

        if (!isMatch) {
            this.isSpecial = false;
        } else if (!isEnd) {
            this.sequenceIdx++;
            return;
        }

        this.sequenceIdx = 0;
        this.state = State.InTagName;
        this.stateInTagName(c);
    }

    /** Look for an end tag. For <title> tags, also decode entities. */
    private stateInSpecialTag(c: number): void {
        if (this.sequenceIdx === this.currentSequence.length) {
            if (c === CharCode.Gt || isWhitespace(c)) {
                const endOfText = this.idx - this.currentSequence.length;

                if (this.sectionStart < endOfText) {
                    // Spoof the index so that reported locations match up.
                    const actualIdx = this.idx;
                    this.idx = endOfText;
                    this.parser.onText(this.sectionStart, endOfText);
                    this.idx = actualIdx;
                }

                this.isSpecial = false;
                this.sectionStart = endOfText + 2; // Skip over the `</`
                this.stateInClosingTagName(c);
                return; // We are done; skip the rest of the function.
            }

            this.sequenceIdx = 0;
        }

        if ((c | 0x20) === this.currentSequence[this.sequenceIdx]) {
            this.sequenceIdx += 1;
        } 
        else if (this.sequenceIdx === 0) {
            if (this.jumpTo(CharCode.Lt)) {
                // Outside of <title> tags, we can fast-forward.
                this.sequenceIdx = 1;
            }
        } 
        else {
            // If we see a `<`, set the sequence index to 1; useful for eg. `<</script>`.
            this.sequenceIdx = Number(c === CharCode.Lt);
        }
    }

    private stateCDATASequence(c: number): void {
        if (c === EndSequences.Cdata[this.sequenceIdx]) {
            if (++this.sequenceIdx === EndSequences.Cdata.length) {
                this.state = State.InCommentLike;
                this.currentSequence = EndSequences.CdataEnd;
                this.sequenceIdx = 0;
                this.sectionStart = this.idx + 1;
            }
        } else {
            this.sequenceIdx = 0;
            this.state = State.InDeclaration;
            this.stateInDeclaration(c); // Reconsume the character
        }
    }

    /**
     * Comments and CDATA end with `-->` and `]]>`.
     *
     * Their common qualities are:
     * - Their end sequences have a distinct character they start with.
     * - That character is then repeated, so we have to check multiple repeats.
     * - All characters but the start character of the sequence can be skipped.
     */
    private stateInCommentLike(c: number): void {
        if (c === this.currentSequence[this.sequenceIdx]) {
            if (++this.sequenceIdx === this.currentSequence.length) {
                if (this.currentSequence === EndSequences.CdataEnd) {
                    this.parser.onCdata(this.sectionStart, this.idx, 2);
                } else {
                    this.parser.onComment(this.sectionStart, this.idx, 2);
                }

                this.sequenceIdx = 0;
                this.sectionStart = this.idx + 1;
                this.state = State.Text;
            }
        } else if (this.sequenceIdx === 0) {
            // Fast-forward to the first character of the sequence
            if (this.jumpTo(this.currentSequence[0])) {
                this.sequenceIdx = 1;
            }
        } else if (c !== this.currentSequence[this.sequenceIdx - 1]) {
            // Allow long sequences, eg. --->, ]]]>
            this.sequenceIdx = 0;
        }
    }

    private startSpecial(sequence: Uint8Array, offset: number) {
        this.isSpecial = true;
        this.currentSequence = sequence;
        this.sequenceIdx = offset;
        this.state = State.SpecialStartSequence;
    }

    private stateBeforeTagName(c: number): void {
        if (c === CharCode.ExclamationMark) {
            this.state = State.BeforeDeclaration;
            this.sectionStart = this.idx + 1;
        } 
        else if (c === CharCode.QuestionMark) {
            this.state = State.InProcessingInstruction;
            this.sectionStart = this.idx + 1;
        } 
        else if (isTagStartChar(c)) {
            this.sectionStart = this.idx;
            this.state = State.InTagName;
        } 
        else if (c === CharCode.Slash) {
            this.state = State.BeforeClosingTagName;
        } 
        else {
            this.state = State.Text;
            this.stateText(c);
        }
    }
    private stateInTagName(c: number): void {
        if (isEndOfTagSection(c)) {
            this.parser.onOpenTagName(this.sectionStart, this.idx);
            this.sectionStart = -1;
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    private stateBeforeClosingTagName(c: number): void {
        if (isWhitespace(c)) {
            // Ignore
        } else if (c === CharCode.Gt) {
            this.state = State.Text;
        } else {
            this.state = isTagStartChar(c) ? 
                State.InClosingTagName : 
                State.InSpecialComment;
            this.sectionStart = this.idx;
        }
    }
    private stateInClosingTagName(c: number): void {
        if (c === CharCode.Gt || isWhitespace(c)) {
            this.parser.onCloseTag(this.sectionStart, this.idx);
            this.sectionStart = -1;
            this.state = State.AfterClosingTagName;
            this.stateAfterClosingTagName(c);
        }
    }
    private stateAfterClosingTagName(c: number): void {
        // Skip everything until ">"
        if (c === CharCode.Gt || this.jumpTo(CharCode.Gt)) {
            this.state = State.Text;
            this.sectionStart = this.idx + 1;
        }
    }
    private stateBeforeAttributeName(c: number): void {
        if (c === CharCode.Gt) {
            this.parser.onOpenTagEnd(this.idx);
            if (this.isSpecial) {
                this.state = State.InSpecialTag;
                this.sequenceIdx = 0;
            } else {
                this.state = State.Text;
            }
            this.sectionStart = this.idx + 1;
        } else if (c === CharCode.Slash) {
            this.state = State.InSelfClosingTag;
        } else if (!isWhitespace(c)) {
            this.state = State.InAttributeName;
            this.sectionStart = this.idx;
        }
    }
    private stateInSelfClosingTag(c: number): void {
        if (c === CharCode.Gt) {
            this.parser.onSelfClosingTag(this.idx);
            this.state = State.Text;
            this.sectionStart = this.idx + 1;
            this.isSpecial = false; // Reset special state, in case of self-closing special tags
        } else if (!isWhitespace(c)) {
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    private stateInAttributeName(c: number): void {
        if (c === CharCode.Eq || isEndOfTagSection(c)) {
            this.parser.onAttrName(this.sectionStart, this.idx);
            this.sectionStart = this.idx;
            this.state = State.AfterAttributeName;
            this.stateAfterAttributeName(c);
        }
    }
    private stateAfterAttributeName(c: number): void {
        if (c === CharCode.Eq) {
            this.state = State.BeforeAttributeValue;
        } else if (c === CharCode.Slash || c === CharCode.Gt) {
            this.parser.onAttrEnd(this.sectionStart);
            this.sectionStart = -1;
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        } else if (!isWhitespace(c)) {
            this.parser.onAttrEnd(this.sectionStart);
            this.state = State.InAttributeName;
            this.sectionStart = this.idx;
        }
    }
    private stateBeforeAttributeValue(c: number): void {
        if (c === CharCode.DoubleQuote) {
            this.state = State.InAttributeValueDq;
            this.sectionStart = this.idx + 1;
        } else if (c === CharCode.SingleQuote) {
            this.state = State.InAttributeValueSq;
            this.sectionStart = this.idx + 1;
        } else if (!isWhitespace(c)) {
            this.sectionStart = this.idx;
            this.state = State.InAttributeValueNq;
            this.stateInAttributeValueNoQuotes(c); // Reconsume token
        }
    }
    private handleInAttributeValue(c: number, quote: number) {
        if (c === quote || this.jumpTo(quote)) {
            this.parser.onAttrData(this.sectionStart, this.idx);
            this.sectionStart = -1;
            this.parser.onAttrEnd(this.idx + 1);
            this.state = State.BeforeAttributeName;
        }
    }
    private stateInAttributeValueDoubleQuotes(c: number): void {
        this.handleInAttributeValue(c, CharCode.DoubleQuote);
    }
    private stateInAttributeValueSingleQuotes(c: number): void {
        this.handleInAttributeValue(c, CharCode.SingleQuote);
    }
    private stateInAttributeValueNoQuotes(c: number): void {
        if (isWhitespace(c) || c === CharCode.Gt) {
            this.parser.onAttrData(this.sectionStart, this.idx);
            this.sectionStart = -1;
            this.parser.onAttrEnd(this.idx);
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    private stateBeforeDeclaration(c: number): void {
        if (c === CharCode.OpeningSquareBracket) {
            this.state = State.CDATASequence;
            this.sequenceIdx = 0;
        } else {
            this.state =
                c === CharCode.Dash
                    ? State.BeforeComment
                    : State.InDeclaration;
        }
    }
    private stateInDeclaration(c: number): void {
        if (c === CharCode.Gt || this.jumpTo(CharCode.Gt)) {
            this.parser.onDeclaration(this.sectionStart, this.idx);
            this.state = State.Text;
            this.sectionStart = this.idx + 1;
        }
    }
    private stateInProcessingInstruction(c: number): void {
        if (c === CharCode.Gt || this.jumpTo(CharCode.Gt)) {
            this.parser.onProcessingInstruction(this.sectionStart, this.idx);
            this.state = State.Text;
            this.sectionStart = this.idx + 1;
        }
    }
    private stateBeforeComment(c: number): void {
        if (c === CharCode.Dash) {
            this.state = State.InCommentLike;
            this.currentSequence = EndSequences.CommentEnd;
            // Allow short comments (eg. <!-->)
            this.sequenceIdx = 2;
            this.sectionStart = this.idx + 1;
        } else {
            this.state = State.InDeclaration;
        }
    }
    private stateInSpecialComment(c: number): void {
        if (c === CharCode.Gt || this.jumpTo(CharCode.Gt)) {
            this.parser.onComment(this.sectionStart, this.idx, 0);
            this.state = State.Text;
            this.sectionStart = this.idx + 1;
        }
    }
    private stateBeforeSpecialS(c: number): void {
        const lower = c | 0x20;
        if (lower === EndSequences.ScriptEnd[3]) {
            this.startSpecial(EndSequences.ScriptEnd, 4);
        } else if (lower === EndSequences.StyleEnd[3]) {
            this.startSpecial(EndSequences.StyleEnd, 4);
        } else {
            this.state = State.InTagName;
            this.stateInTagName(c); // Consume the token again
        }
    }

    private stateBeforeSpecialT(c: number): void {
        const lower = c | 0x20;
        switch (lower) {
            case EndSequences.TitleEnd[3]: {
                this.startSpecial(EndSequences.TitleEnd, 4);
                break;
            }
            case EndSequences.TextareaEnd[3]: {
                this.startSpecial(EndSequences.TextareaEnd, 4);
                break;
            }
            case EndSequences.XmpEnd[3]: {
                this.startSpecial(EndSequences.XmpEnd, 4);
                break;
            }
            default: {
                this.state = State.InTagName;
                this.stateInTagName(c); // Consume the token again
            }
        }
    }

    private stateInEntity(): void {
        const length = this.entityDecoder.write(
            this.buffer,
            this.idx - this.offset,
        );

        // If `length` is positive, we are done with the entity.
        if (length >= 0) {
            this.state = this.baseState;
            if (length === 0) {
                this.idx = this.entityStart;
            }
        } else {
            // Mark buffer as consumed.
            this.idx = this.offset + this.buffer.length - 1;
        }
    }

    /**
     * Remove data that has already been consumed from the buffer.
     */
    private cleanUp() {
        // If we are inside of text or attributes, emit what we already have.
        if (this.isRunning && this.sectionStart !== this.idx) {
            if (
                this.state === State.Text ||
                (this.state === State.InSpecialTag && this.sequenceIdx === 0)
            ) {
                this.parser.onText(this.sectionStart, this.idx);
                this.sectionStart = this.idx;
            } else if (
                this.state === State.InAttributeValueDq ||
                this.state === State.InAttributeValueSq ||
                this.state === State.InAttributeValueNq
            ) {
                this.parser.onAttrData(this.sectionStart, this.idx);
                this.sectionStart = this.idx;
            }
        }
    }

    /**
     * When we wait for one specific character, we can speed things up
     * by skipping through the buffer until we find it.
     * @returns Whether the character was found.
     */
    private jumpTo(c: number): boolean {
        while (++this.idx < this.buffer.length + this.offset) {
            if (this.buffer.charCodeAt(this.idx - this.offset) === c) {
                return true;
            }
        }
        /*
         * We increment the index at the end of the `parse` loop,
         * so set it to `buffer.length - 1` here.
         *
         * TODO: Refactor `parse` to increment index before calling states.
         */
        this.idx = this.buffer.length + this.offset - 1;

        return false;
    }

    private emitCodePoint(cp: number, consumed: number): void {
        if (
            this.baseState !== State.Text &&
            this.baseState !== State.InSpecialTag
        ) {
            if (this.sectionStart < this.entityStart) {
                this.parser.onAttrData(this.sectionStart, this.entityStart);
            }
            this.sectionStart = this.entityStart + consumed;
            this.idx = this.sectionStart - 1;

            this.parser.onAttrEntity(cp);
        } else {
            if (this.sectionStart < this.entityStart) {
                this.parser.onText(this.sectionStart, this.entityStart);
            }
            this.sectionStart = this.entityStart + consumed;
            this.idx = this.sectionStart - 1;

            this.parser.onTextEntity(cp, this.sectionStart);
        }
    }
}
