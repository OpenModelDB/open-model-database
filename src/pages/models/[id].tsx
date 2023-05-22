import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { ParsedUrlQuery } from 'querystring';
import React, { ReactNode, useMemo } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { BsFillTrashFill, BsPlusLg } from 'react-icons/bs';
import { DownloadButton } from '../../elements/components/download-button';
import { EditResourceButton } from '../../elements/components/download-button-edit-popover';
import { EditableIntegerLabel, EditableLabel } from '../../elements/components/editable-label';
import { EditableMarkdownContainer } from '../../elements/components/editable-markdown';
import { EditableTags, SmallTag } from '../../elements/components/editable-tags';
import { EditableUsers } from '../../elements/components/editable-users';
import { ImageCarousel } from '../../elements/components/image-carousel';
import { Link } from '../../elements/components/link';
import { ModelCardGrid } from '../../elements/components/model-card-grid';
import { Switch } from '../../elements/components/switch';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useModels } from '../../lib/hooks/use-models';
import { UpdateModelPropertyFn, useUpdateModel } from '../../lib/hooks/use-update-model';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { KNOWN_LICENSES } from '../../lib/license';
import { MODEL_PROPS } from '../../lib/model-props';
import { ArchId, Image, Model, ModelId, Resource, TagId } from '../../lib/schema';
import { getCachedModels } from '../../lib/server/cached-models';
import { fileApi } from '../../lib/server/file-data';
import { getSimilarModels } from '../../lib/similar';
import { STATIC_ARCH_DATA } from '../../lib/static-data';
import { EMPTY_ARRAY, asArray, getColorMode, getPreviewImage, joinListString, typedEntries } from '../../lib/util';

const MAX_SIMILAR_MODELS = 12 * 2;

interface Params extends ParsedUrlQuery {
    id: ModelId;
}
interface Props {
    modelId: ModelId;
    similar: ModelId[];
    modelData: Record<ModelId, Model>;
}

const extraModelProperties: { key: keyof Model; type: 'number' | 'string' | 'boolean' }[] = [
    { key: 'trainingIterations', type: 'number' },
    { key: 'trainingEpochs', type: 'number' },
    { key: 'trainingBatchSize', type: 'number' },
    { key: 'trainingHRSize', type: 'number' },
    { key: 'trainingOTF', type: 'boolean' },
    { key: 'dataset', type: 'string' },
    { key: 'datasetSize', type: 'number' },
    { key: 'pretrainedModelG', type: 'string' },
    { key: 'pretrainedModelD', type: 'string' },
];

const defaultVals = {
    number: 0,
    string: '',
    boolean: false,
} as const;

const renderTags = (tags: readonly string[], editMode: boolean, onChange: (newTags: string[]) => void) => (
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

const editableMetadata = (
    editMode: boolean,
    value: string | number | boolean,
    onChange: (newValue: string | number | boolean) => void
) => {
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
        case 'boolean':
            return editMode ? (
                <Switch
                    value={value}
                    onChange={onChange}
                />
            ) : (
                <span>{value ? 'Yes' : 'No'}</span>
            );

        default:
            return <span>{value}</span>;
    }
};

interface PropertyProps {
    model: Model;
    updateModelProperty: UpdateModelPropertyFn;
    editMode: boolean;
}
function ArchitectureProp({ model, updateModelProperty, editMode }: PropertyProps) {
    const { archData } = useArchitectures();
    const archName = archData.get(model.architecture)?.name ?? 'unknown';

    return editMode ? (
        <>
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

            <div className="my-1">
                <Link
                    className="text-sm opacity-80 hover:opacity-100"
                    href="/architectures"
                >
                    <AiFillEdit />
                    Edit Architectures
                </Link>
            </div>
        </>
    ) : (
        <SmallTag
            name={archName}
            tagId={`arch:${model.architecture}` as TagId}
        />
    );
}
function ScaleProp({ model, updateModelProperty, editMode }: PropertyProps) {
    return editMode ? (
        <EditableIntegerLabel
            max={16}
            min={1}
            readonly={!editMode}
            value={model.scale}
            onChange={(value) => updateModelProperty('scale', value)}
        />
    ) : (
        <SmallTag
            name={`${model.scale}x`}
            tagId={`scale:${model.scale}` as TagId}
        />
    );
}
function ColorModeProp({ model, updateModelProperty, editMode }: PropertyProps) {
    const name =
        model.inputChannels === model.outputChannels
            ? String(getColorMode(model.inputChannels))
            : `${getColorMode(model.inputChannels)} → ${getColorMode(model.outputChannels)}`;

    const tagId =
        model.inputChannels === model.outputChannels
            ? `color:${model.inputChannels}`
            : `color:${model.inputChannels}-${model.outputChannels}`;

    return (
        <>
            <div>
                <SmallTag
                    name={name}
                    tagId={tagId as TagId}
                />
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
                            onChange={(value) => updateModelProperty('inputChannels', value)}
                        />
                    </div>
                    <div>
                        Output:{' '}
                        <EditableIntegerLabel
                            max={4}
                            min={0}
                            readonly={!editMode}
                            value={model.outputChannels}
                            onChange={(value) => updateModelProperty('outputChannels', value)}
                        />
                    </div>
                </>
            )}
        </>
    );
}
function LicenseProp({ model, updateModelProperty, editMode }: PropertyProps) {
    if (!editMode) {
        return <>{model.license || 'None'}</>;
    }

    return (
        <select
            value={model.license || ''}
            onChange={(e) => {
                updateModelProperty('license', (e.target.value || null) as never);
            }}
        >
            <option value="">None</option>
            {Object.entries(KNOWN_LICENSES).map(([key]) => (
                <option
                    key={key}
                    value={key}
                >
                    {key}
                </option>
            ))}
        </select>
    );
}

function MetadataTable({ rows }: { rows: (false | null | undefined | readonly [string, ReactNode])[] }) {
    return (
        <table className="w-full border-collapse text-left text-sm text-gray-500 dark:text-gray-400 ">
            <tbody>
                {rows.map((row, i) => {
                    if (!row) return null;

                    const [label, value] = row;
                    return (
                        <tr key={i}>
                            <th
                                className="bg-fade-100 px-6 py-4 font-medium text-fade-900 dark:bg-fade-800 dark:text-white sm:whitespace-nowrap"
                                scope="row"
                            >
                                {label}
                            </th>
                            <td className="px-6 py-4">{value}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
export default function Page({ modelId, similar: staticSimilar, modelData: staticModelData }: Props) {
    const { archData } = useArchitectures();
    const { userData } = useUsers();
    const { modelData } = useModels(staticModelData);

    const { webApi, editMode } = useWebApi();
    const model = modelData.get(modelId) || staticModelData[modelId];

    const authors = asArray(model.author);
    const authorsJoined = joinListString(authors.map((userId) => userData.get(userId)?.name ?? 'unknown'));

    const archName = archData.get(model.architecture)?.name ?? 'unknown';

    const { updateModelProperty } = useUpdateModel(webApi, modelId);

    const firstImageValue = model.images[0] as Image | undefined;
    const previewImage = firstImageValue ? getPreviewImage(firstImageValue) : undefined;

    let missingMetadataEntries: [keyof Model, string | number | boolean][] = [];
    if (editMode) {
        const missingMetadataKeys = extraModelProperties.filter(({ key }) => model[key] === undefined);
        missingMetadataEntries = missingMetadataKeys.map(({ key, type }) => [key, defaultVals[type]]);
    }

    const [similar, similarWithScores] = useMemo(() => {
        if (modelData.size > Object.keys(staticModelData).length) {
            const withScores = getSimilarModels(modelId, modelData, archData).slice(0, MAX_SIMILAR_MODELS);
            return [withScores.map(({ id }) => id), withScores];
        } else {
            return [staticSimilar, []];
        }
    }, [staticSimilar, staticModelData, modelData, modelId, archData]);

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
                <div className="grid h-full w-full gap-4 pb-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="relative flex h-full flex-col gap-4 sm:col-span-1 lg:col-span-2">
                        <ImageCarousel
                            images={model.images}
                            indexKey={modelId}
                            readonly={!editMode}
                            onChange={(images) => updateModelProperty('images', images)}
                        />
                        <div className="relative">
                            <div>
                                <h1 className="mt-0 mb-1 leading-10">
                                    <EditableLabel
                                        readonly={!editMode}
                                        text={model.name}
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
                                    markdown={model.description}
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
                                                    modelId={modelId}
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
                                    modelId={modelId}
                                    onChange={(newResource) => {
                                        const newResources = [...model.resources, newResource];
                                        updateModelProperty('resources', newResources);
                                    }}
                                >
                                    Add Resource
                                </EditResourceButton>
                            )}
                        </div>

                        <div className="relative">
                            <MetadataTable
                                rows={[
                                    /* eslint-disable react/jsx-key */
                                    [
                                        'Architecture',
                                        <ArchitectureProp
                                            editMode={editMode}
                                            model={model}
                                            updateModelProperty={updateModelProperty}
                                        />,
                                    ],
                                    [
                                        'Scale',
                                        <ScaleProp
                                            editMode={editMode}
                                            model={model}
                                            updateModelProperty={updateModelProperty}
                                        />,
                                    ],
                                    (model.size || editMode) && [
                                        'Size',
                                        renderTags(model.size ?? EMPTY_ARRAY, editMode, (newTags: string[]) => {
                                            updateModelProperty('size', newTags);
                                        }),
                                    ],
                                    [
                                        'Color Mode',
                                        <ColorModeProp
                                            editMode={editMode}
                                            model={model}
                                            updateModelProperty={updateModelProperty}
                                        />,
                                    ],
                                    [
                                        'License',
                                        <LicenseProp
                                            editMode={editMode}
                                            model={model}
                                            updateModelProperty={updateModelProperty}
                                        />,
                                    ],
                                    ...typedEntries(model)
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
                                                    'license',
                                                    // This is just messed up in the data
                                                    'pretrainedModelG',
                                                    'pretrainedModelD',
                                                    // Definitely don't want to show this
                                                    'images',
                                                ].includes(key)
                                        )
                                        .filter(([_key, value]) => (editMode ? true : value != null))
                                        .sort()
                                        .map(([key, value]) => {
                                            const prop = MODEL_PROPS[key];
                                            return [
                                                prop.name,
                                                Array.isArray(value)
                                                    ? renderTags(
                                                          value.map((v) => String(v)),
                                                          editMode,
                                                          (newTags) => {
                                                              updateModelProperty(key, newTags);
                                                          }
                                                      )
                                                    : editableMetadata(
                                                          editMode,
                                                          value as string | number,
                                                          (newValue) => {
                                                              updateModelProperty(key, newValue);
                                                          }
                                                      ),
                                            ] as const;
                                        }),
                                    /* eslint-enable react/jsx-key */
                                ]}
                            />
                        </div>
                    </div>
                </div>
                {similar.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold">Similar Models</h2>
                        {editMode && similarWithScores.length > 0 && (
                            <details>
                                <summary>Show scores</summary>{' '}
                                <pre className="overflow-auto">
                                    {similarWithScores
                                        .map(({ id, score }) => `${score.toFixed(2).padEnd(6)} ${id}`)
                                        .join('\n')}
                                </pre>
                            </details>
                        )}
                        <ModelCardGrid
                            modelData={modelData}
                            models={similar}
                        />
                    </div>
                )}
                <div className="h-6" />
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

    const modelData = await getCachedModels();
    const archData = STATIC_ARCH_DATA;

    const similar = getSimilarModels(modelId, modelData, archData)
        .slice(0, MAX_SIMILAR_MODELS)
        .map(({ id }) => id);

    const relevantIds = [...new Set([modelId, ...similar])].sort();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const relevantModelData = Object.fromEntries(relevantIds.map((id) => [id, modelData.get(id)!]));

    return {
        props: { modelId, similar, modelData: relevantModelData },
    };
};
