import { useEffect, useState } from 'react';

export type SearchParams<K extends string = string> = Readonly<Partial<Record<K, string>>>;

function toSearchString(params: SearchParams): string {
    const p = new URLSearchParams();
    const keys = Object.keys(params).sort();
    for (const key of keys) {
        const value = params[key];
        if (value !== undefined) {
            p.set(key, value);
        }
    }
    return p.toString();
}

function getParams(): SearchParams {
    const params: Record<string, string> = {};
    for (const [key, value] of new URLSearchParams(location.search.slice(1))) {
        params[key] = value;
    }
    return params;
}
function pushParams(params: SearchParams): void {
    const url = new URL(location.href);
    const search = toSearchString(params);
    if (url.search.slice(1) !== search) {
        url.search = search;
        history.pushState(null, '', url);
    }
}

export function useSearchParams<K extends string = string>(): [
    SearchParams<K> | undefined,
    (value: SearchParams<K>) => void
] {
    const [params, setParams] = useState<SearchParams<K>>();

    useEffect(() => {
        setParams(getParams());

        const update = () => {
            setParams((prev) => {
                const current = getParams();
                if (prev && toSearchString(prev) === toSearchString(current)) {
                    return prev;
                }
                return current;
            });
        };

        window.addEventListener('popstate', update);
        return () => {
            window.removeEventListener('popstate', update);
        };
    }, []);

    useEffect(() => {
        if (params) {
            const timerId = setTimeout(() => pushParams(params), 2000);
            return () => clearTimeout(timerId);
        }
    }, [params]);

    return [params, setParams];
}
