import { UpdateRequest } from '../../lib/api-types';
import { Tag, TagId } from '../../lib/schema';
import { groupUpdatesByType, post, synchronizeDB } from '../../lib/server/api-impl';
import { getTags, writeTags } from '../../lib/server/data';

export type TagsRequestBody = UpdateRequest<TagId, Tag>[];

export default post<TagsRequestBody>(
    synchronizeDB(async (updates) => {
        if (updates.length === 0) return;

        const tags = await getTags();

        const groups = groupUpdatesByType(updates);

        for (const [id, value] of groups.change) {
            tags[id] = value;
            console.warn(`Updated tag ${id}`);
        }
        for (const id of groups.delete) {
            if (id in tags) {
                delete tags[id];
                console.warn(`Delete tag ${id}`);
            } else {
                console.warn(`Tag ${id} cannot be deleted because it doesn't exist`);
            }
        }

        await writeTags(tags);
    })
);
