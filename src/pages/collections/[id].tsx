import deepEqual from 'fast-deep-equal';
import { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import React, { useEffect, useMemo, useState } from 'react';
import { EditableLabel } from '../../elements/components/editable-label';
import { EditableMarkdownContainer } from '../../elements/components/editable-markdown';
import { ModelCardGrid } from '../../elements/components/model-card-grid';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useCollections } from '../../lib/hooks/use-collections';
import { useModels } from '../../lib/hooks/use-models';
import { useWebApi } from '../../lib/hooks/use-web-api';
import { Collection, CollectionId, Model, ModelId } from '../../lib/schema';
import { getCachedCollections, getCachedModels } from '../../lib/server/cached';
import { fileApi } from '../../lib/server/file-data';

interface Params extends ParsedUrlQuery {
    id: CollectionId;
}
interface Props {
    collectionId: CollectionId;
    staticCollectionData: Record<CollectionId, Collection>;
    staticModelData: Record<ModelId, Model>;
}

export default function Page({ collectionId, staticCollectionData, staticModelData }: Props) {
    const { modelData } = useModels(staticModelData);
    const { collectionData } = useCollections(staticCollectionData);

    const { webApi, editMode } = useWebApi();
    const collection = collectionData.get(collectionId) || staticCollectionData[collectionId];

    const [modelsText, setModelsText] = useState(() => collection.models.join('\n'));

    const parsedModels = useMemo(() => {
        const models: ModelId[] = [];
        const invalid: string[] = [];

        for (const line of modelsText.split('\n')) {
            const id = line.trim();
            if (!id) continue;

            if (modelData.has(id as ModelId)) {
                models.push(id as ModelId);
            } else {
                invalid.push(id);
            }
        }

        return { models: [...new Set(models)], invalid };
    }, [modelsText, modelData]);

    useEffect(() => {
        if (parsedModels.invalid.length > 0) return;
        if (!webApi) return;
        if (deepEqual(collection.models, parsedModels.models)) return;

        webApi.collections
            .update([[collectionId, { ...collection, models: parsedModels.models }]])
            .catch(console.error);
    }, [webApi, collectionId, collection, parsedModels]);

    return (
        <>
            <HeadCommon title={collection.name} />
            <PageContainer
                searchBar
                wrapper
            >
                <h1 className="mt-0">
                    <EditableLabel
                        readonly={!editMode}
                        text={collection.name}
                        onChange={(name) => {
                            if (!webApi) return;
                            webApi.collections.update([[collectionId, { ...collection, name }]]).catch(console.error);
                        }}
                    />
                </h1>
                <div className="my-8">
                    <EditableMarkdownContainer
                        markdown={collection.description}
                        readonly={!editMode}
                        onChange={(description) => {
                            if (!webApi) return;
                            webApi.collections
                                .update([[collectionId, { ...collection, description }]])
                                .catch(console.error);
                        }}
                    />
                </div>
                {editMode && (
                    <div>
                        <h2>Model IDs</h2>
                        <p>Edit the model IDs here to change which models are part of the collection.</p>
                        <textarea
                            className="box-border h-64 w-full resize-y"
                            value={modelsText}
                            onChange={(e) => setModelsText(e.target.value)}
                        />
                        {parsedModels.invalid.length > 0 && (
                            <pre className="text-red-400">
                                Invalid model IDs:{parsedModels.invalid.map((i) => `\n  ${i}`).join('')}
                            </pre>
                        )}
                    </div>
                )}
                <ModelCardGrid
                    collectionData={collectionData}
                    modelData={modelData}
                    models={collection.models}
                />
            </PageContainer>
        </>
    );
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
    const collectionIds = await fileApi.collections.getIds();

    return {
        paths: collectionIds.map((id) => ({ params: { id } })),
        fallback: false,
    };
};

export const getStaticProps: GetStaticProps<Props, Params> = async (context) => {
    const collectionId = context.params?.id;
    if (!collectionId) throw new Error("Missing path param 'id'");

    const modelData = await getCachedModels();
    const collectionData = await getCachedCollections();

    const collection = collectionData.get(collectionId);
    if (!collection) throw new Error('Invalid collection');

    const staticModelData = [...modelData].filter(([id]) => collection.models.includes(id));

    return {
        props: {
            collectionId,
            staticCollectionData: { [collectionId]: collection },
            staticModelData: Object.fromEntries(staticModelData),
        },
    };
};
