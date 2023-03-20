import React from 'react';
import { BiRadioCircle } from 'react-icons/bi';
import { BsCheck } from 'react-icons/bs';
import { HiOutlinePlusSm } from 'react-icons/hi';
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
}
function TagButton({ state, name, onClick }: TagButtonProps) {
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
            <span className={style.icon}>{stateIcon[state]()}</span>
            <span className={style.text}>{name}</span>
        </button>
    );
}

export interface TagSelectorProps {
    selection: TagSelection;
    onChange: (selection: TagSelection) => void;
}

export function TagSelector({ selection, onChange }: TagSelectorProps) {
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
