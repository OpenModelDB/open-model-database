import deepEqual from 'fast-deep-equal';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tag, TagId } from '../schema';
import { Sort, validateSort } from '../sort-models';
import { SelectionState, TagSelection } from '../tag-condition';
import { EMPTY_MAP, compareTagId } from '../util';

type CanonicalTagSelection = TagSelection & { readonly __canonical: never };
const EMPTY_TAGS = EMPTY_MAP as TagSelection as CanonicalTagSelection;
function toCanonical(tags: TagSelection): CanonicalTagSelection {
    if (tags.size === 0) return EMPTY_TAGS;
    if (tags.size === 1) return tags as CanonicalTagSelection;

    const entries = [...tags.entries()];
    entries.sort((a, b) => compareTagId(a[0], b[0]));
    const canonicalSelection: TagSelection = new Map(entries);
    return canonicalSelection as CanonicalTagSelection;
}

function stringifyTagSelection(tags: CanonicalTagSelection) {
    const entries = [...tags.entries()];
    return entries
        .map(([tagId, value]) => {
            if (value === SelectionState.Required) {
                return tagId;
            } else {
                return `-${tagId}`;
            }
        })
        .join(' ');
}
function parseTagSelection(str: string, tagData: ReadonlyMap<TagId, Tag>): CanonicalTagSelection {
    const tags = new Map<TagId, SelectionState>();
    const parts = str.split(' ');
    for (const part of parts) {
        let key;
        let state;
        if (part.startsWith('-')) {
            key = part.slice(1);
            state = SelectionState.Forbidden;
        } else {
            key = part;
            state = SelectionState.Required;
        }
        if (tagData.has(key as TagId)) {
            tags.set(key as TagId, state);
        } else {
            console.warn(`Invalid tag id '${key}'`);
        }
    }
    return toCanonical(tags);
}

function isEqualTags(a: TagSelection, b: TagSelection) {
    if (a === b) return true;
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
        if (b.get(key) !== value) return false;
    }
    return true;
}
function isEqualState(a: SearchState, b: SearchState) {
    return a.searchQuery === b.searchQuery && isEqualTags(a.tagSelection, b.tagSelection) && a.sort === b.sort;
}

interface SearchState {
    searchQuery: string;
    tagSelection: CanonicalTagSelection;
    sort: Sort;
}
const DEFAULT_STATE: SearchState = {
    searchQuery: '',
    tagSelection: EMPTY_TAGS,
    sort: 'relevance-desc',
};

interface UseSearch {
    searchQuery: string;
    tagSelection: TagSelection;
    sort: Sort;
    setSearchQuery: (searchQuery: string, updateDelay: number) => void;
    setTagSelection: (tagSelection: TagSelection, updateDelay: number) => void;
    setSort: (sort: Sort, updateDelay: number) => void;
}

export const useSearch = (
    tagData: ReadonlyMap<TagId, Tag>,
    onUpdate: (searchQuery: string, tags: TagSelection) => void
): UseSearch => {
    const lastUpdateRef = useRef<SearchState>(DEFAULT_STATE);
    const callUpdate = useCallback(
        (newState: SearchState) => {
            if (isEqualState(newState, lastUpdateRef.current)) return;
            lastUpdateRef.current = newState;
            const { searchQuery, tagSelection } = newState;
            onUpdate(searchQuery, tagSelection);
        },
        [onUpdate]
    );

    const [state, setState] = useState<SearchState>(DEFAULT_STATE);
    const stateRef = useRef(state);
    const lastTimerRef = useRef<number | NodeJS.Timeout | undefined>(undefined);
    const update = useCallback(
        (newStatePartial: Partial<SearchState>, delay = 0): void => {
            const newState: SearchState = { ...stateRef.current, ...newStatePartial };
            if (isEqualState(newState, stateRef.current)) return;

            setState(newState);
            stateRef.current = newState;

            if (lastTimerRef.current !== undefined) {
                clearTimeout(lastTimerRef.current);
                lastTimerRef.current = undefined;
            }

            if (delay <= 0) {
                callUpdate(newState);
            } else {
                lastTimerRef.current = setTimeout(() => callUpdate(newState), delay);
            }
        },
        [callUpdate]
    );

    const router = useRouter();

    // set URL query string based on current state
    interface Query {
        q?: string;
        t?: string;
        sort?: string;
    }
    const lastQueryUpdateRef = useRef<Query>();
    useEffect(() => {
        const timerId = setTimeout(() => {
            const q = state.searchQuery;
            const t = stringifyTagSelection(state.tagSelection);
            const sort = state.sort;

            const newQuery = { ...router.query };
            if (q) {
                newQuery.q = q;
            } else {
                delete newQuery.q;
            }
            if (t) {
                newQuery.t = t;
            } else {
                delete newQuery.t;
            }
            if (sort !== DEFAULT_STATE.sort) {
                newQuery.sort = sort;
            } else {
                delete newQuery.sort;
            }

            if (deepEqual(newQuery, router.query)) return;

            lastQueryUpdateRef.current = { q: q || undefined, t: t || undefined, sort };
            router.push({ query: newQuery }, undefined, { shallow: true }).catch((e) => console.error(e));
        }, 1000);
        return () => clearTimeout(timerId);
    }, [state, router]);

    // update state based on URL query string
    useEffect(() => {
        const { q, t, sort: sortString } = router.query;
        if (lastQueryUpdateRef.current) {
            const old = lastQueryUpdateRef.current;
            lastQueryUpdateRef.current = undefined;
            if (q === old.q && t === old.t && sortString === old.sort) {
                return;
            }
        }

        const searchQuery = typeof q === 'string' ? q : '';
        const tagSelection = typeof t === 'string' ? parseTagSelection(t, tagData) : EMPTY_TAGS;
        const sort = typeof sortString === 'string' && validateSort(sortString) ? sortString : DEFAULT_STATE.sort;
        update({ searchQuery, tagSelection, sort });
    }, [router.query, tagData, update]);

    return {
        searchQuery: state.searchQuery,
        tagSelection: state.tagSelection,
        sort: state.sort,
        setSearchQuery: useCallback(
            (searchQuery, updateDelay) => {
                update({ searchQuery }, updateDelay);
            },
            [update]
        ),
        setTagSelection: useCallback(
            (tagSelection, updateDelay) => {
                update({ tagSelection: toCanonical(tagSelection) }, updateDelay);
            },
            [update]
        ),
        setSort: useCallback(
            (sort, updateDelay) => {
                update({ sort }, updateDelay);
            },
            [update]
        ),
    };
};
