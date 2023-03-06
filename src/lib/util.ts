export const EMPTY_ARRAY: readonly never[] = [];
export const EMPTY_SET: ReadonlySet<never> = new Set();

export function assertNever(value: never): never {
    throw new Error(`Unreachable code path. The value ${String(value)} is invalid.`);
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

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function sortObjectKeys(obj: Record<string, unknown>, order: readonly string[] = []): void {
    const old = { ...obj };
    const objKeys = Object.keys(obj);
    for (const key of objKeys) {
        delete obj[key];
    }

    let keys: string[];
    if (order.length === 0) {
        keys = objKeys.sort();
    } else {
        const keySet = new Set<string>();
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

export function getColorMode(numberOfChannels: number | string) {
    switch (Number(numberOfChannels)) {
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
