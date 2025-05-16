import { toOneLine } from '../utils';
import { titleTag, KXmlPouch } from './kXmlPouch';
import { dlog } from '../../_utils/env';

export function generateSpecInspectionResult(kXmlStr: KXml): [
    KXml, 
    InspectionReport, 
    CountingReport
] {
    const inspector = new KipoInspector(kXmlStr);
    return inspector.getResult();
}

class ElementCounter {
    public equ: CountInfo = {kind: '수학식', cnt: 0, nums: []};
    public tbl: CountInfo = {kind: '표', cnt: 0, nums: []};
    public clm: CountInfo = {kind: '청구항', cnt: 0, nums: []};
    public fig: CountInfo = {kind: '도면', cnt: 0, nums: []};
    public par: CountInfo = {kind: '문단', cnt: 0, nums: []};
    public countingReport: CountingReport = [];

    constructor() {
        this.countingReport = [this.equ, this.tbl, this.clm, this.fig, this.par];
    }
    public addEqu(n: string) { this.equ.cnt++; this.equ.nums.push(n); }
    public addTbl(n: string) { this.tbl.cnt++; this.tbl.nums.push(n); }
    public addFig(n: string) { this.fig.cnt++; this.fig.nums.push(n); }
    public addClm(n: string) { this.clm.cnt++; this.clm.nums.push(n); }
    public addPar(n: string) { this.par.cnt++; this.par.nums.push(n); }
}

class InspectionReporter {
    public inspectionReport: InspectionReport = [];

    public record(msg: InspectionMsg): string {
        if (msg.kind !== '개발') {
            this.inspectionReport.push(msg);
            return '';
        }
        // MEMO: 스택 트레이스 구조 예시
        // [0]: Error                               -> 에러 메시지와 이름
        // [1]: at 함수명 (파일경로:라인번호:컬럼번호)          -> 현재 함수
        // [2]: at 클래스명.메소드명 (파일경로:라인번호:컬럼번호) -> 이전 함수
        const stack = new Error().stack;
        if (!stack) return '';

        const line = stack.split('\n')[3];
        const match = line.match(/at\s+(\w+\.)?(\w+)\s+\(/);
        if (!match) return '';

        const className = match[1] ? match[1] : '전역: ';
        const methodName = match[2];
        msg.from = `${className}${methodName}()`;
        this.inspectionReport.push(msg);
        return '';
    }

//     public toString(): string {
//         return `
// 표: ${this.tblCnt} (${this.tblNums.join(', ')})
// 도면: ${this.figCnt} (${this.figNums.join(', ')})
// 수학식: ${this.equCnt} (${this.equNums.join(', ')})
// 청구항: ${this.clmCnt} (${this.clmNums.join(', ')})

// 개발 메시지: 
// ${this.msgs.filter(m => m.kind === '개발').map(m => `- ${m.msg}: ${m.pos ?? ''} - ${m.from ?? ''}`).join('\n')}
// 에러 메시지: 
// ${this.msgs.filter(m => m.kind === '에러').map(m => `- ${m.msg}: ${m.pos ?? ''}`).join('\n')}
// 경고 메시지:    
// ${this.msgs.filter(m => m.kind === '경고').map(m => `- ${m.msg}: ${m.pos ?? ''}`).join('\n')}
//         `;
//     }
}

class KipoInspector {
    private inputkXml: KXml;
    private roughXml: KXml = '';
    private safeXml: KXml = '';
    private headTags: KXml = '';
    private tailTags: KXml = '';

    private counter: ElementCounter = new ElementCounter();
    private report: InspectionReporter = new InspectionReporter();

    constructor(kXmlStr: KXml) {
        this.inputkXml = kXmlStr;
    }

    public getResult(): [KXml, InspectionReport, CountingReport] {
        this.startPreInspection();
        this.startMainInspection();
        return [
            this.safeXml, 
            this.report.inspectionReport, 
            this.counter.countingReport
        ];
    }

    private startPreInspection() {
        this.roughXml = toOneLine(this.inputkXml);
        if (/>\s+</.test(this.roughXml)) this.report.record({ 
            kind: '개발', pos: '<KipoXml>', process: 'GO',
            msg: '<태그> 사이에 공백이 있습니다.'
        });
        
        // inspect_bracket - E201, E204, E211 에러 수정
        this.roughXml = this.roughXml
            .replaceAll('【', '[').replaceAll('】', ']')
            .replaceAll('　', ' '); // 全角 스페이스 제거

        const headTags = this.roughXml.match(/^[\s\S]*documentID="\d{10}">/)?.[0];
        if (!headTags) return this.report.record({ 
            kind: '개발', pos: '<머리 태그>', process: 'STOP',
            msg: '<KIPO> 등 머리 태그가 없습니다.'
        });
        this.headTags = headTags.replaceAll('><', '>\n<');

        const tailTags = this.roughXml.match(/<\/PatentCAFDOC><\/KIPO>/)?.[0];
        if (!tailTags) return this.report.record({ 
            kind: '개발', pos: '<꼬리 태그>', process: 'STOP',
            msg: '</KIPO> 등 꼬리 태그가 없습니다.'
        });
        this.tailTags = tailTags.replaceAll('><', '>\n<');

        if (/<p num="\w*">\s*<\/p>/.test(this.roughXml)) {
            const match = this.roughXml.matchAll(/<p num="(\w*)">\s*<\/p>/g);
            const pNums = [];
            for (const { 1: pNum } of match) { pNums.push(pNum); }
            this.report.record({ 
                kind: '개발', pos: `문단 ${pNums.join(', ')}`, process: 'GO',
                msg: `공백이 있는 <p> 태그가 존재합니다.`
            });
        };

        // TODO: 검사 시작 전후 문단/청구항/도면 등 개수 기록해서 비교하기
    }

    private startMainInspection() {
        const disc = new KXmlPouch('<발명의 설명>', '<//발명의 설명>', this.roughXml);
        if (!disc.isInSpec) return this.report.record({ 
            kind: '에러', pos: '[발명의 설명]', process: 'STOP',
            msg: '필수 목차가 없습니다.'
        });
        
        const title = this.inspect_invenTitle(disc);

        const field = new KXmlPouch('<기술분야>', '<//기술분야>', disc.getInnerXml()); // TODO: 문단 검사
        const background = new KXmlPouch('<배경기술>', '<//배경기술>', disc.getInnerXml()); // TODO: 문단 검사
        const invenSummary = this.inspect_invenSummary(disc);
        const embodiments = this.inspect_embodiments(disc);
        const refSigns = this.inspect_refSigns(disc);
        const claims = this.inspect_claims(this.roughXml);
        const drawings = this.inspect_drawings(this.roughXml);
        const abstract = this.inspect_abstract(this.roughXml);
        const briefDrawings = new KXmlPouch('<도간설>', '<//도간설>', disc.getInnerXml()); // TODO: 문단 검사

        this.inspect_mustHaveTitles({
            disc, title, field, background, invenSummary,
            briefDrawings, embodiments, claims, abstract, drawings
        });

        this.inspect_numbering('표', this.counter.tbl.nums);
        this.inspect_numbering('수학식', this.counter.equ.nums);
        this.inspect_numbering('청구항', this.counter.clm.nums);
        this.inspect_numbering('도면', this.counter.fig.nums);

        this.safeXml = [
            this.headTags,
            titleTag['<발명의 설명>'],
            title,
            field.getOuterXml('\n', '\n').replaceAll('</p><p', '</p>\n<p'),
            background.getOuterXml('\n', '\n').replaceAll('</p><p', '</p>\n<p'),
            disc.has('<선행기술문헌>') ? this.inspect_citations(disc) : '',
            invenSummary,
            briefDrawings.getOuterXml('\n', '\n').replaceAll('<br/>', '<br/>\n'),
            embodiments,
            refSigns,
            titleTag['<//발명의 설명>'],
            claims,
            abstract,
            drawings,
            this.tailTags
        ].filter(Boolean).join('\n');

        return;

    }

    // E-263, E-266, E-269(중괄호 한 쪽이 없는 경우) 에러 보고
    // E-261, E-262, E-267, E-268, E-269(중괄호 짝이 여럿인 경우) 에러 수정
    private inspect_invenTitle(disc: KXmlPouch): KXml {
        let title = new KXmlPouch('<발명의 명칭>', '<//발명의 명칭>', disc.getInnerXml());
        if (!title.isInSpec) return this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '필수 목차가 없습니다.'
        });

        let ttl = title.getInnerXml().
            replaceAll(/\s+/g, ' '). // 줄바꿈 제거
            replaceAll(/<.*?>/g, ''); // 태그 제거

        if (!/{/.test(ttl)) return this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '발명의 명칭에 여는 중괄호({)가 없습니다.'
        });
        if (!/}/.test(ttl)) return this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '발명의 명칭에 닫는 중괄호(})가 없습니다.'
        });

        const match = ttl.match(/(.+)\{(.+?)\}/);
        if (!match) return this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '발명의 명칭에 한글 또는 영문 명칭이 없습니다.'
        });

        const krTitle = match[1].
            replaceAll(/[^a-zA-Z0-9가-힣 ~!@#$%^*\*\(\)-_=+,./?:;'’\\|]/g, '').
            replaceAll(/\s+/g, ' ').trim();
        const enTitle = match[2].
            replaceAll(/[^a-zA-Z0-9 ~!@#$%^*\*\(\)-_=+,./?:;'’\\|]/g, '').
            replaceAll(/\s+/g, ' ').trim();
        if (!/[가-힣]+/.test(krTitle)) return this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '발명의 명칭에 한글 명칭이 없습니다.'
        });
        if (!/[a-zA-Z]+/.test(enTitle)) return this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '발명의 명칭에 영문 명칭이 없습니다.'
        });
        if (krTitle.length > 270) return this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '한글 명칭이 270자를 초과합니다.'
        });
        if (enTitle.length > 540) return this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '영문 명칭이 540자를 초과합니다.'
        });

        title.setInnerXml(`${krTitle}{${enTitle}}`);

        return title.getOuterXml('', '\n');
    }

    private inspect_citations(disc: KXmlPouch): KXml {
        let citations = new KXmlPouch('<선행기술문헌>', '<//선행기술문헌>', disc.getInnerXml());
        if (!citations.isInSpec) return '';

        let patcit = new KXmlPouch('<특허문헌>', '<//특허문헌>', citations.getInnerXml());
        let nonPatcit = new KXmlPouch('<비특허문헌>', '<//비특허문헌>', citations.getInnerXml());
        if (!patcit.isInSpec && !nonPatcit.isInSpec) return '';

        const inspect_cit = (cit: KXmlPouch, tag1: string, tag2: string) => {
            let citList = new KXmlPouch(tag1, tag2, cit.getInnerXml());
            if (!citList.isInSpec) return '';

            return [
                cit.getTag1().replaceAll('><', '>\n<'),
                (!citList.hasMany) ?
                    citList.getOuterXml('\n', '\n').
                        replaceAll('><text>', '>\n<text>').
                        replaceAll('</text><', '</text>\n<') :
                    citList.getOuterXmls().map((xml, i) => {
                        if (i > 0) return xml;
                        else return xml.
                            replaceAll('><text>', '>\n<text>').
                            replaceAll('</text><', '</text>\n<');
                    }).filter(Boolean).join('\n'),
                cit.getTag2().replaceAll('><', '>\n<')
            ].filter(Boolean).join('\n');
        }

        const patcitList = (patcit.isInSpec) ? 
            inspect_cit(patcit, '<특허목록>', '<//특허목록>') : '';
        const nonPatcitList = (nonPatcit.isInSpec) ? 
            inspect_cit(nonPatcit, '<비특허목록>', '<//비특허목록>') : '';
        if (!patcitList && !nonPatcitList) return '';

        return [
            titleTag['<선행기술문헌>'],
            patcitList,
            nonPatcitList,
            titleTag['<//선행기술문헌>']
        ].filter(Boolean).join('\n')
    }

    private inspect_invenSummary(disc: KXmlPouch): KXml {
        let invenSummary = new KXmlPouch('<발명의 내용>', '<//발명의 내용>', disc.getInnerXml());
        if (!invenSummary.isInSpec) return '';

        let task = new KXmlPouch('<과제>', '<//과제>', invenSummary.getInnerXml());
        let solution = new KXmlPouch('<수단>', '<//수단>', invenSummary.getInnerXml());
        let effect = new KXmlPouch('<효과>', '<//효과>', invenSummary.getInnerXml());

        if (task.isInSpec && solution.isInSpec && effect.isInSpec) {
            return [
                titleTag['<발명의 내용>'],
                task.getOuterXml('\n', '\n').replaceAll('</p><p', '</p>\n<p'),
                solution.getOuterXml('\n', '\n').replaceAll('</p><p', '</p>\n<p'),
                effect.getOuterXml('\n', '\n').replaceAll('</p><p', '</p>\n<p'),
                titleTag['<//발명의 내용>'],
            ].filter(Boolean).join('\n');
        }
        else if (task.isInSpec || solution.isInSpec || effect.isInSpec) {
            return invenSummary.
                peelTag('<과제>', '<//과제>').
                peelTag('<수단>', '<//수단>').
                peelTag('<효과>', '<//효과>').
                getOuterXml('\n', '\n').replaceAll('</p><p', '</p>\n<p');
        }
        else {
            return invenSummary.
                getOuterXml('\n', '\n').replaceAll('</p><p', '</p>\n<p');
        }
    }

    private inspect_embodiments(disc: KXmlPouch): KXml {
        let embodiments = new KXmlPouch('<발실구내>', '<//발실구내>', disc.getInnerXml());
        if (!embodiments.isInSpec) return '';

        let paragraphs = new KXmlPouch('<p>', '</p>', embodiments.getInnerXml(), { isMany: true });
        if (!paragraphs.isInSpec) return '';

        for (const [i, paragraph] of paragraphs.getOuterXmls().entries()) {
            if (/<tables .*?<\/tables>/.test(paragraph)) {
                const table = this.inspect_table(paragraphs.getInnerXml(i));
                paragraphs.setInnerXml(i, table);
                continue;
            }
            if (/<maths .*?<\/maths>/.test(paragraph)) {
                const math = this.inspect_math(paragraphs.getInnerXml(i));
                paragraphs.setInnerXml(i, math);
                continue;
            }
            const contents = this.inspect_paragraph(paragraphs.getInnerXml(i));
            paragraphs.setInnerXml(i, contents);
        }

        return [
            titleTag['<발실구내>'],
            ...paragraphs.getOuterXmls(),
            titleTag['<//발실구내>']
        ].filter(Boolean).join('\n');
    }

    private inspect_table(tables: string): string {
        const tNum = tables.match(/<tables num="(\w*)">/)![1];
        this.counter.addTbl(tNum);

        const img = tables.match(/<img .*?>/g);
        if (img) {
            if (img.length > 1) {
                this.report.record({ 
                    kind: '에러', pos: `[표 ${tNum}]`, process: 'STOP',
                    msg: `표에 복수의 이미지가 있습니다.`
                });
            };
            const safeImg = this.inspect_img(img[0]);
            return `<tables num="${tNum}">` + safeImg + `</tables>`;
        }

        const tbl = tables.match(/<table>.+?<\/table>/g);
        if (tbl) {
            if (tbl.length > 1) {
                this.report.record({ 
                    kind: '에러', pos: `[표 ${tNum}]`, process: 'STOP',
                    msg: `복수의 표가 있습니다.`
                });
            };
            // TODO: 표 제목 처리 - 임시로 표 제목은 제거함
            const safeTbl = tbl[0].replace(/<title>[\s\S]*?<\/title>/, '').
                replaceAll(`<colspec`, '\n<colspec').
                replaceAll(`<tbody>`, '\n<tbody>').
                replaceAll(`<row>`, '\n<row>').
                replaceAll(`<entry`, '\n<entry').
                replaceAll(`<\/row>`, '\n<\/row>').
                replaceAll(`<\/tbody>`, '\n<\/tbody>').
                replaceAll(`<\/tgroup>`, '\n<\/tgroup>').
                replaceAll(`<\/table>`, '\n<\/table>');
            return `<tables num="${tNum}">` + safeTbl + `\n</tables>`;
        }

        return this.report.record({ 
            kind: '에러', pos: `[표 ${tNum}]`, process: 'STOP',
            msg: `표에 내용이 없습니다.`
        });
    }

    private inspect_math(maths: string): string {
        const eNum = maths.match(/<maths num="(\w*)">/)![1];
        this.counter.addEqu(eNum);

        const img = maths.match(/<img .*?>/g);
        if (!img) {
            return this.report.record({ 
                kind: '에러', pos: `[수학식 ${eNum}]`, process: 'STOP',
                msg: `수학식 이미지가 없습니다.`
            });
        };
        if (img.length > 1) {
            return this.report.record({ 
                kind: '에러', pos: `[수학식 ${eNum}]`, process: 'STOP',
                msg: `복수의 수학식 이미지가 있습니다.`
            });
        };

        const safeImg = this.inspect_img(img[0]);

        return `<maths num="${eNum}">` + safeImg + `</maths>`;
    }

    private inspect_refSigns(disc: KXmlPouch): KXml {
        let refSigns = new KXmlPouch('<부호의 설명>', '<//부호의 설명>', disc.getInnerXml());
        if (!refSigns.isInSpec) return '';
        // TODO: 부호의 설명 검사 - 글자 말고 도면 등 다른 게 있는지 등...
        return refSigns.getOuterXml('\n', '\n').replaceAll('<br/>', '<br/>\n');
    }

    // TODO: 상세 구현 필요
    private inspect_paragraph(contents: string): string {
        let ret = contents;
        if (/<img .*?>/.test(contents)) {
            const imgs = contents.match(/<img .*?>/g)!;
            for (const img of imgs) {
                const safeImg = this.inspect_img(img);
                ret = ret.replace(img, safeImg);
            }
        }
        return ret;
    }

    private inspect_claims(spec: string): string {
        let claims = new KXmlPouch('<청구범위>', '<//청구범위>', spec);
        if (!claims.isInSpec) return '';

        let claim = new KXmlPouch('<청구항 #>', '<//청구항>', claims.getInnerXml(), { isMany: true });
        if (!claim.isInSpec) return '';

        for (const [i, clm] of claim.getInnerXmls().entries()) {
            const cNum = claim.getTag1(i).match(/num="(\w*)"/)![1];
            this.counter.addClm(cNum);

            if (/^\s*삭\s*제[\.\,\s]*$/.test(clm)) {
                this.report.record({ 
                    kind: '에러', pos: `[청구항 ${cNum}]`, process: 'STOP',
                    msg: `청구항을 삭제하려면 해당 청구항 자체를 목차에서 삭제하세요: [청구항 ${cNum}] -> 전부 삭제`});
            }
            // TODO: 화학식/반응식 검사 추가
            if (/<(tables|maths) .*?>/.test(clm) ||
                /\[(표|수학식|화학식|반응식) ?\w+?\]/.test(clm)
            ) {
                this.report.record({ 
                    kind: '에러', pos: `[청구항 ${cNum}]`, process: 'STOP',
                    msg: `청구항에는 [표], [수학식], [화학식], [반응식]을 삽입할 수 없습니다.`});
            }
            if (/<img .*?>/.test(clm)) {
                const imgs = clm.match(/<img .*?>/g)!;
                for (const img of imgs) {
                    const safeImg = this.inspect_img(img);
                    claim.replaceInnerXml({ idx: i, oldXml: img, newXml: safeImg });
                }
            }
        }

        return [
            titleTag['<청구범위>'],
            ...claim.getOuterXmls('\n', '\n'),
            titleTag['<//청구범위>']
        ].filter(Boolean).join('\n');
    }

    private inspect_abstract(spec: string): string {
        let abstract = new KXmlPouch('<요약서>', '<//요약서>', spec);
        if (!abstract.isInSpec) return '';

        let summary = new KXmlPouch('<요약>', '<//요약>', abstract.getInnerXml());
        if (!summary.isInSpec) {
            this.report.record({ 
                kind: '에러', pos: '[요약서]', process: 'STOP',
                msg: `요약서에 [요약]이 없습니다.`});
        }

        let absFig = new KXmlPouch('<대표도>', '<//대표도>', abstract.getInnerXml());
        if (this.counter.fig.cnt > 0) {
            if (!absFig.isInSpec) {
                this.report.record({ 
                    kind: '에러', pos: '[요약서]', process: 'STOP',
                    msg: `[도면]을 작성한 경우 [요약서]에 [대표도]를 기재해야 합니다.`});
            } 
            else {
                const regex = /<figref num="(\w*)"/;
                const xml = absFig.getInnerXml();
                if (!regex.test(xml)) {
                    this.report.record({ 
                        kind: '에러', pos: '[대표도]', process: 'STOP',
                        msg: `[대표도]에는 도면 번호 중 하나를 기재해야 합니다.`});
                }
                const absFigNum = xml.match(regex)![1];
                if (!this.counter.fig.nums.includes(absFigNum)) {
                    this.report.record({ 
                        kind: '에러', pos: '[대표도]', process: 'STOP',
                        msg: `[대표도]에 기재된 도면 번호(도 ${absFigNum})가 [도면]에 없는 번호입니다.`});
                }
            }
        }

        return [
            titleTag['<요약서>'],
            summary.getOuterXml('\n', '\n').replaceAll('<br/>', '<br/>\n'),
            absFig.isInSpec ? absFig.getOuterXml('\n', '\n').replaceAll('><', '>\n<') : '',
            titleTag['<//요약서>']
        ].filter(Boolean).join('\n');
    }

    private inspect_drawings(spec: string): string {
        let drawings = new KXmlPouch('<도면>', '<//도면>', spec);
        if (!drawings.isInSpec) return '';

        let figs = new KXmlPouch('<도 #>', '<//도>', drawings.getInnerXml(), { isMany: true });
        if (!figs.isInSpec) return '';

        for (const [i, fig] of figs.getInnerXmls().entries()) {
            const fNum = figs.getTag1(i).match(/num="(\w*)"/)![1];
            this.counter.addFig(fNum);

            const imgs = fig.match(/<img .*?>/g);
            if (!imgs) {
                this.report.record({ 
                    kind: '에러', pos: `[도 ${fNum}]`, process: 'STOP',
                    msg: `도면에 이미지가 없습니다.`});
                continue;
            }
            if (imgs.length > 1) {
                this.report.record({ 
                    kind: '에러', pos: `[도 ${fNum}]`, process: 'STOP',
                    msg: `하나의 도면에 복수의 이미지가 있습니다.`});
                continue;
            }
            const safeImg = this.inspect_img(imgs[0]);
            figs.setInnerXml(i, safeImg);
        }

        return [
            titleTag['<도면>'],
            ...figs.getOuterXmls('\n', '\n'),
            titleTag['<//도면>']
        ].filter(Boolean).join('\n');
    }

    private inspect_img(img: string): string {
        const imgInfo = img.match(/<img id="(\w+)" he="(\d+)" wi="(\d+)" file="pat(\d{5})\.(\w+)" img-format="(\w+)" \/>/);
        if (!imgInfo) return this.report.record({ 
            kind: '개발', pos: img, process: 'STOP',
            msg: `이미지 태그 형식이 잘못되었습니다.`});

        if (!imgInfo[1].match(/^i\d{4}$/)) return this.report.record({ 
            kind: '개발', pos: img, process: 'STOP',
            msg: `이미지 번호가 올바르지 않습니다.`});
        if (Number(imgInfo[2]) > 222) return this.report.record({ 
            kind: '개발', pos: img, process: 'STOP',
            msg: `이미지 높이가 222mm를 초과합니다.`});
        if (Number(imgInfo[3]) > 165) return this.report.record({ 
            kind: '개발', pos: img, process: 'STOP',
            msg: `이미지 너비가 165mm를 초과합니다.`});
        if (!imgInfo[4].match(/^\d{5}$/)) return this.report.record({ 
            kind: '개발', pos: img, process: 'STOP',
            msg: `이미지 파일명이 올바르지 않습니다.`});
        if (!imgInfo[5].match(/^(jpe?g|tiff?)$/)) return this.report.record({ 
            kind: '개발', pos: img, process: 'STOP',
            msg: `이미지 파일 확장자가 올바르지 않습니다.`});

        return img;
    }

    private inspect_numbering(title: string, nums: string[]) {
        if (title === '청구항') {
            this.inspect_claimNumbering(nums);
            return;
        }
        // 표/수학식/도면 번호 검사
        let prevNum = '-';
        let prevDigit = 0;
        let prevAlpha = '`'; // '`'의 아스키코드: 96 ('a'의 아스키코드: 97)
        const numSet = new Set<string>();
        for (const num of nums) {
            const numTitle = `[${title.replace('도면', '도')} ${num}]`;
            const prevNumTitle = `[${title.replace('도면', '도')} ${prevNum}]`;

            // 번호 형식 검사
            if (!/^\d{1,3}[a-z]?$/.test(num)) {
                this.report.record({ 
                    kind: '에러', pos: numTitle, process: 'STOP',
                    msg: `${title} 번호는 숫자(최대 3자리) + 알파벳 소문자(1자)만 가능합니다.`});
            }
            // 중복 검사
            if (numSet.has(num)) {
                this.report.record({ 
                    kind: '에러', pos: numTitle, process: 'STOP',
                    msg: `${title} 번호가 중복 사용되었습니다.`});
            }
            numSet.add(num);

            // 순차적 증가 검사
            const digit = parseInt(num);
            const alpha = num.replace(/\d*/, '');
            if (digit === 1 + prevDigit && (alpha === '' || alpha === 'a')) {
                // 이 경우는 정상 (예: 2/2c -> 3, 2/2c -> 3, 2/2c -> 3a)
            }
            else if (digit === prevDigit && alpha.charCodeAt(0) === 1 + prevAlpha.charCodeAt(0)) {
                // 이 경우는 정상 (예: 2b -> 2c)
            }
            else if (digit === prevDigit && prevDigit > 0) {
                dlog(alpha.charCodeAt(0), prevAlpha.charCodeAt(0));
                // 같은 숫자인데 알파벳이 없거나, 순서가 맞지 않는 경우 (예: 5 -> 5, 5a -> 5, 5a -> 5b, 5 -> 5a)
                this.report.record({ 
                    kind: '에러', pos: `${prevNumTitle}, ${numTitle}`, process: 'STOP',
                    msg: `숫자가 같은 ${title} 번호는 알파벳을 순차적으로 부여해야 합니다.`});
                break;
            }
            else if (digit !== 1 + prevDigit && prevDigit > 0) {
                // 숫자 부분이 1씩 증가하지 않는 경우 (예: 5/5a -> 4/4a, 5/5a -> 7/7a)
                this.report.record({ 
                    kind: '에러', pos: `${prevNumTitle}, ${numTitle}`, process: 'STOP',
                    msg: `${title} 번호는 순차적으로 증가(1, 2, 3, ...)해야 합니다.`});
                break;
            }
            else if ((digit !== 1 || num !== '1a') && prevDigit === 0) {
                // 첫번째 번호가 '1' 또는 '1a'가 아닌 경우 (예: 2, 1b)
                this.report.record({ 
                    kind: '에러', pos: numTitle, process: 'STOP',
                    msg: `${title} 번호는 '1' 또는 '1a'로 시작해야 합니다.`});
                break;
            }
            else {
                // 그 외의 경우 - HACK: 여기에 걸리는 경우가 있는지 체크
                this.report.record({ 
                    kind: '에러', pos: numTitle, process: 'STOP',
                    msg: `${title} 번호에 오류가 있는 것 같습니다.`});
                break;
            }
            prevNum = num;
            prevDigit = digit;
            prevAlpha = alpha;
        }
    }

    private inspect_claimNumbering(nums: string[]) {
        // 청구항 번호 검사
        let prevNum = 0;
        const numSet = new Set<string>();
        for (const num of nums) {
            // 숫자만 사용 가능
            if (!/^\d+$/.test(num)) {
                this.report.record({ 
                    kind: '에러', pos: `[청구항 ${num}]`, process: 'STOP',
                    msg: `청구항 번호는 숫자만 사용할 수 있습니다.`});
            }
            // 중복 검사
            if (numSet.has(num)) {
                this.report.record({ 
                    kind: '에러', pos: `[청구항 ${num}]`, process: 'STOP',
                    msg: `청구항 번호가 중복 사용되었습니다.`});
            }
            // 1씩 증가 검사
            if (Number(num) !== prevNum + 1) {
                this.report.record({ 
                    kind: '에러', pos: `[청구항 ${prevNum}], [청구항 ${num}]`, process: 'STOP',
                    msg: `청구항 번호를 순차적으로(1, 2, 3, ...) 부여해야 합니다.`});
            }
            prevNum += 1;
            numSet.add(num);
        }
    }

    // 필수 식별항목 유무/순서 검사
    private inspect_mustHaveTitles({
        disc, title, field, background, // [발명의 설명], [발명의 명칭], [기술분야], [배경기술], 
        invenSummary, briefDrawings, embodiments, // [발명의 내용], [도간설], [발실구내], 
        claims, abstract, drawings // [청구범위], [요약서], [도면]
    }: {
        disc: KXmlPouch, title: string, field: KXmlPouch, background: KXmlPouch,
        invenSummary: string, briefDrawings: KXmlPouch, embodiments: string,
        claims: string, abstract: string, drawings: string
    }) {
        if (!disc.isInSpec) this.report.record({ 
            kind: '에러', pos: '[발명의 설명]', process: 'STOP',
            msg: '필수 목차가 없습니다.'});
        if (!title) this.report.record({ 
            kind: '에러', pos: '[발명의 명칭]', process: 'STOP',
            msg: '필수 목차가 없습니다.'});
        if (!field.isInSpec) this.report.record({ 
            kind: '에러', pos: '[기술분야]', process: 'STOP',
            msg: '필수 목차가 없습니다.'});
        if (!background.isInSpec) this.report.record({ 
            kind: '에러', pos: '[배경기술]', process: 'STOP',
            msg: '필수 목차가 없습니다.'});
        if (!invenSummary) this.report.record({ 
            kind: '에러', pos: '[발명의 내용]', process: 'STOP',
            msg: '필수 목차가 없습니다.'});
        if (!drawings && this.counter.fig.cnt > 0) {
            if (!briefDrawings.isInSpec) this.report.record({ 
                kind: '에러', pos: '[도면의 간단한 설명]', process: 'STOP',
                msg: '도면을 작성한 경우 도면의 간단한 설명을 작성해야 합니다.'});
        }
        if (!embodiments) this.report.record({ 
            kind: '에러', pos: '[발명을 실시하기 위한 구체적인 내용]', process: 'STOP',
            msg: '필수 목차가 없습니다.'});
        if (!claims) this.report.record({ 
            kind: '에러', pos: '[청구범위]', process: 'STOP',
            msg: '필수 목차가 없습니다.'});
        if (!abstract) this.report.record({ 
            kind: '에러', pos: '[요약서]', process: 'STOP',
            msg: '필수 목차가 없습니다.'});

        // 포함하면 안되는 식별항목
        // [의견서] -> [표 #] X
    }

    // TODO: 문단번호 순서 검사

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
    // 
} 