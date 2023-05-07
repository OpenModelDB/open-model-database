import { Listbox, Transition } from '@headlessui/react';
import { Fragment, memo, useMemo, useState } from 'react';
import { MdSort } from 'react-icons/md';
import { Model, ModelId } from '../../lib/schema';
import { Sort, parseSort, sortModels } from '../../lib/sort-models';
import { typedEntries } from '../../lib/util';
import { ModelCardGrid } from './model-card-grid';
import style from './model-results.module.scss';

interface ModelResultsProps {
    modelData: ReadonlyMap<ModelId, Model>;
    models: readonly ModelId[];
}

// eslint-disable-next-line react/display-name
export const ModelResults = memo(({ models, modelData }: ModelResultsProps) => {
    const [sort, setSort] = useState<Sort>('relevance-desc');

    const sortedModels = useMemo(() => {
        return sortModels(models, sort, modelData);
    }, [models, sort, modelData]);

    return (
        <>
            <div className={`${style.controls} mb-3`}>
                <span className="mx-3">
                    Found <span className="font-medium">{sortedModels.length}</span> model
                    {sortedModels.length === 1 ? '' : 's'}
                </span>
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
                        className={`${style.button} w-full rounded-lg bg-transparent py-1 pl-9 pr-3 text-base hover:bg-gray-200 ui-open:bg-gray-200 dark:hover:bg-gray-700 dark:ui-open:bg-gray-700`}
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
                            className={`${style.options} mt-1 rounded-md border border-solid border-gray-300 bg-white text-base shadow-lg dark:border-gray-700 dark:bg-fade-800 sm:right-0 sm:text-sm`}
                        >
                            {typedEntries(SORT_OPTIONS).map(([value, { label, hide }]) => {
                                if (hide) return null;

                                return (
                                    <Listbox.Option
                                        className={({ active }) =>
                                            `relative cursor-pointer select-none py-2 px-4 ${
                                                active
                                                    ? 'bg-gray-200 text-black dark:bg-accent-600 dark:text-white'
                                                    : ''
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
