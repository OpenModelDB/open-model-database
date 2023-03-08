import { useEffect, useState } from 'react';
import { CollectionApi, DBApi } from '../data-api';
import { addUpdateListener } from '../web-api';

type Singular<S extends string> = S extends `${infer T}s` ? T : S;
type Type = Singular<keyof DBApi>;
type IdOf<T extends Type> = DBApi[`${T}s`] extends CollectionApi<infer Id, unknown> ? Id : never;
type ValueOf<T extends Type> = DBApi[`${T}s`] extends CollectionApi<unknown, infer Value> ? Value : never;

export function useCurrent<T extends Type>(
    api: DBApi | undefined,
    type: T,
    id: IdOf<T>,
    value: ValueOf<T>
): ValueOf<T> {
    const [current, setCurrent] = useState(value);

    useEffect(() => {
        if (api) {
            return addUpdateListener(() => {
                const collection = api[`${type}s`] as CollectionApi<IdOf<T>, ValueOf<T>>;
                collection.get(id).then(setCurrent, (e) => console.error(e));
            });
        }
    }, [api, id, type]);

    return current;
}
