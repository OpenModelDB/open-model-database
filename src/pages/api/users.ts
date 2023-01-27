import { readFile, writeFile } from 'fs/promises';
import { UpdateRequest, groupUpdatesByType, post, synchronizeDB } from 'src/lib/api';
import { User, UserId } from 'src/lib/schema';
import { USERS_JSON } from 'src/lib/static-data';

export type UsersRequestBody = UpdateRequest<UserId, User>[];

export default post<UsersRequestBody>(
    synchronizeDB(async (updates) => {
        if (updates.length === 0) return;

        const originalContent = await readFile(USERS_JSON, 'utf-8');
        const users = JSON.parse(originalContent) as Record<UserId, User>;

        const groups = groupUpdatesByType(updates);

        for (const [id, value] of groups.change) {
            users[id] = value;
            console.warn('Updated user data of ' + id);
        }
        for (const id of groups.delete) {
            if (id in users) {
                delete users[id];
                console.warn('Delete model user of ' + id);
            } else {
                console.warn('User data of ' + id + " cannot be deleted because it doesn't exist");
            }
        }

        sortObjectKeys(users);
        await writeFile(USERS_JSON, JSON.stringify(users, undefined, 4), 'utf-8');
    })
);

function sortObjectKeys(obj: Record<string, unknown>): void {
    const old = { ...obj };
    const keys: string[] = Object.keys(obj);
    for (const key of keys) {
        delete obj[key];
    }
    keys.sort();
    for (const key of keys) {
        obj[key] = old[key];
    }
}
