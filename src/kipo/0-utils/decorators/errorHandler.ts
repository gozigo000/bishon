import { collectError } from '../errorCollector';
import { styleText as style } from "util";

/**
 * 메서드에 try-catch를 적용하는 데코레이터
 * @param errorMessage 에러 발생 시 표시할 메시지
 * @param returnValue 에러 발생 시 반환할 기본값 (생략 시 원본 메서드의 반환 타입에 맞는 기본값 사용)
 */
export function ErrorHandler(errorMessage: string, returnValue?: any) {
    return function (target: any, propKey: string, desc: PropertyDescriptor) {
        const originalMethod = desc.value;

        desc.value = function (...args: any[]) {
            try {
                const result = originalMethod.apply(this, args);
                // Promise인 경우 await 처리
                if (result instanceof Promise) {
                    return result.catch(error => {
                        collectError(errorMessage, error);
                        console.debug(style(['yellow'], `ErrorHandler: ${errorMessage}:`), error);
                        return (returnValue !== undefined) ? returnValue : null;
                    });
                }
                return result;
            } catch (error) {
                collectError(errorMessage, error as Error);
                console.debug(style(['yellow'], `ErrorHandler: ${errorMessage}:`), error);
                return (returnValue !== undefined) ? returnValue : null;
                // MEMO: (!returnValue) 사용 X
                // (!returnValue)는 오른쪽 값들을 true로 평가: undefined, null, false, 0, '', NaN
                // (returnValue !== undefined)는 undefined만 true로 평가
                // undefined가 아닌 모든 값을 유효한 반환값으로 사용하기 위해 (!== undefined) 사용
            }
        };

        return desc;
    };
}