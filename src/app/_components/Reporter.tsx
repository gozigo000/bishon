import React, { useRef, useEffect, useState, useMemo, useLayoutEffect } from "react";
import ScrollIndicator from './ScrollIndicator';

interface ReporterProps {
    report: ConversionReport;
}

// DiffHighlight: Diff[]를 받아서 시각적으로 표시
function DiffHighlight({ diffs }: { diffs: Diff[] }) {
    return (
        <span>
            {diffs.map(([op, text], idx) => {
                if (op === -1) {
                    // 삭제(빨간 배경, 흰 글씨)
                    return <span key={idx} style={{ background: '#e74c3c', color: '#fff', fontWeight: 'bold' }}>{text}</span>;
                }
                if (op === 1) {
                    // 추가(초록 배경, 검정 글씨)
                    return <span key={idx} style={{ background: '#2ecc40', color: '#111', fontWeight: 'bold' }}>{text}</span>;
                }
                else {
                    // 동일(노란색)
                    return <span key={idx} style={{ color: '#f1c40f' }}>{text}</span>;
                }
            })}
        </span>
    );
}

export default function Reporter({ report }: ReporterProps) {
    const [showContent, setShowContent] = useState(false);
    const [showTitle, setShowTitle] = useState(true);

    const paraRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [paraTops, setParaTops] = useState<number[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollHeight, setScrollHeight] = useState(1);

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

    // report.message가 변경될 때만 diffLines, indicators 갱신
    const diffLines: DiffLine[] = useMemo(() => {
        if (!report.message) return [];
        try {
            return JSON.parse(report.message);
        } catch {
            return [];
        }
    }, [report.message]);

    // 문단 렌더링
    const rendered: React.ReactNode[] = useMemo(() => {
        const arr: React.ReactNode[] = [];
        paraRefs.current = [];
        for (let i = 0; i < diffLines.length; i++) {
            const l = diffLines[i];
            const refCallback = (el: HTMLDivElement | null) => { paraRefs.current[i] = el; };
            if (l.type === '동일')
                arr.push(
                    <div key={i} ref={refCallback} className="text-white text-justify indent-6 w-full">
                        {(l as any).content}
                    </div>
                );
            else if (l.type === '삭제')
                arr.push(
                    <div key={i} ref={refCallback} className="text-red-400 text-justify indent-6 w-full">
                        {(l as any).content || '-'}
                    </div>
                );
            else if (l.type === '추가')
                arr.push(
                    <div key={i} ref={refCallback} className="text-green-400 text-justify indent-6 w-full">
                        {(l as any).content || '+'}
                    </div>
                );
            else if (l.type === '수정')
                arr.push(
                    <div key={i} ref={refCallback} className="text-yellow-300 text-justify indent-6 w-full">
                        <DiffHighlight diffs={(l as any).diffs} />
                    </div>
                );
        }
        return arr;
    }, [report.message]);

    const indicators = useMemo(() =>
        diffLines.map((l, i) =>
            l.type !== '동일'
                ? { type: l.type as '추가' | '삭제' | '수정', idx: i }
                : null
        ).filter(Boolean) as { type: '추가' | '삭제' | '수정'; idx: number }[]
    , [diffLines]);
    
    useEffect(() => {
        setScrollHeight(document.documentElement.scrollHeight);
        setParaTops(
            paraRefs.current.map(ref => ref ?
                    ref.getBoundingClientRect().top - document.documentElement.getBoundingClientRect().top
                    : 0
            )
        );
    }, [rendered]);


    return (
        <div className="flex flex-col w-full h-auto pt-20 pb-10">
            {showTitle && (
                <h2 className={`text-center text-xl sm:text-2xl md:text-3xl font-bold ${report.status === 'success' ? 'text-white/90' : 'text-red-400'} mb-6 animate-bounce duration-500 select-none`}>
                    변환 결과 ⬇️
                </h2>
            )}
            {/* 스크롤 인디케이터 */}
            {diffLines && diffLines.length > 0 && (
                <ScrollIndicator indicators={indicators} paraTops={paraTops} scrollHeight={scrollHeight} />
            )}
            <div
                ref={containerRef}
                className={`
                    bg-white/10 rounded-lg p-6
                    w-full max-w-2xl min-w-[32rem] mx-auto
                    transition-all duration-700
                    ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
                `}
            >
                <div className="space-y-4">
                    {/* <div>
                        <span className="font-semibold text-white">상태:</span>
                        <span className={`ml-2 ${report.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {report.status === 'success' ? '성공' : '실패'}
                        </span>
                    </div> */}
                    <div>
                        <span className="font-semibold text-white">변환된 파일:</span>
                        <ul className="ml-2 text-white list-disc list-inside">
                            {report.convertedFiles.map((file, idx) => (
                                <li key={idx}>{file}</li>
                            ))}
                        </ul>
                    </div>
                    {rendered.length > 0 && (
                        <div>
                            <span className="font-semibold text-white">문장 비교 결과:</span>
                            <div className="mt-2 space-y-5 bg-black/20 rounded p-3 w-full min-w-[28rem]">
                                {rendered}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 