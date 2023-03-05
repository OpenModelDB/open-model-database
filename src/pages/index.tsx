import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { PageContainer } from '../elements/page';
import { Model, ModelId, TagId } from '../lib/schema';
import { getAllModelIds, getModelData } from '../lib/server/data';
import { asArray, joinClasses } from '../lib/util';

interface Props {
    modelIds: ModelId[];
    modelData: Record<ModelId, Model>;
}

const startsWithVowel = (str: string) => {
    const firstLetter = str[0].toLowerCase();
    return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter);
};

export default function Page({ modelIds, modelData }: Props) {
    console.log('🚀 ~ file: index.tsx:16 ~ Page ~ modelData:', modelData);
    const allTags = new Set<string>();
    modelIds.forEach((id) => {
        modelData[id].tags.forEach((tag) => allTags.add(tag));
    });
    const [selectedTag, setSelectedTag] = useState<TagId>();

    const [searchQuery, setSearchQuery] = useState<string>();

    const availableModels = modelIds
        .filter((id) => (selectedTag ? modelData[id].tags.includes(selectedTag) : true))
        .filter((id) => {
            const { name, architecture, author, scale } = modelData[id];
            return searchQuery
                ? `${name} ${architecture} ${scale}x ${String(author)}`
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                : true;
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
                <div className="py-6">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
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
                <div className="py-2">
                    <div className="mx-auto">
                        <div className="rounded-lg bg-fade-100 p-4 dark:bg-fade-800 md:py-2 lg:py-4">
                            <h1 className="mb-6 text-center text-2xl font-bold capitalize text-accent-500 dark:text-gray-200 lg:text-3xl">
                                Models
                            </h1>
                            {/* Search */}
                            <div className="relative mb-6 flex h-10 w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg
                                        aria-hidden="true"
                                        className="h-5 w-5 text-gray-500 dark:text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                        ></path>
                                    </svg>
                                </div>
                                <input
                                    className="w-full rounded-lg border border-solid border-gray-300 bg-white px-4 py-2 pl-10 text-gray-700 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-700 dark:bg-fade-900 dark:text-gray-100 dark:focus:border-accent-500 dark:focus:ring-accent-500"
                                    placeholder="Search"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {/* Tags */}
                            <div className="mb-3 flex flex-row flex-wrap place-content-center justify-items-center align-middle">
                                {Array.from(allTags).map((tag) => (
                                    <div
                                        className={joinClasses(
                                            'mr-2 mb-2 w-fit cursor-pointer rounded-full bg-gray-200 px-2 py-1 text-sm font-medium uppercase text-gray-800 transition-colors ease-in-out hover:bg-fade-500 hover:text-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-fade-500',
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
                                        const { name, architecture, author, scale } = modelData[id];
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
                                                className="transform overflow-hidden rounded-lg border border-solid border-gray-300 bg-white shadow-lg hover:shadow-xl dark:border-gray-700 dark:bg-fade-900"
                                                key={id}
                                            >
                                                <div className="m-0 -mb-2 w-full p-0">
                                                    <a
                                                        className="relative block"
                                                        href={`/models/${id}`}
                                                        rel="noreferrer"
                                                        target="_blank"
                                                    >
                                                        {/* Arch tag on image */}
                                                        <div className="absolute top-0 right-0 m-2">
                                                            <div className="flex flex-row flex-wrap place-content-center justify-items-center gap-x-2 align-middle">
                                                                <div className="cursor-pointer rounded-full bg-accent-500 px-2 py-1 text-sm font-medium text-gray-100  transition-colors ease-in-out hover:bg-accent-600 hover:text-gray-100 dark:bg-accent-600 dark:text-gray-100 dark:hover:bg-accent-700">
                                                                    {architecture}
                                                                </div>
                                                                <div className="cursor-pointer rounded-full bg-accent-500 px-2 py-1 text-sm font-medium text-gray-100  transition-colors ease-in-out hover:bg-accent-600 hover:text-gray-100 dark:bg-accent-600 dark:text-gray-100 dark:hover:bg-accent-700">
                                                                    {scale}x
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            alt="img"
                                                            className={joinClasses(
                                                                'w-full overflow-hidden object-cover'
                                                            )}
                                                            src={`https://picsum.photos/512/256`}
                                                        />
                                                    </a>
                                                </div>
                                                <div className="p-4">
                                                    <Link href={`/models/${id}`}>
                                                        <div className="block text-2xl font-bold text-gray-800 dark:text-gray-100">
                                                            {name}
                                                        </div>
                                                    </Link>
                                                    <div className="text-gray-600 dark:text-gray-400">
                                                        <div className="flex">
                                                            <div className="mr-1">
                                                                {startsWithVowel(architecture) ? 'an' : 'a'}
                                                            </div>
                                                            <Link href={`/architectures/${architecture}`}>
                                                                <div className="mr-1 font-bold text-accent-500">
                                                                    {architecture}
                                                                </div>
                                                            </Link>
                                                            <div className="mr-1">model by</div>
                                                            {asArray(author).map((userId) => (
                                                                <React.Fragment key={userId}>
                                                                    <Link href={`/users/${userId}`}>
                                                                        <div className="font-bold text-accent-500">
                                                                            {userId}
                                                                        </div>
                                                                    </Link>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
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
                                                                className="mr-2 mb-1 rounded-full bg-gray-200 px-2 py-1 text-sm font-medium uppercase text-gray-800 dark:bg-gray-700 dark:text-gray-100"
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
            modelIds: modelIds,
            modelData: Object.fromEntries(modelIds.map((id, i) => [id, modelData[i]])),
        },
    };
};
