export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { makeHlz } from '@/hlz/hlzMaker';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
        return new NextResponse('No file uploaded', { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    // hlz 파일 생성
    const hlzFile = await makeHlz({ wordFile: arrayBuffer, fileName: file.name });

    return new NextResponse(hlzFile, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name.replace('.docx', '.hlz'))}`
        }
    });
} 