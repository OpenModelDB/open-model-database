import React from 'react';
import { BiRadioCircle } from 'react-icons/bi';
import { BsCheck } from 'react-icons/bs';
import { HiOutlinePlusSm } from 'react-icons/hi';
import { useTags } from '../lib/hooks/use-tags';
import { TagId } from '../lib/schema';
import { assertNever, isNonNull, joinClasses } from '../lib/util';
import style from './tag-selector.module.scss';

type State = 'required' | 'forbidden' | 'any';

const stateIcon = {
    required: () => <BsCheck />,
    forbidden: () => <HiOutlinePlusSm style={{ transform: 'rotate(45deg)' }} />,
    any: () => <BiRadioCircle />,
} as const satisfies Record<State, unknown>;

interface TagButtonProps {
    state: State;
    name: string;
    onClick: () => void;
}
function TagButton({ state, name, onClick }: TagButtonProps) {
    return (
        <button
            className={joinClasses(
                style.tagButton,
                style[state],
                state === 'any'
                    ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    : state === 'required'
                    ? 'bg-accent-500 text-white dark:bg-accent-600 dark:text-white'
                    : 'bg-gray-200 text-gray-700 opacity-75 dark:bg-gray-800 dark:text-gray-300'
            )}
            onClick={onClick}
        >
            <span className={style.icon}>{stateIcon[state]()}</span>
            <span className={style.text}>{name}</span>
        </button>
    );
}

export interface TagSelection {
    required: ReadonlySet<TagId>;
    forbidden: ReadonlySet<TagId>;
}

export interface TagSelectorProps {
    required: ReadonlySet<TagId>;
    forbidden: ReadonlySet<TagId>;
    onChange: (selection: TagSelection) => void;
}

export function TagSelector({ required, forbidden, onChange }: TagSelectorProps) {
    const { tagData, categoryOrder } = useTags();

    return (
        <div className={style.tagSelector}>
            {categoryOrder.map(([categoryId, category]) => {
                const tags = category.tags
                    .map((tagId) => {
                        const tag = tagData.get(tagId);
                        if (!tag) return undefined;
                        return [tagId, tag] as const;
                    })
                    .filter(isNonNull);

                if (tags.length === 0) return <React.Fragment key={categoryId} />;

                return (
                    <div key={categoryId}>
                        <h4>{category.name}</h4>
                        <div>
                            {tags.map(([tagId, tag]) => {
                                const state = getState(tagId, required, forbidden);
                                return (
                                    <TagButton
                                        key={tagId}
                                        name={tag.name}
                                        state={state}
                                        onClick={() => {
                                            onChange(setState(tagId, NEXT_STATE[state], required, forbidden));
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const NEXT_STATE = {
    any: 'required',
    required: 'forbidden',
    forbidden: 'any',
} as const satisfies Record<State, State>;
function getState(tag: TagId, required: ReadonlySet<TagId>, forbidden: ReadonlySet<TagId>): State {
    if (required.has(tag)) return 'required';
    if (forbidden.has(tag)) return 'forbidden';
    return 'any';
}
function setState(tag: TagId, state: State, required: ReadonlySet<TagId>, forbidden: ReadonlySet<TagId>): TagSelection {
    switch (state) {
        case 'required':
            return { required: add(required, tag), forbidden: remove(forbidden, tag) };
        case 'forbidden':
            return { required: remove(required, tag), forbidden: add(forbidden, tag) };
        case 'any':
            return { required: remove(required, tag), forbidden: remove(forbidden, tag) };
        default:
            return assertNever(state);
    }
}

function add<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
    if (set.has(value)) return set;
    const result = new Set(set);
    result.add(value);
    return result;
}
function remove<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
    if (!set.has(value)) return set;
    const result = new Set(set);
    result.delete(value);
    return result;
}
