import { XElement } from '../2-lightParser/1-node/node';
import { collectError } from '../errorCollector';

// E-263, E-266, E-269(중괄호 한 쪽이 없는 경우) 에러 보고
// E-261, E-262, E-267, E-268, E-269(중괄호 짝이 여럿인 경우) 에러 수정
export function inspect_invenTitle(invTitle: XElement) {
    let title = invTitle.textContent
        .replace(/\s+/g, ' ') // 줄바꿈 제거
        .replace(/<.*?>/g, '') // 태그 제거
        .trim();

    if (title === '') {
        collectError(`발명의 명칭에 대한 기재가 없습니다`);
        return;
    }

    if (!/{/.test(title)) {
        collectError(`발명의 명칭에 여는 중괄호({)가 없습니다: ${title}`);
        return;
    }
    if (!/}/.test(title)) {
        collectError(`발명의 명칭에 닫는 중괄호(})가 없습니다: ${title}`);
        return;
    }

    invTitle.mergeTextNodes();
    invTitle.forEachXText(content => content.replace(/{+/, '{').replace(/}+/, '}'));

    const match = title.match(/(.+)\{(.+?)\}/)!;
    if (!match) {
        collectError(`발명의 명칭에 한글 또는 영문 명칭이 없습니다: ${title}`);
        return;
    }

    const krTitle = match[1].
        replace(/[^a-zA-Z0-9가-힣 ~!@#$%^*\*\(\)-_=+,./?:;'’\\|]/g, '').
        replace(/\s+/g, ' ').trim();
    const enTitle = match[2].
        replace(/[^a-zA-Z0-9 ~!@#$%^*\*\(\)-_=+,./?:;'’\\|]/g, '').
        replace(/\s+/g, ' ').trim();
    if (!/[가-힣]+/.test(krTitle)) collectError(`발명의 명칭에 한글 명칭이 없습니다: ${title}`);
    if (!/[a-zA-Z]+/.test(enTitle)) collectError(`발명의 명칭에 영문 명칭이 없습니다: ${title}`);
    if (krTitle.length > 270) collectError(`발명의 한글 명칭이 270자를 초과합니다: ${krTitle.length}자`);
    if (enTitle.length > 540) collectError(`발명의 영문 명칭이 540자를 초과합니다: ${enTitle.length}자`);

    invTitle.forEachXText(_ => `${krTitle}{${enTitle}}`);
}
