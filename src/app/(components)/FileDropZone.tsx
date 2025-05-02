'use client';
import JSZip from 'jszip';
import { useState, useCallback } from 'react';


interface FileDropZoneProps {
    onFileSelect?: (fileName: string, documentContent?: string) => void;
}

export default function FileDropZone({ onFileSelect }: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [documentContent, setDocumentContent] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();

        // 드래그가 드랍존을 바깥으로 벗어났는지 확인
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        // 드랍존 바깥으로 벗어났을 때만 isDragging 상태 변경
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const docxFile = files.find(file => file.name.endsWith('.docx'));
        if (docxFile) {
            setFileName(docxFile.name);
            await processDocxFile(docxFile);
        } else {
            alert('.docx 파일을 업로드 해주세요.');
        }
    }, [onFileSelect]);

    const processDocxFile = async (file: File) => {
        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);

            // document.xml 파일 찾기
            const documentXml = zipContent.file('word/document.xml');
            if (documentXml) {
                // document.xml 파일 내용 가져오기
                const content = await documentXml.async('text');
                // 화면에 보여줄 ooxml 파일 내용 
                setDocumentContent(content.slice(0, 50));
                onFileSelect?.(file.name, content);
                // txt 파일 다운로드
                downloadTxtFile(content, file.name);
            } else {
                console.error('document.xml을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('파일 처리 중 오류 발생:', error);
        }
    };

    const downloadTxtFile = (content: string, originalFileName: string) => {
        // 원본 파일 이름에서 확장자를 제거하고 .txt 추가
        const txtFileName = originalFileName.replace('.docx', '_content.txt');
        // Blob 객체 생성
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        // 즉시 다운로드 (다운로드 링크 생성 & 클릭)
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = txtFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };


    return (
        <div
            className={`
                border-2 border-dashed rounded-lg 
                px-12 py-12 
                flex flex-col items-center justify-center 
                transition-colors drag-glow
                ${isDragging ? 'border-blue-300 bg-blue-50' : 'border-gray-500 bg-transparent '}
                `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <img
                className={`
                    w-[100px] h-[100px] 
                    md:w-[200px] md:h-[180px] 
                    lg:w-[220px] lg:h-[220px] 
                    mb-6 object-contain 
                    animate-spin-slow transition-shadow ${isDragging ? 'drag-glow' : ''} 
                `}
                src="/react.svg"
                alt="React Logo"
            />
            {fileName ? (
                <>
                    <p className="text-gray-200 text-base sm:text-lg md:text-xl font-semibold">
                        {fileName}
                    </p>
                    {documentContent && (
                        <div className="mt-4 max-h-40 overflow-auto">
                            <p className="text-xs sm:text-sm text-gray-400">
                                document.xml 내용:
                            </p>
                            <pre className="text-xs sm:text-sm text-left mt-2 text-gray-300 break-words">
                                {documentContent}
                            </pre>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-base sm:text-lg md:text-xl break-words text-white select-none">
                    파일(.docx)을 여기로 드래그하세요
                </p>
            )}
        </div>
    );
} 