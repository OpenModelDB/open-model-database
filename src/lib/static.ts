import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { Model, ModelId, Tag, TagId, User, UserId } from './schema';

const DATA_DIR = './data/';
const USERS_JSON = join(DATA_DIR, 'users.json');
const TAGS_JSON = join(DATA_DIR, 'tags.json');

function getModelDataPath(id: ModelId): string {
    return join(DATA_DIR, 'models', `${id}.json`);
}

export async function geAllModelIds(): Promise<ModelId[]> {
    const files = await readdir(join(DATA_DIR, 'models'));
    const ids = files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -'.json'.length));
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
