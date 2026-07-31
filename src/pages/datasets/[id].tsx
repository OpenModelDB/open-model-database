import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import React, { ReactNode, useCallback, useMemo } from 'react';
import { BsFillTrashFill } from 'react-icons/bs';
import { DatasetDownloadButton } from '../../elements/components/dataset-download-button';
import { EditableLabel } from '../../elements/components/editable-label';
import { EditableMarkdownContainer } from '../../elements/components/editable-markdown';
import { EditableTags } from '../../elements/components/editable-tags';
import { EditableUsers } from '../../elements/components/editable-users';
import { ImageCarousel } from '../../elements/components/image-carousel';
import { LicenseAttributes } from '../../elements/components/license-attributes';
import { Link } from '../../elements/components/link';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useDatasets } from '../../lib/hooks/use-datasets';
import { useUpdateDataset } from '../../lib/hooks/use-update-dataset';
import { useUsers } from '../../lib/hooks/use-users';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { KNOWN_LICENSES } from '../../lib/license';
import { Dataset, DatasetId } from '../../lib/schema';
import { getCachedDatasets } from '../../lib/server/cached';
import { fileApi } from '../../lib/server/file-data';
import { IS_DEPLOYED } from '../../lib/site-data';
import { EMPTY_ARRAY, asArray } from '../../lib/util';
import { validateDataset } from '../../lib/validate-dataset';

interface Params extends ParsedUrlQuery {
    id: DatasetId;
}

interface Props {
    datasetId: DatasetId;
    staticDatasetData: Record<DatasetId, Dataset>;
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

function LicenseProp({
    dataset,
    updateDatasetProperty,
    editMode,
}: {
    dataset: Dataset;
    updateDatasetProperty: ReturnType<typeof useUpdateDataset>['updateDatasetProperty'];
    editMode: boolean;
}) {
    if (!editMode) {
        return dataset.license ? (
            <>
                {dataset.license}
                <LicenseAttributes license={dataset.license} />
            </>
        ) : (
            <>None</>
        );
    }

    return (
        <>
            <select
                className="w-full rounded border-gray-300 text-sm dark:border-fade-700 dark:bg-fade-800"
                value={dataset.license || ''}
                onChange={(e) => {
                    updateDatasetProperty('license', (e.target.value || null) as never);
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
            {dataset.license && <LicenseAttributes license={dataset.license} />}
        </>
    );
}

function PageContent({ datasetId, staticDatasetData }: Props) {
    const { datasetData } = useDatasets(staticDatasetData);
    const { userData } = useUsers();
    const router = useRouter();

    const realDatasetId =
        datasetId === 'OMDB_ADDDATASET_DUMMY' ? (sessionStorage.getItem('dummy-datasetId') as DatasetId) : datasetId;

    const dataset = datasetData.get(realDatasetId);

    const { webApi, editMode } = useWebApi(IS_DEPLOYED);
    const { updateDatasetProperty } = useUpdateDataset(webApi, realDatasetId);

    const authors = useMemo(() => {
        if (!dataset) return [];
        return asArray(dataset.author);
    }, [dataset]);
    const authorsJoined = useMemo(
        () => authors.map((userId) => userData.get(userId)?.name ?? userId).join(', '),
        [authors, userData]
    );

    const title = dataset ? dataset.name : String(realDatasetId);
    const getDatasetPreviewImage = (d: Dataset) => {
        if (!d.images || d.images.length === 0) return undefined;
        const image = d.images[0];
        return image.type === 'paired' ? image.SR : image.url;
    };
    const previewImage = dataset ? getDatasetPreviewImage(dataset) : undefined;

    const handleDelete = useCallback(async () => {
        if (!webApi || !dataset) return;
        if (confirm(`Are you sure you want to delete dataset "${title}"?`)) {
            try {
                await webApi.datasets.delete([realDatasetId]);
                await router.push('/datasets');
            } catch (e) {
                console.error(e);
                alert(`Error deleting dataset: ${String(e)}`);
            }
        }
    }, [webApi, dataset, realDatasetId, title, router]);

    const runDatasetValidation = useCallback(() => {
        if (!webApi || !dataset) {
            throw new Error('API or dataset not available');
        }
        return validateDataset(dataset, realDatasetId, webApi);
    }, [dataset, realDatasetId, webApi]);

    if (!dataset) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-2xl font-bold">Dataset not found</h2>
                <Link
                    className="mt-4 text-accent-600 hover:underline"
                    href="/datasets"
                >
                    Back to datasets
                </Link>
            </div>
        );
    }

    return (
        <>
            <HeadCommon
                description={`Dataset: ${title} by ${authorsJoined}.`}
                image={previewImage}
                title={`${title} - OpenModelDB`}
            />
            {previewImage && (
                <Head>
                    <meta
                        content="summary_large_image"
                        name="twitter:card"
                    />
                </Head>
            )}

            <PageContainer>
                {/* Image carousel */}
                <div className="mb-6 w-full">
                    <ImageCarousel
                        images={dataset.images || EMPTY_ARRAY}
                        indexKey={realDatasetId}
                        readonly={!editMode}
                        onChange={(images) => updateDatasetProperty('images', images)}
                    />
                </div>

                <div className="grid h-full w-full gap-6 pb-4 sm:grid-cols-1 lg:grid-cols-3">
                    {/* Left Column */}
                    <div className="relative flex h-full flex-col gap-4 sm:col-span-1 lg:col-span-2">
                        <div className="relative">
                            <div>
                                {editMode && (
                                    <div className="flex items-end justify-end gap-2 text-right">
                                        <button
                                            onClick={() => {
                                                handleDelete().catch(console.error);
                                            }}
                                        >
                                            Delete Dataset
                                        </button>
                                        {IS_DEPLOYED && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard
                                                            .readText()
                                                            .then((text) => {
                                                                try {
                                                                    const parsedDataset = JSON.parse(text) as Dataset;
                                                                    webApi.datasets
                                                                        .update([[realDatasetId, parsedDataset]])
                                                                        .catch(console.error);
                                                                } catch (e) {
                                                                    console.error(e);
                                                                }
                                                            })
                                                            .catch(console.error);
                                                    }}
                                                >
                                                    Load Dataset from clipboard
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard
                                                            .writeText(JSON.stringify(dataset, null, 2))
                                                            .catch(console.error);
                                                    }}
                                                >
                                                    Copy Dataset to clipboard
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        try {
                                                            const errors = runDatasetValidation();
                                                            if (errors.length > 0) {
                                                                alert(errors.map(({ message }) => message).join('\n'));
                                                                return;
                                                            }
                                                            const path =
                                                                'https://github.com/OpenModelDB/open-model-database/issues/new';
                                                            const datasetJson = JSON.stringify(dataset, null, 2);
                                                            const codeBlock = `\`\`\`json\n${datasetJson}\n\`\`\``;
                                                            const queryParams = new URLSearchParams({
                                                                title: `[DATASET ADD REQUEST] ${dataset.name}`,
                                                                body: codeBlock,
                                                                template: 'dataset-add-request.md',
                                                            });
                                                            const url = `${path}?${queryParams.toString()}`;
                                                            window.open(url, '_blank');
                                                        } catch (e) {
                                                            console.error(e);
                                                        }
                                                    }}
                                                >
                                                    Submit Dataset as GitHub Issue
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                                <h1 className="mt-0 mb-1 text-3xl font-extrabold leading-10">
                                    <EditableLabel
                                        readonly={!editMode}
                                        text={dataset.name}
                                        onChange={(value) => updateDatasetProperty('name', value)}
                                    />
                                </h1>
                                <div>
                                    <EditableUsers
                                        readonly={!editMode}
                                        users={authors}
                                        onChange={(users) => {
                                            updateDatasetProperty('author', users.length === 1 ? users[0] : users);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="mt-2 flex gap-2 text-xs">
                                {editMode && <div>tags:</div>}
                                <EditableTags
                                    context="datasets"
                                    readonly={!editMode}
                                    tags={dataset.tags}
                                    onChange={(tags) => updateDatasetProperty('tags', tags)}
                                />
                            </div>
                            <div className="py-4">
                                <EditableMarkdownContainer
                                    markdown={dataset.description}
                                    readonly={!editMode}
                                    onChange={(value) => updateDatasetProperty('description', value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="col-span-1 w-full">
                        <div className="mb-2 flex w-full flex-col gap-2">
                            {dataset.url && (
                                <div className="flex w-full flex-row gap-2">
                                    <DatasetDownloadButton
                                        readonly={!editMode}
                                        url={dataset.url}
                                        onChange={(newUrl) => updateDatasetProperty('url', newUrl)}
                                    />
                                    {editMode && (
                                        <button
                                            className="cursor-pointer"
                                            onClick={() => {
                                                updateDatasetProperty('url', '');
                                            }}
                                        >
                                            <BsFillTrashFill />
                                        </button>
                                    )}
                                </div>
                            )}
                            {editMode && !dataset.url && (
                                <button
                                    className="cursor-pointer rounded border border-dashed border-gray-400 p-4 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                                    onClick={() => {
                                        const newUrl = prompt('Enter dataset URL');
                                        if (newUrl) {
                                            updateDatasetProperty('url', newUrl);
                                        }
                                    }}
                                >
                                    + Add URL
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <MetadataTable
                                rows={[
                                    [
                                        'License',
                                        <LicenseProp
                                            dataset={dataset}
                                            editMode={editMode}
                                            key="license"
                                            updateDatasetProperty={updateDatasetProperty}
                                        />,
                                    ],
                                    [
                                        'Added on',
                                        <EditableLabel
                                            key="date"
                                            readonly={!editMode}
                                            text={dataset.date || ''}
                                            onChange={(value) => updateDatasetProperty('date', value || '')}
                                        />,
                                    ],
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
}

export default function Page({ datasetId, staticDatasetData }: Props) {
    return (
        <PageContainer wrapper>
            <PageContent
                datasetId={datasetId}
                staticDatasetData={staticDatasetData}
            />
        </PageContainer>
    );
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
    const datasetIds = await fileApi.datasets.getIds();

    return {
        paths: datasetIds.map((id) => ({ params: { id } })),
        fallback: false,
    };
};

export const getStaticProps: GetStaticProps<Props, Params> = async (context) => {
    const datasetId = context.params?.id;
    if (!datasetId) throw new Error("Missing path param 'id'");

    const datasetData = await getCachedDatasets();
    const relevantIds = [datasetId].sort();
    const relevantDatasetData: Record<DatasetId, Dataset> = {};
    for (const id of relevantIds) {
        const dataset = datasetData.get(id);
        if (dataset) {
            relevantDatasetData[id] = dataset;
        }
    }

    return {
        props: {
            datasetId,
            staticDatasetData: relevantDatasetData,
        },
    };
};
