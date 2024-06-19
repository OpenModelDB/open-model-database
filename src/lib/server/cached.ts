import { Collection, CollectionId, Model, ModelId } from '../schema';
import { fileApi, getFileApiMutationCounterUnsynchronized } from './file-data';

let cachedMutationCounter = 0;
function cached<T>(fn: () => Promise<T>): () => Promise<T> {
    let cache: T | undefined = undefined;

    return async () => {
        if (cache === undefined || cachedMutationCounter !== getFileApiMutationCounterUnsynchronized()) {
            cache = await fn();
            cachedMutationCounter = getFileApiMutationCounterUnsynchronized();
        }
        return cache;
    };
}

/**
 * This is a cached version of `fileApi.models.getAll()`.
 *
 * The caller is not allowed to mutate the returned map or any of its values.
 */
export const getCachedModels = cached((): Promise<ReadonlyMap<ModelId, Model>> => fileApi.models.getAll());

/**
 * This is a cached version of `fileApi.collections.getAll()`.
 *
 * The caller is not allowed to mutate the returned map or any of its values.
 */
export const getCachedCollections = cached(
    (): Promise<ReadonlyMap<CollectionId, Collection>> => fileApi.collections.getAll()
);
