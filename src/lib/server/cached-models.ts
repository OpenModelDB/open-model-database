import { Model, ModelId } from '../schema';
import { fileApi, getFileApiMutationCounterUnsynchronized } from './file-data';

let cached_models: ReadonlyMap<ModelId, Model> | undefined = undefined;
let cached_mutation_counter = 0;
/**
 * This is a cached version of `fileApi.models.getAll()`.
 *
 * The caller is not allowed to mutate the returned map or any of its values.
 */
export async function getCachedModels(): Promise<ReadonlyMap<ModelId, Model>> {
    if (cached_models === undefined || cached_mutation_counter !== getFileApiMutationCounterUnsynchronized()) {
        cached_models = await fileApi.models.getAll();
        cached_mutation_counter = getFileApiMutationCounterUnsynchronized();
    }
    return cached_models;
}
