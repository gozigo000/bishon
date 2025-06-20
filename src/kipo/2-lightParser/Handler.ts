import { XNodeType } from "./1-node/nodeType.js";
import {
    XNode,
    XElement,
    XNodeWithData,
    XText,
    XComment,
    XCDATA,
    XDocument,
    XProcessingInstruction,
    XParentNode,
} from "./1-node/node.js";

export type DomHandlerOptions = {
    /**
     * 노드에 `prevSibling` 및 `nextSibling` 속성 추가.
     * @note 현재 사용하지 않는 중
     * @default false
     */
    withSibling?: boolean;
}

type Callback = (error: Error | null, dom: XNode[]) => void;
type ElementCallback = (element: XElement) => void;

/**
 * DOM 트리를 구축하는 클래스 \
 * 노드 추가, 콜백 처리, 옵션 처리
 */
export class DomHandler {
    /** The elements of the DOM */
    public dom: XNode[] = [];
    /** The root element for the DOM */
    public root: XDocument = new XDocument(this.dom);

    /** Stack of open tags. */
    protected openTagStack: XParentNode[] = [this.root];
    /** A data node that is still being written to. */
    protected lastNode: XNodeWithData | null = null;
    /** Indicated whether parsing has been completed. */
    private done = false;

    private readonly options: DomHandlerOptions;
    private readonly callback: Callback | null;
    private readonly elementCallback: ElementCallback | null;
    
    /**
     * @param options Settings for the handler.
     * @param callback 파싱이 완료되면 한 번 호출되는 콜백 함수.
     * @param elementCB 태그가 닫힐 때마다 호출되는 콜백 함수.
     */
    public constructor(
        options?: DomHandlerOptions | null,
        callback?: Callback | null,
        elementCB?: ElementCallback,
    ) {
        this.options = options ?? {
            withSibling: false,
        };
        this.callback = callback ?? null;
        this.elementCallback = elementCB ?? null;
    }

    // Resets the DomHandler back to starting state
    public onReset(): void {
        this.dom = [];
        this.root = new XDocument(this.dom);
        this.done = false;
        this.openTagStack = [this.root];
        this.lastNode = null;
    }

    // Signals the DomHandler that parsing is done
    public onEnd(): void {
        if (this.done) return;
        this.done = true;
        if (this.callback) {
            this.callback(null, this.dom);
        }
    }

    public onError(error: Error): void {
        if (typeof this.callback === "function") {
            this.callback(error, this.dom);
        } else if (error) {
            throw error;
        }
    }

    public onOpenTag(name: string, attrs: { [key: string]: string }): void {
        const elem = new XElement(name, attrs, undefined);
        this.addNode(elem);
        this.openTagStack.push(elem);
    }
    
    public onCloseTag(): void {
        this.lastNode = null;

        const elem = this.openTagStack.pop() as XElement;
        if (this.elementCallback) {
            this.elementCallback(elem);
        }
    }

    public onText(data: string): void {
        const { lastNode } = this;
        if (lastNode?.type === XNodeType.Text) {
            lastNode.content += data;
        } else {
            const node = new XText(data);
            this.addNode(node);
            this.lastNode = node;
        }
    }

    public onComment(data: string): void {
        if (this.lastNode?.type === XNodeType.Comment) {
            this.lastNode.content += data;
            return;
        }
        const node = new XComment(data);
        this.addNode(node);
        this.lastNode = node;
    }

    public onCommentEnd(): void {
        this.lastNode = null;
    }

    public onCdataStart(): void {
        const text = new XText("");
        const node = new XCDATA([text]);

        this.addNode(node);

        text.parent = node;
        this.lastNode = text;
    }

    public onCdataEnd(): void {
        this.lastNode = null;
    }

    public onProcessingInstruction(name: string, data: string): void {
        const node = new XProcessingInstruction(name, data);
        this.addNode(node);
    }

    protected addNode(node: XNode): void {
        const parent = this.openTagStack[this.openTagStack.length - 1];        
        node.parent = parent;
        parent.childNodes.push(node);

        const prevSibling = parent.childNodes[parent.childNodes.length - 2];
        if (prevSibling) {
            node.prevSibling = prevSibling;
            prevSibling.nextSibling = node;
        }

        this.lastNode = null;
    }
}
