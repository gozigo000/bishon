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
            return new NextResponse('No file uploaded', { status: 400 });
        }

        // 배송물품 생성
        const hlzFileEtc = await makeHlz(file);
        if (!hlzFileEtc) {
            return new NextResponse('HLZ 파일 생성 중 오류가 발생했습니다.', { status: 500 });
        }
        const [
            hlzFile, 
            countingReport, 
            inspectionReport, 
            diffReport, 
            hImgs, 
        ] = hlzFileEtc;
       
        if (!hlzFile) {
             const report: FinalReport = {
                status: 'fail' as const,
                generatedFiles: [],
                countingReport: JSON.stringify(countingReport),
                inspectionReport: JSON.stringify(inspectionReport),
                diffReport: '',
                jpgImgs: '',
            };
            // 배송
            const box: deliveryBox = { userDownloadFile: null, report };
            return NextResponse.json(box);
        }

        const finFile = await makeFin(hlzFile);
        if (!finFile) {
            return new NextResponse('FIN 파일 생성 중 오류가 발생했습니다.', { status: 500 });
        }

        const zip = new JSZip();
        zip.file(hlzFile.name, await hlzFile.arrayBuffer());
        zip.file(finFile.name, await finFile.arrayBuffer());
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const userDownloadFile = zipBuffer.toString('base64');

        const jpgImgsBase64: Record<string, string> = {};
        for (const hImg of hImgs) {
            const base64Str = Buffer.from(hImg.buffer).toString('base64');
            jpgImgsBase64[hImg.name] = base64Str;
        }

        const report: FinalReport = {
            status: 'success' as const,
            generatedFiles: [hlzFile.name, finFile.name],
            countingReport: JSON.stringify(countingReport),
            inspectionReport: JSON.stringify(inspectionReport),
            diffReport: JSON.stringify(diffReport),
            jpgImgs: JSON.stringify(jpgImgsBase64),
        };

        // 배송
        const box: deliveryBox = { userDownloadFile, report };
        return NextResponse.json(box);

    } catch (error) {
        console.error('make-hlz API 에러:', error);
        return NextResponse.json({ 
            error: '파일 변환 중 오류가 발생했습니다.',
            report: {
                status: 'error' as const,
                convertedFiles: [],
                message: error instanceof Error ? error.message : '알 수 없는 오류'
            }
        }, { status: 500 });
    }

} 