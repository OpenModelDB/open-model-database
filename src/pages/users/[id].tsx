import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { ParsedUrlQuery } from 'querystring';
import React from 'react';
import { BsDiscord } from 'react-icons/bs';
import { Link } from '../../elements/components/link';
import { ModelCard } from '../../elements/components/model-card';
import { PageContainer } from '../../elements/page';
import { useModels } from '../../lib/hooks/use-models';
import { DiscordData, Model, ModelId, User, UserId } from '../../lib/schema';
import { getDiscordUserInfo } from '../../lib/server/discord-data';
import { fileApi } from '../../lib/server/file-data';

interface Params extends ParsedUrlQuery {
    id: UserId;
}
interface Props {
    userId: UserId;
    user: User;
    models: Record<ModelId, Model>;
    discordData: DiscordData | null;
}

export default function Page({ userId, user, models, discordData }: Props) {
    const { name, discordId } = user;

    const { avatarUrl, bannerUrl, username, discriminator } = discordData || {};

    const { modelData } = useModels(models);

    return (
        <>
            <Head>
                <title>{`${name} - OpenModelDB`}</title>
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
                <div className="my-6 rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
                    {/* User Info */}
                    <div className="my-3 flex w-full content-center items-center gap-2 align-middle">
                        <div className="m-auto flex gap-2 rounded-lg px-4 py-2">
                            <div className="m-auto flex h-full content-center align-middle">
                                {avatarUrl ? (
                                    <Image
                                        alt="avatar"
                                        className="relative m-auto h-10 w-10 rounded-full p-1 ring-2 ring-fade-300 dark:ring-fade-500"
                                        height={40}
                                        src={avatarUrl}
                                        width={40}
                                    />
                                ) : (
                                    <span className="relative flex h-10 w-10 content-center items-center rounded-full bg-fade-300 p-1 text-center align-middle  font-bold text-gray-600 dark:bg-fade-700 dark:text-gray-300">
                                        <div className="w-full">{name[0]}</div>
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col align-middle">
                                <h1 className="relative m-0 h-full text-center text-2xl font-bold text-accent-500 dark:text-fade-200 lg:text-3xl">
                                    {`${name}'s Models`}
                                </h1>
                                {discordId && discordData && (
                                    <div className="flex flex-row content-center items-center gap-1 align-middle">
                                        <BsDiscord />
                                        <span>
                                            <Link
                                                external
                                                href={`https://discordapp.com/users/${discordId}`}
                                            >
                                                {username}#{discriminator}
                                            </Link>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

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
    const discordData = user.discordId ? await getDiscordUserInfo(user.discordId) : null;

    return {
        props: {
            userId,
            user,
            models: Object.fromEntries([...models].filter(([, model]) => hasAuthor(model, userId))),
            discordData,
        },
    };
};

function hasAuthor(model: Model, author: UserId): boolean {
    return model.author === author || (Array.isArray(model.author) && model.author.includes(author));
}
