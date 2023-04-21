import { deriveTags } from '../derive-tags';
import { Model, ModelId, TagId } from '../schema';
import { asArray } from '../util';
import { CorpusEntry, SearchIndex } from './search-index';

export function createModelSearchIndex(modelData: ReadonlyMap<ModelId, Model>) {
    return new SearchIndex(
        [...modelData].map(([id, model]): CorpusEntry<ModelId, TagId> => {
            return {
                id,
                tags: new Set(deriveTags(model)),
                texts: [
                    {
                        text: [id, model.name].filter(Boolean).join('\n').toLowerCase(),
                        weight: 8,
                    },
                    {
                        text: asArray(model.author).filter(Boolean).join('\n').toLowerCase(),
                        weight: 4,
                    },
                    {
                        text: [model.architecture, `${model.scale}x`, model.dataset]
                            .filter(Boolean)
                            .join('\n')
                            .toLowerCase(),
                        weight: 1,
                    },
                    { text: model.description.toLowerCase(), weight: 1 },
                ],
            };
        })
    );
}
