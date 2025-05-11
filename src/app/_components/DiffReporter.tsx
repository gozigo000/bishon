import React, { useRef, useEffect, useState, useMemo } from "react";
import ScrollIndicator from './ScrollIndicator';
import RenderHTML from "./RenderHTML";

interface ReporterProps {
    diffReport: DiffReport;
}

export default function DiffReporter({ diffReport }: ReporterProps) {
    const paraRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [paraTops, setParaTops] = useState<number[]>([]);
    const [scrollHeight, setScrollHeight] = useState(1);

    const indicators = useMemo(() =>
        diffReport.map((l, i) =>
            l.type === '동일' ? null : { type: l.type as '추가' | '삭제' | '수정', idx: i }
        ).filter(Boolean) as { type: '추가' | '삭제' | '수정'; idx: number }[]
    , [diffReport]);
    
    useEffect(() => {
        setScrollHeight(document.documentElement.scrollHeight);
        setParaTops(
            paraRefs.current.map(ref => ref ?
                    ref.getBoundingClientRect().top - document.documentElement.getBoundingClientRect().top
                    : 0
            )
        );
    }, [diffReport]);

    // 문단 렌더링
    const rendered: React.ReactNode[] = useMemo(() => {
        const arr: React.ReactNode[] = [];
        paraRefs.current = [];
        for (let i = 0; i < diffReport.length; i++) {
            const l = diffReport[i];
            const refCallback = (el: HTMLDivElement | null) => { paraRefs.current[i] = el; };
            if (l.type === '동일')
                arr.push(
                    <div key={i} ref={refCallback} className="text-white/90 text-justify indent-6 w-full">
                        <RenderHTML html={l.content} />
                    </div>
                );
            else if (l.type === '삭제')
                arr.push(
                    <div key={i} ref={refCallback} className="text-red-400 text-justify indent-6 w-full">
                        <RenderHTML html={l.content || '-'} />
                    </div>
                );
            else if (l.type === '추가')
                arr.push(
                    <div key={i} ref={refCallback} className="text-green-400 text-justify indent-6 w-full">
                        <RenderHTML html={l.content || '+'} />
                    </div>
                );
            else if (l.type === '수정')
                arr.push(
                    <div key={i} ref={refCallback} className="text-yellow-300 text-justify indent-6 w-full">
                        <HighlightDiff diffs={l.diffs} />
                    </div>
                );
        }
        return arr;
    }, [diffReport]);


    return (
        <>
            {diffReport?.length > 0 && (
                <ScrollIndicator indicators={indicators} paraTops={paraTops} scrollHeight={scrollHeight} />
            )}
            <div className="space-y-4">
                <span className="font-semibold text-white">문장 비교:</span>
                <div className="mt-2 space-y-5 bg-black/20 rounded p-3 w-full min-w-[28rem]">
                    {rendered}
                </div>
            </div>
        </>
    );
}

// DiffHighlight: Diff[]를 받아서 시각적으로 표시
function HighlightDiff({ diffs }: { diffs: Diff[] }) {
    return (
        <span>
            {diffs.map(([op, text], idx) => {
                if (op === -1) // 삭제
                    return (
                        <span key={idx} className="bg-red-700 text-white px-0.5" >
                            <RenderHTML html={text} />
                        </span>
                    )
                if (op === 1) // 추가
                    return (
                        <span key={idx} className="bg-green-500 text-black font-bold px-0.5" >
                            <RenderHTML html={text} />
                        </span>
                    )
                if (op === 0) // 동일
                    return (
                        <span key={idx} className="text-yellow-400" >
                            <RenderHTML html={text} />
                        </span>
                    )
            })}
        </span>
    );
}