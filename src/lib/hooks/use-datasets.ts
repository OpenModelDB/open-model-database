import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dataset, DatasetId } from '../schema';
import { EMPTY_MAP, typedEntries } from '../util';
import { addUpdateListener, getWebApi, startListeningForUpdates } from '../web-api';

export interface UseDatasets {
    readonly datasetData: ReadonlyMap<DatasetId, Dataset>;
}

export function useDatasets(datasets?: Readonly<Record<DatasetId, Dataset>>): UseDatasets {
    const staticData: ReadonlyMap<DatasetId, Dataset> = useMemo(
        () => (datasets ? new Map(typedEntries(datasets)) : EMPTY_MAP),
        [datasets]
    );
    const [data, setData] = useState(staticData);

    const update = useCallback((value: ReadonlyMap<DatasetId, Dataset>): void => {
        setData((prev) => {
            if (prev === value) return prev;

            const newData = new Map();
            for (const [id, dataset] of value) {
                const old = prev.get(id);
                if (old && areEqual(old, dataset)) {
                    newData.set(id, old);
                } else {
                    newData.set(id, dataset);
                }
            }
            return newData;
        });
    }, []);

    const updateWithWebApi = useCallback((): void => {
        getWebApi()
            .then(async (webApi) => {
                if (!webApi) return;
                const datasets = await webApi.datasets.getAll();
                update(datasets);
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

    return { datasetData: data };
}

function areEqual(a: Dataset, b: Dataset): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}
