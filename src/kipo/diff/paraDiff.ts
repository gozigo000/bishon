import { DiffMatchPatch } from 'diff-match-patch-ts';
import { getKipoParas } from './kipoParas';
import { getHtmlParas } from './htmlParas';
import { color } from "@/_utils/color";

type Pair = {
    old: number;
    new: number;
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

function generateDiffs(oldStr: string, newStr: string): Diff[] {
    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(oldStr, newStr);
    dmp.diff_cleanupSemantic(diffs);
    
    return diffs;
}

export async function generateDiffLines(kXmlStr: KXml, word: FileOrBuffer | Html): Promise<DiffLine[]> {
    const newLines = await getKipoParas(kXmlStr);
    const oldLines = await getHtmlParas(word);
    
    const nls = newLines.map(l => l.content);
    const ols = oldLines.map(l => l.content);
    const matches = lcsMatch(nls, ols);

    let i = 0, lenN = nls.length;
    let j = 0, lenO = ols.length;
    let m = 0, lenM = matches.length;
    const diffLines: DiffLine[] = [];

    while (i < lenN || j < lenO) {
        if (m < lenM) {
            if (i === matches[m].new && j === matches[m].old) {
                diffLines.push({ type: '동일', content: nls[i] });
                i++; j++; m++;
            } else if (i < matches[m].new && j < matches[m].old) {
                diffLines.push({ type: '수정', content: nls[i], diffs: generateDiffs(ols[j], nls[i]) });
                i++; j++;
            } else if (i < matches[m].new) {
                diffLines.push({ type: '추가', content: nls[i] });
                i++;
            } else if (j < matches[m].old) {
                diffLines.push({ type: '삭제', content: ols[j] });
                j++;
            }
        } else {
            // 남은 부분 처리
            if (i < lenN && j < lenO) {
                diffLines.push({ type: '수정', content: nls[i], diffs: generateDiffs(ols[j], nls[i]) });
                i++; j++;
            } else if (i < lenN) {
                diffLines.push({ type: '추가', content: nls[i] });
                i++;
            } else if (j < lenO) {
                diffLines.push({ type: '삭제', content: ols[j] });
                j++;
            }
        }
    }

    return diffLines;
}

// 문장 내 diff 강조
function highlightDiff(oldStr: string, newStr: string): { oneStr: string, oldStr: string, newStr: string } {
    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(oldStr, newStr);
    dmp.diff_cleanupSemantic(diffs);
    
    const parts: string[] = []; 
    const oldParts: string[] = [];
    const newParts: string[] = [];

    diffs.forEach(([op, data]) => {
        if (op === -1) {
            parts.push(color.bgRed(data));     // 삭제된 부분
            oldParts.push(color.bgRed(data));
        } else if (op === 1) {
            parts.push(color.bgGreen(data));   // 추가된 부분
            newParts.push(color.bgGreen(data));
        } else {
            parts.push(color.yellow(data));    // 일치하는 부분
            oldParts.push(color.yellow(data));
            newParts.push(color.yellow(data));
        }
    });
    
    return {
        oneStr: parts.join(''),
        oldStr: oldParts.join(''),
        newStr: newParts.join('')
    };
}

// 콘솔 출력
export async function printDiffLikeGit(kXmlStr: KXml, word: FileOrBuffer | Html) {
    const newLines = await getKipoParas(kXmlStr);
    const oldLines = await getHtmlParas(word);
        
    const nls = newLines.map(l => l.content);
    const ols = oldLines.map(l => l.content);
    const matches = lcsMatch(nls, ols);

    let i = 0, lenN = nls.length;
    let j = 0, lenO = ols.length;
    let m = 0, lenM = matches.length;
    const output: string[] = [];

    while (i < lenN || j < lenO) {
        if (m < lenM) {
            if (i === matches[m].new && j === matches[m].old) {
                output.push(`  ${nls[i]}`);
                i++; j++; m++;
            } else if (i < matches[m].new && j < matches[m].old) {
                const { oneStr } = highlightDiff(ols[j], nls[i]);
                output.push(color.yellow(`~ ${oneStr}`));
                i++; j++;
            } else if (i < matches[m].new) {
                output.push(color.green(`+ ${nls[i]}`));
                i++;
            } else if (j < matches[m].old) {
                output.push(color.red(`- ${ols[j]}`));
                j++;
            }
        } else {
            // 남은 부분 처리
            if (i < lenN && j < lenO) {
                const { oneStr } = highlightDiff(ols[j], nls[i]);
                output.push(color.yellow(`~ ${oneStr}`));
                i++; j++;
            } else if (i < lenN) {
                output.push(color.green(`+ ${nls[i]}`));
                i++;
            } else if (j < lenO) {
                output.push(color.red(`- ${ols[j]}`));
                j++;
            }
        }
    }

    console.log(output.join('\n'));
}
