import { useMemo } from 'react';
import { DBApi } from '../data-api';
import { Model, ModelId } from '../schema';
import { noop } from '../util';

export interface UseUpdateModel {
    updateModelProperty: <K extends keyof Model>(key: K, value: Model[K]) => void;
}

export function useUpdateModel(webApi: DBApi | undefined, modelId: ModelId): UseUpdateModel {
    const updateModelProperty = useMemo<UseUpdateModel['updateModelProperty']>(() => {
        if (!webApi) return noop;
        return <K extends keyof Model>(key: K, value: Model[K]) => {
            const fn = async () => {
                const model = await webApi.models.get(modelId);
                model[key] = value;
                await webApi.models.update([[modelId, model]]);
            };
            fn().catch((e) => console.error(e));
        };
    }, [webApi, modelId]);

    return { updateModelProperty };
}
