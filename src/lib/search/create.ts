import { deriveTags } from '../derive-tags';
import { Dataset, DatasetId, Model, ModelId, TagId } from '../schema';
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

export function createDatasetSearchIndex(datasetData: ReadonlyMap<DatasetId, Dataset>) {
    return new SearchIndex(
        [...datasetData].map(([id, dataset]): CorpusEntry<DatasetId, TagId> => {
            return {
                id,
                tags: new Set(dataset.tags),
                texts: [
                    {
                        text: [id, dataset.name].filter(Boolean).join('\n').toLowerCase(),
                        weight: 8,
                    },
                    {
                        text: asArray(dataset.author).filter(Boolean).join('\n').toLowerCase(),
                        weight: 4,
                    },
                    { text: dataset.description.toLowerCase(), weight: 1 },
                ],
            };
        })
    );
}
