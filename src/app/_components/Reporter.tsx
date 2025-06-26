import React, { useEffect, useState, useMemo } from "react";
import Notice from "./Notice";
import CountingReporter from "@/app/_components/CountingReporter";
import MsgReporter from "./MsgReporter";
import DiffReporter from "@/app/_components/DiffReporter";

interface ReporterProps {
    report: FinalReport;
}

export default function Reporter({ report }: ReporterProps) {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) setShowContent(true);
            else setShowContent(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const countingReport: CountingReport = useMemo(() => {
        if (!report.countingReport) return [];
        try { return JSON.parse(report.countingReport); }
        catch { return []; }
    }, [report]);

    const msgReport: MsgReport = useMemo(() => {
        if (!report.magReport) return [];
        try { return JSON.parse(report.magReport); }
        catch { return []; }
    }, [report]);

    const diffReport: DiffReport = useMemo(() => {
        if (!report.diffReport) return [];
        try { return JSON.parse(report.diffReport); }
        catch { return []; }
    }, [report]);

    const imgBuffs: Record<string, ArrayBuffer> = useMemo(() => {
        if (!report.jpgImgs) return {};
        try { 
            const buffs: Record<string, ArrayBuffer> = {};
            const jpgImgsBase64: Record<string, string> = JSON.parse(report.jpgImgs);
            for (const [name, base64Str] of Object.entries(jpgImgsBase64)) {
                const byteChars = atob(base64Str);
                const byteArray = new Uint8Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) {
                    byteArray[i] = byteChars.charCodeAt(i);
                }
                buffs[name] = byteArray.buffer;
            }
            return buffs;
        }
        catch { return {}; }
    }, [report]);

    return (
        <div className="flex flex-col w-full h-auto pb-10">
            {(report.status === 'success' || report.status === 'fail') && (
                <Notice status={report.status} />
            )}
            <div className={`
                    bg-white/10 rounded-lg p-6 mt-10
                    w-full max-w-2xl min-w-[32rem] mx-auto space-y-4
                    transition-all duration-700
                    ${showContent || true ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
            >
                <div>
                    <span className="font-semibold text-white">
                        변환된 파일: {report.generatedFiles.length > 0 ? '' : '❌'}
                    </span>
                    <ul className="ml-2 text-white list-disc list-inside">
                        {report.generatedFiles.map((file, idx) => (
                            <li key={idx}>{file}</li>
                        ))}
                    </ul>
                </div>
                <CountingReporter countingReport={countingReport} />
                {msgReport.length > 0 && (
                    <MsgReporter msgReport={msgReport} />
                )}
                {diffReport.length > 0 && (
                    <DiffReporter diffReport={diffReport} imgBuffs={imgBuffs} />
                )}
            </div>
        </div>
    );
} 