import { memo } from 'react';
import { Model, ModelId } from '../../lib/schema';
import { ModelCard } from './model-card';
import style from './model-card-grid.module.scss';

interface ModelCardGridProps {
    models: readonly ModelId[];
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
// eslint-disable-next-line react/display-name
export const ModelCardGrid = memo(({ models, modelData, lazyOffset = 0 }: ModelCardGridProps) => {
    return (
        <div className={style.grid}>
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
