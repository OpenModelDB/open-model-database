/* eslint-disable @typescript-eslint/ban-types */
import { RWLock } from './lock';
import {
    Arch,
    ArchId,
    Collection,
    CollectionId,
    Model,
    ModelId,
    Tag,
    TagCategory,
    TagCategoryId,
    TagId,
    User,
    UserId,
} from './schema';
import { noop } from './util';

export interface DBApi {
    readonly models: CollectionApi<ModelId, Model>;
    readonly tags: CollectionApi<TagId, Tag>;
    readonly tagCategories: CollectionApi<TagCategoryId, TagCategory>;
    readonly users: CollectionApi<UserId, User>;
    readonly architectures: CollectionApi<ArchId, Arch>;
    readonly collections: CollectionApi<CollectionId, Collection>;
}

/**
 * A collections of key-value pairs.
 *
 * All operations guarantee atomicity, consistency, and isolation (see ACID).
 * Durability is not always guaranteed and depends on the implementation.
 */
export interface CollectionApi<Id, Value> {
    /**
     * Returns the value of the given id.
     *
     * @throws if the id does not exist
     */
    get(id: Id): Promise<Value>;
    /**
     * Returns all ids in the collection.
     */
    getIds(): Promise<Id[]>;
    /**
     * Returns map representation of the collection.
     *
     * Changes to the map will not be reflected in the collection.
     */
    getAll(): Promise<Map<Id, Value>>;

    /**
     * Sets the value of the given ids. The values of ids that already exist
     * will be overwritten. Ids that do not exist will be added to be collection.
     *
     * The order of ids is irrelevant.
     *
     * @throws if there are duplicate ids.
     */
    update(updates: Iterable<readonly [Id, Value]>): Promise<void>;
    /**
     * Removes the given ids from the collection.
     *
     * Duplicate ids and ids not in the collection are ignored. The order of ids is irrelevant.
     */
    delete(ids: Iterable<Id>): Promise<void>;
    /**
     * Changes the id of a value.
     *
     * Does nothing if `from` and `to` are the same.
     *
     * @throws if `from` does not exist or `to` already exists.
     */
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

/**
 * A collection that is backed by a simple `Map`.
 */
export class MapCollection<Id, Value> implements CollectionApi<Id, Value> {
    public map: Map<Id, Value>;

    constructor(map: Map<Id, Value> = new Map()) {
        this.map = map;
    }

    get(id: Id): Promise<Value> {
        const value = this.map.get(id);
        if (value === undefined) {
            throw new Error(`No value for id ${String(id)}`);
        }
        return Promise.resolve(value);
    }
    getIds(): Promise<Id[]> {
        return Promise.resolve([...this.map.keys()]);
    }
    getAll(): Promise<Map<Id, Value>> {
        return Promise.resolve(new Map(this.map));
    }
    update(updates: Iterable<readonly [Id, Value]>): Promise<void> {
        updates = new Map(updates);
        for (const [id, value] of updates) {
            this.map.set(id, value);
        }
        return Promise.resolve();
    }
    delete(ids: Iterable<Id>): Promise<void> {
        for (const id of ids) {
            this.map.delete(id);
        }
        return Promise.resolve();
    }
    changeId(from: Id, to: Id): Promise<void> {
        const value = this.map.get(from);
        if (value === undefined) {
            throw new Error(`No value for id ${String(from)}`);
        }
        if (this.map.has(to)) {
            throw new Error(`Id ${String(to)} already exists`);
        }
        this.map.delete(from);
        this.map.set(to, value);
        return Promise.resolve();
    }
}
