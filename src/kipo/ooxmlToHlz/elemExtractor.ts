/**
 * 명세서에서 발명의 구성요소를 추출하는 함수
 * @param text 명세서 텍스트
 * @returns 추출된 구성요소 배열
 */
export function extractElements(text: string): string[] {

    const matches = Array.from(text.matchAll(/([^().,]+)\((\d+\w?)\)/g));
    if (!matches.length) return [];

    const elemBag: Record<string, string> = {}
    matches.forEach(match => {
        const [_, text, num] = match;
        if (!elemBag[num]) {
            elemBag[num] = text.trim();
        }
        else if (elemBag[num] !== text) {
            const suffix = findCommonSuffix(elemBag[num], text);
            elemBag[num] = suffix.trim();
        }
    });

    function findCommonSuffix(s1: string, s2: string): string {
        let i = s1.length - 1;
        let j = s2.length - 1;
        let common = '';
        while (i >= 0 && j >= 0 && s1[i] === s2[j]) {
            common = s1[i] + common;
            i--; j--;
        }
        return common;
    }

    const orderedElems = Object.entries(elemBag)
        .sort(([numA], [numB]) => {
            const a = numA.replace(/\d/g, '');
            const b = numB.replace(/\d/g, '');
            return a.localeCompare(b);
        })
        .sort(([numA], [numB]) => parseInt(numA) - parseInt(numB))
        .map(([num, text]) => `${text}(${num})`);

    return orderedElems;
}
