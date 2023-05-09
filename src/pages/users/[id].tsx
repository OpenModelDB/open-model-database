import { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import React, { useMemo } from 'react';
import { ModelCardGrid } from '../../elements/components/model-card-grid';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useModels } from '../../lib/hooks/use-models';
import { Model, ModelId, User, UserId } from '../../lib/schema';
import { getCachedModels } from '../../lib/server/cached-models';
import { fileApi } from '../../lib/server/file-data';

interface Params extends ParsedUrlQuery {
    id: UserId;
}
interface Props {
    userId: UserId;
    user: User;
    models: Record<ModelId, Model>;
}

export default function Page({ userId, user, models }: Props) {
    const { modelData } = useModels(models);

    const userModels = useMemo(() => {
        return [...modelData].filter(([, model]) => hasAuthor(model, userId)).map(([id]) => id);
    }, [modelData, userId]);

    return (
        <>
            <HeadCommon
                description={`The OpenModelDB user profile of ${user.name}.`}
                title={user.name}
            />
            <PageContainer
                scrollToTop
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

    return {
        props: {
            userId,
            user,
            models: Object.fromEntries([...models].filter(([, model]) => hasAuthor(model, userId))),
        },
    };
};

function hasAuthor(model: Model, author: UserId): boolean {
    return model.author === author || (Array.isArray(model.author) && model.author.includes(author));
}
