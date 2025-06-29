import { XElement } from "../2-lightParser/1-node/node";
import { collectError, collectWarning } from "../0-utils/errorCollector";


// 표/수학식/도면 번호 검사 후 번호 반환
// TODO: 수정된 번호 반환하기
export function inspect_numbering(elems: XElement[]): string[] {
    const nums = elems
        .map(elem => elem.getAttrValue('num'))
        .filter(num => num !== undefined);
    if (elems.length !== nums.length) {
        collectError(`식별항목 개수와 번호 개수가 불일치: ${elems.length} !== ${nums.length}`);
    }

    const title =
        elems[0].tagName === 'tables' ? '표' :
            elems[0].tagName === 'maths' ? '수학식' :
                elems[0].tagName === 'figure' ? '도면' : '';
    let prevNum = '-';
    let prevDigit = 0;
    let prevAlpha = '`'; // '`'의 아스키코드: 96 ('a'의 아스키코드: 97)
    const numSet = new Set<string>();

    for (const num of nums) {
        const currTitle = `[${title.replace('도면', '도')} ${num}]`;
        const prevTitle = `[${title.replace('도면', '도')} ${prevNum}]`;

        // TODO: 알파벳이 대문자인 경우 소문자로 수정해주기

        // 번호 형식 검사
        if (!/^\d{1,3}[a-z]?$/.test(num)) {
            collectError(
                `${title} 번호는 '숫자(최대 3자리) + 알파벳 소문자(최대 1자)'만 가능: ${currTitle}`
            )
        }
        // 번호 중복 검사
        if (numSet.has(num)) {
            collectError(`${title} 번호가 중복 사용됨: ${currTitle}`)
        }
        numSet.add(num);

        // 순차 증가 검사
        const digit = Number(num.replace(/\D/g, ''));
        const alpha = num.replace(/\d/g, '');
        if (digit === 1 + prevDigit && (alpha === '' || alpha === 'a')) {
            // 이 경우는 정상 (예: 2/2c -> 3, 2/2c -> 3, 2/2c -> 3a)
        }
        else if (digit === prevDigit) {
            if (alpha === '' || prevAlpha === '') {
                // 같은 숫자인데 알파벳이 없는 경우 (예: 5 -> 5, 6a -> 6, 7 -> 7a)
                collectError(
                    `숫자가 같은 ${title} 번호는 알파벳을 순차적으로 부여해야 함: ${prevTitle}, ${currTitle}`
                )
            }
            else if (alpha.charCodeAt(0) !== 1 + prevAlpha.charCodeAt(0)) {
                // 같은 숫자인데 알파벳 순서가 맞지 않는 경우 (예: 5a -> 5c)
                collectError(
                    `숫자가 같은 ${title} 번호는 알파벳을 순차적으로 부여해야 함: ${prevTitle}, ${currTitle}`
                )
            }
        }
        else if (prevNum === '-' && num !== '1' && num !== '1a') {
            // 첫번째 번호가 '1' 또는 '1a'가 아닌 경우 (예: 2, 1b)
            collectError(
                `${title} 번호는 '1' 또는 '1a'로 시작해야 함: ${currTitle}`
            )
        }
        else if (digit !== 1 + prevDigit) {
            // 숫자가 1씩 증가하지 않는 경우 (예: 5/5a -> 4/4a, 5/5a -> 7/7a)
            collectError(
                `${title} 번호는 순차적으로 증가해야 함: ${prevTitle}, ${currTitle}`
            )
        }
        else if (digit === 1 + prevDigit && alpha !== '' && alpha !== 'a') {
            // 숫자가 1씩 증가하는데 알파벳이 잘못된 경우 (예: 5 -> 6c)
            collectError(
                `${title} 번호는 순차적으로 증가해야 함: ${prevTitle}, ${currTitle}`
            )
        }
        else {
            // 그 외의 경우 - HACK: 여기에 걸리는 경우가 있는지 체크
            collectWarning(
                `${title} 번호에 오류가 있을 수 있음: ${currTitle}`
            )
        }
        prevNum = num;
        prevDigit = digit;
        prevAlpha = alpha;
    }

    return nums;
}

export function inspect_claimNumbering(eachClaims: XElement[]): string[] {
    const nums = eachClaims
        .map(claim => claim.getAttrValue('num'))
        .filter(num => num !== undefined);

    // 청구항 번호 검사
    let prevNum = 0;
    const numSet = new Set<string>();
    for (const num of nums) {
        // 숫자만 사용 가능
        if (!/^\d+$/.test(num)) {
            collectError(`청구항 번호는 숫자만 사용할 수 있음: [청구항 ${num}]`)
        }
        // 중복 검사
        if (numSet.has(num)) {
            collectError(`청구항 번호가 중복됨: [청구항 ${num}]`)
        }
        // 1씩 증가 검사
        if (Number(num) !== prevNum + 1) {
            collectError(
                `청구항 번호를 순차적으로(1, 2, 3, ...) 부여해야 함: [청구항 ${prevNum}], [청구항 ${num}]`
            )
        }
        numSet.add(num);
        prevNum = Number(num);
    }

    return nums;
}