import { GetStaticProps } from 'next';
import React, { useCallback, useMemo, useState } from 'react';
import { Link } from '../elements/components/link';
import { ModelCardGrid } from '../elements/components/model-card-grid';
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
import { tokenize } from '../lib/search/token';
import { fileApi } from '../lib/server/file-data';
import { TagSelection, getTagCondition } from '../lib/tag-condition';

interface Props {
    modelData: Record<ModelId, Model>;
}

export default function Page({ modelData: staticModelData }: Props) {
    const { modelData } = useModels(staticModelData);
    const { tagData, tagCategoryData } = useTags();

    const searchIndex = useMemo(() => createModelSearchIndex(modelData), [modelData]);

    const [selectedModels, setSelectedModels] = useState<ModelId[]>(() => [...modelData.keys()]);
    const updatedSelectedModels = useCallback(
        (searchQuery: string, tags: TagSelection): void => {
            const queryTokens = tokenize(searchQuery);
            const tagCondition = compileCondition(getTagCondition(tags, tagCategoryData.values()));

            const searchResults = searchIndex
                .retrieve(tagCondition, queryTokens)
                .sort((a, b) => a.id.localeCompare(b.id));

            // de-buff pretrained models
            for (const result of searchResults) {
                const model = modelData.get(result.id);
                if (model?.tags.includes('pretrained' as TagId)) {
                    result.score -= 0.01;
                }
            }

            // sort by score
            searchResults.sort((a, b) => b.score - a.score);

            setSelectedModels(searchResults.map((r) => r.id));
        },
        [searchIndex, tagCategoryData, modelData]
    );
    const { searchQuery, tagSelection, setSearchQuery, setTagSelection } = useSearch(tagData, updatedSelectedModels);

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

                <div className="rounded-lg bg-yellow-300 px-4 py-2 dark:bg-yellow-900">
                    <h4 className="m-0">Notice</h4>
                    <p className="m-0">
                        OpenModelDB is still in alpha and actively being worked on. Please feel free to{' '}
                        <Link
                            external
                            className="font-medium hover:underline"
                            href="https://github.com/OpenModelDB/open-model-database/discussions/new?category=general"
                        >
                            share your feedback
                        </Link>{' '}
                        and{' '}
                        <Link
                            external
                            className="font-medium hover:underline"
                            href="https://github.com/OpenModelDB/open-model-database/issues"
                        >
                            report any bugs
                        </Link>{' '}
                        you find.
                    </p>
                </div>

                <h1 className="mb-4 text-center text-2xl font-bold capitalize text-accent-500 dark:text-fade-200 md:mb-6 lg:text-3xl">
                    The best place to find AI Upscaling models
                </h1>

                <p className="mx-auto max-w-screen-md text-center text-gray-600 dark:text-gray-400 md:text-lg">
                    OpenModelDB is a community driven database of AI Upscaling models. We aim to provide a better way to
                    find and compare models than existing sources.
                </p>

                {/* Search */}
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value, 400)}
                />

                {/* Tags */}
                <div className="my-4">
                    <TagSelector
                        selection={tagSelection}
                        onChange={(value, style) => {
                            setTagSelection(value, style === 'advanced' ? 800 : 0);
                        }}
                    />
                </div>

                {/* Model Cards */}
                {selectedModels.length > 0 ? (
                    <>
                        <div className="mb-3 ml-3">
                            Found <span className="font-medium">{selectedModels.length}</span> model
                            {selectedModels.length === 1 ? '' : 's'}
                        </div>
                        <ModelCardGrid
                            lazyOffset={12}
                            modelData={modelData}
                            models={selectedModels}
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-6">
                        <div className="text-2xl font-bold text-accent-500 dark:text-gray-100">No models found</div>
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
            modelData: Object.fromEntries(await fileApi.models.getAll()),
        },
    };
};
