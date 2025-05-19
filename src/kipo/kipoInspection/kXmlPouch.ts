const kTagRegex: Record<string, RegExp> = {
    'xml': /^<\?xml version="1\.0" encoding="utf-8"\?>/,
    'KIPO': /<KIPO keapsVersion="[\d\.]+" editorKind="[A-Z]" pageCount="[\d]+" imgApply="N" specId="SD00000001" xmlns="http:\/\/www\.kipo\.go\.kr">[\s\S]*<\/KIPO>/,
    'PatentCAFDOC': /<PatentCAFDOC docflag="1\.0" documentID="\d+">[\s\S]*<\/PatentCAFDOC>/,
    'description': /<description>[\s\S]*<\/description>/,
    'inventionTitle': /<invention-title>[\s\S]*<\/invention-title>/,
    'technicalField': /<technical-field>[\s\S]*<\/technical-field>/,
    'citationList': /<citation-list>[\s\S]*<\/citation-list>/,
    'patentLiterature': /<patent-literature><p num="\d{4}">[\s\S]*<\/p><\/patent-literature>/,
    'nonPatentLiterature': /<non-patent-literature><p num="\d{4}">[\s\S]*<\/p><\/non-patent-literature>/,
    'backgroundArt': /<background-art>[\s\S]*<\/background-art>/,
    'summaryOfInvention': /<summary-of-invention>[\s\S]*<\/summary-of-invention>/,
    'techProblem': /<tech-problem>[\s\S]*<\/tech-problem>/,
    'techSolution': /<tech-solution>[\s\S]*<\/tech-solution>/,
    'advantageousEffects': /<advantageous-effects>[\s\S]*<\/advantageous-effects>/,
    'descriptionOfDrawings': /<description-of-drawings>[\s\S]*<\/description-of-drawings>/,
    'descriptionOfEmbodiments': /<description-of-embodiments>[\s\S]*<\/description-of-embodiments>/,
    'claims': /<claims>[\s\S]*<\/claims>/,
    'abstract': /<abstract>[\s\S]*<\/abstract>/,
    'summary': /<summary>[\s\S]*<\/summary>/,
    'abstractFigure': /<abstract-figure><p num="\d+a"><figref num="\w+" \/><\/p><\/abstract-figure>/,
    'drawings': /<drawings>[\s\S]*<\/drawings>/,
    
    'p': /<p num="\d*">[\s\S]*?<\/p>/g,
    'maths': /<maths num="\w*">.*?<\/maths>/g,
    'tables': /<tables num="\w*">.*?<\/tables>/g,
    'figure': /<figure num="\w*"><img id="i\d{4}" he="\d+" wi="\d+" file="pat\d{5}\.\w+" img-format="\w+" \/><\/figure>/g,
    'claim': /<claim num="\d*"><claim-text>[\s\S]*<\/claim-text><\/claim>/g,
    'img': /<img id="i\d{4}" he="\d*" wi="\d*" file="pat\d{5}\.\w*" img-format="\w*" \/>/g,
    'patcit': /<patcit num="\d{4}"><text>[\s\S]*<\/text><\/patcit>/g,
    'nplcit': /<nplcit num="\d{4}"><text>[\s\S]*<\/text><\/nplcit>/g,
}

export const titleTag: Record<string, string> = {
    '<p>': '<p num="\\d\+\?">',
    '</p>': '</p>',
    '<발명의 설명>': '<description>',
    '<//발명의 설명>': '</description>',
    '<발명의 명칭>': '<invention-title>',
    '<//발명의 명칭>': '</invention-title>',
    '<기술분야>': '<technical-field>',
    '<//기술분야>': '</technical-field>',
    '<배경기술>': '<background-art>',
    '<//배경기술>': '</background-art>',
    '<발명의 배경이 되는 기술>': '<background-art>',
    '<//발명의 배경이 되는 기술>': '</background-art>',
    '<선행기술문헌>': '<citation-list>',
    '<//선행기술문헌>': '</citation-list>',
    '<특허문헌>': '<patent-literature><p num="\\d\+\?">',
    '<//특허문헌>': '</p></patent-literature>',
    '<특허목록>': '<patcit num="\\d\+\?">',
    '<//특허목록>': '</patcit>',
    '<비특허문헌>': '<non-patent-literature><p num="\\d\+\?">',
    '<//비특허문헌>': '</p></non-patent-literature>',
    '<비특허목록>': '<nplcit num="\\d\+\?">',
    '<//비특허목록>': '</nplcit>',
    '<발명의 내용>': '<summary-of-invention>',
    '<//발명의 내용>': '</summary-of-invention>',
    '<과제>': '<tech-problem>',
    '<//과제>': '</tech-problem>',
    '<해결하려는 과제>': '<tech-problem>',
    '<//해결하려는 과제>': '</tech-problem>',
    '<해결하고자 하는 과제>': '<tech-problem>',
    '<//해결하고자 하는 과제>': '</tech-problem>',
    '<수단>': '<tech-solution>',
    '<//수단>': '</tech-solution>',
    '<과제의 해결 수단>': '<tech-solution>',
    '<//과제의 해결 수단>': '</tech-solution>',
    '<효과>': '<advantageous-effects>',
    '<//효과>': '</advantageous-effects>',
    '<발명의 효과>': '<advantageous-effects>',
    '<//발명의 효과>': '</advantageous-effects>',
    '<도간설>': '<description-of-drawings>',
    '<//도간설>': '</description-of-drawings>',
    '<도면의 간단한 설명>': '<description-of-drawings>',
    '<//도면의 간단한 설명>': '</description-of-drawings>',
    '<발실구내>': '<description-of-embodiments>',
    '<//발실구내>': '</description-of-embodiments>',
    '<부호의 설명>': '<reference-signs-list>',
    '<//부호의 설명>': '</reference-signs-list>',
    '<발명을 실시하기 위한 구체적인 내용>': '<description-of-embodiments>',
    '<//발명을 실시하기 위한 구체적인 내용>': '</description-of-embodiments>',
    '<청구범위>': '<claims>',
    '<//청구범위>': '</claims>',
    '<청구항 #>': '<claim num="\\w\*">',
    '<//청구항>': '</claim>',
    '<요약서>': '<abstract>',
    '<//요약서>': '</abstract>',
    '<요약>': '<summary>',
    '<//요약>': '</summary>',
    '<대표도>': '<abstract-figure>',
    '<//대표도>': '</abstract-figure>',
    '<도면>': '<drawings>',
    '<//도면>': '</drawings>',
    '<도 #>': '<figure num="\\w\*">',
    '<//도>': '</figure>',
    '<표 #>': '<tables num="\\w\*">',
    '<//표>': '</tables>',
    '<수학식 #>': '<maths num="\\w\*">',
    '<//수학식>': '</maths>',
}

export class KXmlPouch {
    public name: string = '한글명칭';
    public isInSpec: boolean = false;
    public hasMany: boolean = false;
    public howMany: number = 0;
    public hasContents: boolean[] = []; // TODO: 이걸로 내용 있는지 확인하는 거 추가하기

    private kTag1s: KXml[] = [];
    private kTag2s: KXml[] = [];
    private rawXmls: KXml[] = [];
    private innerXmls: KXml[] = [];

    constructor(tag1: KXml, tag2: KXml, content: KXml, option: { isMany?: boolean } = {}) {
        this.name = tag1.slice(1, -1);

        this.testFnCall({ kTag: tag1 }).testFnCall({ kTag: tag2 });
        const t1 = titleTag[tag1];
        const t2 = titleTag[tag2];

        const escaped = `(${t1})([\\s\\S]*?)(${t2})`;
        const regex = new RegExp(escaped, 'g');
        const match = content.matchAll(regex); // MEMO: `iterator`만 반환 -> if (!match) == true

        for (const { 1: tag1, 2: innerXml, 3: tag2, input } of match) {
            this.kTag1s.push(tag1);
            this.kTag2s.push(tag2);
            this.rawXmls.push(input);
            this.innerXmls.push(innerXml);
            this.hasContents.push(innerXml.trim().length > 0);
        }
        this.howMany = this.rawXmls.length;
        if (this.howMany > 0) this.isInSpec = true;
        if (this.howMany > 1 || option.isMany) this.hasMany = true;
    }

    /** 내부에 다른 태그 존재 여부 확인 */
    public has(kTag: KXml, idx = 0): boolean {
        this.testFnCall({ kTag }).testFnCall({ idx });
        const tag = titleTag[kTag];
        return this.innerXmls[idx].includes(tag);
    }

    /** 자식 태그 내용은 남기고 태그만 삭제 */
    public peelTag(tag1: KXml, tag2: KXml, idx = 0): KXmlPouch {
        this.testFnCall({ kTag: tag1 }).testFnCall({ kTag: tag2 }).testFnCall({ idx });
        const t1 = titleTag[tag1];
        const t2 = titleTag[tag2];
        this.innerXmls[idx] = this.innerXmls[idx].replace(t1, '').replace(t2, '');
        return this;
    }

    public getTag1(idx = 0): KXml {
        this.testFnCall({ idx });
        return this.kTag1s[idx];
    }
    public getTag2(idx = 0): KXml {
        this.testFnCall({ idx });
        return this.kTag2s[idx];
    }
    public getNoGapTagPair(idx = 0): KXml {
        this.testFnCall({ idx });
        return this.kTag1s[idx] + this.kTag2s[idx];
    }

    public getInnerXml(idx = 0): KXml {
        this.testFnCall({ idx });
        return this.innerXmls[idx];
    }
    public getInnerXmls(): KXml[] {
        this.testFnCall({ from: 'getInnerXmls' });
        return this.innerXmls;
    }

    public getOuterXml(ln1 = '', ln2 = '', idx = 0): KXml {
        this.testFnCall({ idx });
        return this.kTag1s[idx] + ln1 + this.getInnerXml(idx) + ln2 + this.kTag2s[idx];
    }
    public getOuterXmls(ln1 = '', ln2 = ''): KXml[] {
        this.testFnCall({ from: 'getOuterXmls' });
        return this.innerXmls.map(
            (innerXml, i) => this.kTag1s[i] + ln1 + innerXml + ln2 + this.kTag2s[i]
        );
    }

    public setInnerXml(xml: KXml): void;
    public setInnerXml(idx: number, xml: KXml): void;
    public setInnerXml(xori: KXml | number, xml?: KXml) {
        if (typeof xori === 'string') {
            this.innerXmls[0] = xori;
        }
        else if (typeof xori === 'number' && xml) {
            this.testFnCall({ idx: xori });
            this.innerXmls[xori] = xml;
        }
    }

    /** 내부 XML 중 일부 내용을 새로운 내용으로 교체 */
    public replaceInnerXml({ idx, oldXml, newXml }: { idx: number, oldXml: KXml, newXml: KXml }) {
        this.testFnCall({ idx });
        this.innerXmls[idx] = this.innerXmls[idx].replace(oldXml, newXml);
    }

    private testFnCall({ kTag, idx, from }: { kTag?: string, idx?: number, from?: string }): KXmlPouch {
        try {
            if (kTag && !titleTag.hasOwnProperty(kTag)) {
                throw new Error(`식별항목 한글명이 잘못 입력되었습니다.\n\t   kTag: ${kTag}\n`);
            }
            if (idx && idx > 0) {
                if (!this.hasMany) throw new Error(`이 KXmlPouch에는 하나의 태그만 들어 있으므로 idx(${idx})를 지정하지 마세요.\n`);
            }
            if (from && (from === 'getInnerXmls' || from === 'getOuterXmls')) {
                if (!this.hasMany) throw new Error(`이 KXmlPouch에는 하나의 태그만 들어 있으므로 .${from}()를 호출할 수 없습니다.\n`);
            }
        } catch (e) {
            console.error(e);
        }
        return this;
    }
}