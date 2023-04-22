/* eslint-disable react/display-name */
import { memo } from 'react';
import { Model, ModelId } from '../../lib/schema';
import { ModelCard } from './model-card';

interface ModelCardGridProps {
    models: ModelId[];
    modelData: ReadonlyMap<ModelId, Model>;
    /**
     * The number models that will be eagerly displayed before lazy loading starts.
     *
     * If `0`, then all models will be lazily displayed.
     *
     * @default 0
     */
    lazyOffset?: number;
}
export const ModelCardGrid = memo(({ models, modelData, lazyOffset = 0 }: ModelCardGridProps) => {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {models.map((id, index) => {
                const model = modelData.get(id);
                if (!model) return null;

                return (
                    <ModelCard
                        id={id}
                        key={id}
                        lazy={index >= lazyOffset}
                        model={model}
                    />
                );
            })}
        </div>
    );
});
