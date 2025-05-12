import React, { useEffect, useState } from "react";

interface ReporterProps {
    status: string;
}

export default function Notice({ status }: ReporterProps) {
    const NOTICE_TIME = 1800; // 1.8초 후 사라짐
    const REJECTED_TIME = 1800; // 1.8초 후 사라짐

    const [showNotice, setShowNotice] = useState(true);
    const [showRejected, setShowRejected] = useState(true);

    useEffect(() => {
        if (showNotice) {
            const timer = setTimeout(() => setShowNotice(false), NOTICE_TIME);
            return () => clearTimeout(timer);
        }
    }, [showNotice]);
    
    useEffect(() => {
        if (showRejected) {
            const timer = setTimeout(() => setShowRejected(false), REJECTED_TIME);
            return () => clearTimeout(timer);
        }
    }, [showRejected]);

    return (
        <div className="flex flex-col w-full h-auto">
            {showNotice && (
                <h2 className={`
                    absolute pt-20 left-0 right-0 text-center 
                    text-xl sm:text-2xl md:text-3xl font-bold 
                    ${status === 'success' ? 'text-white/90' : 'text-red-400'} 
                    animate-bounce duration-500 select-none`}
                >
                    변환 결과 ⬇️
                </h2>
            )}
            {showRejected && status === 'fail' && (
                <div className="
                    fixed top-30 left-0 right-0 
                    flex items-center justify-center pointer-events-none
                    text-red-500/20 text-[20vw] font-bold select-none"
                >
                    Rejected
                </div>
            )}
        </div>
    );
} 