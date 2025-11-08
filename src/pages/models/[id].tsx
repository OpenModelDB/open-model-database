import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import React, { ReactNode, useCallback, useMemo } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { BsFillTrashFill, BsPlusLg } from 'react-icons/bs';
import { DownloadButton } from '../../elements/components/download-button';
import { EditResourceButton } from '../../elements/components/download-button-edit-popover';
import { EditableIntegerLabel, EditableLabel } from '../../elements/components/editable-label';
import { EditableMarkdownContainer } from '../../elements/components/editable-markdown';
import { EditableTags, SmallTag } from '../../elements/components/editable-tags';
import { EditableUsers } from '../../elements/components/editable-users';
import { ImageCarousel } from '../../elements/components/image-carousel';
import { LicenseAttributes } from '../../elements/components/license-attributes';
import { Link } from '../../elements/components/link';
import { ModelCardGrid } from '../../elements/components/model-card-grid';
import { Switch } from '../../elements/components/switch';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useArchitectures } from '../../lib/hooks/use-architectures';
import { useCollections } from '../../lib/hooks/use-collections';
import { useModels } from '../../lib/hooks/use-models';
import { UpdateModelPropertyFn, useUpdateModel } from '../../lib/hooks/use-update-model';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { KNOWN_LICENSES } from '../../lib/license';
import { MODEL_PROPS, ModelProp } from '../../lib/model-props';
import { ArchId, Collection, CollectionId, Model, ModelId, Resource, TagId } from '../../lib/schema';
import { getCachedCollections, getCachedModels } from '../../lib/server/cached';
import { fileApi } from '../../lib/server/file-data';
import { getSimilarModels } from '../../lib/similar';
import { IS_DEPLOYED } from '../../lib/site-data';
import { STATIC_ARCH_DATA } from '../../lib/static-data';
import { getTextDescription } from '../../lib/text-description';
import { EMPTY_ARRAY, asArray, getColorMode, getPreviewImage, joinListString, typedKeys } from '../../lib/util';
import { validateModel } from '../../lib/validate-model';

const MAX_SIMILAR_MODELS = 12 * 2;

interface Params extends ParsedUrlQuery {
    id: ModelId;
}
interface Props {
    modelId: ModelId;
    staticSimilar: ModelId[];
    staticModelData: Record<ModelId, Model>;
    staticCollectionData: Record<CollectionId, Collection>;
    editModeOverride?: boolean;
}

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
                            if (text) {
                                newTags[index] = text;
                            } else {
                                // remove empty tags
                                newTags.splice(index, 1);
                            }
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
    value: unknown,
    prop: ModelProp,
    onChange: (newValue: Model[keyof Model]) => void
) => {
    switch (prop.type) {
        case 'string': {
            return (
                <EditableLabel
                    className="break-words"
                    readonly={!editMode}
                    text={String(value ?? '')}
                    onChange={(newValue) => {
                        if (!newValue && prop.optional) {
                            onChange(undefined);
                        } else {
                            onChange(newValue);
                        }
                    }}
                />
            );
        }
        case 'number': {
            let nullValue: number;
            if (prop.optional) {
                nullValue = prop.min !== undefined ? prop.min - 1 : 0;
            } else {
                nullValue = prop.min ?? 0;
            }
            const min = prop.min === undefined ? undefined : Math.min(prop.min, nullValue);

            return (
                <EditableIntegerLabel
                    max={prop.max}
                    min={min}
                    readonly={!editMode}
                    value={Number(value ?? nullValue)}
                    onChange={(newValue) => {
                        if (newValue === nullValue && prop.optional) {
                            onChange(undefined);
                        } else {
                            onChange(newValue);
                        }
                    }}
                />
            );
        }
        case 'boolean': {
            if (!editMode) {
                return <span>{value ? 'Yes' : 'No'}</span>;
            }
            if (prop.optional) {
                return (
                    <span>
                        <span
                            className={`${value === true ? 'font-bold underline ' : ''}cursor-pointer hover:underline`}
                            onClick={() => onChange(true)}
                        >
                            Yes
                        </span>
                        {' / '}
                        <span
                            className={`${value === false ? 'font-bold underline ' : ''}cursor-pointer hover:underline`}
                            onClick={() => onChange(false)}
                        >
                            No
                        </span>
                        {' / '}
                        <span
                            className={`${value == null ? 'font-bold underline ' : ''}cursor-pointer hover:underline`}
                            onClick={() => onChange(undefined)}
                        >
                            Unknown
                        </span>
                    </span>
                );
            }
            return (
                <Switch
                    value={Boolean(value ?? false)}
                    onChange={onChange}
                />
            );
        }
        default:
            return <span>{String(value)}</span>;
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
        return model.license ? (
            <>
                {model.license}
                <LicenseAttributes license={model.license} />
            </>
        ) : (
            <>None</>
        );
    }

    return (
        <>
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
            {model.license && <LicenseAttributes license={model.license} />}
        </>
    );
}

function isTrue<T>(value: T | null | undefined | false | '' | 0): value is T {
    return Boolean(value);
}

function MetadataTable({ rows }: { rows: (false | null | undefined | readonly [string, ReactNode])[] }) {
    const filteredRows = rows.filter(isTrue);
    return (
        <div className="overflow-hidden rounded-lg border border-fade-200 bg-white dark:border-fade-700 dark:bg-fade-900">
            <table className="w-full border-collapse text-left text-sm text-gray-700 dark:text-gray-400">
                <tbody>
                    {filteredRows.map((row, i) => {
                        const [label, value] = row;
                        const extraPadding = i === 0 ? 'pt-3' : i === filteredRows.length - 1 ? 'pb-3' : '';
                        const isLastRow = i === filteredRows.length - 1;
                        return (
                            <tr
                                className={!isLastRow ? 'border-b border-fade-200 dark:border-fade-700' : ''}
                                key={i}
                            >
                                <th
                                    className={`${extraPadding} whitespace-nowrap bg-fade-100 px-4 py-2 text-right align-top font-medium text-fade-900 dark:bg-fade-800 dark:text-white`}
                                    scope="row"
                                >
                                    {label}
                                </th>
                                <td className={`${extraPadding} px-4 py-2`}>{value}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
export default function Page({
    modelId,
    staticSimilar,
    staticModelData,
    staticCollectionData,
    editModeOverride,
}: Props) {
    const { archData } = useArchitectures();
    const { userData } = useUsers();
    const { modelData } = useModels(staticModelData);
    const { collectionData } = useCollections(staticCollectionData);

    const { webApi, editMode } = useWebApi(editModeOverride);
    const model = modelData.get(modelId) || staticModelData[modelId];

    const authors = asArray(model.author);
    const authorsJoined = joinListString(authors.map((userId) => userData.get(userId)?.name ?? 'unknown'));
    const title = (model.scale ? `${model.scale}x ` : '') + model.name;

    const archName = archData.get(model.architecture)?.name ?? 'unknown';

    const { updateModelProperty } = useUpdateModel(webApi, modelId);

    const previewImage = getPreviewImage(model);

    const [similar, similarWithScores] = useMemo(() => {
        if (modelData.size > Object.keys(staticModelData).length) {
            const withScores = getSimilarModels(modelId, modelData, archData).slice(0, MAX_SIMILAR_MODELS);
            return [withScores.map(({ id }) => id), withScores];
        } else {
            return [staticSimilar, []];
        }
    }, [staticSimilar, staticModelData, modelData, modelId, archData]);

    const collections = useMemo(() => {
        return [...collectionData].filter(([, collection]) => collection.models.includes(modelId)).map(([id]) => id);
    }, [modelId, collectionData]);

    const router = useRouter();

    const runModelValidation = useCallback(async () => {
        if (!webApi) {
            throw new Error('API not available');
        }
        const modelData = await webApi.models.getAll();
        const archData = await webApi.architectures.getAll();
        const tagData = await webApi.tags.getAll();
        const userData = await webApi.users.getAll();
        const realModelId =
            modelId === 'OMDB_ADDMODEL_DUMMY' ? (sessionStorage.getItem('dummy-modelId') as ModelId) : modelId;
        return validateModel(model, realModelId, modelData, archData, tagData, userData, webApi);
    }, [model, modelId, webApi]);

    return (
        <>
            <HeadCommon
                description={`A ${model.scale}x ${archName} model by ${authorsJoined}.`}
                image={previewImage}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'SoftwareApplication',
                    applicationCategory: 'Multimedia',
                    applicationSubCategory: 'AI Model',
                    author: authors.length === 1 ? { '@type': 'Person', name: authorsJoined } : authorsJoined,
                    datePublished: model.date ? new Date(model.date).toISOString() : undefined,
                    image: previewImage,
                    name: title,
                    description: getTextDescription(model),
                }}
                title={title}
            />
            {/* Only use a large card when we have an image to show */}
            {previewImage && (
                <Head>
                    <meta
                        content="summary_large_image"
                        name="twitter:card"
                    />
                </Head>
            )}
            <PageContainer searchBar>
                {/* Full-width preview at top (YouTube-style) */}
                <div className="mb-6 w-full">
                    <ImageCarousel
                        images={model.images}
                        indexKey={modelId}
                        readonly={!editMode}
                        onChange={(images) => updateModelProperty('images', images)}
                    />
                </div>

                {/* Two columns: Description and Sidebar */}
                <div className="grid h-full w-full gap-6 pb-4 sm:grid-cols-1 lg:grid-cols-3">
                    {/* Left column: Description */}
                    <div className="relative flex h-full flex-col gap-4 sm:col-span-1 lg:col-span-2">
                        <div className="relative">
                            <div>
                                {editMode && (
                                    <div className="flex items-end justify-end gap-2 text-right">
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this model?')) {
                                                    webApi.models.delete([modelId]).then(
                                                        () => {
                                                            router.push('/').catch(console.error);
                                                        },
                                                        (e) => {
                                                            console.error(e);
                                                            alert(`Error deleting model: ${String(e)}`);
                                                        }
                                                    );
                                                }
                                            }}
                                        >
                                            Delete Model
                                        </button>
                                        {IS_DEPLOYED && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard
                                                            .readText()
                                                            .then((text) => {
                                                                try {
                                                                    // in the future we might want to actually validate the model
                                                                    const model = JSON.parse(text) as Model;
                                                                    webApi.models
                                                                        .update([[modelId, model]])
                                                                        .catch(console.error);
                                                                } catch (e) {
                                                                    console.error(e);
                                                                }
                                                            })
                                                            .catch(console.error);
                                                    }}
                                                >
                                                    Load Model from clipboard
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard
                                                            .writeText(JSON.stringify(model, null, 2))
                                                            .catch(console.error);
                                                    }}
                                                >
                                                    Copy Model to clipboard
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        runModelValidation()
                                                            .then((errors) => {
                                                                if (errors.length > 0) {
                                                                    alert(
                                                                        errors.map(({ message }) => message).join('\n')
                                                                    );
                                                                    return;
                                                                }
                                                                const path =
                                                                    'https://github.com/OpenModelDB/open-model-database/issues/new';
                                                                const modelJson = JSON.stringify(model, null, 2);
                                                                const codeBlock = `\`\`\`json\n${modelJson}\n\`\`\``;
                                                                const queryParams = new URLSearchParams({
                                                                    title: `[MODEL ADD REQUEST] ${model.name}`,
                                                                    body: codeBlock,
                                                                    template: 'model-add-request.md',
                                                                });
                                                                const url = `${path}?${queryParams.toString()}`;
                                                                window.open(url, '_blank');
                                                            })
                                                            .catch(console.error);
                                                    }}
                                                >
                                                    Submit Model as GitHub Issue
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
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
                            <div className="mt-2 flex gap-2 text-xs">
                                {editMode && <div>tags:</div>}
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
                    {/* Right column: Sidebar */}
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
                                            updateModelProperty('size', newTags.length === 0 ? null : newTags);
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
                                    ...typedKeys(MODEL_PROPS)
                                        .filter((key) => {
                                            return [
                                                'date',
                                                'dataset',
                                                'datasetSize',
                                                'trainingIterations',
                                                'trainingEpochs',
                                                'trainingBatchSize',
                                                'trainingHRSize',
                                                'trainingOTF',
                                            ].includes(key);
                                        })
                                        .map((key) => [key, model[key]] as const)
                                        .filter(([, value]) => editMode || value != null)
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
                                                    : editableMetadata(editMode, value, prop, (newValue) => {
                                                          updateModelProperty(key, newValue);
                                                      }),
                                            ] as const;
                                        }),
                                    /* eslint-enable react/jsx-key */
                                ]}
                            />
                        </div>
                    </div>
                </div>
                {editMode && (
                    <div>
                        <button
                            onClick={() => {
                                const name = prompt('Enter the name of the new collection');
                                if (!name) return;

                                const collectionId = `c-${name
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, '-')}` as CollectionId;

                                webApi.collections
                                    .getIds()
                                    .then(async (ids) => {
                                        if (ids.includes(collectionId)) {
                                            alert('Collection already exists');
                                            return;
                                        }

                                        const newCollection: Collection = {
                                            name,
                                            author: model.author,
                                            description: '',
                                            models: [modelId],
                                        };
                                        await webApi.collections.update([[collectionId, newCollection]]);
                                    })
                                    .catch(console.error);
                            }}
                        >
                            Create a new collection with this model
                        </button>
                    </div>
                )}
                {collections.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold">Collections that include this model</h2>
                        <ModelCardGrid
                            collectionData={collectionData}
                            modelData={modelData}
                            models={collections}
                        />
                    </div>
                )}
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
    const collectionData = await getCachedCollections();
    const archData = STATIC_ARCH_DATA;

    const similar = getSimilarModels(modelId, modelData, archData)
        .slice(0, MAX_SIMILAR_MODELS)
        .map(({ id }) => id);

    const collections = [...collectionData].filter(([, collection]) => collection.models.includes(modelId));

    const relevantIds = [
        ...new Set([modelId, ...similar, ...collections.flatMap(([, collection]) => collection.models)]),
    ].sort();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const relevantModelData = Object.fromEntries(relevantIds.map((id) => [id, modelData.get(id)!]));

    return {
        props: {
            modelId,
            staticSimilar: similar,
            staticModelData: relevantModelData,
            staticCollectionData: Object.fromEntries(collections),
        },
    };
};
