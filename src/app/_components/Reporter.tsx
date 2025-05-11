import React, { useEffect, useState, useMemo } from "react";
import Notice from "./Notice";
import CountingReporter from "@/app/_components/CountingReporter";
import InspectionReporter from "./InspectionReporter";
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

    const inspectionReport: InspectionReport = useMemo(() => {
        if (!report.inspectionReport) return [];
        try { return JSON.parse(report.inspectionReport); } 
        catch { return []; }
    }, [report]);

    const diffLines: DiffLine[] = useMemo(() => {
        if (!report.diffReport) return [];
        try { return JSON.parse(report.diffReport); } 
        catch { return []; }
    }, [report]);


    return (
        <div className="flex flex-col w-full h-auto pb-10">
            <Notice status={report.status}/>
            <div className={`
                    bg-white/10 rounded-lg p-6
                    w-full max-w-2xl min-w-[32rem] mx-auto space-y-4
                    transition-all duration-700
                    ${showContent ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
            >
                <div>
                    <span className="font-semibold text-white">
                        변환된 파일:
                    </span>
                    <ul className="ml-2 text-white list-disc list-inside">
                        {report.generatedFiles.map((file, idx) => (
                            <li key={idx}>{file}</li>
                        ))}
                    </ul>
                </div>
                <CountingReporter countingReport={countingReport} />
                <InspectionReporter inspectionReport={inspectionReport} />
                {diffLines.length > 0 && (
                    <DiffReporter diffReport={diffLines} />
                )}
            </div>
        </div>
    );
} 