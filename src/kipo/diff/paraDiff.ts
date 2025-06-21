import { DiffMatchPatch } from 'diff-match-patch-ts';
import { KipoParas } from './kipoParas';
import { getHtmlParasForDiff } from './htmlParas';
import { collectRefs } from '../dataCollector';
import { isProd } from '@/_utils/env';

type Pair = {
    old: number;
    new: number;
}

export async function generateDiffReport(kXmlStr: KXml, word: FileOrBuffer | Html): Promise<DiffLine[]> {
    const newLines = KipoParas.getParas(kXmlStr);
    const oldLines = (await getHtmlParasForDiff(word))
        .map(c => c.replace(/__MATH-START__.*?__MATH-END__/g, ''));

    const diffLines = generateDiffLines(newLines, oldLines);

    collectRefs({
        'Rpt_diffReport.json': diffLines,
    });

    return diffLines;
}

export function generateDiffAfterInspection(kXmlAfter: KXml, kXmlBefore: KXml): DiffLine[] {
    if (isProd()) return [];

    const newLines = KipoParas.getParas(kXmlAfter);
    const oldLines = KipoParas.getParas(kXmlBefore);
        
    const diffLines = generateDiffLines(newLines, oldLines);

    collectRefs({
        'Rpt_diffAfterInspection.json': diffLines,
    });

    return diffLines;
}

export function generateDiffLines(after: string[], before: string[]): DiffLine[] {
    const matches = lcsMatch(after, before);

    let i = 0, lenN = after.length;
    let j = 0, lenO = before.length;
    let m = 0, lenM = matches.length;
    const diffLines: DiffLine[] = [];

    while (i < lenN || j < lenO) {
        if (m < lenM) {
            if (i === matches[m].new && j === matches[m].old) {
                diffLines.push({ type: '동일', content: after[i] });
                i++; j++; m++;
            } else if (i < matches[m].new && j < matches[m].old) {
                diffLines.push({ type: '수정', content: after[i], diffs: generateDiffs(before[j], after[i]) });
                i++; j++;
            } else if (i < matches[m].new) {
                diffLines.push({ type: '추가', content: after[i] });
                i++;
            } else if (j < matches[m].old) {
                diffLines.push({ type: '삭제', content: before[j] });
                j++;
            }
        } else {
            // 남은 부분 처리
            if (i < lenN && j < lenO) {
                diffLines.push({ type: '수정', content: after[i], diffs: generateDiffs(before[j], after[i]) });
                i++; j++;
            } else if (i < lenN) {
                diffLines.push({ type: '추가', content: after[i] });
                i++;
            } else if (j < lenO) {
                diffLines.push({ type: '삭제', content: before[j] });
                j++;
            }
        }
    }

    return diffLines;
}

// LCS 경로 추적 (매칭된 인덱스 쌍 반환)
function lcsMatch(a: string[], b: string[]): Pair[] {
    const dp = lcsTable(a, b);
    let i = a.length, j = b.length;
    const pairs: Pair[] = [];
    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            pairs.push({ new: i - 1, old: j - 1 });
            i--; j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    return pairs.reverse();
}

// LCS 테이블 생성
function lcsTable(a: string[], b: string[]): number[][] {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (a[i] === b[j]) dp[i + 1][j + 1] = dp[i][j] + 1;
            else dp[i + 1][j + 1] = Math.max(dp[i][j + 1], dp[i + 1][j]);
        }
    }
    return dp;
}

function generateDiffs(oldStr: string, newStr: string): Diff[] {
    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(oldStr, newStr);
    dmp.diff_cleanupSemantic(diffs);
    
    return diffs;
}