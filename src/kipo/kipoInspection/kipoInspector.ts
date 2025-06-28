import { XDocument, XElement, XProcessingInstruction } from '../2-lightParser/1-node/node';
import { PartFlag as Flag } from '../0-data/kipoTitles';
import { collectError } from '../0-utils/errorCollector';
import { parseXml } from '../2-lightParser/entry';
import { removeNode } from '../2-lightParser/2-domutils/manipulate';
import { compareRelativePos, RelPos } from '../2-lightParser/2-domutils/tree-utils';
import { XNodeType } from '../2-lightParser/1-node/nodeType';
import { inspect_numbering, inspect_claimNumbering } from './numbering';
import { inspect_img, inspect_math, inspect_paragraph, inspect_table } from './subParts';
import { inspect_invenTitle } from './invenTitle';
import { isString } from '../0-utils/typeCheck';

type InspectionResult = {
    xDoc: XDocument;
    countingReport: CountingReport;
}

export class KipoInspector {
    private xDoc: XDocument;
    private partFlags: Flag = 0;

    private mathNums: string[] = [];
    private tableNums: string[] = [];
    private claimNums: string[] = [];
    private figNums: string[] = [];

    public static generateReport(kXml: KXml | XDocument): InspectionResult {
        if (isString(kXml)) {
            kXml = parseXml(kXml);
        }
        return new KipoInspector(kXml).getResult();
    }

    private constructor(xDoc: XDocument) {
        this.xDoc = xDoc;
    }

    public getResult(): InspectionResult {
        this.preInspect();
        this.mainInspect();

        const countingReport: CountingReport = [
            { kind: '수학식', cnt: this.mathNums.length, nums: this.mathNums },
            { kind: '표', cnt: this.tableNums.length, nums: this.tableNums },
            { kind: '청구항', cnt: this.claimNums.length, nums: this.claimNums },
            { kind: '도면', cnt: this.figNums.length, nums: this.figNums },
        ];

        return {
            xDoc: this.xDoc,
            countingReport,
        };
    }

    private preInspect() {
        // inspect_bracket - E201, E204, E211 에러 수정
        this.xDoc.forEachXText(content => content
            .replaceAll('【', '[').replaceAll('】', ']') // TODO: 괄호 교체
            // .replaceAll('　', ' ') // 全角 스페이스 제거
        );
    }

    private mainInspect() {
        const root = this.xDoc;

        const docType = root.getNodeByType(XNodeType.Directive);
        if (!docType) {
            collectError(`문서 타입이 지정되지 않음: <? ... ?>`);
            root.prependChild(new XProcessingInstruction('?xml', '?xml version="1.0" encoding="utf-8"?'));
        }

        const KIPO = root.getElemByTag('<KIPO>');
        if (!KIPO) collectError('<KIPO> 태그가 없음');

        const PatentCAFDOC = root.getElemByTag('<PatentCAFDOC>');
        if (!PatentCAFDOC) collectError('<PatentCAFDOC> 태그가 없음');

        // 발명의설명
        const description = root.getKipoElem('<발명의설명>');
        if (description) this.partFlags |= Flag.발명의설명;
        // TODO: [발명의설명] 제목 안적었을 때 처리 작성하기

        const invTitle = root.getKipoElem('<발명의명칭>');
        if (invTitle) {
            this.partFlags |= Flag.발명의명칭;
            inspect_invenTitle(invTitle);
        }

        const techField = root.getKipoElem('<기술분야>');
        if (techField) {
            this.partFlags |= Flag.기술분야;
            // TODO: 문단 검사
        }

        const backgArt = root.getKipoElem('<배경기술>');
        if (backgArt) {
            this.partFlags |= Flag.배경기술;
            // TODO: 문단 검사
        }

        const citationList = root.getKipoElem('<선행기술문헌>');
        if (citationList) {
            this.partFlags |= Flag.선행기술문헌;
            this.inspect_citations(citationList, root);
        }

        /* 여기까지 테스트 코드 만들다가 멈춤 */

        const invSummary = root.getKipoElem('<발명의내용>');
        if (invSummary) {
            this.partFlags |= Flag.발명의내용;
            this.inspect_invenSummary(invSummary, root);
        }

        const briefDrawings = root.getKipoElem('<도간설>');
        if (briefDrawings) {
            this.partFlags |= Flag.도간설;
            // TODO: 문단 검사
        }

        const embodiments = root.getKipoElem('<발실구내>');
        if (embodiments) {
            this.partFlags |= Flag.발실구내;
            inspect_embodiments(embodiments, root);
        }

        const refSigns = root.getKipoElem('<부호의설명>');
        if (refSigns) {
            this.partFlags |= Flag.부호의설명;
            inspect_refSigns(refSigns, root);
        }

        const maths = root.getKipoElems('<수학식>');
        if (maths.length > 0) {
            this.partFlags |= Flag.수학식;
            this.mathNums = inspect_numbering(maths);
            for (const mathsTag of maths) {
                inspect_math(mathsTag);
            }
        }

        const tables = root.getKipoElems('<표>');
        if (tables.length > 0) {
            this.partFlags |= Flag.표;
            this.tableNums = inspect_numbering(tables);
            for (const tablesTag of tables) {
                inspect_table(tablesTag);
            }
        }

        // 청구범위
        const claims = root.getKipoElem('<청구범위>');
        if (claims) {
            this.partFlags |= Flag.청구범위;
            inspect_claims(claims, root);
        }

        const eachClaims = root.getKipoElems('<청구항>');
        if (eachClaims.length > 0) {
            this.partFlags |= Flag.청구항;
            this.claimNums = inspect_claimNumbering(eachClaims);
            for (const claim of eachClaims) {
                inspect_eachClaims(claim);
            }
        }

        // 도면
        const drawings = root.getKipoElem('<도면>');
        if (drawings) {
            this.partFlags |= Flag.도면;
            inspect_drawings(drawings, root);
        }

        const figs = root.getKipoElems('<도>');
        if (figs.length > 0) {
            this.partFlags |= Flag.도;
            this.figNums = inspect_numbering(figs);
        }

        // 요약서 - 도면 번호 체크 위해서 도면 검사 이후에 검사
        const abstract = root.getKipoElem('<요약서>');
        if (abstract) {
            this.partFlags |= Flag.요약서;
            this.inspect_abstract(abstract, root);
        }

        // 이미지
        const imgs = root.getElemsByTag('<img>');
        if (imgs.length > 0) {
            inspect_img(imgs);
        }

        inspect_mustHaveTitles(this.partFlags);
        // root.forEachXText(content => content.replaceAll('\n', ''));
        // root.mergeTextNodes();
    }

    private inspect_citations(citations: XElement, root: XDocument) {
        const patLiterature = root.getKipoElem('<특허문헌>');
        const nonPatLiterature = root.getKipoElem('<비특허문헌>');
        if (!patLiterature && !nonPatLiterature) {
            removeNode(citations);
            this.partFlags &= ~Flag.선행기술문헌;
            return;
        }

        const patcits = root.getKipoElems('<특허목록>');
        if (patLiterature && patcits.length === 0) {
            removeNode(patLiterature);
        }
        const nplcits = root.getKipoElems('<비특허목록>');
        if (nonPatLiterature && nplcits.length === 0) {
            removeNode(nonPatLiterature);
        }
        if (patcits.length === 0 && nplcits.length === 0) {
            removeNode(citations);
            this.partFlags &= ~Flag.선행기술문헌;
        }
    }

    private inspect_invenSummary(invSummary: XElement, root: XDocument) {
        const problem = root.getKipoElem('<과제>');
        if (problem) this.partFlags |= Flag.과제;
        const solution = root.getKipoElem('<수단>');
        if (solution) this.partFlags |= Flag.수단;
        const effects = root.getKipoElem('<효과>');
        if (effects) this.partFlags |= Flag.효과;

        if (problem && solution && effects) {
            const firstPTag = invSummary.getElemByTag('<p>');
            const PTagChildren = invSummary.getChildElemsByTag('<p>');
            if (firstPTag && compareRelativePos(firstPTag, problem) === RelPos.A_PRECEDES_B) {
                PTagChildren.reverse().forEach(problem.prependChild);
            }
        }
        else if (problem || solution || effects) {
            problem?.childNodes.forEach(invSummary.appendChild);
            solution?.childNodes.forEach(invSummary.appendChild);
            effects?.childNodes.forEach(invSummary.appendChild);
        }
    }

    private inspect_abstract(abstract: XElement, root: XDocument) {
        const summary = root.getKipoElem('<요약>');
        if (summary) this.partFlags |= Flag.요약;
        else collectError(`요약서에 [요약]이 없음`);

        const absFig = root.getKipoElem('<대표도>');
        if (absFig) this.partFlags |= Flag.대표도;

        if (!absFig && this.figNums.length > 0) {
            collectError(`[도면]을 작성한 경우 [요약서]에 [대표도]를 기재해야 함`);
        }

        if (absFig && this.figNums.length > 0) {
            const ref = root.getElemByTag('<figref>')!;
            const refNum = ref.getAttrValue('num')!;
            if (!this.figNums.includes(refNum)) {
                collectError(`[대표도]의 도면 번호(도 ${refNum})에 대응하는 [도면]이 없음`);
            }
        }

        if (absFig && this.figNums.length === 0) {
            removeNode(absFig);
        }
    }

    // TODO:
    // ### 기타 prettify 작업 ###
    // 중복 스페이스 바 제거
    // trimming
    // 은/는/이/가 수정 (괄호 뒤 조사)
    // 구성요소 번호 체크 -> 부호의 설명 추가
    // 도면 개수 체크 (도간설 - 도면 수)
    // "상기" 체크
    // "이다 ." -> "이다."
    // 부산대 맞춤법 체크
    // 청구항 "및" 체크
    // 청구항 "발명 카테고리" 체크
}

function inspect_embodiments(embodiments: XElement, root: XDocument) {
    let paragraphs = embodiments.getChildElemsByTag('<p>');
    for (const paragraph of paragraphs) {
        inspect_paragraph(paragraph);
    }
}

function inspect_refSigns(refSigns: XElement, root: XDocument) {
    // TODO: 부호의 설명 검사 - 글자 말고 도면 등 다른 게 있는지 등...
}

function inspect_claims(claimsTag: XElement, root: XDocument) {
    const eachClaims = root.getKipoElems('<청구항>');
    if (eachClaims.length === 0) {
        collectError(`[청구범위]에 [청구항]이 없음`);
        removeNode(claimsTag);
    }
}

function inspect_eachClaims(claim: XElement) {
    const cNum = claim.getAttrValue('num');
    const cText = claim.getElemByTag('<claim-text>')!.textContent;

    if (/^\s*삭\s*제[\.\,\s]*$/.test(cText)) {
        collectError(
            `청구항을 삭제하는 경우 해당 청구항 자체를 목차에서 삭제: [청구항 ${cNum}] -> 전부 삭제`
        );
    }
    if (
        // TODO: 화학식/반응식 검사 추가
        claim.getKipoElems('<표>').length > 0 ||
        claim.getKipoElems('<수학식>').length > 0 ||
        /\[(표|수학식|화학식|반응식) ?\w+?\]/.test(cText)
    ) {
        collectError(
            `청구항에는 [표], [수학식], [화학식], [반응식]을 삽입할 수 없음: [청구항 ${cNum}]`
        );
    }
}

function inspect_drawings(drawings: XElement, root: XDocument) {
    const figs = root.getKipoElems('<도>');
    for (const fig of figs) {
        const fNum = fig.getAttrValue('num')!;
        const imgs = fig.getElemsByTag('<img>');

        if (imgs.length === 0) {
            collectError(`도면에 이미지가 없음: [도 ${fNum}]`);
        }
        if (imgs.length > 1) {
            collectError(`하나의 도면에 복수의 이미지가 있음: [도 ${fNum}]`);
        }
        // TODO: 이미지 외 내용 삭제
    }
}

// 필수 목차
const MUST_HAVE_PARTS_MASK =
    Flag.발명의설명 |
    Flag.발명의명칭 |
    Flag.기술분야 |
    Flag.배경기술 |
    Flag.발명의내용 |
    Flag.발실구내 |
    Flag.요약서;

const MUST_TOGETHER_PARTS_MASK =
    Flag.도면 |
    Flag.도간설 |
    Flag.대표도;

// 필수 식별항목 유무/순서 검사
function inspect_mustHaveTitles(partFlags: Flag) {
    const has = partFlags;
    const hasNo = ~partFlags;
    // if ((hasNo & MUST_HAVE_PARTS) === 0) return;
    if (hasNo & Flag.발명의설명) collectError('필수 목차가 없음: [발명의 설명]');
    if (hasNo & Flag.발명의명칭) collectError('필수 목차가 없음: [발명의 명칭]');
    if (hasNo & Flag.기술분야) collectError('필수 목차가 없음: [기술분야]');
    if (hasNo & Flag.배경기술) collectError('필수 목차가 없음: [배경기술]');
    if (hasNo & Flag.발명의내용) collectError('필수 목차가 없음: [발명의 내용]');
    if (hasNo & Flag.발실구내) collectError('필수 목차가 없음: [발명을 실시하기 위한 구체적인 내용]');
    if (hasNo & Flag.요약서) collectError('필수 목차가 없음: [요약서]');

    // if (has & Flag.도면 && this.figNums.length > 0 && hasNo & Flag.도간설) {
    //     collectError('[도면]을 작성한 경우 [도면의 간단한 설명]을 작성해야 함');
    // }

    if (has & Flag.청구범위 && hasNo & Flag.청구항) collectError('[청구범위]에 [청구항]을 작성해야 함');
    if (has & Flag.요약서 && hasNo & Flag.요약) collectError('[요약서]에 [요약]을 작성해야 함');
    if (has & Flag.도면 && hasNo & Flag.도) collectError('[도면]에 [도]를 작성해야 함');

    // 포함하면 안되는 식별항목
    // [의견서] -> [표 #] X
}
