import { ChangeIdRequest } from '../../lib/api-types';
import { UserId } from '../../lib/schema';
import { post, synchronizeDB } from '../../lib/server/api-impl';
import { getUsers, mutateModels, writeUsers } from '../../lib/server/data';
import { hasOwn } from '../../lib/util';

export type UsersRequestBody = ChangeIdRequest<UserId>;

export default post<UsersRequestBody>(
    synchronizeDB(async ({ id, newId }) => {
        if (id === newId) return;

        const users = await getUsers();

        if (!hasOwn(users, id)) {
            throw new Error(`Cannot change user id ${id} because it does not exist`);
        }
        if (hasOwn(users, newId)) {
            throw new Error(`Cannot change user id ${id} to ${newId} because ${newId} already exists`);
        }

        users[newId] = users[id];
        delete users[id];

        await writeUsers(users);

        await mutateModels((model) => {
            if (Array.isArray(model.author)) {
                const index = model.author.indexOf(id);
                if (index !== -1) {
                    model.author[index] = newId;
                    return true;
                }
            } else {
                if (model.author === id) {
                    model.author = newId;
                    return true;
                }
            }
        });
    })
);
