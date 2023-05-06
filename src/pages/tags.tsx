import React, { useMemo } from 'react';
import { EditableLabel } from '../elements/components/editable-label';
import { HeadCommon } from '../elements/head-common';
import { PageContainer } from '../elements/page';
import { TagView } from '../elements/tag-view';
import { deriveTags } from '../lib/derive-tags';
import { useModels } from '../lib/hooks/use-models';
import { useTags } from '../lib/hooks/use-tags';
import { useWebApi } from '../lib/hooks/use-web-api';
import { Tag, TagCategory, TagCategoryId, TagId, TagIdPattern } from '../lib/schema';
import { compareTagId } from '../lib/util';

export default function Page() {
    const { tagData, tagCategoryData, categoryOrder } = useTags();
    const { modelData } = useModels();

    const { webApi, editMode } = useWebApi();

    const updateTag = (id: TagId, value: Partial<Tag>): void => {
        if (!webApi) return;
        const tag = tagData.get(id);
        if (!tag) return;
        webApi.tags.update([[id, { ...tag, ...value }]]).catch((e) => console.error(e));
    };
    const deleteTag = (id: TagId): void => {
        if (!webApi) return;
        webApi.tags.delete([id]).catch((e) => console.error(e));
    };
    const updateCategory = (id: TagCategoryId, value: Partial<TagCategory>): void => {
        if (!webApi) return;
        const category = tagCategoryData.get(id);
        if (!category) return;
        webApi.tagCategories.update([[id, { ...category, ...value }]]).catch((e) => console.error(e));
    };

    const tagUsage = useMemo(() => {
        const byTag = new Map<TagId, number>();
        for (const model of modelData.values()) {
            for (const tag of deriveTags(model)) {
                byTag.set(tag, (byTag.get(tag) ?? 0) + 1);
            }
        }
        return byTag;
    }, [modelData]);

    const noCategory = useMemo(() => {
        const categorized = new Set([...tagCategoryData.values()].flatMap((c) => c.tags));
        return [...tagData.keys()].filter((id) => !categorized.has(id)).sort(compareTagId);
    }, [tagData, tagCategoryData]);
    const unknown = useMemo(() => {
        const known = new Set(tagData.keys());
        return [...tagUsage.keys()].filter((id) => !known.has(id) && !id.startsWith('by:')).sort(compareTagId);
    }, [tagUsage, tagData]);

    return (
        <>
            <HeadCommon
                noIndex
                title="Tags"
            />
            <PageContainer>
                <h1>Tags</h1>

                {!editMode && <p className="text-red-700 dark:text-red-300">Not in edit mode!</p>}

                <div className="my-6 rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
                    {categoryOrder.map(([categoryId, category]) => {
                        return (
                            <div key={categoryId}>
                                <h2>
                                    <EditableLabel
                                        readonly={!editMode}
                                        text={category.name}
                                        onChange={(name) => updateCategory(categoryId, { name })}
                                    />
                                    {editMode && (
                                        <button
                                            onClick={() => {
                                                const id = prompt('Tag ID');
                                                if (!id) return;
                                                const tagId = id.trim().toLowerCase() as TagId;
                                                if (!TagIdPattern.test(tagId)) return;

                                                Promise.all([
                                                    webApi.tags.update([[tagId, { name: tagId, description: '' }]]),
                                                    webApi.tagCategories.update([
                                                        [
                                                            categoryId,
                                                            {
                                                                ...category,
                                                                tags: [tagId, ...category.tags],
                                                            },
                                                        ],
                                                    ]),
                                                ]).catch((e) => console.error(e));
                                            }}
                                        >
                                            +
                                        </button>
                                    )}
                                </h2>

                                <div>
                                    {category.tags.map((tagId) => {
                                        const tag = tagData.get(tagId);
                                        if (!tag) return <React.Fragment key={tagId} />;
                                        return (
                                            <TagView
                                                key={tagId}
                                                readonly={!editMode}
                                                tag={tag}
                                                usage={tagUsage.get(tagId) ?? 0}
                                                onDelete={() => deleteTag(tagId)}
                                                onDescriptionChange={(description) => updateTag(tagId, { description })}
                                                onMove={(difference) => {
                                                    const index = category.tags.indexOf(tagId);
                                                    if (index === -1) return;
                                                    const newIndex = Math.max(
                                                        0,
                                                        Math.min(index + difference, category.tags.length - 1)
                                                    );
                                                    const newTags = [...category.tags];
                                                    newTags.splice(index, 1);
                                                    newTags.splice(newIndex, 0, tagId);
                                                    updateCategory(categoryId, { tags: newTags });
                                                }}
                                                onRename={(name) => updateTag(tagId, { name })}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {noCategory.length > 0 && (
                    <div className="my-6 rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
                        <h2>Uncategorized</h2>

                        <div>
                            {noCategory.map((tagId) => {
                                const tag = tagData.get(tagId);
                                if (!tag) return <React.Fragment key={tagId} />;
                                return (
                                    <TagView
                                        key={tagId}
                                        readonly={!editMode}
                                        tag={tag}
                                        usage={tagUsage.get(tagId) ?? 0}
                                        onDelete={() => deleteTag(tagId)}
                                        onDescriptionChange={(description) => updateTag(tagId, { description })}
                                        onRename={(name) => updateTag(tagId, { name })}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {unknown.length > 0 && (
                    <div className="my-6 rounded-lg bg-fade-100 p-4 dark:bg-fade-800">
                        <h2>Unknown tags</h2>

                        {unknown.map((id) => {
                            return <div key={id}>{id}</div>;
                        })}
                    </div>
                )}
            </PageContainer>
        </>
    );
}
