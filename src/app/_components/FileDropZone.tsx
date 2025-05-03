import { useState, useCallback } from 'react';

interface FileDropZoneProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
}

export default function FileDropZone({ onFileSelect, isLoading = false }: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

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

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const docxFile = files.find(file => file.name.endsWith('.docx'));
        if (docxFile) {
            setFileName(docxFile.name);
            onFileSelect?.(docxFile);
        } else {
            alert('.docx 파일을 업로드 해주세요.');
        }
    }, [onFileSelect]);


    return (
        <div
            className={`
                border-2 border-dashed rounded-lg 
                px-12 py-12 
                flex flex-col items-center justify-center 
                transition-colors
                ${isLoading ? 'drag-glow-more' : 'drag-glow'}
                ${isDragging || isLoading ? 'border-blue-300 bg-blue-50' : 
                    'border-gray-500 bg-transparent'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                >
            <img
                className={`
                    w-[100px] h-[100px] 
                    md:w-[200px] md:h-[200px] 
                    lg:w-[220px] lg:h-[220px] 
                    mb-10 object-contain 
                    ${isLoading ? 'animate-spin-fast' : 'animate-spin-slow'}
                    transition-shadow
                    cursor-grab select-none 
                `}
                src="/react.svg"
                alt="React Logo"
            />
            {fileName ? (
                <p className=" text-cyan-100 text-base sm:text-lg md:text-xl font-semibold  select-none">
                    {fileName}
                </p>
            ) : (
                <p className=" text-gray-300 text-base sm:text-lg md:text-xl break-words select-none">
                    파일(.docx)을 여기로 드래그하세요
                </p>
            )}
        </div>
    );
} 