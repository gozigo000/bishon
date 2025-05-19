import { collectError } from '../errorCollector';

/**
 * 메서드에 try-catch를 적용하는 데코레이터
 * @param errorMessage 에러 발생 시 표시할 메시지
 * @param returnValue 에러 발생 시 반환할 기본값 (생략 시 원본 메서드의 반환 타입에 맞는 기본값 사용)
 */
export function errorHandler<T>(errorMessage: string, returnValue?: T) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            try {
                return await originalMethod.apply(this, args);
            } catch (error) {
                collectError(`${errorMessage}:`, error as Error);
                // MEMO: (!returnValue) 사용 X
                // (!returnValue)는 오른쪽 값들을 true로 평가: undefined, null, false, 0, '', NaN
                // (returnValue !== undefined)는 undefined만 true로 평가
                // undefined가 아닌 모든 값을 유효한 반환값으로 사용하기 위해 (!== undefined) 사용
                if (returnValue !== undefined) return returnValue;
                
                // 원본 메서드의 반환값 타입 추론
                const returnType = typeof originalMethod.apply(this, args);
                if (returnType === 'object') return {};
                if (returnType === 'number') return 0;
                if (returnType === 'string') return '';
                if (returnType === 'boolean') return false;
                return undefined;
            }
        };

        return descriptor;
    };
} 