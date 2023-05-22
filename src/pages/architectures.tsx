import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { MdDelete } from 'react-icons/md';
import { EditableLabel } from '../elements/components/editable-label';
import { Link } from '../elements/components/link';
import { HeadCommon } from '../elements/head-common';
import { PageContainer } from '../elements/page';
import { useArchitectures } from '../lib/hooks/use-architectures';
import { useModels } from '../lib/hooks/use-models';
import { useWebApi } from '../lib/hooks/use-web-api';
import { Arch, ArchId, InputType, ModelId, Platform, TagCategoryId, TagId } from '../lib/schema';
import { EMPTY_ARRAY, capitalize, delay, joinClasses } from '../lib/util';

function getTagId(archId: ArchId): TagId {
    return `arch:${archId}` as TagId;
}

const PLATFORMS: readonly Platform[] = ['pytorch', 'onnx', 'ncnn'];
const INPUT_TYPES: readonly InputType[] = ['audio', 'image', 'video'];

export default function Page() {
    const { archData } = useArchitectures();
    const { modelData } = useModels();

    const archModels = useMemo(() => {
        const archModels = new Map<ArchId, ModelId[]>();
        for (const [modelId, model] of modelData) {
            const models = archModels.get(model.architecture);
            if (models) {
                models.push(modelId);
            } else {
                archModels.set(model.architecture, [modelId]);
            }
        }
        return archModels;
    }, [modelData]);

    const archs = useMemo(() => {
        return [...archData].map(([archId, arch]) => {
            const models = archModels.get(archId) ?? EMPTY_ARRAY;
            return { archId, arch, models };
        });
    }, [archData, archModels]);

    const unknownArchs = useMemo(() => {
        return [...archModels.keys()].filter((id) => !archData.has(id));
    }, [archData, archModels]);

    const { webApi, editMode } = useWebApi();
    const { asPath, replace } = useRouter();
    const hash = asPath.replace(/^[^#]*#/, '') || undefined;

    const updateArch = (id: ArchId, value: Partial<Arch>): void => {
        if (!webApi) return;
        const arch = archData.get(id);
        if (!arch) return;
        webApi.architectures.update([[id, { ...arch, ...value }]]).catch((e) => console.error(e));
    };

    return (
        <>
            <HeadCommon
                noIndex
                title="Architectures"
            />
            <PageContainer wrapper>
                <div className="mb-4">
                    {unknownArchs.length > 0 && (
                        <div className="mb-8">
                            <h3>Unknown architectures</h3>
                            {unknownArchs.map((archId) => {
                                const models = archModels.get(archId) ?? EMPTY_ARRAY;

                                return (
                                    <div key={archId}>
                                        <span className="mr-2 text-neutral-500 dark:text-neutral-400">{archId}</span>
                                        <ModelCount count={models.length} />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button
                        className="mr-2"
                        disabled={!editMode}
                        onClick={() => {
                            if (!webApi) return;
                            const id = prompt('Architecture ID');
                            if (!id) return;

                            const arch: Arch = {
                                name: capitalize(id),
                                input: 'image',
                                compatiblePlatforms: [],
                            };

                            webApi.architectures
                                .update([[id as ArchId, arch]])
                                .then(async () => {
                                    const elementId = `arch-${id}`;
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

                            const tagId = getTagId(id as ArchId);
                            webApi.tags
                                .update([[tagId, { name: arch.name, description: '' }]])
                                .then(async () => {
                                    const categories = await webApi.tagCategories.getAll();
                                    const category = categories.get('architecture' as TagCategoryId);
                                    if (category) {
                                        category.tags.push(tagId);
                                        await webApi.tagCategories.update([
                                            ['architecture' as TagCategoryId, category],
                                        ]);
                                    }
                                })
                                .catch((e) => console.error(e));
                        }}
                    >
                        Add architecture
                    </button>

                    <Link
                        className="text-sm opacity-80 hover:opacity-100"
                        href="/tags"
                    >
                        <AiFillEdit />
                        Edit Tags
                    </Link>
                </div>

                {archs.map(({ archId, arch, models }) => {
                    const selected = hash === `arch-${archId}`;

                    return (
                        <div
                            className={joinClasses('mb-4', selected && 'bg-white dark:bg-black')}
                            id={`arch-${archId}`}
                            key={archId}
                        >
                            <div>
                                <EditableLabel
                                    readonly={!editMode}
                                    text={arch.name}
                                    onChange={(name) => {
                                        if (!webApi) return;

                                        updateArch(archId, { name });

                                        // update tag (if any)
                                        const tagId = getTagId(archId);
                                        webApi.tags
                                            .getAll()
                                            .then(async (allTags) => {
                                                const tag = allTags.get(tagId);
                                                if (tag) {
                                                    await webApi.tags.update([[tagId, { ...tag, name }]]);
                                                }
                                            })
                                            .catch((e) => console.error(e));
                                    }}
                                />
                                <span className="mr-2 text-neutral-500 dark:text-neutral-400">Id:</span>
                                <EditableLabel
                                    readonly={!editMode}
                                    text={archId}
                                    onChange={(newId) => {
                                        if (!webApi) return;

                                        // change arch id
                                        webApi.architectures
                                            .changeId(archId, newId as ArchId)
                                            .then(async () => {
                                                // change tag (if any)
                                                const tagId = getTagId(archId);
                                                const allTags = await webApi.tags.getAll();
                                                if (allTags.has(tagId)) {
                                                    await webApi.tags.changeId(tagId, getTagId(newId as ArchId));
                                                }
                                            })
                                            .catch((e) => console.error(e));
                                    }}
                                />

                                {editMode && (
                                    <button
                                        title="Delete tag"
                                        onClick={() => {
                                            // remove arch
                                            webApi.architectures.delete([archId]).catch((e) => console.error(e));

                                            // remove tag
                                            const tagId = getTagId(archId);
                                            webApi.tags.delete([tagId]).catch((e) => console.error(e));
                                        }}
                                    >
                                        <MdDelete />
                                    </button>
                                )}
                                <ModelCount count={models.length} />
                            </div>
                            <div>
                                <select
                                    className="mr-4"
                                    value={arch.input}
                                    onChange={(e) => {
                                        updateArch(archId, { input: e.target.value as InputType });
                                    }}
                                >
                                    {INPUT_TYPES.map((t) => {
                                        return (
                                            <option
                                                key={t}
                                                value={t}
                                            >
                                                {capitalize(t)}
                                            </option>
                                        );
                                    })}
                                </select>

                                {PLATFORMS.map((p) => {
                                    return (
                                        <span key={p}>
                                            <input
                                                checked={arch.compatiblePlatforms.includes(p)}
                                                type="checkbox"
                                                onChange={(e) => {
                                                    const compatiblePlatforms = e.target.checked
                                                        ? [...arch.compatiblePlatforms, p]
                                                        : arch.compatiblePlatforms.filter((v) => v !== p);
                                                    compatiblePlatforms.sort(
                                                        (a, b) => PLATFORMS.indexOf(a) - PLATFORMS.indexOf(b)
                                                    );
                                                    updateArch(archId, { compatiblePlatforms });
                                                }}
                                            />
                                            <span className="mr-2">{p}</span>
                                        </span>
                                    );
                                })}
                            </div>
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
