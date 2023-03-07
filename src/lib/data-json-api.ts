import { CollectionApi } from './data-api';

interface ApiMapping<Id, Value> {
    get: (data: Id) => Value;
    getIds: () => Id[];
    getAll: () => [Id, Value][];

    update: (data: (readonly [Id, Value])[]) => void;
    delete: (data: Id[]) => void;
    changeId: (data: [Id, Id]) => void;
}

export type Method = keyof CollectionApi<never, never>;

export type JsonRequest<Id, Value, M extends Method = Method> = {
    method: M;
    data: Parameters<ApiMapping<Id, Value>[M]>[0];
};
export type JsonResponse<Id, Value, M extends Method = Method> = { data: ReturnType<ApiMapping<Id, Value>[M]> };

type RequestHandler<Id, Value, M extends Method> = (
    data: JsonRequest<Id, Value, M>['data']
) => Promise<JsonResponse<Id, Value, M>['data']>;
type RequestHandlers<Id, Value> = {
    [M in Method]: RequestHandler<Id, Value, M>;
};

export type JsonApiRequestHandler<Id, Value> = <M extends Method>(
    method: M,
    req: JsonRequest<Id, Value, M>['data']
) => Promise<JsonResponse<Id, Value, M>['data']>;

export function createCollectionRequestHandler<Id, Value>(
    collection: CollectionApi<Id, Value>
): JsonApiRequestHandler<Id, Value> {
    const handlers: RequestHandlers<Id, Value> = {
        get: (data) => {
            return collection.get(data);
        },
        getIds: () => {
            return collection.getIds();
        },
        getAll: async () => {
            return [...(await collection.getAll())];
        },
        update: (data) => {
            return collection.update(data);
        },
        delete: (data) => {
            return collection.delete(data);
        },
        changeId: ([from, to]) => {
            return collection.changeId(from, to);
        },
    };

    return <M extends Method>(
        method: M,
        req: JsonRequest<Id, Value, M>['data']
    ): Promise<JsonResponse<Id, Value, M>['data']> => {
        return handlers[method](req);
    };
}

export class JsonApiCollection<Id, Value> implements CollectionApi<Id, Value> {
    private readonly requestHandler: JsonApiRequestHandler<Id, Value>;

    constructor(requestHandler: JsonApiRequestHandler<Id, Value>) {
        this.requestHandler = requestHandler;
    }

    get(id: Id): Promise<Value> {
        return this.requestHandler('get', id);
    }
    getIds(): Promise<Id[]> {
        return this.requestHandler('getIds', undefined);
    }
    async getAll(): Promise<Map<Id, Value>> {
        return new Map(await this.requestHandler('getAll', undefined));
    }

    update(updates: Iterable<readonly [Id, Value]>): Promise<void> {
        return this.requestHandler('update', [...updates]);
    }
    delete(ids: Iterable<Id>): Promise<void> {
        return this.requestHandler('delete', [...ids]);
    }
    changeId(from: Id, to: Id): Promise<void> {
        return this.requestHandler('changeId', [from, to]);
    }
}
