import { isDev, isProd, isTest } from '../../_utils/env';

export function OnDev() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            if (!isDev()) return;
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

export function OnTest() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            if (!isTest()) return;
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

export function OnDevTest() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            if (isProd()) return;
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}
