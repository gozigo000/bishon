import { dlog, isDev, isProd, isTest } from '../_utils/env';

type ErrorInfo = {
    severity: 'ARROR' | 'WARNING' | 'INFO';
    timestamp: Date;
    message: string;
    reference?: string;
    location?: string;
    context?: any;
    errCode?: string;
    errMsg?: string;
    errStack?: string;
}

/**
 * 전역 에러 수집기 클래스
 * 싱글톤 패턴으로 구현되어 애플리케이션 전체에서 하나의 인스턴스만 사용
 */
export class GlobalErrorCollector {
    private static instance: GlobalErrorCollector;
    private errors: ErrorInfo[] = [];
    
    private constructor() {}
    
    /** GlobalErrorCollector의 인스턴스 반환 */
    public static getInstance(): GlobalErrorCollector {
        if (!GlobalErrorCollector.instance) {
            GlobalErrorCollector.instance = new GlobalErrorCollector();
        }
        return GlobalErrorCollector.instance;
    }
    
    /** 새로운 에러 정보 추가 */
    public addError(error: ErrorInfo): void { this.errors.push(error); }
    
    /** 수집한 모든 에러 정보 반환 */
    public getErrors(): ErrorInfo[] { return this.errors; }
    
    /** 수집한 에러 정보 모두 초기화 */
    public clearErrors(): void { this.errors = []; }
    
    /** 에러가 존재하는지 확인 */
    public hasErrors(): boolean { return this.errors.length > 0; }
    
    /** 특정 심각도의 에러만 필터링하여 반환 */
    public getErrorsBySeverity(severity: ErrorInfo['severity']): ErrorInfo[] {
        return this.errors.filter(error => error.severity === severity);
    }
    
    /** 수집한 에러를 콘솔에 출력 */
    public logErrors(): void {
        if (isProd()) return;
        console.log(this.formatErrors());
    }

    /** 에러 정보를 포맷팅하여 문자열로 반환 */
    public formatErrors(): string {
        if (!this.hasErrors()) {
            return color.green('에러가 발견되지 않았습니다.');
        }
        return this.errors.map(errInfo => {
            const [bgClr, clr] = errInfo.severity === 'ARROR' ? [color.bgRed, color.red] : 
                errInfo.severity === 'WARNING' ? [color.bgYellow, color.yellow] :
                [color.bgCyan, color.brCyan];

            const severity = `[${errInfo.severity}]`;
            const message = `${errInfo.message}`;
            const timestamp = '\n(tms) ' + errInfo.timestamp.toLocaleString('ko-KR', { 
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric', 
                fractionalSecondDigits: 3,
            });
            const location = errInfo.location ? `\n(loc) ${errInfo.location}` : '';
            const reference = errInfo.reference ? `\n(ctx) ${errInfo.reference}` : '';
            const errCode = errInfo.errCode ? `\n(cod) ${errInfo.errCode}` : '';
            const errMsg = errInfo.errMsg ? `\n(err) ${errInfo.errMsg}` : '';
            const errStack = errInfo.errStack ? `\n(stk) ${errInfo.errStack}` : '';

            return bgClr(`${severity} ${message} `)
                + clr(`${timestamp}${location}${reference}${errCode}${errMsg}${errStack}\n`);
        }).join('\n');
    }
}

/**
 * 에러를 수집하는 유틸리티 함수
 * @param message 에러 메시지
 * @param error 발생한 에러 객체
 * @param reference 참고 정보
 */
export function collectError(message: string, error?: Error, reference?: string): void {
    const errorCollector = GlobalErrorCollector.getInstance();

    errorCollector.addError({
        severity: 'ARROR',
        message,
        timestamp: new Date(),
        location: getCallerPos(),
        errCode: error?.name,
        errMsg: error?.message,
        errStack: error?.stack?.replace(/.*?(?=\n)/, '-'.repeat(50)),
        reference,
    });
}

/**
 * 경고 메시지를 수집하는 유틸리티 함수
 * @param message 경고 메시지
 * @param reference 참고 정보
 */
export function collectWarning(message: string, reference?: any): void {
    const errorCollector = GlobalErrorCollector.getInstance();
    
    errorCollector.addError({
        severity: 'WARNING',
        message,
        timestamp: new Date(),
        location: getCallerPos(),
        reference,
    });
}

/**
 * 정보 메시지를 수집하는 유틸리티 함수
 * @param message 정보 메시지
 * @param reference 참고 정보
 */
export function collectInfo(message: string, reference?: any): void {
    const errorCollector = GlobalErrorCollector.getInstance();
    
    errorCollector.addError({
        severity: 'INFO',
        message,
        timestamp: new Date(),
        location: getCallerPos(),
        reference,
    });
}

/**
 * collect***(...)를 호출한 함수의 위치 정보 반환
 */
export function getCallerPos(): string {
    const stack = new Error().stack;
    if (!stack) return 'no-stack';
    
    const callerLine = stack.split('\n')[3];
    const match = callerLine.match(/at\s+([^\s]+)\s+\(([^)]+)\)/);
    if (!match) return `callerLine: ${callerLine}`;
    
    const [_, fn, loc] = match;
    const relLoc = loc.split('bishon').pop() || loc;
    return `${relLoc} - ${fn}()`;
}