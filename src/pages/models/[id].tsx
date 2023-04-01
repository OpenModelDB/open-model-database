import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { ParsedUrlQuery } from 'querystring';
import React, { useCallback } from 'react';
import { BsFillTrashFill } from 'react-icons/bs';
import { DownloadButton } from '../../elements/components/download-button';
import { EditableIntegerLabel, EditableLabel } from '../../elements/components/editable-label';
import { EditableMarkdownContainer } from '../../elements/components/editable-markdown';
import { EditableUsers } from '../../elements/components/editable-users';
import { ImageCarousel } from '../../elements/components/image-carousel';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useCurrent } from '../../lib/hooks/use-current';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { ArchId, Model, ModelId, Resource } from '../../lib/schema';
import { fileApi } from '../../lib/server/file-data';
import { asArray, getColorMode, joinListString } from '../../lib/util';

interface Params extends ParsedUrlQuery {
    id: ModelId;
}
interface Props {
    modelId: ModelId;
    modelData: Model;
}

const renderTags = (tags: string[]) => (
    <div className="flex flex-row flex-wrap gap-2">
        {tags.map((tag) => {
            return (
                <span
                    className="inline-flex items-center rounded-full bg-fade-100 px-2.5 py-0.5 text-xs font-medium text-fade-800 dark:bg-fade-800 dark:text-fade-200"
                    key={tag}
                >
                    {tag}
                </span>
            );
        })}
    </div>
);

const dummyImages = [
    {
        LR: 'https://imgsli.com/i/07b7f3f2-2d9f-4325-b0a6-824646131308.jpg',
        HR: 'https://imgsli.com/i/986ec7cc-2c3e-43de-8b56-82040abe65a3.jpg',
    },
];

export default function Page({ modelId, modelData }: Props) {
    const { archData } = useArchitectures();
    const { userData } = useUsers();

    const { webApi, editMode } = useWebApi();
    const model = useCurrent(webApi, 'model', modelId, modelData);

    const authors = asArray(model.author);
    const authorsJoined = joinListString(authors.map((userId) => userData.get(userId)?.name ?? 'unknown'));

    const archName = archData.get(model.architecture)?.name ?? 'unknown';

    const updateModelProperty = useCallback(
        <K extends keyof Model>(key: K, value: Model[K]) => {
            const newModel: Model = { ...model, [key]: value };
            webApi?.models.update([[modelId, newModel]]).catch((e) => console.error(e));
        },
        [webApi, modelId, model]
    );

    return (
        <>
            <HeadCommon
                description={`A ${model.scale}x ${archName} model by ${authorsJoined}.`}
                image={dummyImages[0].HR}
                title={model.name}
            />
            <Head>
                <meta
                    content="summary_large_image"
                    name="twitter:card"
                />
            </Head>
            <PageContainer>
                {/* Two columns */}
                <div className="grid h-full w-full grid-cols-3 gap-4 py-6">
                    {/* Left column */}
                    <div className="relative col-span-2 flex h-full flex-col gap-4">
                        <ImageCarousel images={dummyImages} />
                        <div className="relative">
                            <div>
                                <h1 className="m-0">
                                    <EditableLabel
                                        readonly={!editMode}
                                        text={modelData.name}
                                        onChange={(value) => updateModelProperty('name', value)}
                                    />
                                </h1>
                                <div className="m-0 flex w-full max-w-full flex-row gap-2">
                                    by{' '}
                                    <EditableUsers
                                        readonly={!editMode}
                                        users={authors}
                                        onChange={(users) => {
                                            updateModelProperty('author', users.length === 1 ? users[0] : users);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="py-4">
                                <EditableMarkdownContainer
                                    markdown={modelData.description}
                                    readonly={!editMode}
                                    onChange={(value) => updateModelProperty('description', value)}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Right column */}
                    <div className="col-span-1 w-full">
                        {/* Download Button */}
                        <div className="mb-2 flex w-full flex-col gap-2">
                            {model.resources.map((resource) => {
                                return (
                                    <div
                                        className="flex w-full flex-row gap-2"
                                        key={resource.sha256}
                                    >
                                        <DownloadButton
                                            readonly={!editMode}
                                            resource={resource}
                                            onChange={(newResource: Resource) => {
                                                const newResources = model.resources
                                                    .map((r) => {
                                                        if (r.sha256 === resource.sha256) {
                                                            return newResource;
                                                        }
                                                        return r;
                                                    })
                                                    .filter((r) => r.urls.length > 0);
                                                updateModelProperty('resources', newResources);
                                            }}
                                        />
                                        {editMode && (
                                            <button
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    const newResources = model.resources.filter(
                                                        (r) => r.sha256 !== resource.sha256
                                                    );
                                                    updateModelProperty('resources', newResources);
                                                }}
                                            >
                                                <BsFillTrashFill />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="relative table-auto overflow-hidden rounded-lg border-fade-700">
                            <table className="w-full border-collapse overflow-hidden rounded-lg border-fade-700 text-left text-sm text-gray-500 dark:text-gray-400 ">
                                <tbody className="overflow-hidden  rounded-lg ">
                                    <tr className=" ">
                                        <th
                                            className="whitespace-nowrap bg-fade-100 px-6 py-4 font-medium text-gray-900 dark:bg-fade-800 dark:text-white"
                                            scope="row"
                                        >
                                            Architecture
                                        </th>
                                        <td className="px-6 py-4">
                                            {editMode ? (
                                                <select
                                                    value={model.architecture}
                                                    onChange={(e) => {
                                                        updateModelProperty('architecture', e.target.value as ArchId);
                                                    }}
                                                >
                                                    {[...archData].map(([archId, arch]) => (
                                                        <option
                                                            key={archId}
                                                            value={archId}
                                                        >
                                                            {arch.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                archName
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="">
                                        <th
                                            className="whitespace-nowrap bg-fade-100 px-6 py-4 font-medium text-fade-900 dark:bg-fade-800 dark:text-white"
                                            scope="row"
                                        >
                                            Scale
                                        </th>
                                        <td className="px-6 py-4 ">
                                            <EditableIntegerLabel
                                                max={16}
                                                min={1}
                                                readonly={!editMode}
                                                value={model.scale}
                                                onChange={(value) => updateModelProperty('scale', value)}
                                            />
                                        </td>
                                    </tr>
                                    {model.size && (
                                        <tr className="">
                                            <th
                                                className="whitespace-nowrap bg-fade-100 px-6 py-4 font-medium text-fade-900 dark:bg-fade-800 dark:text-white"
                                                scope="row"
                                            >
                                                Size
                                            </th>
                                            <td className="px-6 py-4">{renderTags(model.size)}</td>
                                        </tr>
                                    )}
                                    <tr className="">
                                        <th
                                            className="whitespace-nowrap bg-fade-100 px-6 py-4 font-medium text-gray-900 dark:bg-fade-800 dark:text-white"
                                            scope="row"
                                        >
                                            Tags
                                        </th>
                                        <td className="px-6 py-4">{renderTags(model.tags)}</td>
                                    </tr>
                                    <tr className="">
                                        <th
                                            className="whitespace-nowrap bg-fade-100 px-6 py-4 font-medium text-gray-900 dark:bg-fade-800 dark:text-white"
                                            scope="row"
                                        >
                                            Color Mode
                                        </th>
                                        <td className="px-6 py-4">
                                            <div className="uppercase">
                                                {getColorMode(model.inputChannels)} →{' '}
                                                {getColorMode(model.outputChannels)}
                                            </div>
                                            {editMode && (
                                                <>
                                                    <div>
                                                        Input:{' '}
                                                        <EditableIntegerLabel
                                                            max={4}
                                                            min={0}
                                                            readonly={!editMode}
                                                            value={model.inputChannels}
                                                            onChange={(value) =>
                                                                updateModelProperty('inputChannels', value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        Output:{' '}
                                                        <EditableIntegerLabel
                                                            max={4}
                                                            min={0}
                                                            readonly={!editMode}
                                                            value={model.outputChannels}
                                                            onChange={(value) =>
                                                                updateModelProperty('outputChannels', value)
                                                            }
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                    {Object.entries(model)
                                        .filter(
                                            ([key, _value]) =>
                                                ![
                                                    // Handled by other parts of page
                                                    'name',
                                                    'author',
                                                    'description',
                                                    'resources',
                                                    // Already handled manually
                                                    'architecture',
                                                    'scale',
                                                    'size',
                                                    'tags',
                                                    'inputChannels',
                                                    'outputChannels',
                                                    // This is just messed up in the data
                                                    'pretrainedModelG',
                                                ].includes(key)
                                        )
                                        .filter(([_key, value]) => !!value)
                                        .sort()
                                        .map(([key, value]) => {
                                            return (
                                                <tr
                                                    className=""
                                                    key={key}
                                                >
                                                    <th
                                                        className="whitespace-nowrap bg-fade-100 px-6 py-4 font-medium capitalize text-fade-900 dark:bg-fade-800 dark:text-white"
                                                        scope="row"
                                                    >
                                                        {key}
                                                    </th>
                                                    <td className="px-6 py-4">
                                                        {Array.isArray(value)
                                                            ? renderTags(value.map((v) => String(v)))
                                                            : value}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
    const modelIds = await fileApi.models.getIds();

    return {
        paths: modelIds.map((id) => ({ params: { id } })),
        fallback: false,
    };
};

export const getStaticProps: GetStaticProps<Props, Params> = async (context) => {
    const modelId = context.params?.id;
    if (!modelId) throw new Error("Missing path param 'id'");

    const modelData = await fileApi.models.get(modelId);

    return {
        props: { modelId, modelData },
    };
};
