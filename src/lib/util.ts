import { Image, TagCategory, TagCategoryId, TagId } from './schema';

export const EMPTY_ARRAY: readonly never[] = [];
export const EMPTY_SET: ReadonlySet<never> = new Set();
export const EMPTY_MAP: ReadonlyMap<never, never> = new Map<never, never>();

export function assertNever(value: never): never {
    throw new Error(`Unreachable code path. The value ${String(value)} is invalid.`);
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isNonNull<T extends {}>(value: T | undefined | null): value is T {
    return value != null;
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
    obj: Partial<Record<K, unknown>>,
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

export function typedEntries<K extends string, V>(o: Record<K, V>): [K, V][];
export function typedEntries<K extends string, V>(o: Partial<Record<K, V>>): [K, V | undefined][];
export function typedEntries<K extends string, V>(o: Record<K, V>): [K, V][] {
    return Object.entries(o) as [K, V][];
}
export function typedKeys<K extends string>(o: Partial<Record<K, unknown>>): K[] {
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
export function isDerivedTag(id: TagId): boolean {
    return id.includes(':');
}

export function getColorMode(numberOfChannels: number) {
    switch (numberOfChannels) {
        case 1:
            return 'Grayscale';
        case 3:
            return 'RGB';
        case 4:
            return 'RGBA';
        default:
            return numberOfChannels;
    }
}

export function getTagCategoryOrder(
    iter: Iterable<readonly [TagCategoryId, TagCategory]>
): (readonly [TagCategoryId, TagCategory])[] {
    const array = [...iter];
    array.sort((a, b) => {
        const order = a[1].order - b[1].order;
        if (order) return order;
        return compareString(a[0], b[0]);
    });
    return array;
}

export function joinListString(elements: readonly string[], conjunction: 'and' | 'or' = 'and'): string {
    if (elements.length === 0) {
        return 'none';
    } else if (elements.length === 1) {
        return elements[0];
    } else if (elements.length === 2) {
        const [a, b] = elements;
        return `${a} ${conjunction} ${b}`;
    } else {
        return elements
            .map((e, i) => {
                let prefix;
                if (i === 0) {
                    prefix = '';
                } else if (i === elements.length - 1) {
                    prefix = `, ${conjunction} `;
                } else {
                    prefix = ', ';
                }

                return prefix + e;
            })
            .join('');
    }
}

export function getPreviewImage(image: Image) {
    switch (image.type) {
        case 'paired':
            return image.thumbnail || image.SR;
            break;
        case 'standalone':
            return image.thumbnail || image.url;
            break;
        default:
            return undefined;
    }
}

export const DATE_REGEX = /^\d{4}-(?:0[1-9]|1[012])-(?:0[1-9]|[12][0-9]|3[01])$/;

export function capitalize(str: string): string {
    if (str.length === 0) return '';
    return str[0].toUpperCase() + str.slice(1);
}
