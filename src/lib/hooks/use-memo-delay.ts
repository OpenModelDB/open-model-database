import { useEffect, useState } from 'react';

export function useMemoDelay<T>(fn: () => T, delay: number): T {
    const [value, setValue] = useState(fn);

    useEffect(() => {
        let complete = false;
        const id = setTimeout(() => {
            complete = true;
            setValue(fn);
        }, delay);
        return () => {
            if (!complete) {
                clearTimeout(id);
            }
        };
    }, [fn, delay]);

    return value;
}
