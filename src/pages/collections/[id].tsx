import { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import React from 'react';
import { EditableLabel } from '../../elements/components/editable-label';
import { EditableMarkdownContainer } from '../../elements/components/editable-markdown';
import { ModelCardGrid } from '../../elements/components/model-card-grid';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useCollections } from '../../lib/hooks/use-collections';
import { useModels } from '../../lib/hooks/use-models';
import { useUsers } from '../../lib/hooks/use-users';
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
    const { userData } = useUsers();
    const { modelData } = useModels(staticModelData);
    const { collectionData } = useCollections(staticCollectionData);

    const { webApi, editMode } = useWebApi();
    const collection = collectionData.get(collectionId) || staticCollectionData[collectionId];

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
