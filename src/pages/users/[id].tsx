import { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import React from 'react';
import { ModelCardGrid } from '../../elements/components/model-card-grid';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useCollections } from '../../lib/hooks/use-collections';
import { useModels } from '../../lib/hooks/use-models';
import { Collection, CollectionId, Model, ModelId, User, UserId } from '../../lib/schema';
import { getCachedCollections, getCachedModels } from '../../lib/server/cached';
import { fileApi } from '../../lib/server/file-data';

interface Params extends ParsedUrlQuery {
    id: UserId;
}
interface Props {
    userId: UserId;
    user: User;
    userModels: ModelId[];
    userCollections: CollectionId[];
    staticModels: Record<ModelId, Model>;
    staticCollections: Record<CollectionId, Collection>;
}

export default function Page({ user, userModels, userCollections, staticModels, staticCollections }: Props) {
    const { modelData } = useModels(staticModels);
    const { collectionData } = useCollections(staticCollections);

    return (
        <>
            <HeadCommon
                description={`The OpenModelDB user profile of ${user.name}.`}
                title={user.name}
            />
            <PageContainer
                scrollToTop
                searchBar
                wrapper
            >
                <h1 className="mb-6 text-center text-2xl font-bold text-accent-500 dark:text-fade-200 lg:text-3xl">
                    {`${user.name}'s Models`}
                </h1>

                {/* Model Cards */}
                <ModelCardGrid
                    modelData={modelData}
                    models={userModels}
                />

                {userCollections.length > 0 && (
                    <>
                        <h1 className="mb-6 text-center text-2xl font-bold text-accent-500 dark:text-fade-200 lg:text-3xl">
                            {`${user.name}'s Collections`}
                        </h1>

                        <ModelCardGrid
                            collectionData={collectionData}
                            modelData={modelData}
                            models={userCollections}
                        />
                    </>
                )}
            </PageContainer>
        </>
    );
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
    const userIds = await fileApi.users.getIds();

    return {
        paths: userIds.map((id) => ({ params: { id } })),
        fallback: false,
    };
};

export const getStaticProps: GetStaticProps<Props, Params> = async (context) => {
    const userId = context.params?.id;
    if (!userId) throw new Error("Missing path param 'id'");

    const user = await fileApi.users.get(userId);
    const models = await getCachedModels();
    const collections = await getCachedCollections();

    const userModels = [...models].filter(([, model]) => hasAuthor(model, userId));
    const userCollections = [...collections].filter(([, collection]) => hasAuthor(collection, userId));

    const collectionModels = new Set(userCollections.flatMap(([, collection]) => collection.models));
    const staticModels = [...models].filter(([id, model]) => hasAuthor(model, userId) || collectionModels.has(id));

    return {
        props: {
            userId,
            user,
            userModels: userModels.map(([id]) => id),
            userCollections: userCollections.map(([id]) => id),
            staticModels: Object.fromEntries(staticModels),
            staticCollections: Object.fromEntries(userCollections),
        },
    };
};

function hasAuthor(item: Model | Collection, author: UserId): boolean {
    return item.author === author || (Array.isArray(item.author) && item.author.includes(author));
}
