import React from "react";

interface ReporterProps {
    inspectionReport: InspectionReport;
}

export default function InspectionReporter({ inspectionReport }: ReporterProps) {
    return (
        <div className="bg-black/20 w-full min-w-[28rem] p-3 mt-2 space-y-3 rounded">
            {inspectionReport.map((item, i) => (
                <div key={i} className="text-white/90 flex items-start gap-2">
                    <span className={`font-semibold ${
                        item.kind === '에러' ? 'text-red-400' :
                        item.kind === '경고' ? 'text-yellow-400' :
                        item.kind === '개발' ? 'text-blue-400' : ''
                    }`}>
                        [{item.kind}]
                    </span>
                    <div className="flex-1">
                        <div>
                            {item.msg}
                        </div>
                        {item.pos && (
                            <div className="text-white/60 text-sm mt-1">
                                위치: {item.pos}
                            </div>
                        )}
                        {item.from && (
                            <div className="text-white/60 text-sm">
                                From: {item.from}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
} 