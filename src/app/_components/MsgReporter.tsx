import React from "react";

interface ReporterProps {
    msgReport: MsgReport;
}

export default function MsgReporter({ msgReport }: ReporterProps) {
    return (
        <div className="bg-black/20 w-full min-w-[28rem] p-3 mt-2 space-y-3 rounded">
            {msgReport.map((msg, i) => (
                <div key={i} className="text-white/90 flex items-start gap-2">
                    <span className={`font-semibold ${
                        msg.kind === 'ERROR' ? 'text-red-400' :
                        msg.kind === 'WARNING' ? 'text-yellow-400' :
                        msg.kind === 'INFO' ? 'text-blue-400' : ''
                    }`}>
                        [{msg.kind}]
                    </span>
                    <div className="flex-1">
                        <div>
                            {msg.message}
                        </div>
                        {msg.location && (
                            <div className="text-white/60 text-sm mt-1">
                                위치: {msg.location}
                            </div>
                        )}
                        {msg.reference && (
                            <div className="text-white/60 text-sm">
                                참고: {msg.reference}
                            </div>
                        )}
                        {msg.errCode && (
                            <div className="text-red-300 text-sm">
                                에러코드: {msg.errCode}
                            </div>
                        )}
                        {msg.errMsg && (
                            <div className="text-red-300 text-sm">
                                에러메시지: {msg.errMsg}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
} 