import { FSWatcher } from 'chokidar';
import { readFile, readdir, rename, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { CollectionApi, DBApi, SynchronizedCollection, notifyOnWrite } from '../data-api';
import { RWLock } from '../lock';
import { Model, ModelId, Tag, TagCategory, TagCategoryId, TagId, User, UserId } from '../schema';
import { compareTagId, getTagCategoryOrder, hasOwn, sortObjectKeys, typedEntries, typedKeys } from '../util';
import { JsonFile, fileExists } from './fs-util';

const DATA_DIR = './data/';
const MODEL_DIR = join(DATA_DIR, 'models');
const USERS_JSON = join(DATA_DIR, 'users.json');
const TAGS_JSON = join(DATA_DIR, 'tags.json');
const TAG_CATEGORIES_JSON = join(DATA_DIR, 'tag-categories.json');

const usersFile = new JsonFile<Record<UserId, User>>(USERS_JSON, {
    beforeWrite(data) {
        sortObjectKeys(data);
        return data;
    },
});
const tagsFile = new JsonFile<Record<TagId, Tag>>(TAGS_JSON, {
    beforeWrite(data) {
        sortObjectKeys(data, compareTagId);
        return data;
    },
});
const tagCategoriesFile = new JsonFile<Record<TagCategoryId, TagCategory>>(TAG_CATEGORIES_JSON, {
    beforeWrite(data) {
        sortObjectKeys(
            data,
            getTagCategoryOrder(typedEntries(data)).map((e) => e[0])
        );
        return data;
    },
});

function getModelDataPath(id: ModelId): string {
    return join(MODEL_DIR, `${id}.json`);
}

async function getAllModelIds(): Promise<ModelId[]> {
    const files = await readdir(MODEL_DIR);
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
    'dataset',
    'datasetSize',
    'pretrainedModelG',
    'pretrainedModelD',
] as const satisfies readonly (keyof Model)[];
type IsNever<T extends never> = T;
type MissingKeys = Exclude<keyof Model, (typeof modelKeyOrder)[number]>;
type _valid = IsNever<MissingKeys>;

async function writeModelData(id: ModelId, model: Readonly<Model>): Promise<void> {
    const file = getModelDataPath(id);
    sortObjectKeys<string | _valid>(model, modelKeyOrder);
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
    if (hasOwn(o, from)) {
        throw new Error(`Cannot change id ${from} because it does not exist`);
    }
    if (hasOwn(o, to)) {
        throw new Error(`Cannot change id ${from} to ${to} because ${to} already exists`);
    }

    const value = o[from];
    delete o[from];
    o[to] = value;
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

        // remove from tag categories
        await tagCategoriesFile.update((old) => {
            for (const category of Object.values(old)) {
                category.tags = category.tags.filter((t) => !idSet.has(t));
            }
            return old;
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
        await tagCategoriesFile.update((old) => {
            for (const category of Object.values(old)) {
                category.tags = category.tags.map((t) => (t === from ? to : t));
            }
            return old;
        });
    },
};

const tagCategoryApi: CollectionApi<TagCategoryId, TagCategory> = {
    async get(id: TagCategoryId): Promise<TagCategory> {
        return (await tagCategoriesFile.read())[id];
    },
    async getIds(): Promise<TagCategoryId[]> {
        return typedKeys(await tagCategoriesFile.read());
    },
    async getAll(): Promise<Map<TagCategoryId, TagCategory>> {
        return new Map(typedEntries(await tagCategoriesFile.read()));
    },

    async update(updates: Iterable<readonly [TagCategoryId, TagCategory]>): Promise<void> {
        await tagCategoriesFile.update((old) => {
            for (const [id, value] of updates) {
                old[id] = value;
            }
            return old;
        });
    },
    async delete(ids: Iterable<TagCategoryId>): Promise<void> {
        const idSet = new Set(ids);
        if (idSet.size === 0) return;

        await tagCategoriesFile.update((old) => {
            for (const id of idSet) {
                delete old[id];
            }
            return old;
        });
    },
    async changeId(from: TagCategoryId, to: TagCategoryId): Promise<void> {
        if (from === to) return;

        await tagCategoriesFile.update((tags) => {
            renameObjectKey(tags, from, to);
            return tags;
        });
    },
};

const fileLock = new RWLock();
let mutationCounter = 0;
const addMutation = () => {
    mutationCounter++;
};
const wrapCollection = <Id, Value>(collection: CollectionApi<Id, Value>): CollectionApi<Id, Value> => {
    collection = new SynchronizedCollection(collection, fileLock);
    collection = notifyOnWrite(collection, { after: addMutation });
    return collection;
};

export const fileApi: DBApi = {
    models: wrapCollection(modelApi),
    users: wrapCollection(userApi),
    tags: wrapCollection(tagApi),
    tagCategories: wrapCollection(tagCategoryApi),
};

export function getFileApiMutationCounter(): Promise<number> {
    return fileLock.read(() => Promise.resolve(mutationCounter));
}

const watcher = new FSWatcher({ persistent: false, ignorePermissionErrors: true, usePolling: true });
watcher.add(MODEL_DIR);
watcher.on('add', addMutation);
watcher.on('unlink', addMutation);
watcher.on('change', addMutation);
