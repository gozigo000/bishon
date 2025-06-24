
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

