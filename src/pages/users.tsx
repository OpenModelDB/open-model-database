import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { MdDelete } from 'react-icons/md';
import { EditableLabel } from '../elements/components/editable-label';
import { HeadCommon } from '../elements/head-common';
import { PageContainer } from '../elements/page';
import { useModels } from '../lib/hooks/use-models';
import { useUsers } from '../lib/hooks/use-users';
import { useWebApi } from '../lib/hooks/use-web-api';
import { ModelId, User, UserId } from '../lib/schema';
import { UserIdPattern, canonicalizeUserId } from '../lib/schema-util';
import { EMPTY_ARRAY, asArray, delay, joinClasses } from '../lib/util';

export default function Page() {
    const { userData } = useUsers();
    const { modelData } = useModels();

    const userModels = useMemo(() => {
        const userModels = new Map<UserId, ModelId[]>();
        for (const [modelId, model] of modelData) {
            for (const userId of asArray(model.author)) {
                const models = userModels.get(userId);
                if (models) {
                    models.push(modelId);
                } else {
                    userModels.set(userId, [modelId]);
                }
            }
        }
        return userModels;
    }, [modelData]);

    const users = useMemo(() => {
        return [...userData].map(([userId, user]) => {
            const models = userModels.get(userId) ?? EMPTY_ARRAY;
            return { userId, user, models };
        });
    }, [userData, userModels]);

    const unknownUsers = useMemo(() => {
        return [...userModels.keys()].filter((userId) => !userData.has(userId));
    }, [userData, userModels]);

    const { webApi, editMode } = useWebApi();
    const { asPath, replace } = useRouter();
    const hash = asPath.replace(/^[^#]*#/, '') || undefined;

    const updateUser = (id: UserId, value: Partial<User>): void => {
        if (!webApi) return;
        const user = userData.get(id);
        if (!user) return;
        webApi.users.update([[id, { ...user, ...value }]]).catch((e) => console.error(e));
    };
    const deleteUser = (id: UserId): void => {
        if (!webApi) return;
        webApi.users.delete([id]).catch((e) => console.error(e));
    };

    return (
        <>
            <HeadCommon
                noIndex
                title="Users"
            />
            <PageContainer wrapper>
                <div className="mb-4">
                    {unknownUsers.length > 0 && (
                        <div className="mb-8">
                            <h3>Unknown authors</h3>
                            {unknownUsers.map((userId) => {
                                const models = userModels.get(userId) ?? EMPTY_ARRAY;

                                return (
                                    <div key={userId}>
                                        <span className="mr-2 text-neutral-500 dark:text-neutral-400">@{userId}</span>
                                        <ModelCount count={models.length} />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button
                        disabled={!editMode}
                        onClick={() => {
                            if (!webApi) return;
                            const name = prompt('User name')?.trim();
                            if (!name) return;

                            const id = canonicalizeUserId(name);

                            webApi.users
                                .update([[id, { name }]])
                                .then(async () => {
                                    const elementId = `user-${id}`;
                                    await replace(`${asPath.replace(/#.*$/, '')}#${elementId}`, undefined, {
                                        shallow: true,
                                    });

                                    for (let i = 0; i < 50; i++) {
                                        await delay(100);
                                        const element = document.getElementById(elementId);
                                        if (element) {
                                            element.scrollIntoView({ block: 'center' });
                                            break;
                                        }
                                    }
                                })
                                .catch((e) => console.error(e));
                        }}
                    >
                        Add user
                    </button>
                </div>

                {users.map(({ userId, user, models }, index) => {
                    const previous = index === 0 ? undefined : users[index - 1];
                    const selected = hash === `user-${userId}`;

                    return (
                        <div
                            className={joinClasses(
                                previous && previous.userId[0] !== userId[0] && 'mt-4',
                                selected && 'bg-white dark:bg-black'
                            )}
                            id={`user-${userId}`}
                            key={userId}
                        >
                            <span className="mr-2 text-neutral-500 dark:text-neutral-400">
                                @
                                <EditableLabel
                                    readonly={!editMode}
                                    text={userId}
                                    onChange={(newId) => {
                                        if (!webApi) return;
                                        webApi.users
                                            .changeId(userId, canonicalizeUserId(newId))
                                            .catch((e) => console.error(e));
                                    }}
                                />
                            </span>
                            {!UserIdPattern.test(userId) && (
                                <span className="mr-2 text-red-500 dark:text-red-400">Invalid User ID</span>
                            )}
                            <EditableLabel
                                readonly={!editMode}
                                text={user.name}
                                onChange={(name) => updateUser(userId, { name })}
                            />
                            {editMode && (
                                <button
                                    // className={style.iconButton}
                                    title="Delete tag"
                                    onClick={() => deleteUser(userId)}
                                >
                                    <MdDelete />
                                </button>
                            )}
                            <ModelCount count={models.length} />
                        </div>
                    );
                })}
            </PageContainer>
        </>
    );
}

function ModelCount({ count }: { count: number }) {
    return (
        <span className="ml-4 text-neutral-500 dark:text-neutral-400">
            ({count} {count === 1 ? 'model' : 'models'})
        </span>
    );
}
