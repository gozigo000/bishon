import React, { useEffect, useState, useRef } from "react";

type IndicatorType = '추가' | '삭제' | '수정';

interface Indicator {
    type: IndicatorType;
    idx: number;
}

interface ScrollIndicatorProps {
    indicators: Indicator[];
    paraTops: number[];
    scrollHeight: number;
}

const colorMap: Record<IndicatorType, string> = {
    '추가': 'bg-green-400',
    '삭제': 'bg-red-400',
    '수정': 'bg-yellow-300',
};

export default function ScrollIndicator({
    indicators,
    paraTops,
    scrollHeight,
}: ScrollIndicatorProps) {
    const [scrollY, setScrollY] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [dragging, setDragging] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        const handleResize = () => setViewportHeight(window.innerHeight);

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        // 초기값 설정
        setScrollY(window.scrollY);
        setViewportHeight(window.innerHeight);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // 드래그 이벤트 핸들러
    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!barRef.current) return;
            const rect = barRef.current.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const ratio = Math.max(0, Math.min(1, clickY / rect.height));
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            let target = scrollableHeight * ratio;
            target = Math.max(0, Math.min(target, scrollableHeight));
            window.scrollTo({ top: target });
        };

        const handleMouseUp = () => setDragging(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging]);

    // 전체 스크롤 가능한 높이
    const scrollableHeight = scrollHeight - viewportHeight;
    // 뷰포트 비율
    const viewportRatio = viewportHeight / scrollHeight;
    // 스크롤 위치 비율
    const scrollRatio = scrollableHeight > 0 ? (scrollY) / scrollableHeight : 0;

    const thumbHeightPercent = viewportRatio * 100;
    const thumbTopPercent = scrollRatio * (100 - thumbHeightPercent);

    return (
        <div
            ref={barRef}
            className={`fixed right-1 top-0 h-screen ${window.scrollY > 10 ? 'w-5' : 'w-1.5'} transition-all duration-100 z-50 pointer-events-auto`}
            onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const ratio = clickY / rect.height;
                const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
                const target = scrollableHeight * ratio;
                window.scrollTo({ top: Math.max(0, Math.min(target, scrollableHeight)), behavior: 'smooth' });
            }}
        >
            <div className="relative h-full w-full">
                {indicators.map(({ type, idx }, i) => {
                    const viewHlafH = window.innerHeight / 2;
                    const top = scrollHeight > 0 ? 100 * (paraTops[idx]) / scrollHeight : 0;
                    const isHover = hoverIdx === i && !dragging;
                    const normalHeight = 6; // px
                    const hoverHeight = 16; // px
                    const height = isHover ? hoverHeight : normalHeight;
                    // top을 height 변화의 절반만큼 위로 보정
                    const topPos = `calc(${top}% - ${(height - normalHeight) / 2}px)`;

                    return (
                        <div
                            key={i}
                            className={`absolute left-0 w-full rounded-sm transition-all duration-100 ${colorMap[type]}`}
                            style={{
                                top: topPos,
                                height: `${height}px`,
                                opacity: isHover ? 0.9 : 0.7,
                                zIndex: isHover ? 10 : 1,
                                cursor: !dragging ? 'pointer' : 'default',
                            }}
                            onMouseEnter={() => setHoverIdx(i)}
                            onMouseLeave={() => setHoverIdx(null)}
                            onClick={e => {
                                e.stopPropagation();
                                window.scrollTo({ top: paraTops[idx] - viewHlafH, behavior: 'smooth' });
                            }}
                        />
                    );
                })}

                {/* 커스텀 스크롤바(thumb) */}
                <div
                    className="absolute left-0 w-full bg-white/40 rounded-sm"
                    style={{
                        height: `${thumbHeightPercent}%`,
                        top: `${thumbTopPercent}%`,
                        opacity: 0.8,
                        pointerEvents: 'auto',
                        userSelect: 'none',
                    }}
                    onMouseDown={e => {
                        e.stopPropagation();
                        setDragging(true);
                    }}
                />
            </div>
        </div>
    );
} 