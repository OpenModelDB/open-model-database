import { Model, ModelId } from './schema';
import { EMPTY_ARRAY, assertNever } from './util';

export type Sort = `${SortBy}-${SortOrder}`;
export type SortBy = 'relevance' | 'date' | 'scale' | 'size';
export type SortOrder = 'asc' | 'desc';

export function validateSort(sort: string): sort is Sort {
    return /^(relevance|date|scale|size)-(asc|desc)$/.test(sort);
}

export type ParsedSort = [SortBy, SortOrder];
export type ParsedSortOf<T extends Sort> = T extends `${infer By extends SortBy}-${infer Order extends SortOrder}`
    ? [By, Order]
    : never;

export function parseSort<S extends Sort>(sort: S): ParsedSortOf<S> {
    return sort.split('-') as ParsedSortOf<S>;
}

export function sortModels(
    models: readonly ModelId[],
    sort: Sort,
    modelData: ReadonlyMap<ModelId, Model>
): readonly ModelId[] {
    // we assume that models are sorted by relevance desc by default
    if (sort === 'relevance-desc') {
        return models;
    } else if (sort === 'relevance-asc') {
        return [...models].reverse();
    }

    const [by, order] = parseSort(sort);
    const compare = getCompareFn(by, order, modelData);
    return [...models].sort(compare);
}

function getCompareFn(
    by: Exclude<SortBy, 'relevance'>,
    order: SortOrder,
    modelData: ReadonlyMap<ModelId, Model>
): (a: ModelId, b: ModelId) => number {
    const keyFn = getSortKeyFn(by, modelData);
    const unknown = order === 'asc' ? 1e100 : -1e100;
    const f = order === 'asc' ? 1 : -1;
    return (a, b) => f * ((keyFn(a) ?? unknown) - (keyFn(b) ?? unknown));
}
function getSortKeyFn(
    by: Exclude<SortBy, 'relevance'>,
    modelData: ReadonlyMap<ModelId, Model>
): (id: ModelId) => number | undefined {
    switch (by) {
        case 'date':
            return (id) => {
                const date = modelData.get(id)?.date;
                if (!date) {
                    return undefined;
                }
                return Date.parse(date);
            };

        case 'scale':
            return (id) => modelData.get(id)?.scale;

        case 'size':
            return (id) => {
                const resources = modelData.get(id)?.resources ?? EMPTY_ARRAY;

                // find the minimum size
                let size: number | undefined = undefined;
                for (const resource of resources) {
                    if (size === undefined || resource.size < size) {
                        size = resource.size;
                    }
                }
                return size;
            };

        default:
            return assertNever(by);
    }
}
