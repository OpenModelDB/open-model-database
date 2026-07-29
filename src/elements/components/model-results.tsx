import { Listbox, Transition } from '@headlessui/react';
import { Fragment, memo, useMemo } from 'react';
import { MdSort } from 'react-icons/md';
import { Model, ModelId } from '../../lib/schema';
import { Sort, parseSort, sortModels } from '../../lib/sort-models';
import { typedEntries } from '../../lib/util';
import { ModelCardGrid } from './model-card-grid';
import style from './model-results.module.scss';

interface ModelResultsProps {
    modelData: ReadonlyMap<ModelId, Model>;
    models: readonly ModelId[];
    sort: Sort;
    setSort: (sort: Sort) => void;
}

// eslint-disable-next-line react/display-name
export const ModelResults = memo(({ models, modelData, sort, setSort }: ModelResultsProps) => {
    const sortedModels = useMemo(() => {
        return sortModels(models, sort, modelData);
    }, [models, sort, modelData]);

    return (
        <>
            <div className={`${style.controls} mb-4 gap-2 pb-3`}>
                <h2
                    aria-live="polite"
                    className="m-0 text-sm font-medium text-ink-muted"
                >
                    <span className="font-semibold text-ink">{sortedModels.length.toLocaleString('en-US')}</span>{' '}
                    {sortedModels.length === 1 ? 'model' : 'models'}
                </h2>
                <span className="h-1 flex-grow" />
                <SortSelector
                    setSort={setSort}
                    sort={sort}
                />
            </div>
            <ModelCardGrid
                lazyOffset={12}
                modelData={modelData}
                models={sortedModels}
            />
        </>
    );
});

const SORT_OPTIONS: Readonly<Record<Sort, { label: string; hide?: boolean }>> = {
    'relevance-desc': { label: 'Relevance' },
    'relevance-asc': { label: 'Relevance', hide: true },
    'date-desc': { label: 'Latest' },
    'date-asc': { label: 'Oldest', hide: true },
    'scale-desc': { label: 'Largest Scale' },
    'scale-asc': { label: 'Smallest Scale' },
    'size-desc': { label: 'Largest Size' },
    'size-asc': { label: 'Smallest Size' },
};

export function SortSelector({ sort, setSort }: { sort: Sort; setSort: (sort: Sort) => void }) {
    const [, order] = parseSort(sort);

    return (
        <div className={style.sortSelector}>
            <Listbox
                value={sort}
                onChange={setSort}
            >
                <div className="relative">
                    <Listbox.Button
                        aria-label={`Sort by ${SORT_OPTIONS[sort].label}`}
                        className={`${style.button} w-full rounded-control border border-solid border-line bg-surface py-1.5 pl-9 pr-3 text-sm font-medium hover:border-line-strong ui-open:border-line-strong`}
                    >
                        <span className="block truncate">{SORT_OPTIONS[sort].label}</span>
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MdSort className={`${style.sortIcon} ${style[order]}`} />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options
                            className={`${style.options} mt-1 rounded-control border border-solid border-line bg-surface py-1 text-sm shadow-pop`}
                        >
                            {typedEntries(SORT_OPTIONS).map(([value, { label, hide }]) => {
                                if (hide) return null;

                                return (
                                    <Listbox.Option
                                        className={({ active }) =>
                                            `relative cursor-pointer select-none py-2 px-4 ${
                                                active ? 'bg-accent-600 text-white dark:bg-accent-500' : ''
                                            }`
                                        }
                                        key={value}
                                        value={value}
                                    >
                                        {({ selected }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${
                                                        selected ? 'font-medium' : 'font-normal'
                                                    }`}
                                                >
                                                    {label}
                                                </span>
                                            </>
                                        )}
                                    </Listbox.Option>
                                );
                            })}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
}
