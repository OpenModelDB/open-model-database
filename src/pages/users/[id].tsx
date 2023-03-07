import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { ParsedUrlQuery } from 'querystring';
import React from 'react';
import { ModelCard } from '../../elements/components/model-card';
import { PageContainer } from '../../elements/page';
import { Model, ModelId, User, UserId } from '../../lib/schema';
import { fileApi } from '../../lib/server/file-data';
import { fixDescription } from '../../lib/util';

interface Params extends ParsedUrlQuery {
    id: UserId;
}
interface Props {
    userId: UserId;
    user: User;
    models: Record<ModelId, Model>;
}

export default function Page({ user, models }: Props) {
    return (
        <>
            <Head>
                <title>{`${user.name} - OpenModelDB`}</title>
                <meta
                    content="Generated by create next app"
                    name="description"
                />
                <meta
                    content="width=device-width, initial-scale=1"
                    name="viewport"
                />
                <link
                    href="/favicon.ico"
                    rel="icon"
                />
            </Head>
            <PageContainer>
                <div className="py-6">
                    <div className="mx-auto max-w-screen-2xl">
                        <div className="rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
                            <h1 className="mb-4 text-center text-2xl font-bold text-accent-500 dark:text-fade-200 md:mb-6 lg:text-3xl">
                                {`${user.name}'s Models`}
                            </h1>

                            {/* Model Cards */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.keys(models).map((id) => {
                                    const { architecture, author, scale, description, tags } = models[id as ModelId];

                                    const actualDescription = fixDescription(description, scale);

                                    return (
                                        <ModelCard
                                            architecture={architecture}
                                            author={author}
                                            description={actualDescription}
                                            id={id}
                                            key={id}
                                            scale={scale}
                                            tags={tags}
                                        />
                                    );
                                })}
                            </div>
                        </div>
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
            models: Object.fromEntries(
                [...models].filter(([, model]) => {
                    return model.author === userId || (Array.isArray(model.author) && model.author.includes(userId));
                })
            ),
        },
    };
};
