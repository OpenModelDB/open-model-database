import React, { useEffect, useMemo, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { BiRadioCircle } from 'react-icons/bi';
import { BsCheck } from 'react-icons/bs';
import { HiChevronDoubleDown, HiChevronDoubleUp, HiOutlinePlus, HiOutlinePlusSm } from 'react-icons/hi';
import { useTags } from '../lib/hooks/use-tags';
import { useTooltip } from '../lib/hooks/use-tooltip';
import { useWebApi } from '../lib/hooks/use-web-api';
import { TagCategory, TagId } from '../lib/schema';
import { SelectionState, TagSelection } from '../lib/tag-condition';
import { EMPTY_MAP, assertNever, isNonNull, joinClasses } from '../lib/util';
import { Link } from './components/link';
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
    tooltipContent?: string;
}
function TagButton({ state, name, onClick, noIcon = false, tooltipContent }: TagButtonProps) {
    const tooltipId = useTooltip();

    return (
        <button
            aria-pressed={state === 'required'}
            className={joinClasses(
                style.tagButton,
                state === 'any'
                    ? 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
                    : state === 'required'
                    ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
                    : 'border-line bg-surface text-red-700 dark:text-red-400'
            )}
            data-tooltip-content={tooltipContent}
            data-tooltip-id={tooltipContent ? tooltipId : undefined}
            onClick={onClick}
        >
            {!noIcon && <span className={style.icon}>{stateIcon[state]()}</span>}
            <span className={style.text}>{name}</span>
        </button>
    );
}

export type TagSelectorStyle = 'simple' | 'advanced';

export interface TagSelectorProps {
    selection: TagSelection;
    onChange: (selection: TagSelection, style: TagSelectorStyle) => void;
    context?: 'models' | 'datasets';
}

export function TagSelector({ selection, onChange, context = 'models' }: TagSelectorProps) {
    const [simple, setSimple] = useState(true);
    const { editMode } = useWebApi();

    const { tagData, tagCategoryData } = useTags();

    useEffect(() => {
        if (simple) {
            const filteredCategories =
                context === 'datasets'
                    ? [...tagCategoryData.entries()].filter(([id]) => id === 'dataset').map(([, c]) => c)
                    : [...tagCategoryData.entries()].filter(([id]) => id !== 'dataset').map(([, c]) => c);
            const reduced = reduceToSimple(filteredCategories, selection);
            if (reduced !== selection) {
                setSimple(false);
            }
        }
    }, [simple, tagData, tagCategoryData, selection, context]);

    return (
        <div>
            {simple ? (
                <SimpleTagSelector
                    context={context}
                    selection={selection}
                    onChange={onChange}
                />
            ) : (
                <AdvancedTagSelector
                    context={context}
                    selection={selection}
                    onChange={onChange}
                />
            )}
            <div className={style.controls}>
                <button
                    className={`${style.modeButton} text-ink-muted hover:text-ink`}
                    onClick={() => {
                        setSimple(!simple);
                        if (!simple) {
                            const filteredCategories =
                                context === 'datasets'
                                    ? [...tagCategoryData.entries()]
                                          .filter(([id]) => id === 'dataset')
                                          .map(([, c]) => c)
                                    : [...tagCategoryData.entries()]
                                          .filter(([id]) => id !== 'dataset')
                                          .map(([, c]) => c);
                            const reduced = reduceToSimple(filteredCategories, selection);
                            if (reduced !== selection) onChange(reduced, 'simple');
                        }
                    }}
                >
                    {simple ? <HiChevronDoubleDown /> : <HiChevronDoubleUp />}
                    <span>{simple ? 'Advanced tag selector' : 'Simple tag selector'}</span>
                </button>

                {!simple && (
                    <button
                        className={`${style.modeButton} text-ink-muted hover:text-ink disabled:text-ink-subtle`}
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
                        className={`${style.modeButton} text-ink-muted hover:text-ink`}
                        href="/tags"
                    >
                        <AiFillEdit />
                        <span>Edit tags</span>
                    </Link>
                )}
            </div>
        </div>
    );
}

function AdvancedTagSelector({ selection, onChange, context = 'models' }: TagSelectorProps) {
    const { tagData, categoryOrder } = useTags();
    const { editMode } = useWebApi();

    const filteredCategoryOrder = useMemo(() => {
        if (context === 'datasets') {
            return categoryOrder.filter(([id]) => id === 'dataset');
        }
        return categoryOrder.filter(([id]) => id !== 'dataset');
    }, [categoryOrder, context]);

    return (
        <div className={`${style.tagSelector} ${style.advanced}`}>
            {filteredCategoryOrder.map(([categoryId, category]) => {
                if (category.tags.length === 0 || (category.editOnly && !editMode))
                    return <React.Fragment key={categoryId} />;

                return (
                    <React.Fragment key={categoryId}>
                        <h4>{category.name}</h4>
                        <div className={style.advancedTags}>
                            {category.tags.map((tagId) => {
                                const tag = tagData.get(tagId);
                                const state = getState(tagId, selection);

                                return (
                                    <TagButton
                                        key={tagId}
                                        name={tag?.name ?? tagId}
                                        state={state}
                                        tooltipContent={tag?.description}
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

function SimpleTagSelector({ selection, onChange, context = 'models' }: TagSelectorProps) {
    const { tagData, categoryOrder } = useTags();

    // The dataset category is only meaningful on /datasets, and every other
    // category is only meaningful off it. From main, along with the datasets
    // pages.
    const filteredCategoryOrder = useMemo(() => {
        if (context === 'datasets') {
            return categoryOrder.filter(([id]) => id === 'dataset');
        }
        return categoryOrder.filter(([id]) => id !== 'dataset');
    }, [categoryOrder, context]);

    // Grouped by category so the ~30 options can be scanned, rather than read as
    // one undifferentiated wall. Selection stays single-select across all groups.
    const groups = useMemo(() => {
        return filteredCategoryOrder
            .filter(([, category]) => category.simple)
            .map(([categoryId, category]) => {
                const tags = category.tags
                    .map((tagId) => {
                        const tag = tagData.get(tagId);
                        if (!tag || tag.hidden) return undefined;
                        return [tagId, tag] as const;
                    })
                    .filter(isNonNull);
                return { categoryId, name: category.name, tags };
            })
            .filter(({ tags }) => tags.length > 0);
    }, [filteredCategoryOrder, tagData]);

    const allTags = useMemo(() => groups.flatMap(({ tags }) => tags), [groups]);

    const selected: TagId | undefined = useMemo(() => {
        const required = allTags.filter(([tagId]) => selection.get(tagId) === SelectionState.Required);
        if (required.length === 1) return required[0][0];
        return undefined;
    }, [selection, allTags]);

    const selectTag = (tagId: TagId) => {
        if (selected === tagId) return;
        let s = setState(tagId, 'required', selection);
        if (selected !== undefined) {
            s = setState(selected, 'any', s);
        }
        onChange(s, 'simple');
    };

    return (
        <div className={style.tagSelector}>
            <div
                aria-labelledby="tag-group-showing"
                className={style.group}
                role="group"
            >
                {/* Deliberately not a heading: these label a set of filter controls
                    rather than a section of the document. As an <h4> under the page's
                    <h1> they broke the heading outline for screen readers. */}
                <span
                    className={style.groupTitle}
                    id="tag-group-showing"
                >
                    Showing
                </span>
                <div className={style.groupTags}>
                    <TagButton
                        noIcon
                        name={context === 'datasets' ? 'All datasets' : 'All models'}
                        state={selected === undefined ? 'required' : 'any'}
                        onClick={() => {
                            if (selected !== undefined) {
                                onChange(setState(selected, 'any', selection), 'simple');
                            }
                        }}
                    />
                </div>
            </div>

            {groups.map(({ categoryId, name, tags }) => (
                <div
                    aria-labelledby={`tag-group-${categoryId}`}
                    className={style.group}
                    key={categoryId}
                    role="group"
                >
                    <span
                        className={style.groupTitle}
                        id={`tag-group-${categoryId}`}
                    >
                        {name}
                    </span>
                    <div className={style.groupTags}>
                        {tags.map(([tagId, tag]) => (
                            <TagButton
                                noIcon
                                key={tagId}
                                name={tag.name}
                                state={selected === tagId ? 'required' : 'any'}
                                tooltipContent={tag.description}
                                onClick={() => selectTag(tagId)}
                            />
                        ))}
                    </div>
                </div>
            ))}
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
