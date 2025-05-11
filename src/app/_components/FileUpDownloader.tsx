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
            if (!res.ok) {
                throw new Error('- 변환 실패 -'); // TODO: 변환 실패 메시지 상세히 구현하기
            }
            
            const data: deliveryBox = await res.json();
            // 결과 보고
            setReport(data.report);
            // 파일 다운로드
            const byteChars = atob(data.userDownloadFile);
            const byteNums = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
                byteNums[i] = byteChars.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNums);
            const blob = new Blob([byteArray], { type: 'application/zip' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `비숑-${getBaseName(file)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            setReport({
                errorMsg: error instanceof Error ? error.message : '알 수 없는 오류',
                status: 'error',
                generatedFiles: [],
                countingReport: '',
                inspectionReport: '',
                diffReport: ''
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
                <div className="text-red-500 text-sm mt-2">
                    {report.errorMsg}
                </div>
            )}
            {report && (
                <Reporter report={report} />
            )}
        </div>
    );
} 