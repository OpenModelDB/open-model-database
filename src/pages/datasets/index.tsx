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
                <h1 className="mb-4 text-center text-4xl font-extrabold md:mb-6 md:text-5xl lg:text-6xl">
                    <span className="font-bold text-gray-800 dark:text-gray-100">Training </span>
                    <span className="bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 bg-clip-text text-transparent">
                        Datasets
                    </span>
                </h1>

                <p className="mx-auto mb-8 max-w-screen-md text-center text-gray-600 dark:text-gray-400 md:text-lg">
                    Explore and search for datasets used to train upscaling and restoration models.
                </p>

                {/* Search */}
                <SearchBar
                    className="mb-4 w-full"
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
                <div className="my-4">
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
                    <div className="mt-10 flex flex-col items-center justify-center p-6">
                        <div className="text-2xl font-bold text-accent-500 dark:text-gray-100">No datasets found</div>
                        <div className="text-gray-500 dark:text-gray-400">Try changing your search filters</div>
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
