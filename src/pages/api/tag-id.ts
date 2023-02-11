import { ChangeIdRequest } from '../../lib/api-types';
import { TagId } from '../../lib/schema';
import { post, synchronizeDB } from '../../lib/server/api-impl';
import { getTags, mutateModels, writeTags } from '../../lib/server/data';
import { hasOwn, sortObjectKeys } from '../../lib/util';

export type TagsRequestBody = ChangeIdRequest<TagId>;

export default post<TagsRequestBody>(
    synchronizeDB(async ({ id, newId }) => {
        if (id === newId) return;

        const tags = await getTags();

        const tagIds = Object.keys(tags);

        const index = tagIds.indexOf(id);
        if (index === -1) {
            throw new Error(`Cannot change tag id ${id} because it does not exist`);
        }
        if (hasOwn(tags, newId)) {
            throw new Error(`Cannot change tag id ${id} to ${newId} because ${newId} already exists`);
        }

        tagIds[index] = newId;
        const value = tags[id];
        delete tags[id];
        tags[newId] = value;
        sortObjectKeys(tags, tagIds);

        await writeTags(tags);

        await mutateModels((model) => {
            const index = model.tags.indexOf(id);
            if (index !== -1) {
                model.tags[index] = newId;
                return true;
            }
        });
    })
);
