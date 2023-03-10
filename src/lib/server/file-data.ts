import { readFile, readdir, rename, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { CollectionApi, DBApi, SynchronizedCollection } from '../data-api';
import { RWLock } from '../lock';
import { Model, ModelId, Tag, TagId, User, UserId } from '../schema';
import { hasOwn, sortObjectKeys, typedEntries, typedKeys } from '../util';
import { JsonFile, fileExists } from './fs-util';

const DATA_DIR = './data/';
const USERS_JSON = join(DATA_DIR, 'users.json');
const TAGS_JSON = join(DATA_DIR, 'tags.json');

const usersFile = new JsonFile<Record<UserId, User>>(USERS_JSON);
const tagsFile = new JsonFile<Record<TagId, Tag>>(TAGS_JSON);

function getModelDataPath(id: ModelId): string {
    return join(DATA_DIR, 'models', `${id}.json`);
}

async function getAllModelIds(): Promise<ModelId[]> {
    const files = await readdir(join(DATA_DIR, 'models'));
    const ids = files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -'.json'.length) as ModelId);
    return ids;
}

async function getSingleModelData(id: ModelId): Promise<Model> {
    const content = await readFile(getModelDataPath(id), 'utf-8');
    return JSON.parse(content) as Model;
}

function getModelData(ids: readonly ModelId[]): Promise<Model[]> {
    return Promise.all(ids.map(getSingleModelData));
}

// mutation

const modelKeyOrder = [
    'name',
    'author',
    'license',
    'tags',
    'description',
    'date',
    'architecture',
    'size',
    'scale',
    'inputChannels',
    'outputChannels',
    'resources',
    'trainingIterations',
    'trainingEpochs',
    'trainingBatchSize',
    'trainingHRSize',
    'trainingOTF',
    // 'dataset',
    'datasetSize',
    'pretrainedModelG',
    'pretrainedModelD',
] as const satisfies readonly (keyof Model)[];
type _valid = never;

async function writeModelData(id: ModelId, model: Readonly<Model>): Promise<void> {
    const file = getModelDataPath(id);
    sortObjectKeys(model, modelKeyOrder);
    await writeFile(file, JSON.stringify(model, undefined, 4), 'utf-8');
}

async function mutateModels(mutate: (model: Model) => boolean | void): Promise<void> {
    const modelIds = await getAllModelIds();
    await Promise.all(
        modelIds.map(async (id) => {
            const model = await getSingleModelData(id);
            if (mutate(model)) {
                await writeModelData(id, model);
            }
        })
    );
}

function renameObjectKey<K extends string>(o: Record<K, unknown>, from: K, to: K): void {
    const keys = Object.keys(o);

    const index = keys.indexOf(from);
    if (index === -1) {
        throw new Error(`Cannot change id ${from} because it does not exist`);
    }
    if (hasOwn(o, to)) {
        throw new Error(`Cannot change id ${from} to ${to} because ${to} already exists`);
    }

    keys[index] = to;
    const value = o[from];
    delete o[from];
    o[to] = value;
    sortObjectKeys(o, keys);
}

const modelApi: CollectionApi<ModelId, Model> = {
    get: getSingleModelData,
    getIds: getAllModelIds,
    async getAll(): Promise<Map<ModelId, Model>> {
        const ids = await getAllModelIds();
        const data = await getModelData(ids);
        return new Map(ids.map((id, i) => [id, data[i]]));
    },

    async update(updates: Iterable<readonly [ModelId, Model]>): Promise<void> {
        await Promise.all(
            [...updates].map(async ([id, value]) => {
                await writeModelData(id, value);
                console.warn(`Updated model data of ${id}`);
            })
        );
    },
    async delete(ids: Iterable<ModelId>): Promise<void> {
        await Promise.all(
            [...ids].map(async (id) => {
                const file = getModelDataPath(id);
                if (await fileExists(file)) {
                    await unlink(file);
                    console.warn(`Delete model data of ${id}`);
                } else {
                    console.warn(`Model data of ${id} cannot be deleted because it doesn't exist`);
                }
            })
        );
    },
    async changeId(id: ModelId, newId: ModelId): Promise<void> {
        if (id === newId) return;

        const modelIds = await getAllModelIds();
        if (!modelIds.includes(id)) {
            throw new Error(`Cannot change model id ${id} because it does not exist`);
        }
        if (modelIds.includes(newId)) {
            throw new Error(`Cannot change model id ${id} to ${newId} because ${newId} already exists`);
        }

        // We do the renaming with a temp file in between because of Windows.
        // Windows FS ignore case, so if the path you rename a file only changes the case of some letters,
        // then Windows won't actually rename the file.
        const from = getModelDataPath(id);
        const to = getModelDataPath(newId);
        const temp = `${to}.tmp`;
        await rename(from, temp);
        await rename(temp, to);

        await mutateModels((model) => {
            let changed = false;
            if (model.pretrainedModelG === id) {
                model.pretrainedModelG = newId;
                changed = true;
            }
            if (model.pretrainedModelD === id) {
                model.pretrainedModelD = newId;
                changed = true;
            }
            return changed;
        });
    },
};

const userApi: CollectionApi<UserId, User> = {
    async get(id: UserId): Promise<User> {
        return (await usersFile.read())[id];
    },
    async getIds(): Promise<UserId[]> {
        return typedKeys(await usersFile.read());
    },
    async getAll(): Promise<Map<UserId, User>> {
        return new Map(typedEntries(await usersFile.read()));
    },

    async update(updates: Iterable<readonly [UserId, User]>): Promise<void> {
        await usersFile.update((old) => {
            for (const [id, value] of updates) {
                old[id] = value;
            }
            return old;
        });
    },
    async delete(ids: Iterable<UserId>): Promise<void> {
        const idSet = new Set(ids);
        if (idSet.size === 0) return;

        await usersFile.update((old) => {
            for (const id of idSet) {
                delete old[id];
            }
            return old;
        });

        // TODO: remove author from models
    },
    async changeId(from: UserId, to: UserId): Promise<void> {
        if (from === to) return;

        await usersFile.update((tags) => {
            renameObjectKey(tags, from, to);
            return tags;
        });
        await mutateModels((model) => {
            if (Array.isArray(model.author)) {
                if (model.author.includes(from)) {
                    model.author = model.author.map((t) => (t === from ? to : t));
                    return true;
                }
            } else {
                if (model.author === from) {
                    model.author = to;
                    return true;
                }
            }
        });
    },
};

const tagApi: CollectionApi<TagId, Tag> = {
    async get(id: TagId): Promise<Tag> {
        return (await tagsFile.read())[id];
    },
    async getIds(): Promise<TagId[]> {
        return typedKeys(await tagsFile.read());
    },
    async getAll(): Promise<Map<TagId, Tag>> {
        return new Map(typedEntries(await tagsFile.read()));
    },

    async update(updates: Iterable<readonly [TagId, Tag]>): Promise<void> {
        await tagsFile.update((old) => {
            for (const [id, value] of updates) {
                old[id] = value;
            }
            return old;
        });
    },
    async delete(ids: Iterable<TagId>): Promise<void> {
        const idSet = new Set(ids);
        if (idSet.size === 0) return;

        await tagsFile.update((old) => {
            for (const id of idSet) {
                delete old[id];
            }
            return old;
        });

        // remove tags from models
        await mutateModels((model) => {
            if (model.tags.some((t) => idSet.has(t))) {
                model.tags = model.tags.filter((t) => !idSet.has(t));
                return true;
            }
        });
    },
    async changeId(from: TagId, to: TagId): Promise<void> {
        if (from === to) return;

        await tagsFile.update((tags) => {
            renameObjectKey(tags, from, to);
            return tags;
        });
        await mutateModels((model) => {
            if (model.tags.includes(from)) {
                model.tags = model.tags.map((t) => (t === from ? to : t));
                return true;
            }
        });
    },
};

const fileLock = new RWLock();
export const fileApi: DBApi = {
    models: new SynchronizedCollection(modelApi, fileLock),
    users: new SynchronizedCollection(userApi, fileLock),
    tags: new SynchronizedCollection(tagApi, fileLock),
};
