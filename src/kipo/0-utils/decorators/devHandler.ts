import { isDev, isProd, isTest } from '../../../_utils/env';

export function OnDev(target: any, propKey: string, desc: PropertyDescriptor) {
    const originalMethod = desc.value;

    desc.value = function (...args: any[]) {
        if (!isDev()) return;
        return originalMethod.apply(this, args);
    };

    return desc;
}

export function OnTest(target: any, propKey: string, desc: PropertyDescriptor) {
    const originalMethod = desc.value;

    desc.value = function (...args: any[]) {
        if (!isTest()) return;
        return originalMethod.apply(this, args);
    };

    return desc;
}

export function OnDevTest(target: any, propKey: string, desc: PropertyDescriptor) {
    const originalMethod = desc.value;

    desc.value = function (...args: any[]) {
        if (isProd()) return;
        return originalMethod.apply(this, args);
    };

    return desc;
}
