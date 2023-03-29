import { GetStaticProps } from 'next';
import Head from 'next/head';
import React, { useCallback, useMemo, useState } from 'react';
import { ModelCard } from '../elements/components/model-card';
import { SearchBar } from '../elements/components/searchbar';
import { PageContainer } from '../elements/page';
import { TagSelector } from '../elements/tag-selector';
import { deriveTags } from '../lib/derive-tags';
import { useMemoDelay } from '../lib/hooks/use-memo-delay';
import { useModels } from '../lib/hooks/use-models';
import { useTags } from '../lib/hooks/use-tags';
import { useWebApi } from '../lib/hooks/use-web-api';
import { Model, ModelId, TagId } from '../lib/schema';
import { compileCondition } from '../lib/search/logical-condition';
import { CorpusEntry, SearchIndex } from '../lib/search/search-index';
import { tokenize } from '../lib/search/token';
import { fileApi } from '../lib/server/file-data';
import { TagSelection, getTagCondition } from '../lib/tag-condition';
import { EMPTY_MAP, asArray } from '../lib/util';

interface Props {
    modelData: Record<ModelId, Model>;
}

export default function Page({ modelData: staticModelData }: Props) {
    const { modelData } = useModels(staticModelData);
    const { tagCategoryData } = useTags();

    const searchIndex = useMemo(() => {
        return new SearchIndex(
            [...modelData].map(([id, model]): CorpusEntry<ModelId, TagId> => {
                return {
                    id,
                    tags: new Set(deriveTags(model)),
                    texts: [
                        {
                            text: [id, model.name].filter(Boolean).join('\n').toLowerCase(),
                            weight: 8,
                        },
                        {
                            text: asArray(model.author).filter(Boolean).join('\n').toLowerCase(),
                            weight: 4,
                        },
                        {
                            text: [model.architecture, `${model.scale}x`, model.dataset]
                                .filter(Boolean)
                                .join('\n')
                                .toLowerCase(),
                            weight: 1,
                        },
                        { text: model.description.toLowerCase(), weight: 1 },
                    ],
                };
            })
        );
    }, [modelData]);
    const modelCount = searchIndex.entries.size;

    const [searchQuery, setSearchQuery] = useState<string>('');

    const [tagSelection, setTagSelection] = useState<TagSelection>(EMPTY_MAP);
    const tagCondition = useMemo(
        () => compileCondition(getTagCondition(tagSelection, tagCategoryData.values())),
        [tagSelection, tagCategoryData]
    );

    const availableModels = useMemoDelay(
        useCallback(() => {
            const queryTokens = tokenize(searchQuery);

            const searchResults = searchIndex
                .retrieve(tagCondition, queryTokens)
                .sort((a, b) => a.id.localeCompare(b.id))
                .sort((a, b) => b.score - a.score);
            return searchResults.map((r) => r.id);
        }, [tagCondition, searchQuery, searchIndex]),
        500
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
            <Head>
                <title>OpenModelDB</title>
                <meta
                    content="OpenModelDB is a community driven database of AI Upscaling models. We aim to provide a better way to find and compare models than existing sources."
                    name="description"
                />
                <meta
                    content="width=device-width, initial-scale=1"
                    name="viewport"
                />
                <link
                    href="/favicon.ico"
                    rel="icon"
                />
                <meta
                    content="OpenModelDB"
                    property="og:title"
                />
                <meta
                    content="OpenModelDB is a community driven database of AI Upscaling models. We aim to provide a better way to find and compare models than existing sources."
                    property="og:description"
                />
                <meta
                    content={process.env.SITE_URL}
                    property="og:url"
                />
                <meta
                    content="https://imgsli.com/i/986ec7cc-2c3e-43de-8b56-82040abe65a3.jpg"
                    property="og:image"
                />
                <meta
                    content="#4d48a9"
                    data-react-helmet="true"
                    name="theme-color"
                />
            </Head>
            <PageContainer>
                <div className="my-6 rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
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

                    <h1 className="mb-4 text-center text-2xl font-bold capitalize text-accent-500 dark:text-fade-200 md:mb-6 lg:text-3xl">
                        The best place to find AI Upscaling models
                    </h1>

                    <p className="mx-auto max-w-screen-md text-center text-gray-500 md:text-lg">
                        OpenModelDB is a community driven database of AI Upscaling models. We aim to provide a better
                        way to find and compare models than existing sources.
                    </p>

                    <p className="mx-auto max-w-screen-md text-center text-gray-500 md:text-lg">
                        Currently listing <span className="font-bold text-accent-500">{modelCount}</span> models.
                    </p>

                    {/* Search */}
                    <SearchBar
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {/* Tags */}
                    <div className="my-8">
                        <TagSelector
                            selection={tagSelection}
                            onChange={setTagSelection}
                        />
                    </div>

                    {/* Model Cards */}
                    {availableModels.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {availableModels.map((id) => {
                                return (
                                    <ModelCard
                                        id={id}
                                        key={id}
                                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                        model={modelData.get(id)!}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6">
                            <div className="text-2xl font-bold text-accent-500 dark:text-gray-100">No models found</div>
                            <div className="text-gray-500 dark:text-gray-400">Try changing your search filters</div>
                        </div>
                    )}
                </div>
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
