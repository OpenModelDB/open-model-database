import { readFile, writeFile } from 'fs/promises';
import { UpdateRequest, groupUpdatesByType, post, synchronizeDB } from 'src/lib/api';
import { Tag, TagId } from 'src/lib/schema';
import { TAGS_JSON } from 'src/lib/static-data';

export type TagsRequestBody = UpdateRequest<TagId, Tag>[];

export default post<TagsRequestBody>(
    synchronizeDB(async (updates) => {
        if (updates.length === 0) return;

        // update is done synchronously to prevent race conditions
        const originalContent = await readFile(TAGS_JSON, 'utf-8');
        const tags = JSON.parse(originalContent) as Record<TagId, Tag>;

        const groups = groupUpdatesByType(updates);

        for (const [id, value] of groups.change) {
            tags[id] = value;
            console.warn('Updated tag ' + id);
        }
        for (const id of groups.delete) {
            if (id in tags) {
                delete tags[id];
                console.warn('Delete tag ' + id);
            } else {
                console.warn('Tag ' + id + " cannot be deleted because it doesn't exist");
            }
        }

        await writeFile(TAGS_JSON, JSON.stringify(tags, undefined, 4), 'utf-8');
    })
);
