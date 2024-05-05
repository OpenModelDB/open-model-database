import { CollectionApi, DBApi, notifyOnWrite } from './data-api';
import { JsonApiCollection, JsonApiRequestHandler, JsonRequest, JsonResponse, Method } from './data-json-api';
import { SessionStorageMapCollection } from './data-session';
import { IS_DEPLOYED, SITE_URL } from './site-data';
import { delay, lazy, noop } from './util';

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

let mutationCounter = 0;
function listenToMutationCounterChanges(): void {
    try {
        const sse = new EventSource('/api/mutation-sse');

        sse.addEventListener('message', (message) => {
            const backendCounter = Number(message.data);
            if (backendCounter > mutationCounter) {
                mutationCounter = backendCounter;
                notifyListeners();
            }
        });
        sse.addEventListener('error', (e) => {
            console.log(e);
        });
    } catch (error) {
        console.error(error);
    }
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
    return notifyOnWrite(new JsonApiCollection(createWebRequestHandler<Id, Value>(path)), {
        after: () => {
            mutationCounter++;
            notifyListeners();
        },
    });
}

async function createDeployedCollection<Id, Value>(path: string): Promise<CollectionApi<Id, Value>> {
    const url = new URL(path, SITE_URL).href;
    const res = await fetch(url);
    if (res.status !== 200) {
        throw new Error(res.statusText);
    }
    const map = new Map<Id, Value>();
    const data = (await res.json()) as Record<string, Value>[];
    for (const [id, value] of Object.entries(data)) {
        map.set(id as Id, value as Value);
    }
    return notifyOnWrite(new SessionStorageMapCollection(path, map), {
        after: () => {
            mutationCounter++;
            notifyListeners();
        },
    });
}

const getDbAPI = async (): Promise<DBApi> => {
    if (IS_DEPLOYED) {
        // we only have API access locally
        return {
            models: await createDeployedCollection('/api/v1/models.json'),
            users: await createDeployedCollection('/api/v1/users.json'),
            tags: await createDeployedCollection('/api/v1/tags.json'),
            tagCategories: await createDeployedCollection('/api/v1/tagCategories.json'),
            architectures: await createDeployedCollection('/api/v1/architectures.json'),
        };
    }
    return {
        models: createWebCollection('/api/models'),
        users: createWebCollection('/api/users'),
        tags: createWebCollection('/api/tags'),
        tagCategories: createWebCollection('/api/tag-categories'),
        architectures: createWebCollection('/api/architectures'),
    };
};

export const getWebApi = lazy(async (): Promise<DBApi | undefined> => {
    const webApi = await getDbAPI();

    // we do an empty update to test the waters
    return webApi.tags.update([]).then(
        () => {
            listenToMutationCounterChanges();
            return webApi;
        },
        () => undefined
    );
});

export function startListeningForUpdates() {
    getWebApi().catch((e) => console.error(e));
}
