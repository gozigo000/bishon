import { useEffect, useState } from 'react';

interface ReporterProps {
    report: ConversionReport;
}

export default function Reporter({ report }: ReporterProps) {
    const [showContent, setShowContent] = useState(false);
    const [showTitle, setShowTitle] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) setShowContent(true);
            else setShowContent(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 바운스 후 사라지게
    useEffect(() => {
        if (showTitle) {
            const timer = setTimeout(() => setShowTitle(false), 1800); // 1.8초 후 사라짐
            return () => clearTimeout(timer);
        }
    }, [showTitle]);

    return (
        <div className="flex flex-col w-full h-auto pt-20 pb-10">
            {showTitle && (
                <h2 className={`text-center text-xl sm:text-2xl md:text-3xl font-bold ${report.status === 'success' ? 'text-white/90' : 'text-red-400'} mb-6 animate-bounce duration-500 select-none`}>
                    변환 결과 ⬇️
                </h2>
            )}
            <div
                className={`
                    bg-white/10 rounded-lg p-6 max-w-2xl mx-auto w-full
                    transition-all duration-700
                    ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
                `}
            >
                <div className="space-y-4">
                    <div>
                        <span className="font-semibold text-white">상태:</span>
                        <span className={`ml-2 ${report.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {report.status === 'success' ? '성공' : '실패'}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold text-white">변환된 파일:</span>
                        <ul className="ml-2 text-white list-disc list-inside">
                            {report.convertedFiles.map((file, index) => (
                                <li key={index}>{file}</li>
                            ))}
                        </ul>
                    </div>
                    {report.message && (
                        <div>
                            <span className="font-semibold text-white">메시지:</span>
                            <span className="ml-2">
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(report.message);
                                        if (Array.isArray(parsed)) {
                                            return (
                                                <ul className="list-disc list-inside">
                                                    {parsed.map((item, idx) => (
                                                        <li key={idx}>
                                                            {Object.entries(item).map(([k, v]) => (
                                                                <div key={k} className="text-sm text-white/80 truncate max-w-xl"><b>{k}:</b> {String(v)}</div>
                                                            ))}
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        } else if (typeof parsed === 'object' && parsed !== null) {
                                            return (
                                                <ul className="list-disc list-inside">
                                                    {Object.entries(parsed).map(([k, v]) => (
                                                        <li key={k} className="text-xs text-white/80"><b>{k}:</b> {String(v)}</li>
                                                    ))}
                                                </ul>
                                            );
                                        } else {
                                            return <span>{String(parsed)}</span>;
                                        }
                                    } catch {
                                        return <span>{report.message}</span>;
                                    }
                                })()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 