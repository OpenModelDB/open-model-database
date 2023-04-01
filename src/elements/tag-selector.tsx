import React, { useEffect, useMemo, useState } from 'react';
import { BiRadioCircle } from 'react-icons/bi';
import { BsCheck } from 'react-icons/bs';
import { HiChevronDoubleDown, HiChevronDoubleUp, HiOutlinePlusSm } from 'react-icons/hi';
import { useTags } from '../lib/hooks/use-tags';
import { TagId } from '../lib/schema';
import { SelectionState, TagSelection } from '../lib/tag-condition';
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
    noIcon?: boolean;
}
function TagButton({ state, name, onClick, noIcon = false }: TagButtonProps) {
    return (
        <button
            className={joinClasses(
                style.tagButton,
                state === 'any'
                    ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    : state === 'required'
                    ? 'bg-accent-500 text-white dark:bg-accent-600 dark:text-white'
                    : 'bg-gray-300 text-red-800 dark:bg-gray-900 dark:text-red-400'
            )}
            onClick={onClick}
        >
            {!noIcon && <span className={style.icon}>{stateIcon[state]()}</span>}
            <span className={style.text}>{name}</span>
        </button>
    );
}

export interface TagSelectorProps {
    selection: TagSelection;
    onChange: (selection: TagSelection) => void;
}

export function TagSelector({ selection, onChange }: TagSelectorProps) {
    const [simple, setSimple] = useState(true);

    return (
        <div>
            {simple ? (
                <SimpleTagSelector
                    selection={selection}
                    onChange={onChange}
                />
            ) : (
                <AdvancedTagSelector
                    selection={selection}
                    onChange={onChange}
                />
            )}
            <button
                className={`${style.modeButton} mt-1 text-neutral-700 hover:text-black dark:text-neutral-300 hover:dark:text-white`}
                onClick={() => setSimple(!simple)}
            >
                {simple ? <HiChevronDoubleDown /> : <HiChevronDoubleUp />}
                <span>{simple ? 'Advanced tag selector' : 'Simple tag selector'}</span>
            </button>
        </div>
    );
}

function AdvancedTagSelector({ selection, onChange }: TagSelectorProps) {
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
                                const state = getState(tagId, selection);
                                return (
                                    <TagButton
                                        key={tagId}
                                        name={tag.name}
                                        state={state}
                                        onClick={() => {
                                            onChange(setState(tagId, NEXT_STATE[state], selection));
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

function SimpleTagSelector({ selection, onChange }: TagSelectorProps) {
    const { tagData, categoryOrder } = useTags();

    const tags = useMemo(() => {
        return categoryOrder
            .map(([, category]) => category)
            .filter((category) => category.simple)
            .flatMap(({ tags }) => {
                return tags
                    .map((tagId) => {
                        const tag = tagData.get(tagId);
                        if (!tag) return undefined;
                        return [tagId, tag] as const;
                    })
                    .filter(isNonNull);
            });
    }, [categoryOrder, tagData]);

    const selected: TagId | undefined = useMemo(() => {
        const required = tags.filter(([tagId]) => selection.get(tagId) === SelectionState.Required);
        if (required.length === 1) return required[0][0];
        return undefined;
    }, [selection, tags]);

    useEffect(() => {
        const changes: [TagId, SelectionState | undefined][] = [];

        if (selected !== undefined && selection.get(selected) !== SelectionState.Required) {
            changes.push([selected, SelectionState.Required]);
        }

        for (const [tag] of tags) {
            if (tag !== selected && selection.has(tag)) {
                changes.push([tag, undefined]);
            }
        }

        if (changes.length > 0) {
            const copy = new Map(selection);
            for (const [tag, change] of changes) {
                if (change === undefined) {
                    copy.delete(tag);
                } else {
                    copy.set(tag, change);
                }
            }
            onChange(copy);
        }
    }, [selected, selection, tags, onChange]);

    return (
        <div className={style.tagSelector}>
            <div>
                <TagButton
                    noIcon
                    name="All"
                    state={selected === undefined ? 'required' : 'any'}
                    onClick={() => {
                        if (selected !== undefined) {
                            onChange(setState(selected, 'any', selection));
                        }
                    }}
                />
                {tags.map(([tagId, tag]) => (
                    <TagButton
                        noIcon
                        key={tagId}
                        name={tag.name}
                        state={selected === tagId ? 'required' : 'any'}
                        onClick={() => {
                            if (selected !== tagId) {
                                let s = setState(tagId, 'required', selection);
                                if (selected !== undefined) {
                                    s = setState(selected, 'any', s);
                                }
                                onChange(s);
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

const NEXT_STATE = {
    any: 'required',
    required: 'forbidden',
    forbidden: 'any',
} as const satisfies Record<State, State>;
function getState(tag: TagId, selection: TagSelection): State {
    const state = selection.get(tag);
    if (state === SelectionState.Required) return 'required';
    if (state === SelectionState.Forbidden) return 'forbidden';
    return 'any';
}
function stateToSelectionState(state: State): SelectionState | undefined {
    switch (state) {
        case 'required':
            return SelectionState.Required;
        case 'forbidden':
            return SelectionState.Forbidden;
        case 'any':
            return undefined;
        default:
            return assertNever(state);
    }
}
function setState(tag: TagId, state: State, selection: TagSelection): TagSelection {
    const target = stateToSelectionState(state);
    if (selection.get(tag) === target) {
        return selection;
    }
    const copy = new Map(selection);
    if (target === undefined) {
        copy.delete(tag);
    } else {
        copy.set(tag, target);
    }
    return copy;
}
