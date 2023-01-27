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

export const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
