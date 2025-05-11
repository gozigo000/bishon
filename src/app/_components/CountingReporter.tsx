import React from "react";

interface ReporterProps {
    countingReport: CountingReport;
}

export default function CountingReporter({ countingReport }: ReporterProps) {
    
    return (
        <div className="bg-black/20 w-full min-w-[28rem] p-3 mt-2 space-y-3 rounded">
            {countingReport.filter(item => item.cnt > 0).map((item, i) => (
                <div key={i}>
                    <div className="text-white/90 font-semibold">
                        {item.kind}: 
                        <span className="text-yellow-400 ml-2 tracking-widest">
                            {item.cnt}개
                        </span>
                    </div>
                    <div className="text-white/60 ml-2 font-mono">
                        <span>
                            ({item.nums.join(' ')})
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
} 