export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { makeHlz } from '@/hlz/hlzMaker';
import { makeFin } from '@/hlz/finMaker';
import JSZip from 'jszip';
import iconv from 'iconv-lite';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return new NextResponse('No file uploaded', { status: 400 });
        }
        const arrayBuffer = await file.arrayBuffer();
        
        // hlz 파일 생성
        const hlzFile = await makeHlz({ wordFile: arrayBuffer, fileName: file.name });
        // fin 파일 생성
        const finFile = await makeFin({ hlzFile: hlzFile, fileName: file.name });
        // ZIP 파일 생성
        const zip = new JSZip();
        zip.file(hlzFile.name, await hlzFile.arrayBuffer());
        zip.file(finFile.name, await finFile.arrayBuffer());
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        
        // 파일 보내기
        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename=anyName}`
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return new NextResponse('파일 변환 중 오류가 발생했습니다.', { status: 500 });
    }

} 