
// label별 누적 시간 저장용 객체
const timeAccumulator: Record<string, number> = {};

/**
 * label별로 누적 시간 측정하는 래퍼 함수
 */
export async function measureTime<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const elapsed = end - start;

    // 누적 시간 기록
    if (!timeAccumulator[label]) timeAccumulator[label] = 0;
    timeAccumulator[label] += elapsed;

    return result;
}

/**
 * label별 누적 시간 조회 함수
 */
export function printAccTimes() {
    for (const key in timeAccumulator) {
        console.log(`${key}: ${timeAccumulator[key].toFixed(2)} ms`);
    }
}
