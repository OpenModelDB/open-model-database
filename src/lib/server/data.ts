import { readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { Model, ModelId, Tag, TagId, User, UserId } from '../schema';
import { sortObjectKeys } from '../util';

export const DATA_DIR = './data/';
export const USERS_JSON = join(DATA_DIR, 'users.json');
export const TAGS_JSON = join(DATA_DIR, 'tags.json');

export function getModelDataPath(id: ModelId): string {
    return join(DATA_DIR, 'models', `${id}.json`);
}

export async function getAllModelIds(): Promise<ModelId[]> {
    const files = await readdir(join(DATA_DIR, 'models'));
    const ids = files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -'.json'.length) as ModelId);
    return ids;
}

async function getSingleModelData(id: ModelId): Promise<Model> {
    const content = await readFile(getModelDataPath(id), 'utf-8');
    return JSON.parse(content) as Model;
}

export function getModelData(id: ModelId): Promise<Model>;
export function getModelData(id: readonly ModelId[]): Promise<Model[]>;
export function getModelData(id: readonly ModelId[] | ModelId): Promise<Model | Model[]> {
    if (typeof id === 'string') {
        return getSingleModelData(id);
    } else {
        return Promise.all(id.map(getSingleModelData));
    }
}

export async function getUsers(): Promise<Record<UserId, User>> {
    const content = await readFile(USERS_JSON, 'utf-8');
    return JSON.parse(content) as Record<UserId, User>;
}

export async function getTags(): Promise<Record<TagId, Tag>> {
    const content = await readFile(TAGS_JSON, 'utf-8');
    return JSON.parse(content) as Record<TagId, Tag>;
}

// mutation

export async function writeModelData(id: ModelId, model: Readonly<Model>): Promise<void> {
    const file = getModelDataPath(id);
    await writeFile(file, JSON.stringify(model, undefined, 4), 'utf-8');
}

export async function writeUsers(users: Readonly<Record<UserId, User>>): Promise<void> {
    users = { ...users };
    sortObjectKeys(users);
    await writeFile(USERS_JSON, JSON.stringify(users, undefined, 4), 'utf-8');
}

export async function writeTags(tags: Readonly<Record<TagId, Tag>>): Promise<void> {
    await writeFile(TAGS_JSON, JSON.stringify(tags, undefined, 4), 'utf-8');
}

export async function mutateModels(mutate: (model: Model) => boolean | void): Promise<void> {
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
