import React, { useEffect, useMemo, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { BiRadioCircle } from 'react-icons/bi';
import { BsCheck } from 'react-icons/bs';
import { HiChevronDoubleDown, HiChevronDoubleUp, HiOutlinePlus, HiOutlinePlusSm } from 'react-icons/hi';
import { Tooltip } from 'react-tooltip';
import { useIsClient } from '../lib/hooks/use-is-client';
import { useIsTouch } from '../lib/hooks/use-is-touch';
import { useTags } from '../lib/hooks/use-tags';
import { useWebApi } from '../lib/hooks/use-web-api';
import { TagCategory, TagId } from '../lib/schema';
import { SelectionState, TagSelection } from '../lib/tag-condition';
import { EMPTY_MAP, assertNever, isNonNull, joinClasses } from '../lib/util';
import { Link } from './components/link';
import { MarkdownContainer } from './markdown';
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
    tooltipId?: string;
    tooltipContent?: string;
}
function TagButton({ state, name, onClick, noIcon = false, tooltipId, tooltipContent }: TagButtonProps) {
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
            data-tooltip-content={tooltipContent}
            data-tooltip-delay-show={500}
            data-tooltip-id={tooltipId}
            onClick={onClick}
        >
            {!noIcon && <span className={style.icon}>{stateIcon[state]()}</span>}
            <span className={style.text}>{name}</span>
        </button>
    );
}

const TOOLTIP_ID = 'tag-selector-tooltip';

export type TagSelectorStyle = 'simple' | 'advanced';

export interface TagSelectorProps {
    selection: TagSelection;
    onChange: (selection: TagSelection, style: TagSelectorStyle) => void;
}

export function TagSelector({ selection, onChange }: TagSelectorProps) {
    const [simple, setSimple] = useState(true);
    const isClient = useIsClient();
    const isTouch = useIsTouch();
    const { editMode } = useWebApi();

    const { tagData, tagCategoryData } = useTags();

    useEffect(() => {
        if (simple) {
            const reduced = reduceToSimple(tagCategoryData.values(), selection);
            if (reduced !== selection) {
                setSimple(false);
            }
        }
    }, [simple, tagData, tagCategoryData, selection]);

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
            <div className={style.controls}>
                <button
                    className={`${style.modeButton} text-neutral-700 hover:text-black dark:text-neutral-300 hover:dark:text-white`}
                    onClick={() => {
                        setSimple(!simple);
                        if (!simple) {
                            const reduced = reduceToSimple(tagCategoryData.values(), selection);
                            if (reduced !== selection) onChange(reduced, 'simple');
                        }
                    }}
                >
                    {simple ? <HiChevronDoubleDown /> : <HiChevronDoubleUp />}
                    <span>{simple ? 'Advanced tag selector' : 'Simple tag selector'}</span>
                </button>

                {!simple && (
                    <button
                        className={`${style.modeButton} text-neutral-700 hover:text-black disabled:text-neutral-500 dark:text-neutral-300 hover:dark:text-white disabled:dark:text-neutral-500`}
                        disabled={selection.size === 0}
                        onClick={() => {
                            onChange(EMPTY_MAP, 'simple');
                        }}
                    >
                        <HiOutlinePlus style={{ transform: 'rotate(45deg)' }} />
                        <span>Clear all tags</span>
                    </button>
                )}

                {editMode && (
                    <Link
                        className={`${style.modeButton} text-neutral-700 hover:text-black dark:text-neutral-300 hover:dark:text-white`}
                        href="/tags"
                    >
                        <AiFillEdit />
                        <span>Edit tags</span>
                    </Link>
                )}
            </div>

            {isClient && !isTouch && (
                <Tooltip
                    closeOnEsc
                    className={style.tooltip}
                    id={TOOLTIP_ID}
                    render={({ content }) => {
                        const tag = tagData.get(content as TagId);
                        return (
                            <MarkdownContainer
                                className={style.markdown}
                                markdown={tag?.description || 'No description.'}
                            />
                        );
                    }}
                />
            )}
        </div>
    );
}

function AdvancedTagSelector({ selection, onChange }: TagSelectorProps) {
    const { tagData, categoryOrder } = useTags();
    const { editMode } = useWebApi();

    return (
        <div className={`${style.tagSelector} ${style.advanced}`}>
            {categoryOrder.map(([categoryId, category]) => {
                if (category.tags.length === 0 || (category.editOnly && !editMode))
                    return <React.Fragment key={categoryId} />;

                return (
                    <React.Fragment key={categoryId}>
                        <h4>{category.name}</h4>
                        <div>
                            {category.tags.map((tagId) => {
                                const tag = tagData.get(tagId);
                                const state = getState(tagId, selection);

                                return (
                                    <TagButton
                                        key={tagId}
                                        name={tag?.name ?? tagId}
                                        state={state}
                                        tooltipContent={tag?.description ? tagId : undefined}
                                        tooltipId={tag?.description ? TOOLTIP_ID : undefined}
                                        onClick={() => {
                                            onChange(setState(tagId, NEXT_STATE[state], selection), 'advanced');
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </React.Fragment>
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

    return (
        <div className={style.tagSelector}>
            <div>
                <TagButton
                    noIcon
                    name="All"
                    state={selected === undefined ? 'required' : 'any'}
                    onClick={() => {
                        if (selected !== undefined) {
                            onChange(setState(selected, 'any', selection), 'simple');
                        }
                    }}
                />
                {tags.map(([tagId, tag]) => (
                    <TagButton
                        noIcon
                        key={tagId}
                        name={tag.name}
                        state={selected === tagId ? 'required' : 'any'}
                        tooltipContent={tag.description ? tagId : undefined}
                        tooltipId={tag.description ? TOOLTIP_ID : undefined}
                        onClick={() => {
                            if (selected !== tagId) {
                                let s = setState(tagId, 'required', selection);
                                if (selected !== undefined) {
                                    s = setState(selected, 'any', s);
                                }
                                onChange(s, 'simple');
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

function reduceToSimple(categories: Iterable<TagCategory>, selection: TagSelection): TagSelection {
    if (selection.size === 0) return selection;

    const simpleTags = new Set<TagId>([...categories].filter((c) => c.simple).flatMap((c) => c.tags));

    const selectedMainTags: TagId[] = [];
    for (const [tagId, state] of selection) {
        // ignore forbidden tags
        if (state === SelectionState.Required && simpleTags.has(tagId)) {
            selectedMainTags.push(tagId);
        }
    }

    if (selectedMainTags.length === 0) {
        return EMPTY_MAP;
    } else if (selectedMainTags.length === 1) {
        if (selection.size === 1) return selection;
        return new Map([[selectedMainTags[0], SelectionState.Required]]);
    } else {
        // we can only select 1 tag
        // it's quite hard to find a strategy that makes sense here
        // so we just give up
        return EMPTY_MAP;
    }
}
