/* eslint-disable @typescript-eslint/ban-types */
import { RWLock } from './lock';
import { Model, ModelId, Tag, TagId, User, UserId } from './schema';
import { noop } from './util';

export interface DBApi {
    readonly models: CollectionApi<ModelId, Model>;
    readonly tags: CollectionApi<TagId, Tag>;
    readonly users: CollectionApi<UserId, User>;
}

export interface CollectionApi<Id, Value> {
    get(id: Id): Promise<Value>;
    getIds(): Promise<Id[]>;
    getAll(): Promise<Map<Id, Value>>;

    update(updates: Iterable<readonly [Id, Value]>): Promise<void>;
    delete(ids: Iterable<Id>): Promise<void>;
    changeId(from: Id, to: Id): Promise<void>;
}

export class SynchronizedCollection<Id, Value> implements CollectionApi<Id, Value> {
    readonly collection: CollectionApi<Id, Value>;
    private readonly lock: RWLock;
    constructor(collection: CollectionApi<Id, Value>, lock = new RWLock()) {
        this.collection = collection;
        this.lock = lock;
    }

    get(id: Id): Promise<Value> {
        return this.lock.read(() => this.collection.get(id));
    }
    getIds(): Promise<Id[]> {
        return this.lock.read(() => this.collection.getIds());
    }
    getAll(): Promise<Map<Id, Value>> {
        return this.lock.read(() => this.collection.getAll());
    }

    update(updates: Iterable<readonly [Id, Value]>): Promise<void> {
        return this.lock.write(() => this.collection.update(updates));
    }
    delete(ids: Iterable<Id>): Promise<void> {
        return this.lock.write(() => this.collection.delete(ids));
    }
    changeId(from: Id, to: Id): Promise<void> {
        return this.lock.write(() => this.collection.changeId(from, to));
    }
}

export function notifyOnWrite<Id, Value>(
    collection: CollectionApi<Id, Value>,
    { before = noop, after = noop }: { before?: () => void | Promise<void>; after?: () => void | Promise<void> }
): CollectionApi<Id, Value> {
    return {
        get(id: Id): Promise<Value> {
            return collection.get(id);
        },
        getIds(): Promise<Id[]> {
            return collection.getIds();
        },
        getAll(): Promise<Map<Id, Value>> {
            return collection.getAll();
        },
        async update(updates: Iterable<readonly [Id, Value]>): Promise<void> {
            await before();
            return collection.update(updates).then(after);
        },
        async delete(ids: Iterable<Id>): Promise<void> {
            await before();
            return collection.delete(ids).then(after);
        },
        async changeId(from: Id, to: Id): Promise<void> {
            await before();
            return collection.changeId(from, to).then(after);
        },
    };
}
