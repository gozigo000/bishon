'use client';
import { useState } from 'react';
import FileDropZone from './FileDropZone';
import { getBaseName } from '../../_utils/file';
import Reporter from './Reporter';

export default function FileUploader() {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<FinalReport | null>(null);
    
    // word 파일 업로드 및 hlz 다운로드
    const handleFileSelect = async (file: File) => {
        setIsLoading(true);
        setReport(null);

        try {
            // 파일 업로드
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/make-hlz', {
                method: 'POST',
                body: formData,
            });
            // 응답 실패 처리
            if (!res.ok) {
                if (res.status === 413) {
                    throw new Error('업로드 파일이 너무 큽니다. (Vercel 서버에서 크기가 4.5MB 이상인 파일의 직접 업로드를 지원하지 않습니다)');
                } else {
                    throw new Error(`서버 응답 실패 - status: ${res.status} / statusText: ${res.statusText}`);
                }
            }

            // 결과 수신
            const { userDownloadFile, report } = await res.json();
            // 파일 다운로드
            if (userDownloadFile) {
                downloadFile(userDownloadFile, getBaseName(file));
            }
            // 리포트 보고
            setReport(report);

        } catch (error) {
            setReport({
                errorMsg: (error as Error).message,
                status: 'error',
                generatedFiles: [],
                countingReport: '',
                magReport: '',
                diffReport: '',
                jpgImgs: '',
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
            {report?.errorMsg && (
                <div className="text-red-500 text-sm mt-2"> {report.errorMsg} </div>
            )}
            {report && (
                <Reporter report={report} />
            )}
        </div>
    );
}

function downloadFile(userDownloadFile: string, fileName: string) {
    const byteChars = atob(userDownloadFile);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNums);
    const blob = new Blob([byteArray], { type: 'application/zip' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `짜잔-${fileName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}