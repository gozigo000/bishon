// [fin 파일 구조]
// - 파일명.hlz
// - xresult.inf
//     [APPLICATION]
//     APPNAME=파일명.hlz,2030-04-05,1 (생성일 유닉스타임과 일치),1
//     APPTIME=1717177100 (생성시간 10자리 유닉스타임)
//     [AMENDMENT] (보정 시 추가)
//     AMDCNT=1 (보정 횟수)
//     AMD001=파일명.dta,2034-05-06,1 (보정 파일명, 보정일, 1)

import JSZip from 'jszip';
import iconv from 'iconv-lite';
import { toArrayBuffer } from '@/_utils/dataType';
import { generateKipoFile } from './0-utils/utils';
import { getBaseName } from '@/_utils/file';
import { collectError } from './0-utils/errorCollector';

export async function makeFin(hlzFile: File): Promise<File | null> {
    try {
        const hlzZip = new JSZip();
        const hlzBuffer = toArrayBuffer(hlzFile);
        const zipContent = await hlzZip.loadAsync(hlzBuffer);

        // xresult.inf 파일 만들기
        const xmlFiles = zipContent.file(/\.xml$/);
        if (!xmlFiles) throw new Error('hlz에서 xml 파일을 찾을 수 없습니다.');

        const baseName = getBaseName(hlzFile);
        const appTime = Math.floor(xmlFiles[0].date.getTime()/1000);        
        const kstDate = new Date((appTime + 9 * 60 * 60) * 1000); // UTC+0900
        const timeYMD = kstDate.toISOString().split('T')[0]; // 년-월-일

        const xresult: string[] = [];
        xresult.push(`[APPLICATION]`);
        xresult.push(`APPNAME=${baseName}.hlz,${timeYMD},1`);
        xresult.push(`APPTIME=${appTime}`);
        const xresultBuffer = iconv.encode(xresult.join('\n'), 'cp949');

        // fin 생성
        const finZip = new JSZip();
        finZip.file(`${baseName}.hlz`, hlzBuffer);
        finZip.file('xresult.inf', xresultBuffer);
        const finFile = generateKipoFile(`${baseName}.fin`, finZip);

        return finFile;

    } catch (error) {
        collectError('Fin 파일 생성 중 오류 발생', error as Error);
        return null;
    }
};