export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { makeHlz } from '@/kipo/hlzMaker';
import { makeFin } from '@/kipo/finMaker';
import JSZip from 'jszip';

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // 배송요청 확인
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return new NextResponse('업로드된 파일이 없습니다', { status: 400 });
        }

        // 배송물품 생성
        const hlzFileEtc = await makeHlz(file);
        const { hlzFile, hlzImgs, countingReport, msgReport, diffReport } = hlzFileEtc;
        const finFile = hlzFile ? await makeFin(hlzFile) : null;

        if (!hlzFile || !finFile) {
            // 배송
            const box: deliveryBox = {
                userDownloadFile: null,
                report: {
                    status: 'fail',
                    generatedFiles: [],
                    countingReport: '',
                    magReport: JSON.stringify(msgReport),
                    diffReport: '',
                    jpgImgs: '',
                }
            };
            return NextResponse.json(box);
        }

        const zip = new JSZip();
        zip.file(hlzFile.name, await hlzFile.arrayBuffer());
        zip.file(finFile.name, await finFile.arrayBuffer());
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const userDownloadFile = zipBuffer.toString('base64');

        const jpgImgs: Record<string, string> = {};
        for (const hImg of hlzImgs) {
            const base64Str = Buffer.from(hImg.buffer).toString('base64');
            jpgImgs[hImg.name] = base64Str;
        }

        // 배송
        const box: deliveryBox = {
            userDownloadFile,
            report: {
                status: 'success',
                generatedFiles: [hlzFile.name, finFile.name],
                countingReport: JSON.stringify(countingReport),
                magReport: JSON.stringify(msgReport),
                diffReport: JSON.stringify(diffReport),
                jpgImgs: JSON.stringify(jpgImgs),
            }
        };
        return NextResponse.json(box);

    } catch (error) {
        console.error('make-hlz API 에러:', error);
        // 배송
        const box: deliveryBox = {
            userDownloadFile: null,
            report: {
                errorMsg: (error as Error).message,
                status: 'error',
                generatedFiles: [],
                countingReport: '',
                magReport: '',
                diffReport: '',
                jpgImgs: '',
            }
        };
        return NextResponse.json(box);
    }
} 