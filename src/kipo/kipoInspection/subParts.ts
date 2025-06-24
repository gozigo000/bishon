import { XElement } from "../2-lightParser/1-node/node";
import { collectError, collectWarning } from "../0-utils/errorCollector";

export function inspect_paragraph(paragraph: XElement) {
    if (/^\s*$/.test(paragraph.innerXML)) {
        collectWarning(`공백이 있는 <p> 태그가 존재합니다: ${paragraph.outerXML}`);
    };
    // HACK: 추가 검사 필요하면 추가하기
}

export function inspect_table(tablesTag: XElement) {
    const tNum = tablesTag.getAttrValue('num')!;

    const img = tablesTag.getAllElemsByTag('<img>');
    if (img.length > 1) {
        collectError(`표에 복수의 이미지가 있습니다: [표 ${tNum}]`);
        // TODO: 복수의 이미지가 있거나, 텍스트가 있는 경우 
        // 제목을 【】에서 [] 형식으로 변경해주기
    };

    const tbl = tablesTag.getAllElemsByTag('<table>');
    if (tbl.length > 1) {
        collectError(`표에 복수의 테이블이 있습니다: [표 ${tNum}]`);
    };
    // if (tablesTag.hasElem('<title>')) {
    //     // TODO: 표 제목 처리 - 임시로 표 제목은 제거함
    //     removeNode(tablesTag.getElemByTag('<title>')!);
    // }

    if (img.length === 0 && tbl.length === 0) {
        collectError(`표에 내용이 없습니다: [표 ${tNum}]`);
    }
}

export function inspect_math(mathsTag: XElement) {
    const eNum = mathsTag.getAttrValue('num')!;

    const img = mathsTag.getAllElemsByTag('<img>');
    if (img.length === 0) {
        collectError(`[수학식]에 수학식 이미지가 없습니다: [수학식 ${eNum}]`);
    }
    if (img.length > 1) {
        collectError(`[수학식]에 복수의 수학식 이미지가 있습니다: [수학식 ${eNum}]`);
        // TODO: 복수의 수학식 이미지가 있거나, 텍스트가 있는 경우 
        // 제목을 【】에서 [] 형식으로 변경해주기
    };
}

export function inspect_img(imgs: XElement[]) {
    for (const img of imgs) {
        if (!/<img id="(\w+)" he="(\d+)" wi="(\d+)" file="pat(\d{5})\.(\w+)" img-format="(\w+)" \/>/
            .test(img.outerXML)) {
            collectError(`이미지 태그 형식이 잘못되었습니다: ${img.outerXML}`);
        }

        const id = img.getAttrValue('id')!;
        const he = img.getAttrValue('he')!;
        const wi = img.getAttrValue('wi')!;
        const file = img.getAttrValue('file')!;
        const imgFormat = img.getAttrValue('img-format')!;

        if (!/^i\d{4}$/.test(id))
            collectError(`이미지 id가 올바르지 않습니다: id:${id}`);
        if (Number(he) > 222)
            collectError(`이미지 높이가 222mm를 초과합니다: ${he}mm`);
        if (Number(wi) > 165)
            collectError(`이미지 너비가 165mm를 초과합니다: ${wi}mm`);
        if (!/^pat\d{5}\.(jpe?g|tiff?)$/.test(file))
            collectError(`이미지 파일명 또는 확장자가 올바르지 않습니다: file:${file}`);
        if (!/^jpe?g|tiff?$/.test(imgFormat))
            collectError(`이미지 파일 확장자가 올바르지 않습니다: img-format:${imgFormat}`);
    }
}
