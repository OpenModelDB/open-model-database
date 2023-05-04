import { Tag, TagId } from './schema';

/**
 * If a tag is in the given set, then all of its implied tags are added to the set.
 */
export function addImpliedTags(tags: Set<TagId>, tagData: ReadonlyMap<TagId, Tag>) {
    for (const tagId of tags) {
        const tag = tagData.get(tagId);
        if (tag?.implies) {
            for (const impliedTagId of tag.implies) {
                tags.add(impliedTagId);
            }
        }
    }
}

/**
 * If an implied tag is not in the given set, then its implying tag is removed from the set.
 */
export function removeImplyingTags(tags: Set<TagId>, tagData: ReadonlyMap<TagId, Tag>): void {
    let lastSize;
    do {
        lastSize = tags.size;

        for (const tagId of tags) {
            const tag = tagData.get(tagId);
            if (tag?.implies?.some((impliedTagId) => !tags.has(impliedTagId))) {
                tags.delete(tagId);
            }
        }
    } while (lastSize !== tags.size);
}
