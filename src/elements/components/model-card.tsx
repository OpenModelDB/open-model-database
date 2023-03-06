import Link from 'next/link';
import React from 'react';
import { asArray } from '../../lib/util';

const startsWithVowel = (str: string) => {
    const firstLetter = str[0].toLowerCase();
    return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter);
};

type ModelCardProps = {
    id: string;
    author: string | string[];
    architecture: string;
    scale: number;
    tags: string[];
    description: string;
};

export const ModelCard = ({ id, author, architecture, scale, tags, description }: ModelCardProps) => {
    return (
        <div
            // eslint-disable-next-line tailwindcss/no-arbitrary-value
            className="group relative h-[435px] overflow-hidden rounded-lg border border-solid border-gray-300 shadow-lg hover:shadow-xl dark:border-gray-700 "
            key={id}
        >
            <div className="relative flex h-full w-full flex-col  transition-all ease-in-out">
                {/* Arch tag on image */}
                <div className="absolute top-0 right-0 m-2">
                    <div className="flex flex-row flex-wrap place-content-center justify-items-center gap-x-2 align-middle">
                        <div className="rounded-lg bg-accent-500 px-2 py-1 text-sm font-medium text-gray-100 transition-colors ease-in-out dark:bg-accent-600 dark:text-gray-100 ">
                            {architecture}
                        </div>
                        <div className="rounded-lg bg-accent-500 px-2 py-1 text-sm font-medium text-gray-100 transition-colors ease-in-out dark:bg-accent-600 dark:text-gray-100 ">
                            {scale}x
                        </div>
                    </div>
                </div>

                <a
                    // eslint-disable-next-line tailwindcss/no-arbitrary-value
                    className="h-auto w-full flex-1  bg-[url(https://picsum.photos/512/312)] bg-cover bg-center transition-all duration-500 ease-in-out group-hover:h-full"
                    href={`/models/${id}`}
                    rel="noreferrer"
                    target="_blank"
                />

                <div className="relative inset-x-0 bottom-0 bg-white p-4   dark:bg-fade-900">
                    <Link href={`/models/${id}`}>
                        <div className="block text-2xl font-bold text-gray-800 dark:text-gray-100">{id}</div>
                    </Link>
                    <div className="text-gray-600 dark:text-gray-400">
                        <div className="flex">
                            <div className="mr-1">{startsWithVowel(architecture) ? 'an' : 'a'}</div>
                            <Link href={`/architectures/${architecture}`}>
                                <div className="mr-1 font-bold text-accent-500">{architecture}</div>
                            </Link>
                            <div className="mr-1">model by</div>
                            {asArray(author).map((userId) => (
                                <React.Fragment key={userId}>
                                    <Link href={`/users/${userId}`}>
                                        <div className="font-bold text-accent-500">{userId}</div>
                                    </Link>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="my-2 flex flex-col justify-between">
                        <div className="text-gray-500 line-clamp-3 dark:text-gray-400">{description}</div>
                    </div>

                    {/* Tags */}
                    <div className="mt-2 flex flex-row flex-wrap">
                        {tags.map((tag) => (
                            <div
                                className="mr-2 mt-1 rounded-lg bg-gray-200 px-2 py-1 text-sm font-medium uppercase text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                                key={tag}
                            >
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
