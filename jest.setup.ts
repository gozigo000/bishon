import { log } from './src/_utils/env';

declare global { var log: (arg: any, showCallStack?: boolean) => void; }

// Jest 전역 스코프에 함수 등록
(global as any).log = log;
(global as any).color = color;