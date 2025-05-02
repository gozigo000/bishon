'use client';
import FileDropZone from './FileDropZone';

export default function FileUploader() {
    return (
        <div className="flex flex-col">
            <header className="w-full h-26 pt-10 pb-10">
                <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    HLZ 만들기
                </h2>
            </header>
            <main className="w-full h-full items-center justify-center">
                <FileDropZone
                    onFileSelect={(fileName) => {
                        console.log('선택된 파일:', fileName);
                    }}
                />
            </main>
        </div>
    );
} 