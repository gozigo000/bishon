import React, { useEffect, useState } from "react";

interface ReporterProps {
    status: string;
}

export default function Notice({ status }: ReporterProps) {
    const HIDE_TIME = 1800; // 1.8초 후 사라짐
    const [showTitle, setShowTitle] = useState(true);

    useEffect(() => {
        if (showTitle) {
            const timer = setTimeout(() => setShowTitle(false), HIDE_TIME);
            return () => clearTimeout(timer);
        }
    }, [showTitle]);

    return (
        <div className="flex flex-col w-full h-auto pt-20 pb-10">
            {showTitle && (
                <h2 className={`text-center text-xl sm:text-2xl md:text-3xl font-bold mb-6 ${status === 'success' ? 'text-white/90' : 'text-red-400'} animate-bounce duration-500 select-none`}>
                    변환 결과 ⬇️
                </h2>
            )}
        </div>
    );
} 