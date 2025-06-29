import { memo } from 'react';
import { Collection, CollectionId, Model, ModelId } from '../../lib/schema';
import { CollectionCard, ModelCard } from './model-card';
import style from './model-card-grid.module.scss';

interface ModelCardGridProps {
    models: readonly (ModelId | CollectionId)[];
    modelData: ReadonlyMap<ModelId, Model>;
    collectionData?: ReadonlyMap<CollectionId, Collection>;
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
export const ModelCardGrid = memo(({ models, modelData, collectionData, lazyOffset = 0 }: ModelCardGridProps) => {
    return (
        <div className={style.grid}>
            {models.map((id, index) => {
                const collection = collectionData?.get(id as CollectionId);
                if (collection) {
                    return (
                        <CollectionCard
                            collection={collection}
                            id={id as CollectionId}
                            key={id}
                            lazy={index >= lazyOffset}
                            preview={collection.models.length === 0 ? undefined : modelData.get(collection.models[0])}
                        />
                    );
                }

                const model = modelData.get(id as ModelId);
                if (!model) return null;

                return (
                    <ModelCard
                        id={id as ModelId}
                        key={id}
                        lazy={index >= lazyOffset}
                        model={model}
                    />
                );
            })}
        </div>
    );
});
