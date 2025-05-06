'use client';
import { useState } from 'react';
import FileDropZone from './FileDropZone';
import Reporter from './Reporter';

export default function FileUploader() {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<ConversionReport | null>(null);
    
    // word 파일 업로드 및 hlz 다운로드
    const handleFileSelect = async (file: File) => {
        setIsLoading(true);
        setReport(null);
        try {
            // word 파일 업로드
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/make-hlz', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                throw new Error('변환 실패');
            }
            
            const data = await res.json();
            // 결과 보고
            setReport(data.report);
            // ZIP 파일 다운로드
            // base64를 Blob으로 변환
            const byteChars = atob(data.zip);
            const byteNums = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
                byteNums[i] = byteChars.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNums);
            const blob = new Blob([byteArray], { type: 'application/zip' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = file.name.replace('.docx', '.zip'); // 다운 받을 파일 이름
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            setReport({
                fileName: file.name,
                convertedFiles: [],
                status: 'error',
                message: error instanceof Error ? error.message : '알 수 없는 오류'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="items-center justify-center">
            <FileDropZone
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
            />
            {report && (
                <Reporter report={report} />
            )}
        </div>
    );
} 