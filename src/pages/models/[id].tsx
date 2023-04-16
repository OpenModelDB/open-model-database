import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { ParsedUrlQuery } from 'querystring';
import React from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { BsFillTrashFill, BsPlusLg } from 'react-icons/bs';
import { DownloadButton } from '../../elements/components/download-button';
import { EditResourceButton } from '../../elements/components/download-button-edit-popover';
import { EditableIntegerLabel, EditableLabel } from '../../elements/components/editable-label';
import { EditableMarkdownContainer } from '../../elements/components/editable-markdown';
import { EditableTags } from '../../elements/components/editable-tags';
import { EditableUsers } from '../../elements/components/editable-users';
import { ImageCarousel } from '../../elements/components/image-carousel';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useCurrent } from '../../lib/hooks/use-current';
import { useUpdateModel } from '../../lib/hooks/use-update-model';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { ArchId, Image, Model, ModelId, Resource } from '../../lib/schema';
import { fileApi } from '../../lib/server/file-data';
import { asArray, getColorMode, getPreviewImage, joinListString } from '../../lib/util';

interface Params extends ParsedUrlQuery {
    id: ModelId;
}
interface Props {
    modelId: ModelId;
    modelData: Model;
}

const extraModelProperties = [
    { key: 'trainingIterations', type: 'number' },
    { key: 'trainingEpochs', type: 'number' },
    { key: 'trainingBatchSize', type: 'number' },
    { key: 'trainingHRSize', type: 'number' },
    { key: 'trainingOTF', type: 'string' },
    { key: 'dataset', type: 'string' },
    { key: 'datasetSize', type: 'number' },
    { key: 'pretrainedModelG', type: 'string' },
    { key: 'pretrainedModelD', type: 'string' },
];

const renderTags = (tags: string[], editMode: boolean, onChange: (newTags: string[]) => void) => (
    <div className="flex flex-row flex-wrap gap-2">
        {tags.map((tag, index) => {
            return (
                <span
                    className="inline-flex items-center rounded-full bg-fade-100 px-2.5 py-0.5 text-xs font-medium text-fade-800 dark:bg-fade-800 dark:text-fade-200"
                    key={tag}
                >
                    <EditableLabel
                        readonly={!editMode}
                        text={tag}
                        onChange={(text) => {
                            const newTags = [...tags];
                            newTags[index] = text;
                            onChange(newTags);
                        }}
                    />
                    {editMode && (
                        <button
                            className="ml-1.5"
                            onClick={() => {
                                const newTags = [...tags];
                                newTags.splice(index, 1);
                                onChange(newTags);
                            }}
                        >
                            <BsFillTrashFill />
                        </button>
                    )}
                </span>
            );
        })}
        {editMode && (
            <button
                onClick={() => {
                    onChange([...tags, '']);
                }}
            >
                <BsPlusLg />
            </button>
        )}
    </div>
);

const editableMetadata = (editMode: boolean, value: string | number, onChange: (newValue: string | number) => void) => {
    switch (typeof value) {
        case 'string':
            return (
                <EditableLabel
                    readonly={!editMode}
                    text={value}
                    onChange={onChange}
                />
            );
        case 'number':
            return (
                <EditableIntegerLabel
                    readonly={!editMode}
                    value={value}
                    onChange={onChange}
                />
            );
        default:
            return <span>{value}</span>;
    }
};

export default function Page({ modelId, modelData }: Props) {
    const { archData } = useArchitectures();
    const { userData } = useUsers();

    const { webApi, editMode } = useWebApi();
    const model = useCurrent(webApi, 'model', modelId, modelData);

    const authors = asArray(model.author);
    const authorsJoined = joinListString(authors.map((userId) => userData.get(userId)?.name ?? 'unknown'));

    const archName = archData.get(model.architecture)?.name ?? 'unknown';

    const { updateModelProperty } = useUpdateModel(webApi, modelId);

    const firstImageValue = model.images[0] as Image | undefined;
    const previewImage = firstImageValue ? getPreviewImage(firstImageValue) : undefined;

    let missingMetadataEntries: [string, string | number][] = [];
    if (editMode) {
        const missingMetadataKeys = extraModelProperties.filter(({ key }) => model[key as keyof Model] === undefined);
        missingMetadataEntries = missingMetadataKeys.map(({ key, type }) => [key, type === 'number' ? 0 : '']);
    }

    return (
        <>
            <HeadCommon
                description={`A ${model.scale}x ${archName} model by ${authorsJoined}.`}
                image={previewImage}
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
                        <ImageCarousel
                            images={model.images}
                            readonly={!editMode}
                            onChange={(images) => updateModelProperty('images', images)}
                        />
                        <div className="relative">
                            <div>
                                <h1 className="m-0">
                                    <EditableLabel
                                        readonly={!editMode}
                                        text={modelData.name}
                                        onChange={(value) => updateModelProperty('name', value)}
                                    />
                                </h1>
                                <div>
                                    <EditableUsers
                                        readonly={!editMode}
                                        users={authors}
                                        onChange={(users) => {
                                            updateModelProperty('author', users.length === 1 ? users[0] : users);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="mt-2 text-xs">
                                <EditableTags
                                    readonly={!editMode}
                                    tags={model.tags}
                                    onChange={(tags) => updateModelProperty('tags', tags)}
                                />
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
                            {model.resources.map((resource, index) => {
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
                                            <>
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
                                                <EditResourceButton
                                                    resource={resource}
                                                    onChange={(newResource) => {
                                                        const newResources = model.resources;
                                                        newResources[index] = newResource;
                                                        updateModelProperty('resources', newResources);
                                                    }}
                                                >
                                                    <AiFillEdit />
                                                </EditResourceButton>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                            {editMode && (
                                <EditResourceButton
                                    onChange={(newResource) => {
                                        const newResources = [...model.resources, newResource];
                                        updateModelProperty('resources', newResources);
                                    }}
                                >
                                    Add Resource
                                </EditResourceButton>
                            )}
                        </div>

                        <div className="relative table-auto rounded-lg border-fade-700">
                            <table className="w-full border-collapse rounded-lg border-fade-700 text-left text-sm text-gray-500 dark:text-gray-400 ">
                                <tbody className="rounded-lg">
                                    <tr>
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
                                    <tr>
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
                                        <tr>
                                            <th
                                                className="whitespace-nowrap bg-fade-100 px-6 py-4 font-medium text-fade-900 dark:bg-fade-800 dark:text-white"
                                                scope="row"
                                            >
                                                Size
                                            </th>
                                            <td className="px-6 py-4">
                                                {renderTags(model.size, editMode, (newTags: string[]) => {
                                                    updateModelProperty('size', newTags);
                                                })}
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
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
                                        .concat(missingMetadataEntries)
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
                                                    'pretrainedModelD',
                                                    // Definitely don't want to show this
                                                    'images',
                                                ].includes(key)
                                        )
                                        .filter(([_key, value]) => (editMode ? true : !!value))
                                        .sort()
                                        .map(([key, value]) => {
                                            return (
                                                <tr key={key}>
                                                    <th
                                                        className="whitespace-nowrap bg-fade-100 px-6 py-4 font-medium capitalize text-fade-900 dark:bg-fade-800 dark:text-white"
                                                        scope="row"
                                                    >
                                                        {key}
                                                    </th>
                                                    <td className="px-6 py-4">
                                                        {Array.isArray(value)
                                                            ? renderTags(
                                                                  value.map((v) => String(v)),
                                                                  editMode,
                                                                  (newTags) => {
                                                                      updateModelProperty(key as keyof Model, newTags);
                                                                  }
                                                              )
                                                            : editableMetadata(
                                                                  editMode,
                                                                  value as string | number,
                                                                  (newValue) => {
                                                                      updateModelProperty(key as keyof Model, newValue);
                                                                  }
                                                              )}
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
