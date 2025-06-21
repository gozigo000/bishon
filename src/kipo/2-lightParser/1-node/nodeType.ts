/** XDOM에서 사용되는 노드의 타입 */
export enum XNodeType {
    /** 루트 노드 타입 */
    Root = "root",
    /** 텍스트 노드 타입 */
    Text = "text",
    /** 요소 노드 타입 */
    Element = "elem",
    /** `<? ... ?>` 타입 */
    Directive = "directive",
    /** `<!-- ... -->` 타입 */
    Comment = "comment",
    /** `<![CDATA[ ... ]]>` 타입 */
    CDATA = "cdata",
    /** `<!doctype ...>` 타입 */
    Doctype = "doctype",
}
