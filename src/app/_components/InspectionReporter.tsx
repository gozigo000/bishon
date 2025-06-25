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
                        item.kind === 'ERROR' ? 'text-red-400' :
                        item.kind === 'WARNING' ? 'text-yellow-400' :
                        item.kind === 'INFO' ? 'text-blue-400' : ''
                    }`}>
                        [{item.kind}]
                    </span>
                    <div className="flex-1">
                        <div>
                            {item.message}
                        </div>
                        {item.location && (
                            <div className="text-white/60 text-sm mt-1">
                                위치: {item.location}
                            </div>
                        )}
                        {item.reference && (
                            <div className="text-white/60 text-sm">
                                참고: {item.reference}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
} 