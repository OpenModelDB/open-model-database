import { GetStaticProps } from 'next';
import React, { useCallback, useMemo, useState } from 'react';
import { ModelResults } from '../elements/components/model-results';
import { SearchBar } from '../elements/components/searchbar';
import { HeadCommon } from '../elements/head-common';
import { PageContainer } from '../elements/page';
import { TagSelector } from '../elements/tag-selector';
import { useModels } from '../lib/hooks/use-models';
import { useSearch } from '../lib/hooks/use-search';
import { useTags } from '../lib/hooks/use-tags';
import { useWebApi } from '../lib/hooks/use-web-api';
import { Model, ModelId, TagId } from '../lib/schema';
import { createModelSearchIndex } from '../lib/search/create';
import { compileCondition } from '../lib/search/logical-condition';
import { SearchResult } from '../lib/search/search-index';
import { tokenize } from '../lib/search/token';
import { fileApi } from '../lib/server/file-data';
import { TagSelection, getTagCondition } from '../lib/tag-condition';
import { EMPTY_MAP } from '../lib/util';

interface Props {
    modelData: Record<ModelId, Model>;
}

export default function Page({ modelData: staticModelData }: Props) {
    const { modelData } = useModels(staticModelData);
    const { tagData, tagCategoryData } = useTags();

    const sortSearchResults = useCallback(
        (searchResults: SearchResult<ModelId>[]): void => {
            // sort by id to get a stable order
            searchResults.sort((a, b) => a.id.localeCompare(b.id));

            // de-buff pretrained models
            for (const result of searchResults) {
                const model = modelData.get(result.id);
                if (model?.tags.includes('pretrained' as TagId)) {
                    result.score -= 0.01;
                }
            }

            // give a small boost to recent models
            for (const result of searchResults) {
                const model = modelData.get(result.id);
                if (model?.date) {
                    const daysSinceUpload = (Date.now() - Date.parse(model.date)) / (1000 * 60 * 60 * 24);
                    result.score -= daysSinceUpload / 10000;
                }
            }

            // sort by score
            searchResults.sort((a, b) => b.score - a.score);
        },
        [modelData]
    );

    const searchIndex = useMemo(() => createModelSearchIndex(modelData), [modelData]);

    const [selectedModels, setSelectedModels] = useState<ModelId[]>(() => {
        const results: SearchResult<ModelId>[] = [...modelData.keys()].map((id) => ({ id, score: 0 }));
        sortSearchResults(results);
        return results.map((r) => r.id);
    });
    const updatedSelectedModels = useCallback(
        (searchQuery: string, tags: TagSelection): void => {
            const queryTokens = tokenize(searchQuery);
            const tagCondition = compileCondition(getTagCondition(tags, tagCategoryData.values()));

            const searchResults = searchIndex.retrieve(tagCondition, queryTokens);
            sortSearchResults(searchResults);
            setSelectedModels(searchResults.map((r) => r.id));
        },
        [searchIndex, tagCategoryData, sortSearchResults]
    );
    const { searchQuery, tagSelection, sort, setSearchQuery, setTagSelection, setSort } = useSearch(
        tagData,
        updatedSelectedModels
    );

    const { webApi, editMode } = useWebApi();
    const clickFunction = async () => {
        if (!webApi) return;

        const models = await webApi.models.getAll();
        // for (const [id, model] of models) {
        //     // todo
        // }
        await webApi.models.update(models);
    };

    return (
        <>
            <HeadCommon
                noTitlePrefix
                description="OpenModelDB is a community driven database of AI Upscaling models. We aim to provide a better way to find and compare models than existing sources."
                title="OpenModelDB"
            />
            <PageContainer
                scrollToTop
                wrapper
            >
                {editMode && (
                    <button
                        className="text-l absolute opacity-0 hover:opacity-100"
                        onClick={() => {
                            clickFunction().catch((e) => console.error(e));
                        }}
                    >
                        Click me!
                    </button>
                )}

                <section className="mx-auto max-w-3xl pt-8 pb-2 text-center md:pt-12">
                    <h1 className="m-0 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
                        The best place to find <span className="text-accent-text">AI Upscaling</span> models
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">
                        OpenModelDB is a community driven database of AI Upscaling models. We aim to provide a better
                        way to find and compare models than existing sources.
                    </p>
                </section>

                {/* Search */}
                <SearchBar
                    aria-label="Search models"
                    className="mx-auto mt-7 w-full max-w-3xl"
                    placeholder={`Search ${modelData.size.toLocaleString('en-US')} models by name, author, or purpose`}
                    size="large"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value, 400)}
                    onEnter={(e) => {
                        setSearchQuery(e.currentTarget.value, 0);

                        // scroll to search results on mobile
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
                        selection={tagSelection}
                        onChange={(value, style) => {
                            setTagSelection(value, style === 'advanced' ? 800 : 0);
                        }}
                    />
                </div>

                <span id="scroll-anchor" />

                {/* Model Cards */}
                {selectedModels.length > 0 ? (
                    <ModelResults
                        modelData={modelData}
                        models={selectedModels}
                        setSort={(sort) => setSort(sort, 0)}
                        sort={sort}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-card border border-solid border-line bg-surface px-6 py-16 text-center">
                        <p className="m-0 text-lg font-semibold text-ink">No models match those filters</p>
                        <p className="m-0 mt-1 max-w-md text-sm text-ink-muted">
                            {searchQuery
                                ? `Nothing matched “${searchQuery}”. Try a broader term, or clear the filters to start over.`
                                : 'That combination of tags has no models. Try removing one, or clear the filters to start over.'}
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
            modelData: Object.fromEntries(await fileApi.models.getAll()),
        },
    };
};
