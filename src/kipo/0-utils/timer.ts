
// label별 누적시간
const timeAccumulator: Record<string, number> = {};

/**
 * label별 누적시간 출력
 */
export function printAccTimes() {
    const accTimes = Object.entries(timeAccumulator)
        .map(([key, value]) => `${key}: ${value.toFixed(2)} ms`)
        .join('\n');
    console.log(accTimes);
}

/**
 * 함수별 누적 실행시간 측정을 위한 래퍼
 */
export async function measureTime<T>(fn: () => Promise<T> | T, label?: string): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    label = label ||
        fn.toString().match(/\( ?\) ?=> ?([^(]*?) ?\(/)?.[1] ||
        'anonymous';

    // 누적 시간 기록
    if (!timeAccumulator[label]) timeAccumulator[label] = 0;
    timeAccumulator[label] += end - start;

    return result;
}

/**
 * 메서드별 누적 실행시간 측정을 위한 데코레이터
 */
export function MeasureTime(target: any, propKey: string, desc: PropertyDescriptor) {
    const originalMethod = desc.value;

    desc.value = function (...args: any[]) {
        const label = `${target.constructor.name}.${propKey}`;
        const result = measureTime(() => originalMethod.apply(this, args), label);
        return result;
    };

    return desc;
}
