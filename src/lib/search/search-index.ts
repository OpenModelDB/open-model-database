import { EMPTY_SET, assertNever } from '../util';
import { CompiledCondition, testCondition } from './logical-condition';
import { createScoreFn } from './score';

export interface WeightedText {
    readonly text: string;
    readonly weight: number;
}
export interface CorpusEntry<Id, Tag> {
    readonly id: Id;
    readonly tags: ReadonlySet<Tag>;
    readonly texts: readonly WeightedText[];
}
export interface SearchResult<Id> {
    readonly id: Id;
    /** A score greater than zero. */
    readonly score: number;
}

export class SearchIndex<Id, Tag> {
    readonly entries: ReadonlyMap<Id, CorpusEntry<Id, Tag>>;
    readonly allIds: ReadonlySet<Id>;
    private readonly byTag: ReadonlyMap<Tag, ReadonlySet<Id>>;

    constructor(entries: Iterable<CorpusEntry<Id, Tag>>) {
        const byId = new Map<Id, CorpusEntry<Id, Tag>>();
        const byTag = new Map<Tag, Set<Id>>();

        for (const entry of entries) {
            if (byId.has(entry.id)) {
                throw new Error(`Duplicate id ${String(entry.id)}`);
            }
            byId.set(entry.id, entry);

            for (const tag of entry.tags) {
                let ids = byTag.get(tag);
                if (ids === undefined) {
                    ids = new Set();
                    byTag.set(tag, ids);
                }
                ids.add(entry.id);
            }
        }

        this.entries = byId;
        this.byTag = byTag;
        this.allIds = new Set(byId.keys());
    }

    /**
     * Returns a set of all entries that fulfill the given tag condition.
     *
     * The order of ids in the iterable is not determined and must not be relied upon.
     */
    withTags(condition: CompiledCondition<Tag>): ReadonlySet<Id> {
        switch (condition.type) {
            case 'const': {
                return condition.value ? this.allIds : EMPTY_SET;
            }
            case 'var': {
                const ref = this.byTag.get(condition.value) ?? EMPTY_SET;
                return condition.negated ? without(this.allIds, ref) : ref;
            }
            case 'and': {
                const refs: ReadonlySet<Id>[] = [];
                const negRefs: ReadonlySet<Id>[] = [];
                let complete = true;

                for (const item of condition.items) {
                    if (item.type === 'var') {
                        const ref = this.byTag.get(item.value) ?? EMPTY_SET;
                        (item.negated ? negRefs : refs).push(ref);
                    } else {
                        complete = false;
                    }
                }

                const selection = without(refs.length === 0 ? this.allIds : intersect(...refs), union(...negRefs));
                if (complete) {
                    return selection;
                }
                return setFilter(selection, (id) => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const entry = this.entries.get(id)!;
                    return testCondition(condition, (t) => entry.tags.has(t));
                });
            }
            case 'or': {
                const refs: ReadonlySet<Id>[] = [];
                const negRefs: ReadonlySet<Id>[] = [];
                for (const item of condition.items) {
                    if (item.type === 'var') {
                        const ref = this.byTag.get(item.value) ?? EMPTY_SET;
                        (item.negated ? negRefs : refs).push(ref);
                    } else {
                        refs.push(this.withTags(item));
                    }
                }

                if (negRefs.length > 0) {
                    const neg = intersect(...negRefs);
                    if (neg.size === 0) {
                        return this.allIds;
                    }
                    refs.push(without(this.allIds, neg));
                }
                return union(...refs);
            }
            default:
                return assertNever(condition);
        }
    }

    retrieve(condition: CompiledCondition<Tag>, queryTokens: string[]): SearchResult<Id>[] {
        const selection = this.withTags(condition);
        const scoreFn = createScoreFn(queryTokens);

        const results: SearchResult<Id>[] = [];
        for (const id of selection) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const entry = this.entries.get(id)!;
            let score = 0;
            for (const { text, weight } of entry.texts) {
                score += scoreFn(text) * weight;
            }
            if (score > 0) {
                results.push({ id, score });
            }
        }
        return results;
    }
}

function intersect<T>(...sets: ReadonlySet<T>[]): ReadonlySet<T> {
    if (sets.length === 0) {
        throw new Error('Cannot intersect 0 sets');
    }
    if (sets.length === 1) {
        return sets[0];
    }

    sets.sort((a, b) => a.size - b.size);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const smallest = sets.shift()!;
    if (smallest.size === 0) {
        return EMPTY_SET;
    }

    const result = new Set<T>();

    if (sets.length === 1) {
        const [a] = sets;
        for (const i of smallest) {
            if (a.has(i)) {
                result.add(i);
            }
        }
    } else if (sets.length === 2) {
        const [a, b] = sets;
        for (const i of smallest) {
            if (a.has(i) && b.has(i)) {
                result.add(i);
            }
        }
    } else if (sets.length === 3) {
        const [a, b, c] = sets;
        for (const i of smallest) {
            if (a.has(i) && b.has(i) && c.has(i)) {
                result.add(i);
            }
        }
    } else {
        for (const i of smallest) {
            if (sets.every((s) => s.has(i))) {
                result.add(i);
            }
        }
    }

    return result;
}

function union<T>(...sets: ReadonlySet<T>[]): ReadonlySet<T> {
    // remove all empty sets
    sets = sets.filter((s) => s.size > 0);

    if (sets.length === 0) {
        return EMPTY_SET;
    }
    if (sets.length === 1) {
        return sets[0];
    }

    sets.sort((a, b) => b.size - a.size);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const largest = sets.shift()!;
    const result = new Set<T>(largest);

    for (const set of sets) {
        for (const i of set) {
            result.add(i);
        }
    }

    return result;
}

function without<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> {
    if (a.size === 0 || b.size === 0) {
        return a;
    }

    const result = new Set<T>();
    for (const i of a) {
        if (!b.has(i)) {
            result.add(i);
        }
    }

    return result;
}

function setFilter<T>(a: Iterable<T>, fn: (item: T) => boolean): Set<T> {
    const result = new Set<T>();
    for (const i of a) {
        if (fn(i)) {
            result.add(i);
        }
    }
    return result;
}
