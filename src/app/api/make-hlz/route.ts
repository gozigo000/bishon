export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { makeHlz } from '@/hlz/hlzMaker';
import { makeFin } from '@/hlz/finMaker';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return new NextResponse('No file uploaded', { status: 400 });
        }

        // hlz 파일 생성
        const { file: hlzFile, report: hlzReport } = await makeHlz({ wordFile: file, fileName: file.name });
        // fin 파일 생성
        const finFile = await makeFin({ hlzFile: hlzFile, fileName: file.name });
        // ZIP 파일 생성
        const zip = new JSZip();
        zip.file(hlzFile.name, await hlzFile.arrayBuffer());
        zip.file(finFile.name, await finFile.arrayBuffer());
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        const report = {
            status: 'success' as const,
            convertedFiles: [hlzFile.name, finFile.name],
            message: JSON.stringify(hlzReport)
        };
        
        // 파일과 보고 내용을 함께 전송
        return NextResponse.json({
            zip: zipBuffer.toString('base64'), // base64 인코딩
            report: report
        });
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