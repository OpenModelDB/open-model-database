import { DBApi } from './data-api';
import { JsonApiCollection, JsonApiRequestHandler, JsonRequest, JsonResponse, Method } from './data-json-api';
import { Model, ModelId, Tag, TagId, User, UserId } from './schema';
import { lazy } from './util';

function createWebRequestHandler<Id, Value>(url: string): JsonApiRequestHandler<Id, Value> {
    return async <M extends Method>(
        method: M,
        req: JsonRequest<Id, Value, M>['data']
    ): Promise<JsonResponse<Id, Value, M>['data']> => {
        const res = await fetch(url, { method: 'POST', body: JSON.stringify({ method, data: req }) });
        if (res.status !== 200) {
            throw new Error(res.statusText);
        }
        const { data } = (await res.json()) as JsonResponse<Id, Value, M>;
        return data;
    };
}

export const getWebApi = lazy(async (): Promise<DBApi | undefined> => {
    const webApi: DBApi = {
        models: new JsonApiCollection(createWebRequestHandler<ModelId, Model>('/api/models')),
        tags: new JsonApiCollection(createWebRequestHandler<TagId, Tag>('/api/tags')),
        users: new JsonApiCollection(createWebRequestHandler<UserId, User>('/api/users')),
    };

    // we do an empty update to test the waters
    return webApi.tags.update([]).then(
        () => webApi,
        () => undefined
    );
});
