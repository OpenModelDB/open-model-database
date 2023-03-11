import { useEffect, useMemo, useState } from 'react';
import { Model, ModelId } from '../schema';
import { typedEntries } from '../util';
import { addUpdateListener, getWebApi, startListeningForUpdates } from '../web-api';

export interface UseModels {
    readonly modelData: ReadonlyMap<ModelId, Model>;
}

export function useModels(models: Readonly<Record<ModelId, Model>>): UseModels {
    const staticData = useMemo(() => new Map(typedEntries(models)), [models]);
    const [dynamicData, setDynamicData] = useState<ReadonlyMap<ModelId, Model>>();

    useEffect(() => {
        startListeningForUpdates();
        return addUpdateListener(() => {
            getWebApi()
                .then(async (webApi) => {
                    if (!webApi) return;
                    const models = await webApi.models.getAll();
                    setDynamicData(models);
                })
                .catch((e) => console.error(e));
        });
    }, []);

    return { modelData: dynamicData ?? staticData };
}
