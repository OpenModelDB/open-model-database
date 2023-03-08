import { CollectionApi, DBApi } from './data-api';
import { JsonApiCollection, JsonApiRequestHandler, JsonRequest, JsonResponse, Method } from './data-json-api';
import { delay, lazy, noop } from './util';

class NotifyOnWrites<Id, Value> implements CollectionApi<Id, Value> {
    private readonly collection: CollectionApi<Id, Value>;
    private readonly notify: () => void;
    constructor(collection: CollectionApi<Id, Value>, notify: () => void) {
        this.collection = collection;
        this.notify = notify;
    }

    get(id: Id): Promise<Value> {
        return this.collection.get(id);
    }
    getIds(): Promise<Id[]> {
        return this.collection.getIds();
    }
    getAll(): Promise<Map<Id, Value>> {
        return this.collection.getAll();
    }
    update(updates: Iterable<readonly [Id, Value]>): Promise<void> {
        return this.collection.update(updates).then(this.notify);
    }
    delete(ids: Iterable<Id>): Promise<void> {
        return this.collection.delete(ids).then(this.notify);
    }
    changeId(from: Id, to: Id): Promise<void> {
        return this.collection.changeId(from, to).then(this.notify);
    }
}

const updateListeners = new Set<() => void>();
export function addUpdateListener(listener: () => void): () => void {
    updateListeners.add(listener);
    return () => {
        updateListeners.delete(listener);
    };
}
let notifying = false;
function notifyListeners() {
    if (notifying) return;
    notifying = true;
    delay(20)
        .then(() => {
            notifying = false;
            for (const l of updateListeners) {
                try {
                    l();
                } catch (e) {
                    console.log(e);
                }
            }
        })
        .catch(noop);
}

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
function createWebCollection<Id, Value>(path: string): CollectionApi<Id, Value> {
    return new NotifyOnWrites(new JsonApiCollection(createWebRequestHandler<Id, Value>(path)), notifyListeners);
}
export const getWebApi = lazy(async (): Promise<DBApi | undefined> => {
    const webApi: DBApi = {
        models: createWebCollection('/api/models'),
        tags: createWebCollection('/api/tags'),
        users: createWebCollection('/api/users'),
    };

    // we do an empty update to test the waters
    return webApi.tags.update([]).then(
        () => webApi,
        () => undefined
    );
});
