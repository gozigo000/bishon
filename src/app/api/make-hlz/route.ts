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
        const [hlzFile, countingReport, inspectionReport, diffReport] = await makeHlz(file);
        const finFile = await makeFin(hlzFile);

        const zip = new JSZip();
        zip.file(hlzFile.name, await hlzFile.arrayBuffer());
        zip.file(finFile.name, await finFile.arrayBuffer());
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const userDownloadFile = zipBuffer.toString('base64'); // base64 문자열로 인코딩

        const report: FinalReport = {
            status: 'success' as const,
            generatedFiles: [hlzFile.name, finFile.name],
            countingReport: JSON.stringify(countingReport),
            inspectionReport: JSON.stringify(inspectionReport),
            diffReport: JSON.stringify(diffReport),
        };

        // 배송
        const deliveryBox: deliveryBox = { userDownloadFile, report };
        return NextResponse.json(deliveryBox);

    } catch (error) {
        console.error('Error:', error);
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