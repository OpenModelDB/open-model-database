import { GetStaticProps } from 'next';
import Head from 'next/head';
import React, { useMemo, useState } from 'react';
import { ModelCard } from '../elements/components/model-card';
import { SearchBar } from '../elements/components/searchbar';
import { PageContainer } from '../elements/page';
import { Model, ModelId, TagId } from '../lib/schema';
import { Condition, compileCondition } from '../lib/search/logical-condition';
import { CorpusEntry, SearchIndex } from '../lib/search/search-index';
import { tokenize } from '../lib/search/token';
import { getAllModelIds, getModelData } from '../lib/server/data';
import { asArray, joinClasses, typedEntries } from '../lib/util';

interface Props {
    modelData: Record<ModelId, Model>;
}

export default function Page({ modelData }: Props) {
    const searchIndex = useMemo(() => {
        return new SearchIndex(
            typedEntries(modelData).map(([id, model]): CorpusEntry<ModelId, TagId> => {
                return {
                    id,
                    tags: new Set(model.tags),
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

    const allTags = useMemo(() => new Set<string>(Object.values(modelData).flatMap((m) => m.tags)), [modelData]);
    const [selectedTag, setSelectedTag] = useState<TagId>();
    const [searchQuery, setSearchQuery] = useState<string>('');

    const availableModels = useMemo(() => {
        const tagCondition: Condition<TagId> = selectedTag ? Condition.variable(selectedTag) : true;
        const queryTokens = tokenize(searchQuery);

        const searchResults = searchIndex
            .retrieve(compileCondition(tagCondition), queryTokens)
            .sort((a, b) => b.score - a.score);
        return searchResults.map((r) => r.id);
    }, [selectedTag, searchQuery, searchIndex]);

    return (
        <>
            <Head>
                <title>OpenModelDB</title>
                <meta
                    content="Generated by create next app"
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
            </Head>
            <PageContainer>
                <div className="py-6">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
                            <h1 className="mb-4 text-center text-2xl font-bold capitalize text-accent-500 dark:text-fade-200 md:mb-6 lg:text-3xl">
                                The best place to find AI Upscaling models
                            </h1>

                            <p className="mx-auto max-w-screen-md text-center text-gray-500 md:text-lg">
                                OpenModelDB is a community driven database of AI Upscaling models. We aim to provide a
                                better way to find and compare models than existing sources.
                            </p>

                            <p className="mx-auto max-w-screen-md text-center text-gray-500 md:text-lg">
                                Currently listing <a className="font-bold text-accent-500">{modelCount}</a> models.
                            </p>

                            {/* Search */}
                            <SearchBar
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {/* Tags */}
                            <div className="mb-2 flex flex-row flex-wrap place-content-center justify-items-center align-middle">
                                <div
                                    className={joinClasses(
                                        'mr-2 mb-2 w-fit cursor-pointer rounded-lg bg-gray-200 px-2 py-1 text-sm font-medium uppercase text-gray-800 transition-colors ease-in-out hover:bg-fade-500 hover:text-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-fade-500',
                                        !selectedTag && 'bg-accent-500 text-gray-100 dark:bg-accent-500 '
                                    )}
                                    onClick={() => setSelectedTag(undefined)}
                                >
                                    All
                                </div>
                                {Array.from(allTags).map((tag) => (
                                    <div
                                        className={joinClasses(
                                            'mr-2 mb-2 w-fit cursor-pointer rounded-lg bg-gray-200 px-2 py-1 text-sm font-medium uppercase text-gray-800 transition-colors ease-in-out hover:bg-fade-500 hover:text-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-fade-500',
                                            selectedTag == tag && 'bg-accent-500 text-gray-100 dark:bg-accent-500 '
                                        )}
                                        key={tag}
                                        onClick={() => setSelectedTag(selectedTag == tag ? undefined : (tag as TagId))}
                                    >
                                        {tag}
                                    </div>
                                ))}
                            </div>
                            {/* Model Cards */}
                            {availableModels.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {availableModels.map((id) => {
                                        const { architecture, author, scale, description, tags } = modelData[id];
                                        const lines = description.split('\n');
                                        const descLines: string[] = [];
                                        let category = '',
                                            purpose = '',
                                            pretrained = '',
                                            dataset = '';
                                        lines.forEach((line) => {
                                            if (line.startsWith('Category: ')) {
                                                category = String(line).replace('Category: ', '');
                                            } else if (line.startsWith('Purpose: ')) {
                                                purpose = String(line).replace('Purpose: ', '');
                                            } else if (line.startsWith('Pretrained: ')) {
                                                pretrained = String(line).replace('Pretrained: ', '');
                                            } else if (line.startsWith('Dataset: ')) {
                                                dataset = String(line).replace('Dataset: ', '');
                                            } else if (line !== '') {
                                                descLines.push(line.trim());
                                            }
                                        });
                                        const purposeSentence = category
                                            ? `A ${scale}x model for ${purpose}.`
                                            : `A ${scale}x model.`;
                                        const datasetSentence = dataset
                                            ? `Trained on ${dataset}.`
                                            : 'Unknown training dataset.';
                                        const pretrainedSentence = pretrained
                                            ? `Pretrained using ${pretrained}.`
                                            : 'Unknown pretrained model.';
                                        const actualDescription =
                                            descLines.length > 0
                                                ? descLines.join('\n').trim()
                                                : `${purposeSentence} ${datasetSentence} ${pretrainedSentence}`;

                                        return (
                                            <ModelCard
                                                architecture={architecture}
                                                author={author}
                                                description={actualDescription}
                                                id={id}
                                                key={id}
                                                scale={scale}
                                                tags={tags}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6">
                                    <div className="text-2xl font-bold text-accent-500 dark:text-gray-100">
                                        No models found
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        Try changing your search filters
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
}

export const getStaticProps: GetStaticProps<Props> = async (_context) => {
    const modelIds = await getAllModelIds();
    const modelData = await getModelData(modelIds);
    return {
        props: {
            modelData: Object.fromEntries(modelIds.map((id, i) => [id, modelData[i]])),
        },
    };
};
