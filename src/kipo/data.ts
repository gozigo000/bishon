// 레벨 1 제목
export const sTitlesLv1 = new Set([
    '[발명의 설명]',
    '[청구범위]',
    '[요약서]',
    '[도면]'
]);
// 레벨 1, 2 제목
export const sTitlesLv12 = new Set([
    ...sTitlesLv1,
    '[발명의 명칭]',
    '[기술분야]',
    '[발명의 배경이 되는 기술]',
    '[배경기술]',
    '[선행기술문헌]',
    '[발명의 내용]',
    '[도면의 간단한 설명]',
    '[발명을 실시하기 위한 구체적인 내용]',
    '[부호의 설명]',
    '[요약]',
    '[대표도]',
]);
// 레벨 1, 2, 3 제목
export const sTitlesLv123 = new Set([
    ...sTitlesLv12,
    '[특허문헌]',
    '[비특허문헌]',
    '[해결하고자 하는 과제]',
    '[해결하려는 과제]',
    '[과제의 해결 수단]',
    '[발명의 효과]'
]);

export const preventTagFromParaNumRapping = new Set<string>([
    '<description>',
    '<invention-title>',
    '<technical-field>',
    '<background-art>',

    '<citation-list>',
    '<patent-literature>',
    '<patcit>',
    '<non-patent-literature>',
    '<nplcit>',

    '<summary-of-invention>',
    '<tech-problem>',
    '<tech-solution>',
    '<advantageous-effects>',

    '<description-of-drawings>',
    '<description-of-embodiments>',

    '<reference-signs-list>',

    '<claims>',
    '<claim>',

    '<abstract>',
    '<summary>',
    '<abstract-figure>',

    '<drawings>',
    '<figure>',
]);

export const numberingParaInsideTag = new Set<string>([
    '<technical-field>',
    '<background-art>',

    '<patent-literature>',
    '<non-patent-literature>',

    '<summary-of-invention>',
    '<tech-problem>',
    '<tech-solution>',
    '<advantageous-effects>',

    '<description-of-drawings>',
    '<description-of-embodiments>',
    '<reference-signs-list>',
]);

export const dividingParaByBrTag = new Set<string>([
    '<description-of-drawings>',
    '<summary>',
    '<claim>',
    '<reference-signs-list>',
]);

export enum KipoTagName {
    '발명의 설명' = 'description',
    '발명의 명칭' = 'invention-title',
    '기술분야' = 'technical-field',
    '배경기술' = 'background-art',
    '발명의 배경이 되는 기술' = 'background-art',

    '선행기술문헌' = 'citation-list',
    '특허문헌' = 'patent-literature',
    '특허목록' = 'patcit',
    '비특허문헌' = 'non-patent-literature',
    '비특허목록' = 'nplcit',

    '발명의 내용' = 'summary-of-invention',
    '과제' = 'tech-problem',
    '해결하려는 과제' = 'tech-problem',
    '해결하고자 하는 과제' = 'tech-problem',
    '수단' = 'tech-solution',
    '과제의 해결 수단' = 'tech-solution',
    '효과' = 'advantageous-effects',
    '발명의 효과' = 'advantageous-effects',

    '도간설' = 'description-of-drawings',
    '도면의 간단한 설명' = 'description-of-drawings',
    '발실구내' = 'description-of-embodiments',
    '발명을 실시하기 위한 구체적인 내용' = 'description-of-embodiments',
    '부호의 설명' = 'reference-signs-list',
    '표' = 'tables',
    '수학식' = 'maths',

    '청구범위' = 'claims',
    '청구항' = 'claim',

    '요약서' = 'abstract',
    '요약' = 'summary',
    '대표도' = 'abstract-figure',

    '도면' = 'drawings',
    '도' = 'figure',
};