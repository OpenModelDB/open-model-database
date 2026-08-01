import { GetStaticProps } from 'next';
import React, { useCallback, useMemo, useState } from 'react';
import { DatasetResults } from '../../elements/components/dataset-results';
import { SearchBar } from '../../elements/components/searchbar';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { TagSelector } from '../../elements/tag-selector';
import { useDatasets } from '../../lib/hooks/use-datasets';
import { useSearch } from '../../lib/hooks/use-search';
import { useTags } from '../../lib/hooks/use-tags';
import { Dataset, DatasetId } from '../../lib/schema';
import { createDatasetSearchIndex } from '../../lib/search/create';
import { compileCondition } from '../../lib/search/logical-condition';
import { SearchResult } from '../../lib/search/search-index';
import { tokenize } from '../../lib/search/token';
import { fileApi } from '../../lib/server/file-data';
import { TagSelection, getTagCondition } from '../../lib/tag-condition';
import { EMPTY_MAP } from '../../lib/util';

interface Props {
    datasetData: Record<DatasetId, Dataset>;
}

export default function Page({ datasetData: staticDatasetData }: Props) {
    const { datasetData } = useDatasets(staticDatasetData);
    const { tagData, tagCategoryData } = useTags();

    const sortSearchResults = useCallback((searchResults: SearchResult<DatasetId>[]): void => {
        // sort by id to get stable order
        searchResults.sort((a, b) => a.id.localeCompare(b.id));
        searchResults.sort((a, b) => b.score - a.score);
    }, []);

    const searchIndex = useMemo(() => createDatasetSearchIndex(datasetData), [datasetData]);

    const [selectedDatasets, setSelectedDatasets] = useState<DatasetId[]>(() => {
        const results: SearchResult<DatasetId>[] = [...datasetData.keys()].map((id) => ({ id, score: 0 }));
        sortSearchResults(results);
        return results.map((r) => r.id);
    });

    const updatedSelectedDatasets = useCallback(
        (searchQuery: string, tags: TagSelection): void => {
            const queryTokens = tokenize(searchQuery);
            const tagCondition = compileCondition(getTagCondition(tags, tagCategoryData.values()));

            const searchResults = searchIndex.retrieve(tagCondition, queryTokens);
            sortSearchResults(searchResults);
            setSelectedDatasets(searchResults.map((r) => r.id));
        },
        [searchIndex, tagCategoryData, sortSearchResults]
    );

    const { searchQuery, tagSelection, setSearchQuery, setTagSelection } = useSearch(tagData, updatedSelectedDatasets);

    return (
        <>
            <HeadCommon
                noTitlePrefix
                description="Browse community-contributed datasets for training AI restoration and upscaling models."
                title="Datasets - OpenModelDB"
            />
            <PageContainer
                scrollToTop
                wrapper
            >
                {/* Same masthead as the models page: one accent word rather
                    than a gradient, and theme tokens instead of paired greys. */}
                <section className="mx-auto max-w-3xl pt-8 pb-2 text-center md:pt-12">
                    <h1 className="m-0 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
                        Training <span className="text-accent-text">Datasets</span>
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">
                        Explore and search for datasets used to train upscaling and restoration models.
                    </p>
                </section>

                {/* Search */}
                <SearchBar
                    aria-label="Search datasets"
                    className="mx-auto mt-7 w-full max-w-3xl"
                    placeholder={`Search ${datasetData.size.toLocaleString('en-US')} dataset${
                        datasetData.size === 1 ? '' : 's'
                    } by name or purpose`}
                    size="large"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value, 400)}
                    onEnter={(e) => {
                        setSearchQuery(e.currentTarget.value, 0);
                        if (window.innerWidth < 600 || window.navigator.maxTouchPoints > 0) {
                            e.currentTarget.blur();
                            const anchor = document.getElementById('scroll-anchor');
                            if (anchor) {
                                const headerOffset = 80;
                                const elementPosition = anchor.getBoundingClientRect().top;
                                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: 'smooth',
                                });
                            }
                        }
                    }}
                />

                {/* Tags */}
                <div className="mt-8 mb-10">
                    <TagSelector
                        context="datasets"
                        selection={tagSelection}
                        onChange={(value, style) => {
                            setTagSelection(value, style === 'advanced' ? 800 : 0);
                        }}
                    />
                </div>

                <span id="scroll-anchor" />

                {/* Dataset Cards */}
                {selectedDatasets.length > 0 ? (
                    <DatasetResults
                        datasetData={datasetData}
                        datasets={selectedDatasets}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-card border border-solid border-line bg-surface px-6 py-16 text-center">
                        <p className="m-0 text-lg font-semibold text-ink">No datasets match those filters</p>
                        <p className="m-0 mt-1 max-w-md text-sm text-ink-muted">
                            {searchQuery
                                ? `Nothing matched “${searchQuery}”. Try a broader term, or clear the filters to start over.`
                                : 'That combination of tags has no datasets. Try removing one, or clear the filters to start over.'}
                        </p>
                        <button
                            className="mt-5 cursor-pointer rounded-control border-0 bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-accent-500"
                            type="button"
                            onClick={() => {
                                setSearchQuery('', 0);
                                setTagSelection(EMPTY_MAP, 0);
                            }}
                        >
                            Clear search and filters
                        </button>
                    </div>
                )}
            </PageContainer>
        </>
    );
}

export const getStaticProps: GetStaticProps<Props> = async (_context) => {
    return {
        props: {
            datasetData: Object.fromEntries(await fileApi.datasets.getAll()),
        },
    };
};
