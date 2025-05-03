'use client';
import FileDropZone from './FileDropZone';

export default function FileUploader() {
    
    // word 파일 업로드 및 hlz 다운로드
    const handleFileSelect = async (file: File) => {
        // word 파일 업로드
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/make-hlz', {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) {
            alert('변환 실패');
            return;
        }
        // Blob 객체 생성
        const blob = await res.blob();
        // 즉시 다운로드 (다운로드 링크 생성 & 클릭)
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.name.replace('.docx', '.hlz');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="items-center justify-center">
            <FileDropZone
                onFileSelect={handleFileSelect}
            />
        </div>
    );
} 