import { useCallback, useEffect, useMemo, useState } from 'react';
import { Collection, CollectionId } from '../schema';
import { EMPTY_MAP, typedEntries } from '../util';
import { addUpdateListener, getWebApi, startListeningForUpdates } from '../web-api';

export interface UseCollections {
    readonly collectionData: ReadonlyMap<CollectionId, Collection>;
}

export function useCollections(collections?: Readonly<Record<CollectionId, Collection>>): UseCollections {
    const staticData: ReadonlyMap<CollectionId, Collection> = useMemo(
        () => (collections ? new Map(typedEntries(collections)) : EMPTY_MAP),
        [collections]
    );
    const [data, setData] = useState(staticData);

    const update = useCallback((value: ReadonlyMap<CollectionId, Collection>): void => {
        setData((prev) => {
            if (prev === value) return prev;

            const newData = new Map();
            for (const [id, collection] of value) {
                const old = prev.get(id);
                if (old && areEqual(old, collection)) {
                    newData.set(id, old);
                } else {
                    newData.set(id, collection);
                }
            }
            return newData;
        });
    }, []);

    const updateWithWebApi = useCallback((): void => {
        getWebApi()
            .then(async (webApi) => {
                if (!webApi) return;
                update(await webApi.collections.getAll());
            })
            .catch((e) => console.error(e));
    }, [update]);

    useEffect(() => {
        update(staticData);
        updateWithWebApi();
    }, [update, updateWithWebApi, staticData]);

    useEffect(() => {
        startListeningForUpdates();
        return addUpdateListener(updateWithWebApi);
    }, [updateWithWebApi]);

    return { collectionData: data };
}

function areEqual(a: Collection, b: Collection): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}
