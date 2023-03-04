import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { PageContainer } from '../elements/page';
import { Model, ModelId } from '../lib/schema';
import { getAllModelIds, getModelData } from '../lib/server/data';
import { asArray } from '../lib/util';

interface Props {
    modelIds: ModelId[];
    modelData: Record<ModelId, Model>;
}

export default function Page({ modelIds, modelData }: Props) {
    const allTags = new Set<string>();
    modelIds.forEach((id) => {
        modelData[id].tags.forEach((tag) => allTags.add(tag));
    });
    console.log({
        allTags,
    });

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
                <div className="py-4 sm:py-4 lg:py-6">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="rounded-lg bg-fade-100 p-4 dark:bg-fade-800 md:py-6 lg:py-8">
                            <h1 className="mb-4 text-center text-2xl font-bold capitalize text-accent-500 dark:text-gray-200 md:mb-6 lg:text-3xl">
                                The best place to find AI Upscaling models
                            </h1>

                            <p className="mx-auto max-w-screen-md text-center text-gray-500 md:text-lg">
                                OpenModelDB is a community driven database of AI Upscaling models. We aim to provide a
                                better way to find and compare models than existing sources.
                            </p>

                            <p className="mx-auto max-w-screen-md text-center text-gray-500 md:text-lg">
                                Currently listing <a className="font-bold text-accent-500">{modelIds.length}</a> models.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="py-4 sm:py-4 lg:py-6">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="rounded-lg bg-fade-100 p-4 dark:bg-fade-800 md:py-2 lg:py-4">
                            <h1 className="mb-6 text-center text-2xl font-bold capitalize text-accent-500 dark:text-gray-200 lg:text-3xl">
                                Models
                            </h1>
                            <div className="mb-3 flex flex-row flex-wrap place-content-center justify-items-center align-middle">
                                {Array.from(allTags).map((tag) => (
                                    <div
                                        className="mr-2 mb-2 w-fit rounded-full bg-gray-200 px-2 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                                        key={tag}
                                    >
                                        {tag}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {modelIds.map((id) => {
                                    const category = (modelData[id].description.split('\n')[0] ?? '').replace(
                                        'Category: ',
                                        ''
                                    );
                                    const purpose = (modelData[id].description.split('\n')[1] ?? '').replace(
                                        'Purpose: ',
                                        ''
                                    );
                                    const tags = modelData[id].tags;

                                    return (
                                        <div
                                            className="rounded-lg bg-white shadow-lg dark:bg-fade-900"
                                            key={id}
                                        >
                                            <div className="p-4">
                                                <Link href={`/models/${id}`}>
                                                    <div className="block text-2xl font-bold text-gray-800 dark:text-gray-100">
                                                        {id}
                                                    </div>
                                                </Link>
                                                <div className="mt-2 text-gray-600 dark:text-gray-400">
                                                    {asArray(modelData[id].author).map((userId) => (
                                                        <React.Fragment key={userId}>
                                                            <Link href={`/users/${userId}`}>
                                                                <div className="flex">
                                                                    <div className="mr-1">by</div>
                                                                    <div className="font-bold text-accent-500">
                                                                        {userId}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                {/* Description */}
                                                <div className="my-2 flex flex-col justify-between">
                                                    <div className="truncate text-gray-500 dark:text-gray-400">
                                                        <strong>Purpose:</strong> {purpose}
                                                    </div>
                                                    <div className="truncate text-gray-500 dark:text-gray-400">
                                                        <strong>Category:</strong> {category}
                                                    </div>
                                                </div>

                                                {/* Tags */}
                                                <div className="mt-2 flex flex-row flex-wrap">
                                                    {tags.map((tag) => (
                                                        <div
                                                            className="mr-2 mb-2 rounded-full bg-gray-200 px-2 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                                                            key={tag}
                                                        >
                                                            {tag}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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
            modelIds: modelIds,
            modelData: Object.fromEntries(modelIds.map((id, i) => [id, modelData[i]])),
        },
    };
};
