import { color } from "./color";

export function isDev() { return process.env.NODE_ENV === 'development'; }
export function isTest() { return process.env.NODE_ENV === 'test'; }
export function isProd() { return process.env.NODE_ENV === 'production'; }

export function runInDev<T, Args extends any[]>(
    fn: (...args: Args) => T | Promise<T>,
    ...args: Args
): T | Promise<T> | undefined {
    if (isDev()) {
        return fn(...args);
    }
    return undefined;
}

export let devLogOff = false;
// devLogOff = true;
export function dlog(arg1: any, arg2?: any, showCallStack: boolean = false) {
    if (devLogOff) return;

    if (isDev() || isTest()) {
        let out: string[] = [];

        const a = color.brBlue(arg1.toString());
        const b = arg2 ? color.brYellow(arg2.toString()) : '';
        out.push(a + ' ' + b);

        if (showCallStack) {
        // 호출된 라인 정보 추출
        const stack = new Error().stack;
        if (!stack) return;
        const lines = stack.split('\n').slice(2); // print 함수 자신을 제외한 스택
        let n = 1;
        lines.forEach((ln) => {
            if (ln.includes('node_modules')) return;
            
            const match = ln.match(/bishon\\(.*)/);
            if (!match) return;

            const info = match[1].replace(':', ' (');
            out.push(color.brMagenta(`${n++}.`) + color.yellow(` ${info}`));
            });
        }

        out.push(color.brMagenta('--------------------------------'));
        console.log(out.join('\n'));
    }
}

export function printFnParams(fn: Function): void {
    if (isDev()) {
        const fnStr = fn.toString();
        const paramsMatch = fnStr.match(/\(([^)]*)\)/);
        if (paramsMatch) {
            const params = paramsMatch[1].split(',').map(param => param.trim());
            console.log('함수 파라미터:', params);
        }
    }
}

export function runWithParamNames<T, Args extends any[]>(
    fn: (...args: Args) => T | Promise<T>,
    ...args: Args
): T | Promise<T> | undefined {
    if (isDev()) {
        const fnStr = fn.toString();
        const paramsMatch = fnStr.match(/\(([^)]*)\)/);
        if (paramsMatch) {
            const params = paramsMatch[1].split(',').map(param => param.trim());
            const paramValues = params.map((param, index) => ({
                name: param,
                value: args[index]
            }));
            console.log('함수 파라미터와 값:', paramValues);
        }
        return fn(...args);
    }
    return undefined;
}

