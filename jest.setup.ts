import { print } from './src/_utils/color';

declare global { 
    /** 디버깅 로그 출력 */
    var log: typeof print;
}

// Jest 전역 스코프에 함수 등록
(global as any).log = print;