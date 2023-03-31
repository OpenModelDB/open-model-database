import { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import React from 'react';
import { ModelCard } from '../../elements/components/model-card';
import { HeadCommon } from '../../elements/head-common';
import { PageContainer } from '../../elements/page';
import { useModels } from '../../lib/hooks/use-models';
import { Model, ModelId, User, UserId } from '../../lib/schema';
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

    return (
        <>
            <HeadCommon
                description={`The OpenModelDB user profile of ${user.name}.`}
                title={user.name}
            />
            <PageContainer>
                <div className="my-6 rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
                    <h1 className="mb-4 text-center text-2xl font-bold text-accent-500 dark:text-fade-200 md:mb-6 lg:text-3xl">
                        {`${user.name}'s Models`}
                    </h1>

                    {/* Model Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[...modelData]
                            .filter(([, model]) => hasAuthor(model, userId))
                            .map(([id, model]) => {
                                return (
                                    <ModelCard
                                        id={id}
                                        key={id}
                                        model={model}
                                    />
                                );
                            })}
                    </div>
                </div>
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
    const models = await fileApi.models.getAll();

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
