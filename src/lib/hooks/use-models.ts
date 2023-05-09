import { useCallback, useEffect, useMemo, useState } from 'react';
import { Model, ModelId } from '../schema';
import { EMPTY_MAP, typedEntries } from '../util';
import { addUpdateListener, getWebApi, startListeningForUpdates } from '../web-api';

export interface UseModels {
    readonly modelData: ReadonlyMap<ModelId, Model>;
}

export function useModels(models?: Readonly<Record<ModelId, Model>>): UseModels {
    const staticData: ReadonlyMap<ModelId, Model> = useMemo(
        () => (models ? new Map(typedEntries(models)) : EMPTY_MAP),
        [models]
    );
    const [data, setData] = useState(staticData);

    const update = useCallback((value: ReadonlyMap<ModelId, Model>): void => {
        setData((prev) => {
            if (prev === value) return prev;

            const newData = new Map();
            for (const [id, model] of value) {
                const old = prev.get(id);
                if (old && areEqual(old, model)) {
                    newData.set(id, old);
                } else {
                    newData.set(id, model);
                }
            }
            return newData;
        });
    }, []);

    const updateWithWebApi = useCallback((): void => {
        getWebApi()
            .then(async (webApi) => {
                if (!webApi) return;
                const models = await webApi.models.getAll();
                update(models);
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

    return { modelData: data };
}

function areEqual(a: Model, b: Model): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}
