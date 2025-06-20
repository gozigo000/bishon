/** htmlparser2 DOM에서 사용되는 노드의 타입 */
export enum XNodeType {
    /** 루트 노드 타입 */
    Root = "root",
    /** 텍스트 노드 타입 */
    Text = "text",
    /** 태그(element) 타입 */
    Tag = "tag",
    /** `<script>` 타입 */
    Script = "script",
    /** `<style>` 타입 */
    Style = "style",
    /** `<? ... ?>` 타입 */
    Directive = "directive",
    /** `<!-- ... -->` 타입 */
    Comment = "comment",
    /** `<![CDATA[ ... ]]>` 타입 */
    CDATA = "cdata",
    /** `<!doctype ...>` 타입 */
    Doctype = "doctype",
}
