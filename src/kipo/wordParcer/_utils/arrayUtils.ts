/**
 * @example
 * const users = [
 *   { id: 1, name: '철수' },
 *   { id: 2, name: '영희' },
 *   { id: 3, name: '민수' }
 * ];
 * const ret = indexBy(users, 'id'); // { '1': { id: 1, name: '철수' }, '2': { id: 2, name: '영희' }, '3': { id: 3, name: '민수' } }
 */
export function indexBy<T extends object, K extends keyof T>(array: T[], key: K): Record<string, T> {
    return array.reduce<Record<string, T>>((result, item) => {
        result[String(item[key])] = item;
        return result;
    }, {});
}

/**
 * @example
 * const users = [
 *   { id: 1, name: '철수' },
 *   { id: 2, name: '영희' },
 *   { id: 3, name: '민수' }
 * ];
 * const ret = indexByFn(users, user => user.name[0]); // { '철': { id: 1, name: '철수' }, '영': { id: 2, name: '영희' }, '민': { id: 3, name: '민수' } }
 */
export function indexByFn<T extends object, K extends string>(array: T[], fn: (item: T) => K): Record<K, T> {
    return array.reduce<Record<K, T>>((result, item) => {
        result[fn(item)] = item;
        return result;
    }, {} as Record<K, T>);
}

/**
 * @example
 * const obj = { a: 1, b: 2, c: 3 };
 * const ret = invert(obj); // { '1': 'a', '2': 'b', '3': 'c' }
 */
export function invert<T extends Record<string, string | number>>(obj: T): Record<string, keyof T> {
    return Object.fromEntries(
        Object.entries(obj)
            .map(([key, value]) => [String(value), key])
    );
}
