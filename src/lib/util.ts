import { TagId } from './schema';

export const EMPTY_ARRAY: readonly never[] = [];
export const EMPTY_SET: ReadonlySet<never> = new Set();

export function assertNever(value: never): never {
    throw new Error(`Unreachable code path. The value ${String(value)} is invalid.`);
}

export function noop() {
    // do nothing
}

export function lazy<T>(fn: () => T): () => T {
    let hasValue = false;
    let value: T;
    return () => {
        if (hasValue) return value;
        value = fn();
        hasValue = true;
        return value;
    };
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function lazyWithKey<K, T extends {} | null>(fn: (key: K) => T): (key: K) => T {
    const cache = new Map<K, T>();
    return (key) => {
        let value = cache.get(key);
        if (value === undefined) {
            value = fn(key);
            cache.set(key, value);
        }
        return value;
    };
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function lazyWithWeakKey<K extends object, T extends {} | null>(fn: (key: K) => T): (key: K) => T {
    const cache = new WeakMap<K, T>();
    return (key) => {
        let value = cache.get(key);
        if (value === undefined) {
            value = fn(key);
            cache.set(key, value);
        }
        return value;
    };
}

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function sortObjectKeys<K extends string>(
    obj: Record<K, unknown>,
    order?: readonly K[] | ((a: K, b: K) => number)
): void {
    const old = { ...obj };
    const objKeys = typedKeys(obj);
    for (const key of objKeys) {
        delete obj[key];
    }

    let keys: K[];
    if (!order) {
        keys = objKeys.sort();
    } else if (typeof order === 'function') {
        keys = objKeys.sort(order);
    } else {
        const keySet = new Set<K>();
        const objKeySet = new Set(objKeys);
        for (const key of order) {
            if (objKeySet.has(key)) {
                keySet.add(key);
            }
        }
        for (const key of objKeys.sort()) {
            keySet.add(key);
        }
        keys = [...keySet];
    }

    for (const key of keys) {
        obj[key] = old[key];
    }
}

export function hasOwn(obj: object, key: string | number | symbol): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function asArray<T>(value: T | T[] | readonly T[]): readonly T[] {
    if (Array.isArray(value)) {
        return value;
    } else {
        return [value as T];
    }
}

export function joinClasses(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export function withoutHash(urlFragment: string, removeTrailingSlash = true): string {
    const fragment = urlFragment.replace(/#[\s\S]*$/, '');
    if (removeTrailingSlash) return fragment.replace(/\/$/, '');
    return fragment;
}

export function typedEntries<K extends string, V>(o: Record<K, V>): [K, V][] {
    return Object.entries(o) as [K, V][];
}
export function typedKeys<K extends string>(o: Record<K, unknown>): K[] {
    return Object.keys(o) as K[];
}

export function compareString(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

function getTagCategory(id: TagId): string | undefined {
    const colon = id.indexOf(':');
    if (colon === -1) return undefined;
    return id.slice(0, colon);
}
export function compareTagId(a: TagId, b: TagId): number {
    return compareString(getTagCategory(a) ?? '', getTagCategory(b) ?? '') || compareString(a, b);
}

export function getColorMode(numberOfChannels: number) {
    switch (numberOfChannels) {
        case 1:
            return 'grayscale';
        case 3:
            return 'rgb';
        case 4:
            return 'rgba';
        default:
            return numberOfChannels;
    }
}
