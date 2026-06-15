import { useMemo } from 'react';
import { DBApi } from '../data-api';
import { Dataset, DatasetId } from '../schema';
import { noop } from '../util';

export type UpdateDatasetPropertyFn = <K extends keyof Dataset>(key: K, value: Dataset[K]) => void;

export interface UseUpdateDataset {
    updateDatasetProperty: UpdateDatasetPropertyFn;
}

export function useUpdateDataset(webApi: DBApi | undefined, datasetId: DatasetId): UseUpdateDataset {
    const updateDatasetProperty = useMemo<UpdateDatasetPropertyFn>(() => {
        if (!webApi) return noop;
        return <K extends keyof Dataset>(key: K, value: Dataset[K]) => {
            const fn = async () => {
                const dataset = await webApi.datasets.get(datasetId);
                dataset[key] = value;
                await webApi.datasets.update([[datasetId, dataset]]);
            };
            fn().catch((e) => console.error(e));
        };
    }, [webApi, datasetId]);

    return { updateDatasetProperty };
}
