import { UpdateRequest } from 'src/lib/api-types';
import { User, UserId } from 'src/lib/schema';
import { groupUpdatesByType, post, synchronizeDB } from 'src/lib/server/api-impl';
import { getUsers, writeUsers } from 'src/lib/server/data';

export type UsersRequestBody = UpdateRequest<UserId, User>[];

export default post<UsersRequestBody>(
    synchronizeDB(async (updates) => {
        if (updates.length === 0) return;

        const users = await getUsers();

        const groups = groupUpdatesByType(updates);

        for (const [id, value] of groups.change) {
            users[id] = value;
            console.warn(`Updated user data of ${id}`);
        }
        for (const id of groups.delete) {
            if (id in users) {
                delete users[id];
                console.warn(`Delete model user of ${id}`);
            } else {
                console.warn(`User data of ${id} cannot be deleted because it doesn't exist`);
            }
        }

        await writeUsers(users);
    })
);
