import { OnDevTest } from './decorators/devHandler';
import { styleText as style } from 'util';
import { isString } from '../0-utils/typeCheck';

/**
 * 전역 메시지 수집 클래스
 * @note 싱글톤 패턴
 */
export class MsgCollector {
    private static instance: MsgCollector;
    private msgs: MsgInfo[] = [];
    
    private constructor() {}
    
    /** GlobalErrorCollector의 인스턴스 반환 */
    public static get $(): MsgCollector { return MsgCollector.getInstance(); }
    public static getInstance(): MsgCollector {
        if (!MsgCollector.instance) {
            MsgCollector.instance = new MsgCollector();
        }
        return MsgCollector.instance;
    }
    
    /** 새로운 메시지 추가 */
    public addMsg(newMsg: MsgInfo): void {
        const isNotNew = this.msgs.some(msg => 
            msg.message === newMsg.message && 
            msg.location === newMsg.location &&
            msg.reference === newMsg.reference
        );
        if (isNotNew) return;
        this.msgs.push(newMsg);   
    }
    
    /** 수집한 메시지 모두 초기화 */
    public clearMsgs(): void { this.msgs = []; }
    
    /** 메시지가 존재하는지 확인 */
    public hasMsgs(): boolean { return this.msgs.length > 0; }
    
    /** 수집한 모든 메시지 반환 */
    public getMsgs(): MsgInfo[] { return this.msgs; }
    
    /** 특정 종류의 메시지만 반환 */
    public getMsgsByKind(kind: MsgInfo['kind']): MsgInfo[] {
        return this.msgs.filter(error => error.kind === kind);
    }
    
    /** 수집한 메시지를 콘솔에 출력 */
    @OnDevTest
    public logMsgs(): void {
        console.log(this.formatMsgs());
    }

    /** 메시지를 포맷팅하여 문자열로 반환 */
    private formatMsgs(): string {
        if (!this.hasMsgs()) {
            return style(['green'], '메시지가 없습니다.');
        }
        return this.msgs.map(msgInfo => {
            type ToColor = (t:string) => string;
            const [bgClr, clr]: [ToColor, ToColor] = 
                msgInfo.kind === 'ERROR' ? [
                    t => style(['bgRed'], t),
                    t => style(['red'], t)
                ] : 
                msgInfo.kind === 'WARNING' ? [
                    t => style(['bgYellow'], t),
                    t => style(['yellow'], t)
                ] : [
                    t => style(['bgCyan'], t),
                    t => style(['cyanBright'], t)
                ];

            const kind = `[${msgInfo.kind}]`;
            const message = `${msgInfo.message}`;
            const timestamp = '\n(tms) ' + msgInfo.timestamp.toLocaleString('ko-KR', { 
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric', 
                fractionalSecondDigits: 3,
            });
            const location = msgInfo.location ? `\n(loc) ${msgInfo.location}` : '';
            const reference = msgInfo.reference ? `\n(ctx) ${msgInfo.reference}` : '';
            const errCode = msgInfo.errCode ? `\n(cod) ${msgInfo.errCode}` : '';
            const errMsg = msgInfo.errMsg ? `\n(err) ${msgInfo.errMsg}` : '';
            const errStack = msgInfo.errStack ? `\n(stk) ${msgInfo.errStack}` : '';

            return bgClr(`${kind} ${message} `)
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
export function collectError(message: string, reference?: string): void;
export function collectError(message: string, error?: Error, reference?: string): void;
export function collectError(message: string, error?: Error | string, reference?: string): void {
    if (isString(error)) {
        reference = error;
        error = undefined;
    }
    const msgCollector = MsgCollector.getInstance();

    msgCollector.addMsg({
        kind: 'ERROR',
        message,
        timestamp: new Date(),
        location: getCallerPos(),
        errCode: error?.name,
        errMsg: error?.message,
        // 번들된 주소가 출력돼서 우선 지움
        // errStack: error?.stack?.replace(/.*?(?=\n)/, '-'.repeat(50)), 
        reference,
    });
}

/**
 * 경고 메시지를 수집하는 유틸리티 함수
 * @param message 경고 메시지
 * @param reference 참고 정보
 */
export function collectWarning(message: string, reference?: any): void {
    const msgCollector = MsgCollector.getInstance();
    
    msgCollector.addMsg({
        kind: 'WARNING',
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
    const msgCollector = MsgCollector.getInstance();
    
    msgCollector.addMsg({
        kind: 'INFO',
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